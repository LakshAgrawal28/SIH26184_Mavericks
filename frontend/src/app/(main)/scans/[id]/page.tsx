"use client";

import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import RiskDistribution from "@/components/RiskDistribution";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, apiFetch, getToken } from "@/lib/api";
import type { Artefact, MoscaResult, Recommendation, Scan, ScanSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "overview" | "inventory" | "mosca" | "recommendations";

function urgencyStyle(category: string) {
  if (category === "EXPIRED") return "bg-red-50 text-red-700";
  if (category === "URGENT") return "bg-orange-50 text-orange-700";
  if (category === "PLAN") return "bg-amber-50 text-amber-800";
  return "bg-emerald-50 text-emerald-700";
}

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [scan, setScan] = useState<Scan | null>(null);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [artefacts, setArtefacts] = useState<Artefact[]>([]);
  const [mosca, setMosca] = useState<MoscaResult | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [moscaX, setMoscaX] = useState(10);
  const [moscaY, setMoscaY] = useState(4);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cbomValidation, setCbomValidation] = useState<{
    valid: boolean;
    error_count?: number;
    schema?: string;
  } | null>(null);
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
      const validation = await apiFetch<{
        valid: boolean;
        error_count?: number;
        schema?: string;
      }>(`/api/v1/scans/${id}/reports/cbom/validate`);
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
        if (s.status === "completed") await loadCompletedData();
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
        /* keep polling */
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
    ws.onerror = () => {};
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
        /* keep last */
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
      window.alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setMoscaSaving(false);
    }
  }

  async function exportCbom() {
    try {
      const res = await fetch(`${API_URL}/api/v1/scans/${id}/reports/cbom`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ecdat-cbom-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Export failed");
    }
  }

  const filteredArtefacts = useMemo(() => {
    return artefacts.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.file_path && a.file_path.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.recommendation?.action &&
          a.recommendation.action.toLowerCase().includes(searchTerm.toLowerCase()));
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
      if (margin < 0) category = "EXPIRED";
      else if (margin < 2) category = "URGENT";
      else if (maxRisk >= 5.5) category = "PLAN";
      return { name: sc.name, z_value: sc.z_value, margin, category };
    });
  }, [mosca, moscaX, moscaY, maxRisk]);

  const baselineClient = useMemo(
    () => clientScenarios.find((s) => s.name === "Baseline") ?? clientScenarios[0],
    [clientScenarios]
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
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const riskTotal = summary?.total_artefacts ?? scan.total_artefacts ?? 0;
  const progress = scan.progress_percentage ?? 0;

  return (
    <>
      <PageHeader
        title={scan.name}
        description={scan.current_stage || `Scan ${scan.status}`}
        breadcrumb={["ECDAT", "Scans", scan.name]}
        actions={
          scan.status === "completed" ? (
            <div className="flex items-center gap-2">
              {cbomValidation && (
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    cbomValidation.valid
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  CBOM {cbomValidation.valid ? "valid 1.6" : "invalid"}
                </span>
              )}
              <Button type="button" variant="outline" onClick={exportCbom}>
                Export CBOM
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Status" value={scan.status} />
        <StatCard label="Progress" value={`${progress}%`} />
        <StatCard label="Artefacts" value={scan.total_artefacts ?? 0} />
        <StatCard label="Critical" value={scan.critical_risk_count ?? 0} dot="critical" />
        <StatCard label="High" value={scan.high_risk_count ?? 0} dot="high" />
      </div>

      {scan.status !== "completed" && scan.status !== "failed" && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-8 gap-6">
        <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b border-zinc-200 bg-transparent p-0">
          <TabsTrigger value="overview" className="px-4 py-2.5">Overview</TabsTrigger>
          <TabsTrigger value="inventory" className="px-4 py-2.5">Artefacts</TabsTrigger>
          <TabsTrigger value="mosca" className="px-4 py-2.5">Mosca</TabsTrigger>
          <TabsTrigger value="recommendations" className="px-4 py-2.5">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">Scan summary</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Target type</dt>
                  <dd className="font-medium text-zinc-900">{scan.target_type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Files scanned</dt>
                  <dd className="font-medium text-zinc-900">{scan.total_files ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Total artefacts</dt>
                  <dd className="font-medium text-zinc-900">{scan.total_artefacts ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Created</dt>
                  <dd className="font-medium text-zinc-900">
                    {scan.created_at ? new Date(scan.created_at).toLocaleString() : "—"}
                  </dd>
                </div>
                {summary?.layers_present && summary.layers_present.length > 0 && (
                  <div>
                    <dt className="text-zinc-500">Detector layers</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      {summary.layers_present.join(" · ")}
                    </dd>
                  </div>
                )}
                {cbomValidation && (
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">CycloneDX 1.6</dt>
                    <dd className={cn("font-medium", cbomValidation.valid ? "text-emerald-600" : "text-red-600")}>
                      {cbomValidation.valid ? "Valid" : `Invalid (${cbomValidation.error_count} errors)`}
                    </dd>
                  </div>
                )}
              </dl>
              {scan.error_message && (
                <p className="mt-4 text-sm text-red-600">{scan.error_message}</p>
              )}
            </div>
            {summary && scan.status === "completed" && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <RiskDistribution distribution={summary.risk_distribution} total={riskTotal} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-wrap gap-3 border-b border-zinc-200 p-4">
              <Input
                placeholder="Search artefacts…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
              >
                <option value="ALL">All risks</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {filteredArtefacts.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-zinc-500">
                {scan.status === "completed"
                  ? "No matching artefacts found."
                  : "Inventory available after scan completes."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-zinc-500">Name</th>
                      <th className="px-5 py-3 text-xs font-medium text-zinc-500">Type</th>
                      <th className="px-5 py-3 text-xs font-medium text-zinc-500">Risk</th>
                      <th className="px-5 py-3 text-xs font-medium text-zinc-500">Location</th>
                      <th className="px-5 py-3 text-xs font-medium text-zinc-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArtefacts.map((a) => {
                      const open = expandedId === a.artefact_id;
                      return (
                        <Fragment key={a.artefact_id}>
                          <tr
                            className="cursor-pointer border-b border-zinc-100 transition-colors duration-150 hover:bg-zinc-50"
                            onClick={() => setExpandedId(open ? null : a.artefact_id)}
                          >
                            <td className="px-5 py-3.5 font-medium text-zinc-900">{a.name}</td>
                            <td className="px-5 py-3.5 capitalize text-zinc-600">{a.asset_type}</td>
                            <td className="px-5 py-3.5">
                              <RiskBadge band={a.risk.risk_band} score={a.risk.final_score} />
                            </td>
                            <td className="max-w-xs truncate px-5 py-3.5 text-zinc-500">
                              {a.file_path}
                              {a.line_number ? `:${a.line_number}` : ""}
                            </td>
                            <td className="px-5 py-3.5 text-zinc-600">
                              {a.recommendation?.action ?? "—"}
                            </td>
                          </tr>
                          {open && (
                            <tr className="bg-zinc-50">
                              <td colSpan={5} className="px-5 py-4">
                                <div className="grid gap-4 sm:grid-cols-3 text-sm">
                                  <div>
                                    <p className="text-xs text-zinc-500">HNDL risk</p>
                                    <p className="font-medium text-zinc-900">{a.risk.hndl_risk ?? 0} / 10</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-zinc-500">Operational risk</p>
                                    <p className="font-medium text-zinc-900">{a.risk.operational_risk ?? 0} / 10</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-zinc-500">PQC urgency</p>
                                    <p className="font-medium text-zinc-900">
                                      {a.recommendation?.timeline_urgency ?? "MONITORING"}
                                    </p>
                                  </div>
                                </div>
                                {a.recommendation?.rationale && (
                                  <p className="mt-3 text-sm text-zinc-600">{a.recommendation.rationale}</p>
                                )}
                                {a.evidence_snippet && (
                                  <pre className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
                                    {a.evidence_snippet}
                                  </pre>
                                )}
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
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            {!mosca ? (
              <p className="text-sm text-zinc-500">Mosca analysis available after scan completes.</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Mosca theorem</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Adjust X and Y to model data lifetime and migration time against CRQC scenarios.
                  </p>
                  {mosca.formula && (
                    <code className="mt-3 block rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                      {mosca.formula}
                    </code>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-center justify-between">
                      <Label>Data lifetime (X)</Label>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                        {moscaX}y
                      </span>
                    </div>
                    <Slider className="mt-3" min={1} max={30} step={1} value={[moscaX]} onValueChange={(v) => setMoscaX(v[0] ?? 10)} />
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-center justify-between">
                      <Label>Migration time (Y)</Label>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                        {moscaY}y
                      </span>
                    </div>
                    <Slider className="mt-3" min={1} max={15} step={1} value={[moscaY]} onValueChange={(v) => setMoscaY(v[0] ?? 4)} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div>
                    <p className="text-xs text-zinc-500">X + Y needed</p>
                    <p className="text-2xl font-semibold tabular-nums text-zinc-900">{moscaX + moscaY} years</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Baseline verdict</p>
                    <span className={cn("mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-medium", urgencyStyle(headlineCategory))}>
                      {headlineCategory}
                    </span>
                  </div>
                  <Button variant="outline" onClick={saveMoscaBaseline} disabled={moscaSaving}>
                    {moscaSaving ? "Saving…" : "Save baseline"}
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                        <th className="px-4 py-3 text-xs font-medium text-zinc-500">Scenario</th>
                        <th className="px-4 py-3 text-xs font-medium text-zinc-500">Z (years)</th>
                        <th className="px-4 py-3 text-xs font-medium text-zinc-500">Margin</th>
                        <th className="px-4 py-3 text-xs font-medium text-zinc-500">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientScenarios.map((s) => (
                        <tr key={s.name} className="border-b border-zinc-100 last:border-0">
                          <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
                          <td className="px-4 py-3 text-zinc-600">{s.z_value}</td>
                          <td className={cn("px-4 py-3 font-medium", s.margin < 0 ? "text-red-600" : "text-emerald-600")}>
                            {s.margin < 0 ? `-${Math.abs(s.margin)}y` : `+${s.margin}y`}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", urgencyStyle(s.category))}>
                              {s.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          {recs.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-sm text-zinc-500">
                {scan.status === "completed"
                  ? "No migration actions for this scan."
                  : "Recommendations available after scan completes."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recs.map((r) => (
                <div
                  key={r.artefact_id}
                  className="rounded-xl border border-zinc-200 border-l-4 border-l-indigo-500 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-zinc-900">{r.name}</h4>
                      <p className="mt-0.5 font-mono text-xs text-zinc-400">{r.artefact_id}</p>
                    </div>
                    <StatusBadge status={r.effort === "Low" ? "completed" : r.effort === "Medium" ? "running" : "failed"} />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <p className="text-xs text-zinc-500">Action</p>
                      <p className="mt-0.5 font-medium text-zinc-900">{r.action || "Review"}</p>
                    </div>
                    {r.primary_pqc && (
                      <div>
                        <p className="text-xs text-zinc-500">PQC standard</p>
                        <p className="mt-0.5 font-medium text-zinc-900">
                          {r.primary_pqc} {r.nist_standard ? `(${r.nist_standard})` : ""}
                        </p>
                      </div>
                    )}
                    {r.hybrid_pair && (
                      <div>
                        <p className="text-xs text-zinc-500">Hybrid</p>
                        <p className="mt-0.5 font-medium text-zinc-900">{r.hybrid_pair}</p>
                      </div>
                    )}
                    {r.timeline_urgency && (
                      <div>
                        <p className="text-xs text-zinc-500">Urgency</p>
                        <p className="mt-0.5 font-medium text-zinc-900">{r.timeline_urgency}</p>
                      </div>
                    )}
                  </div>
                  {r.rationale && (
                    <p className="mt-4 border-t border-zinc-100 pt-4 text-sm text-zinc-600">{r.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
