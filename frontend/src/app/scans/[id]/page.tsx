"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import RiskDistribution from "@/components/RiskDistribution";
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
      const s = await apiFetch<Scan>(`/api/v1/scans/${id}`);
      setScan(s);
      if (s.status === "completed") {
        await loadCompletedData();
      }
    };
    load();

    const wsUrl = `${API_URL.replace(/^http/, "ws")}/api/v1/scans/${id}/progress`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data) as Partial<Scan>;
      setScan((prev) => (prev ? { ...prev, ...data } : prev));
      if (data.status === "completed") loadCompletedData();
    };
    return () => ws.close();
  }, [id, router, loadCompletedData]);

  async function exportCbom() {
    const token = getToken();
    const res = await fetch(`${API_URL}/api/v1/scans/${id}/reports/cbom`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ecdat-cbom-${id}.json`;
    a.click();
  }

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
          >
            {t}
          </button>
        ))}
        {scan.status === "completed" && (
          <button type="button" className="btn secondary" onClick={exportCbom}>
            Export CBOM
          </button>
        )}
      </div>

      {tab === "overview" && (
        <div className="overview-grid">
          <div className="card">
            <h3>Scan Summary</h3>
            <p>Files scanned: <strong>{scan.total_files ?? "—"}</strong></p>
            <p>Total artefacts: <strong>{scan.total_artefacts ?? 0}</strong></p>
            <p>Critical risk: <strong>{scan.critical_risk_count ?? 0}</strong></p>
            <p>High risk: <strong>{scan.high_risk_count ?? 0}</strong></p>
            {scan.error_message && (
              <p className="error-text">{scan.error_message}</p>
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
          {artefacts.length === 0 ? (
            <p className="empty-state">
              {scan.status === "completed" ? "No artefacts found." : "Inventory available after scan completes."}
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Risk</th>
                    <th>Location</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {artefacts.map((a) => (
                    <tr key={a.artefact_id}>
                      <td>{a.name}</td>
                      <td>{a.asset_type}</td>
                      <td>
                        <span className={`badge ${a.risk.risk_band}`}>
                          {a.risk.risk_band}
                        </span>
                      </td>
                      <td>
                        {a.file_path}
                        {a.line_number ? `:${a.line_number}` : ""}
                      </td>
                      <td>
                        {a.evidence_snippet && <pre>{a.evidence_snippet}</pre>}
                      </td>
                    </tr>
                  ))}
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
              <p>
                X (data lifetime): <strong>{mosca.parameters.data_lifetime_x}</strong> yrs
                {" · "}
                Y (migration): <strong>{mosca.parameters.migration_time_y}</strong> yrs
              </p>
              <p>
                Overall category: <strong>{mosca.overall_category}</strong>
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Scenario</th>
                      <th>Z</th>
                      <th>Margin</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mosca.scenarios.map((s) => (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td>{s.z_value}</td>
                        <td>{s.margin}</td>
                        <td>{s.category}</td>
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
        <div className="card">
          {recs.length === 0 ? (
            <p className="empty-state">
              {scan.status === "completed" ? "No recommendations generated." : "Recommendations available after scan completes."}
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Action</th>
                    <th>PQC</th>
                    <th>Hybrid</th>
                    <th>Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {recs.map((r) => (
                    <tr key={r.artefact_id}>
                      <td>{r.name}</td>
                      <td>{r.action}</td>
                      <td>{r.primary_pqc}</td>
                      <td>{r.hybrid_pair}</td>
                      <td>{r.effort}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
