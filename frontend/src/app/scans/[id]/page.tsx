"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import RiskDistribution from "@/components/RiskDistribution";
import { API_URL, apiFetch, getToken } from "@/lib/api";
import type { Artefact, MoscaResult, Recommendation, Scan, ScanSummary, RiskBand } from "@/lib/types";

type Tab = "overview" | "inventory" | "mosca" | "recommendations";

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [scan, setScan] = useState<Scan | null>(null);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [artefacts, setArtefacts] = useState<Artefact[]>([]);
  const [mosca, setMosca] = useState<MoscaResult | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);

  // Interactive controls state
  const [moscaX, setMoscaX] = useState<number>(10);
  const [moscaY, setMoscaY] = useState<number>(4);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadCompletedData = useCallback(async () => {
    const [arts, moscaData, recData, summaryData] = await Promise.all([
      apiFetch<{ artefacts?: Artefact[] }>(`/api/v1/scans/${id}/artefacts`),
      apiFetch<MoscaResult>(`/api/v1/scans/${id}/mosca`),
      apiFetch<{ recommendations?: Recommendation[] }>(`/api/v1/scans/${id}/recommendations`),
      apiFetch<ScanSummary>(`/api/v1/scans/${id}/summary`),
    ]);
    setArtefacts(arts.artefacts || []);
    setMosca(moscaData);
    setRecs(recData.recommendations || []);
    setSummary(summaryData);
  }, [id]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    const load = async () => {
      try {
        const s = await apiFetch<Scan>(`/api/v1/scans/${id}`);
        setScan(s);
        setMoscaX(s.data_lifetime_x ?? 10);
        setMoscaY(s.migration_time_y ?? 4);
        if (s.status === "completed") {
          await loadCompletedData();
        }
      } catch (err) {
        console.error("Failed to load scan", err);
      }
    };
    load();

    const wsUrl = `${API_URL.replace(/^http/, "ws")}/api/v1/scans/${id}/progress`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as Partial<Scan>;
        setScan((prev) => (prev ? { ...prev, ...data } : prev));
        if (data.data_lifetime_x !== undefined) setMoscaX(data.data_lifetime_x);
        if (data.migration_time_y !== undefined) setMoscaY(data.migration_time_y);
        if (data.status === "completed") loadCompletedData();
      } catch (err) {
        console.error("WS error", err);
      }
    };
    return () => ws.close();
  }, [id, router, loadCompletedData]);

  async function exportCbom() {
    const token = getToken();
    const res = await fetch(`${API_URL}/api/v1/scans/${id}/cbom`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export failed");
    const json = await res.json();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ecdat-cbom-${id}.json`;
    a.click();
  }

  // Filtered inventory artefacts
  const filteredArtefacts = useMemo(() => {
    return artefacts.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.file_path && a.file_path.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.recommendation?.action && a.recommendation.action.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRisk = riskFilter === "ALL" || a.risk.risk_band === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [artefacts, searchTerm, riskFilter]);

  // Client-side Mosca category recomputation
  const maxRisk = useMemo(() => {
    if (artefacts.length === 0) return 0;
    return Math.max(...artefacts.map((a) => a.risk.final_score ?? 0));
  }, [artefacts]);

  const clientScenarios = useMemo(() => {
    if (!mosca) return [];
    const totalNeeded = moscaX + moscaY;
    return mosca.scenarios.map((sc) => {
      const margin = Number((sc.z_value - totalNeeded).toFixed(2));
      let category = "MONITOR";
      if (margin < 0) {
        category = "EXPIRED";
      } else if (margin < 2) {
        category = "URGENT";
      } else if (maxRisk >= 5.5) {
        category = "PLAN";
      }
      return {
        name: sc.name,
        z_value: sc.z_value,
        margin,
        category,
      };
    });
  }, [mosca, moscaX, moscaY, maxRisk]);

  const worstClientCategory = useMemo(() => {
    if (clientScenarios.length === 0) return "MONITOR";
    let worst = "MONITOR";
    for (const sc of clientScenarios) {
      if (sc.category === "EXPIRED") {
        worst = "EXPIRED";
      } else if (sc.category === "URGENT" && worst !== "EXPIRED") {
        worst = "URGENT";
      } else if (sc.category === "PLAN" && worst === "MONITOR") {
        worst = "PLAN";
      }
    }
    return worst;
  }, [clientScenarios]);

  if (!scan) {
    return <div className="loading-screen">Loading scan…</div>;
  }

  const riskTotal = summary?.total_artefacts ?? scan.total_artefacts ?? 0;

  return (
    <div className="container">
      <Nav title={scan.name}>
        <Link href="/dashboard" className="nav-link">Dashboard</Link>
      </Nav>

      <div className="grid">
        <div className="stat">
          <div className="label">Status</div>
          <div className="value" style={{ fontSize: 20, textTransform: "capitalize" }}>
            {scan.status}
          </div>
        </div>
        <div className="stat">
          <div className="label">Progress</div>
          <div className="value">{scan.progress_percentage ?? 0}%</div>
        </div>
        <div className="stat">
          <div className="label">Artefacts</div>
          <div className="value">{scan.total_artefacts ?? 0}</div>
        </div>
        <div className="stat critical">
          <div className="label">Critical</div>
          <div className="value">{scan.critical_risk_count ?? 0}</div>
        </div>
        <div className="stat high">
          <div className="label">High</div>
          <div className="value">{scan.high_risk_count ?? 0}</div>
        </div>
      </div>

      {scan.current_stage && <p className="stage-text">{scan.current_stage}</p>}

      <div className="tabs">
        {(["overview", "inventory", "mosca", "recommendations"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
            style={{ textTransform: "capitalize" }}
          >
            {t === "inventory" ? "Artefacts" : t}
          </button>
        ))}
        {scan.status === "completed" && (
          <button type="button" className="btn secondary" onClick={exportCbom} style={{ marginLeft: "auto" }}>
            Export CBOM
          </button>
        )}
      </div>

      {tab === "overview" && (
        <div className="overview-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div className="card">
            <h3>Scan Summary</h3>
            <p>Target Type: <strong>{scan.target_type}</strong></p>
            <p>Files scanned: <strong>{scan.total_files ?? "—"}</strong></p>
            <p>Total artefacts: <strong>{scan.total_artefacts ?? 0}</strong></p>
            <p>Critical risk: <strong>{scan.critical_risk_count ?? 0}</strong></p>
            <p>High risk: <strong>{scan.high_risk_count ?? 0}</strong></p>
            <p>Created: <strong>{scan.created_at ? new Date(scan.created_at).toLocaleString() : "—"}</strong></p>
            {scan.error_message && (
              <p className="error-text" style={{ color: "var(--danger)", marginTop: 15 }}>{scan.error_message}</p>
            )}
          </div>
          {summary && scan.status === "completed" && (
            <div className="card">
              <RiskDistribution
                distribution={summary.risk_distribution}
                total={riskTotal}
              />
            </div>
          )}
        </div>
      )}

      {tab === "inventory" && (
        <div className="card">
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search by name, file path, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)"
              }}
            />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                minWidth: "120px"
              }}
            >
              <option value="ALL">All Risks</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {filteredArtefacts.length === 0 ? (
            <p className="empty-state">
              {scan.status === "completed" ? "No matching artefacts found." : "Inventory available after scan completes."}
            </p>
          ) : (
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "12px 8px" }}>Name / Algorithm</th>
                    <th style={{ padding: "12px 8px" }}>Asset Type</th>
                    <th style={{ padding: "12px 8px" }}>Risk Band</th>
                    <th style={{ padding: "12px 8px" }}>Location</th>
                    <th style={{ padding: "12px 8px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArtefacts.map((a) => {
                    const isExpanded = expandedId === a.artefact_id;
                    return (
                      <>
                        <tr
                          key={a.artefact_id}
                          onClick={() => setExpandedId(isExpanded ? null : a.artefact_id)}
                          style={{
                            borderBottom: "1px solid var(--border-subtle)",
                            cursor: "pointer",
                            background: isExpanded ? "rgba(255,255,255,0.02)" : "transparent"
                          }}
                          className="table-row-hover"
                        >
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{ fontWeight: "bold" }}>{a.name}</div>
                            {a.recommendation?.nist_standard && (
                              <span style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>
                                {a.recommendation.nist_standard}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 8px", textTransform: "capitalize" }}>{a.asset_type}</td>
                          <td style={{ padding: "12px 8px" }}>
                            <span className={`badge ${a.risk.risk_band}`}>
                              {a.risk.risk_band} ({a.risk.final_score})
                            </span>
                          </td>
                          <td style={{ padding: "12px 8px", fontSize: 13, color: "var(--text-muted)" }}>
                            {a.file_path}
                            {a.line_number ? `:${a.line_number}` : ""}
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            {a.recommendation?.action ? (
                              <span className={`status-badge ${
                                a.recommendation.action.includes("Replacement") || a.recommendation.action.includes("Expired") ? "failed" :
                                a.recommendation.action.includes("Migration") || a.recommendation.action.includes("Migrate") ? "running" :
                                "completed"
                              }`} style={{ fontSize: 11 }}>
                                {a.recommendation.action}
                              </span>
                            ) : "—"}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${a.artefact_id}-expanded`} style={{ background: "rgba(255,255,255,0.015)" }}>
                            <td colSpan={5} style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "12px" }}>
                                <div>
                                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>HNDL Risk Score</span>
                                  <strong>{a.risk.hndl_risk ?? 0} / 10</strong>
                                </div>
                                <div>
                                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Operational Risk</span>
                                  <strong>{a.risk.operational_risk ?? 0} / 10</strong>
                                </div>
                                <div>
                                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>PQC Urgency</span>
                                  <strong>{a.recommendation?.timeline_urgency ?? "MONITORING"}</strong>
                                </div>
                              </div>
                              {a.recommendation?.rationale && (
                                <p style={{ fontSize: 13, margin: "0 0 12px" }}>
                                  <strong>Rationale:</strong> {a.recommendation.rationale}
                                </p>
                              )}
                              {a.evidence_snippet && (
                                <div>
                                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Evidence Snippet</span>
                                  <pre style={{
                                    margin: 0,
                                    padding: 10,
                                    background: "var(--bg)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 6,
                                    overflowX: "auto",
                                    fontSize: 12,
                                    fontFamily: "Courier, monospace"
                                  }}>{a.evidence_snippet}</pre>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "mosca" && (
        <div className="card">
          {!mosca ? (
            <p className="empty-state">Mosca analysis available after scan completes.</p>
          ) : (
            <>
              <h3>Mosca Theorem Risk Modeling</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Mosca's Theorem states that data confidentiality is broken if migration time (Y) plus data lifetime (X) exceeds the CRQC collapse time (Z).
                Interact with the sliders below to run real-time stress testing on different CRQC arrival scenarios.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, margin: "24px 0" }}>
                <div style={{ background: "rgba(255,255,255,0.015)", padding: 16, border: "1px solid var(--border)", borderRadius: 8 }}>
                  <label htmlFor="detail-x" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span>Data Lifetime (X)</span>
                    <strong>{moscaX} years</strong>
                  </label>
                  <input
                    id="detail-x"
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={moscaX}
                    onChange={(e) => setMoscaX(parseInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginTop: 4 }}>
                    How long the scanned data must remain secure (e.g. classification period).
                  </span>
                </div>

                <div style={{ background: "rgba(255,255,255,0.015)", padding: 16, border: "1px solid var(--border)", borderRadius: 8 }}>
                  <label htmlFor="detail-y" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span>Migration Time (Y)</span>
                    <strong>{moscaY} years</strong>
                  </label>
                  <input
                    id="detail-y"
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={moscaY}
                    onChange={(e) => setMoscaY(parseInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginTop: 4 }}>
                    How long it takes to re-engineer infrastructure and implement PQC.
                  </span>
                </div>
              </div>

              <div style={{ padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total migration margin needed (X + Y)</span>
                  <div style={{ fontSize: 22, fontWeight: "bold" }}>{moscaX + moscaY} years</div>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", display: "block", textAlign: "right" }}>Overall Urgency Category</span>
                  <span className={`status-badge ${
                    worstClientCategory === "EXPIRED" ? "failed" :
                    worstClientCategory === "URGENT" ? "running" :
                    worstClientCategory === "PLAN" ? "pending" :
                    "completed"
                  }`} style={{ fontSize: 16, padding: "6px 16px" }}>
                    {worstClientCategory}
                  </span>
                </div>
              </div>

              <h4>Quantum Collapse Scenarios (Z)</h4>
              <div className="table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "12px 8px" }}>Scenario</th>
                      <th style={{ padding: "12px 8px" }}>Est. Collapse Time (Z)</th>
                      <th style={{ padding: "12px 8px" }}>Safety Margin (Z - [X+Y])</th>
                      <th style={{ padding: "12px 8px" }}>Urgency Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientScenarios.map((s) => (
                      <tr key={s.name} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px 8px", fontWeight: "bold" }}>{s.name}</td>
                        <td style={{ padding: "12px 8px" }}>{s.z_value} years</td>
                        <td style={{ padding: "12px 8px", color: s.margin < 0 ? "var(--danger)" : "var(--success)", fontWeight: "bold" }}>
                          {s.margin < 0 ? `-${Math.abs(s.margin)} years (EXPIRED)` : `+${s.margin} years`}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <span className={`status-badge ${
                            s.category === "EXPIRED" ? "failed" :
                            s.category === "URGENT" ? "running" :
                            s.category === "PLAN" ? "pending" :
                            "completed"
                          }`}>
                            {s.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "recommendations" && (
        <div>
          {recs.length === 0 ? (
            <div className="card">
              <p className="empty-state">
                {scan.status === "completed" ? "No actionable recommendations generated." : "Recommendations available after scan completes."}
              </p>
            </div>
          ) : (
            <div className="recommendations-list" style={{ display: "grid", gap: "16px" }}>
              {recs.map((r) => (
                <div key={r.artefact_id} className="card" style={{ borderLeft: "4px solid var(--accent)", padding: "18px 24px", margin: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: "bold" }}>{r.name}</h4>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Finding ID: {r.artefact_id}</span>
                    </div>
                    <span className={`status-badge ${r.effort === "Low" ? "completed" : r.effort === "Medium" ? "running" : "failed"}`}>
                      Migration Effort: {r.effort}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
                    <div>
                      <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>Recommended Action</span>
                      <strong style={{
                        color: r.action.includes("Replacement") || r.action.includes("Immediate") ? "var(--danger)" : "var(--warning)"
                      }}>{r.action}</strong>
                    </div>
                    {r.primary_pqc && (
                      <div>
                        <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>Primary PQC Standard</span>
                        <strong>{r.primary_pqc} {r.nist_standard ? `(${r.nist_standard})` : ""}</strong>
                      </div>
                    )}
                    {r.hybrid_pair && (
                      <div>
                        <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>Hybrid Cipher Suite</span>
                        <strong>{r.hybrid_pair}</strong>
                      </div>
                    )}
                    {r.timeline_urgency && (
                      <div>
                        <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>Timeline Urgency</span>
                        <span className={`status-badge ${r.timeline_urgency === "IMMEDIATE" ? "failed" : r.timeline_urgency === "PLANNED" ? "running" : "completed"}`}>
                          {r.timeline_urgency}
                        </span>
                      </div>
                    )}
                  </div>

                  {r.rationale && (
                    <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 6, fontSize: 13, border: "1px solid var(--border-subtle)" }}>
                      <strong>Migration Rationale:</strong> {r.rationale}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
