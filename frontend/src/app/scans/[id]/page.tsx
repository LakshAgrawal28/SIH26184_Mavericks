"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import RiskDistribution from "@/components/RiskDistribution";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, apiFetch, getToken } from "@/lib/api";
import type { Artefact, MoscaResult, Recommendation, Scan, ScanSummary } from "@/lib/types";

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

  const [moscaX, setMoscaX] = useState<number>(10);
  const [moscaY, setMoscaY] = useState<number>(4);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cbomValidation, setCbomValidation] = useState<{ valid: boolean; error_count?: number; schema?: string } | null>(null);
  const [moscaSaving, setMoscaSaving] = useState(false);

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
    try {
      const validation = await apiFetch<{ valid: boolean; error_count?: number; schema?: string }>(
        `/api/v1/scans/${id}/reports/cbom/validate`
      );
      setCbomValidation(validation);
    } catch {
      setCbomValidation(null);
    }
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

    const poll = window.setInterval(async () => {
      try {
        const s = await apiFetch<Scan>(`/api/v1/scans/${id}`);
        setScan(s);
        if (s.data_lifetime_x !== undefined) setMoscaX(s.data_lifetime_x);
        if (s.migration_time_y !== undefined) setMoscaY(s.migration_time_y);
        if (s.status === "completed" || s.status === "failed") {
          if (s.status === "completed") await loadCompletedData();
          window.clearInterval(poll);
        }
      } catch {
        /* keep last known scan */
      }
    }, 800);

    const wsUrl = `${API_URL.replace(/^http/, "ws")}/api/v1/scans/${id}/progress`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as Partial<Scan>;
        setScan((prev) => (prev ? { ...prev, ...data } : prev));
        if (data.data_lifetime_x !== undefined) setMoscaX(data.data_lifetime_x);
        if (data.migration_time_y !== undefined) setMoscaY(data.migration_time_y);
        if (data.status === "completed") {
          loadCompletedData();
          window.clearInterval(poll);
        }
        if (data.status === "failed") window.clearInterval(poll);
      } catch (err) {
        console.error("WS error", err);
      }
    };
    ws.onerror = () => {
      /* HTTP polling above is the fallback when Redis/WS is unavailable */
    };
    return () => {
      window.clearInterval(poll);
      ws.close();
    };
  }, [id, router, loadCompletedData]);

  useEffect(() => {
    if (!scan || scan.status !== "completed") return;
    const handle = window.setTimeout(async () => {
      try {
        const live = await apiFetch<MoscaResult>(`/api/v1/scans/${id}/mosca?x=${moscaX}&y=${moscaY}`);
        setMosca(live);
      } catch {
        /* keep last known mosca */
      }
    }, 220);
    return () => window.clearTimeout(handle);
  }, [id, moscaX, moscaY, scan?.status]);

  async function saveMoscaBaseline() {
    setMoscaSaving(true);
    try {
      const body = await apiFetch<{ ok: boolean; mosca: MoscaResult }>(`/api/v1/scans/${id}/context`, {
        method: "PUT",
        body: JSON.stringify({ data_lifetime_x: moscaX, migration_time_y: moscaY }),
      });
      if (body.mosca) setMosca(body.mosca);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to save Mosca parameters");
    } finally {
      setMoscaSaving(false);
    }
  }

  async function exportCbom() {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/v1/scans/${id}/reports/cbom`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ecdat-cbom-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err instanceof Error ? `CBOM export failed: ${err.message}` : "CBOM export failed");
    }
  }

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

  const baselineClient = useMemo(
    () => clientScenarios.find((s) => s.name === "Baseline") ?? clientScenarios[0],
    [clientScenarios],
  );
  const worstClientCategory = useMemo(() => {
    if (clientScenarios.length === 0) return "MONITOR";
    let worst = "MONITOR";
    for (const sc of clientScenarios) {
      if (sc.category === "EXPIRED") worst = "EXPIRED";
      else if (sc.category === "URGENT" && worst !== "EXPIRED") worst = "URGENT";
      else if (sc.category === "PLAN" && worst === "MONITOR") worst = "PLAN";
    }
    return worst;
  }, [clientScenarios]);
  const headlineCategory = baselineClient?.category || worstClientCategory;

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

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-5">
        <div className="flex flex-wrap items-end gap-3 border-b border-[var(--rule)]">
          <TabsList variant="line" className="h-auto w-full flex-1 justify-start rounded-none bg-transparent p-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Artefacts</TabsTrigger>
            <TabsTrigger value="mosca">Mosca</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          {scan.status === "completed" && (
            <div className="tab-tools">
              {cbomValidation && (
                <span className={`status-badge ${cbomValidation.valid ? "completed" : "failed"}`} title={cbomValidation.schema || "CycloneDX 1.6"}>
                  CBOM {cbomValidation.valid ? "VALID 1.6" : "INVALID"}
                </span>
              )}
              <Button type="button" variant="outline" onClick={exportCbom}>
                Export CBOM
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="overview">
          <div className="overview-grid">
            <div className="card">
              <h3>Scan summary</h3>
              <div className="meta-list">
                <p>Target type: <strong>{scan.target_type}</strong></p>
                <p>Files scanned: <strong>{scan.total_files ?? "—"}</strong></p>
                <p>Total artefacts: <strong>{scan.total_artefacts ?? 0}</strong></p>
                {scan.status === "completed" && (scan.total_artefacts ?? 0) === 0 && (
                  <p className="callout warn">
                    The archive was unpacked ({scan.total_files ?? 0} files) but no crypto APIs, certificates,
                    TLS configs, or binaries matched. Nested zip/jar members are now unpacked automatically.
                    For the SIH demo use <code>scanner/corpus/archives/mixed-enterprise.zip</code>.
                  </p>
                )}
                <p>Critical risk: <strong>{scan.critical_risk_count ?? 0}</strong></p>
                <p>High risk: <strong>{scan.high_risk_count ?? 0}</strong></p>
                <p>Created: <strong>{scan.created_at ? new Date(scan.created_at).toLocaleString() : "—"}</strong></p>
                {summary?.layers_present && summary.layers_present.length > 0 && (
                  <p>Detector layers: <strong>{summary.layers_present.join(" · ")}</strong></p>
                )}
                {cbomValidation && (
                  <p>
                    CycloneDX 1.6 schema:{" "}
                    <strong className={cbomValidation.valid ? "action-ok" : "action-hot"}>
                      {cbomValidation.valid ? "VALID" : `INVALID (${cbomValidation.error_count} errors)`}
                    </strong>
                  </p>
                )}
                {scan.error_message && (
                  <p className="error-text">{scan.error_message}</p>
                )}
              </div>
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
        </TabsContent>

        <TabsContent value="inventory">
          <div className="card">
            <div className="filter-bar">
              <Input
                type="text"
                placeholder="Search by name, file path, action…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="ALL">All risks</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {filteredArtefacts.length === 0 ? (
              <p className="empty-state">
                {scan.status === "completed"
                  ? (scan.total_artefacts ?? 0) === 0
                    ? `No cryptographic artefacts in ${scan.total_files ?? 0} files. Try mixed-enterprise.zip.`
                    : "No matching artefacts found."
                  : "Inventory available after scan completes."}
              </p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name / Algorithm</th>
                      <th>Asset type</th>
                      <th>Risk band</th>
                      <th>Location</th>
                      <th>Detected by</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArtefacts.map((a) => {
                      const isExpanded = expandedId === a.artefact_id;
                      return (
                        <Fragment key={a.artefact_id}>
                          <tr
                            className={isExpanded ? "is-open" : undefined}
                            onClick={() => setExpandedId(isExpanded ? null : a.artefact_id)}
                            style={{ cursor: "pointer" }}
                          >
                            <td>
                              <div style={{ fontWeight: 500 }}>{a.name}</div>
                              {a.recommendation?.nist_standard && (
                                <span className="nist-chip">{a.recommendation.nist_standard}</span>
                              )}
                            </td>
                            <td style={{ textTransform: "capitalize" }}>{a.asset_type}</td>
                            <td>
                              <span className={`badge ${a.risk.risk_band}`}>
                                {a.risk.risk_band} ({a.risk.final_score})
                              </span>
                            </td>
                            <td>
                              {a.file_path}
                              {a.line_number ? `:${a.line_number}` : ""}
                            </td>
                            <td>
                              <code>{a.detection_method || "—"}</code>
                            </td>
                            <td>
                              {a.recommendation?.action ? (
                                <span className={`status-badge ${
                                  a.recommendation.action.includes("Replacement") || a.recommendation.action.includes("Expired") ? "failed" :
                                  a.recommendation.action.includes("Migration") || a.recommendation.action.includes("Migrate") ? "running" :
                                  "completed"
                                }`}>
                                  {a.recommendation.action}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6}>
                                <div className="expand-panel">
                                  <div className="expand-grid">
                                    <div>
                                      <span>HNDL risk score</span>
                                      <strong>{a.risk.hndl_risk ?? 0} / 10</strong>
                                    </div>
                                    <div>
                                      <span>Operational risk</span>
                                      <strong>{a.risk.operational_risk ?? 0} / 10</strong>
                                    </div>
                                    <div>
                                      <span>PQC urgency</span>
                                      <strong>{a.recommendation?.timeline_urgency ?? "MONITORING"}</strong>
                                    </div>
                                  </div>
                                  {a.recommendation?.rationale && (
                                    <p>
                                      <strong>Rationale:</strong> {a.recommendation.rationale}
                                    </p>
                                  )}
                                  {a.evidence_snippet && (
                                    <div>
                                      <span>Evidence snippet</span>
                                      <pre>{a.evidence_snippet}</pre>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mosca">
          <div className="card">
            {!mosca ? (
              <p className="empty-state">Mosca analysis available after scan completes.</p>
            ) : (
              <>
                <h3>Mosca theorem risk modeling</h3>
                <p className="lede">
                  Mosca&apos;s Theorem: data confidentiality is already expired if migration time (Y) plus data lifetime (X)
                  exceeds CRQC collapse time (Z). Move the sliders — the engine recomputes live (EXPIRED ↔ URGENT ↔ PLAN).
                </p>
                {mosca.formula && (
                  <p className="formula">{mosca.formula}</p>
                )}
                {mosca.transition?.changed && (
                  <div
                    className={`mosca-flip ${mosca.transition.improved ? "improved" : "worsened"}`}
                    role="status"
                  >
                    Live decision: <strong>{mosca.transition.label}</strong>
                    {mosca.interpretation ? ` — ${mosca.interpretation}` : ""}
                  </div>
                )}

                <div className="mosca-controls">
                  <div className="mosca-field">
                    <Label htmlFor="detail-x">
                      <span>Data lifetime (X)</span>
                      <strong>{moscaX} years</strong>
                    </Label>
                    <Slider
                      id="detail-x"
                      min={1}
                      max={30}
                      step={1}
                      value={[moscaX]}
                      onValueChange={(v) => setMoscaX(v[0] ?? 10)}
                    />
                    <span className="mosca-hint">
                      How long the scanned data must remain secure (e.g. classification period).
                    </span>
                  </div>

                  <div className="mosca-field">
                    <Label htmlFor="detail-y">
                      <span>Migration time (Y)</span>
                      <strong>{moscaY} years</strong>
                    </Label>
                    <Slider
                      id="detail-y"
                      min={1}
                      max={15}
                      step={1}
                      value={[moscaY]}
                      onValueChange={(v) => setMoscaY(v[0] ?? 4)}
                    />
                    <span className="mosca-hint">
                      How long it takes to re-engineer infrastructure and implement PQC.
                    </span>
                  </div>
                </div>

                <div className="mosca-summary">
                  <div>
                    <span className="label">Total migration margin needed (X + Y)</span>
                    <div className="figure">{moscaX + moscaY} years</div>
                  </div>
                  <div>
                    <span className="label" style={{ display: "block", textAlign: "right" }}>
                      Baseline (Z=10y)
                    </span>
                    <span className={`status-badge ${
                      headlineCategory === "EXPIRED" ? "failed" :
                      headlineCategory === "URGENT" ? "running" :
                      headlineCategory === "PLAN" ? "pending" :
                      "completed"
                    }`}>
                      {headlineCategory}
                    </span>
                    <span className="mosca-hint" style={{ textAlign: "right" }}>
                      Worst scenario: {worstClientCategory}
                    </span>
                  </div>
                  <Button type="button" variant="outline" onClick={saveMoscaBaseline} disabled={moscaSaving}>
                    {moscaSaving ? "Saving…" : "Save as scan baseline"}
                  </Button>
                </div>

                <div className="mosca-timeline" aria-label="Mosca timeline versus CRQC scenarios">
                  {(() => {
                    const total = moscaX + moscaY;
                    const zs = clientScenarios.map((s) => s.z_value);
                    const maxZ = Math.max(total, ...zs, 1);
                    return (
                      <>
                        <div className="mosca-timeline-bar">
                          <div className="mosca-timeline-need" style={{ width: `${Math.min(100, (total / maxZ) * 100)}%` }} />
                          {clientScenarios.map((s) => (
                            <span
                              key={s.name}
                              className={`mosca-z ${s.category.toLowerCase()}`}
                              style={{ left: `${(s.z_value / maxZ) * 100}%` }}
                              title={`${s.name} Z=${s.z_value} ${s.category}`}
                            />
                          ))}
                        </div>
                        <div className="mosca-timeline-legend">
                          <span>Need X+Y = {total}y</span>
                          {clientScenarios.map((s) => (
                            <span key={s.name}>{s.name} Z={s.z_value}y</span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <h4>Quantum collapse scenarios (Z)</h4>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Scenario</th>
                        <th>Est. collapse time (Z)</th>
                        <th>Safety margin (Z − [X+Y])</th>
                        <th>Urgency rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientScenarios.map((s) => (
                        <tr key={s.name}>
                          <td style={{ fontWeight: 500 }}>{s.name}</td>
                          <td>{s.z_value} years</td>
                          <td className={s.margin < 0 ? "action-hot" : "action-ok"} style={{ fontWeight: 500 }}>
                            {s.margin < 0 ? `-${Math.abs(s.margin)} years (EXPIRED)` : `+${s.margin} years`}
                          </td>
                          <td>
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
        </TabsContent>

        <TabsContent value="recommendations">
          {recs.length === 0 ? (
            <div className="card">
              <p className="empty-state">
                {scan.status === "completed"
                  ? "No migration actions for this scan. AES/SHA-256-style Keep findings stay on Inventory. Re-run the scan after a mapping update to refresh this tab."
                  : "Recommendations available after scan completes."}
              </p>
            </div>
          ) : (
            <div className="recommendations-list">
              {recs.map((r) => (
                <div key={r.artefact_id} className="rec-card">
                  <div className="rec-head">
                    <div>
                      <h4>{r.name}</h4>
                      <span className="rec-id">Finding ID: {r.artefact_id}</span>
                    </div>
                    <span className={`status-badge ${r.effort === "Low" ? "completed" : r.effort === "Medium" ? "running" : "failed"}`}>
                      Migration effort: {r.effort}
                    </span>
                  </div>

                  <div className="rec-grid">
                    <div>
                      <span>Recommended action</span>
                      <strong className={
                        (r.action || "").includes("Replacement") || (r.action || "").includes("Immediate")
                          ? "action-hot"
                          : "action-warn"
                      }>{r.action || "Review"}</strong>
                    </div>
                    {r.primary_pqc && (
                      <div>
                        <span>Primary PQC standard</span>
                        <strong>{r.primary_pqc} {r.nist_standard ? `(${r.nist_standard})` : ""}</strong>
                      </div>
                    )}
                    {r.hybrid_pair && (
                      <div>
                        <span>Hybrid cipher suite</span>
                        <strong>{r.hybrid_pair}</strong>
                      </div>
                    )}
                    {r.timeline_urgency && (
                      <div>
                        <span>Timeline urgency</span>
                        <span className={`status-badge ${r.timeline_urgency === "IMMEDIATE" ? "failed" : r.timeline_urgency === "PLANNED" ? "running" : "completed"}`}>
                          {r.timeline_urgency}
                        </span>
                      </div>
                    )}
                  </div>

                  {r.rationale && (
                    <div className="rec-rationale">
                      <strong>Migration rationale:</strong> {r.rationale}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
