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
import { API_URL, apiFetch, copyText, getToken } from "@/lib/api";
import type { Artefact, MoscaResult, Recommendation, Scan, ScanSummary } from "@/lib/types";
import NarrativeMarkdown from "@/components/NarrativeMarkdown";
import { cn } from "@/lib/utils";

function quantumStyle(kind?: string) {
  if (kind === "shor") return "bg-red-50 text-red-700";
  if (kind === "broken_classical") return "bg-orange-50 text-orange-800";
  if (kind === "inspect") return "bg-violet-50 text-violet-800";
  if (kind === "grover") return "bg-sky-50 text-sky-800";
  if (kind === "none") return "bg-emerald-50 text-emerald-700";
  return "bg-zinc-100 text-zinc-600";
}

function quantumLabel(kind?: string) {
  if (kind === "shor") return "Shor (public-key)";
  if (kind === "grover") return "Grover (symmetric)";
  if (kind === "broken_classical") return "Broken classically";
  if (kind === "inspect") return "Inspect (not an algo)";
  if (kind === "none") return "PQC-safe";
  return kind || "Unknown";
}

type Tab = "overview" | "inventory" | "mosca" | "recommendations" | "assistant";

function urgencyStyle(category: string) {
  if (category === "EXPIRED") return "border border-[#B3261E] text-[#B3261E]";
  if (category === "URGENT") return "border border-[#B3261E] text-[#B3261E]";
  if (category === "PLAN") return "border border-[#B8781F] text-[#B8781F]";
  return "border border-[#1B7A3D] text-[#1B7A3D]";
}

type DiffItem = {
  bom_ref?: string;
  name?: string;
  risk_band?: string;
  previous_risk_band?: string;
  final_risk_score?: number;
  previous_final_risk_score?: number;
  score_delta?: number;
};

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
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [quantumFilter, setQuantumFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cbomValidation, setCbomValidation] = useState<{
    valid: boolean;
    error_count?: number;
    schema?: string;
  } | null>(null);
  const [moscaSaving, setMoscaSaving] = useState(false);
  const [diffAgainstId, setDiffAgainstId] = useState("");
  const [scanDiff, setScanDiff] = useState<{
    added?: DiffItem[];
    removed?: DiffItem[];
    risk_band_changed?: DiffItem[];
    score_changed?: DiffItem[];
    counts?: {
      added: number;
      removed: number;
      risk_band_changed: number;
      score_changed?: number;
      critical_before: number;
      critical_after: number;
      total_artefacts_before?: number;
      total_artefacts_after?: number;
    };
    mosca?: { transition?: { label: string } };
  } | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [diffHighlight, setDiffHighlight] = useState(false);
  const [scanIdCopied, setScanIdCopied] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ available: boolean; enabled: boolean } | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeMeta, setNarrativeMeta] = useState<{
    contextTruncated?: boolean;
    artefactsInContext?: number;
    totalArtefacts?: number;
    disclaimer?: string;
  } | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  async function copyScanId() {
    try {
      await copyText(id);
      setScanIdCopied(true);
      window.setTimeout(() => setScanIdCopied(false), 1500);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to copy scan ID.");
    }
  }

  useEffect(() => {
    apiFetch<{ available: boolean; enabled: boolean }>("/api/v1/meta/ai")
      .then(setAiStatus)
      .catch(() => setAiStatus({ available: false, enabled: false }));
  }, []);

  const loadCompletedData = useCallback(async () => {
    const [arts, moscaData, recData, summaryData] = await Promise.all([
      apiFetch<{ artefacts?: Artefact[] }>(`/api/v1/scans/${id}/artefacts?limit=500`),
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
    try {
      const history = await apiFetch<{
        results?: {
          kind: string;
          content: string;
          metadata?: {
            question?: string;
            context_metadata?: {
              truncated?: boolean;
              included_artefacts?: number;
              available_artefacts?: number;
            };
          };
        }[];
      }>(`/api/v1/scans/${id}/ai-results?limit=20`);
      const latestNarration = history.results?.find((result) => result.kind === "narration");
      if (latestNarration) {
        setNarrative(latestNarration.content);
        const metadata = latestNarration.metadata?.context_metadata;
        setNarrativeMeta({
          contextTruncated: metadata?.truncated,
          artefactsInContext: metadata?.included_artefacts,
          totalArtefacts: metadata?.available_artefacts,
        });
      }
      const chat = (history.results || [])
        .filter((result) => result.kind === "chat")
        .reverse()
        .flatMap((result) => [
          ...(result.metadata?.question
            ? [{ role: "user" as const, text: result.metadata.question }]
            : []),
          { role: "assistant" as const, text: result.content },
        ]);
      if (chat.length > 0) setChatMessages(chat);
    } catch {
      // AI history is optional and may be unavailable when the feature is disabled.
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

    const token = getToken();
    const wsBase = `${API_URL.replace(/^http/, "ws")}/api/v1/scans/${id}/progress`;
    const wsUrl = token ? `${wsBase}?token=${encodeURIComponent(token)}` : wsBase;
    const ws = token ? new WebSocket(wsUrl) : null;
    if (ws) {
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
    }
    return () => {
      window.clearInterval(poll);
      ws?.close();
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

  async function runExecutiveNarrative() {
    setNarrativeLoading(true);
    setNarrativeError(null);
    try {
      const data = await apiFetch<{
        narrative: string;
        disclaimer?: string;
        context_truncated?: boolean;
        artefacts_in_context?: number;
        total_artefacts?: number;
      }>(
        `/api/v1/scans/${id}/narrate`,
        { method: "POST", body: JSON.stringify({ style: "executive" }) }
      );
      setNarrative(data.narrative);
      setNarrativeMeta({
        contextTruncated: data.context_truncated,
        artefactsInContext: data.artefacts_in_context,
        totalArtefacts: data.total_artefacts,
        disclaimer: data.disclaimer,
      });
    } catch (err) {
      setNarrativeError(err instanceof Error ? err.message : "Narration unavailable");
    } finally {
      setNarrativeLoading(false);
    }
  }

  async function sendAssistantMessage() {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput("");
    setChatError(null);
    setChatMessages((prev) => {
      const withUser = [...prev, { role: "user" as const, text: msg }];
      return withUser;
    });
    setChatLoading(true);
    try {
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const body: {
        message: string;
        against_scan_id?: string;
        history?: { role: string; content: string }[];
      } = { message: msg, history };
      if (diffAgainstId.trim()) body.against_scan_id = diffAgainstId.trim();
      const data = await apiFetch<{ reply: string }>(`/api/v1/scans/${id}/chat`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setChatMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Assistant unavailable");
    } finally {
      setChatLoading(false);
    }
  }

  async function loadScanDiff() {
    if (!diffAgainstId.trim()) return;
    setDiffLoading(true);
    setDiffError(null);
    try {
      const data = await apiFetch<typeof scanDiff>(
        `/api/v1/scans/${id}/diff?against=${encodeURIComponent(diffAgainstId.trim())}`
      );
      setScanDiff(data);
      setDiffHighlight(true);
      window.setTimeout(() => setDiffHighlight(false), 2400);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Diff failed";
      setDiffError(message);
      setScanDiff(null);
    } finally {
      setDiffLoading(false);
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
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        a.name.toLowerCase().includes(q) ||
        (a.file_path && a.file_path.toLowerCase().includes(q)) ||
        (a.algorithm && a.algorithm.toLowerCase().includes(q)) ||
        (a.recommendation?.action && a.recommendation.action.toLowerCase().includes(q));
      const matchesRisk = riskFilter === "ALL" || a.risk.risk_band === riskFilter;
      const matchesType = typeFilter === "ALL" || a.asset_type === typeFilter;
      const qb = a.risk.quantum_break || a.raw_metadata?.quantum_break || "unknown";
      const matchesQuantum = quantumFilter === "ALL" || qb === quantumFilter;
      return matchesSearch && matchesRisk && matchesType && matchesQuantum;
    });
  }, [artefacts, searchTerm, riskFilter, typeFilter, quantumFilter]);

  const assetTypeOptions = useMemo(() => {
    const set = new Set(artefacts.map((a) => a.asset_type).filter(Boolean));
    return ["ALL", ...Array.from(set).sort()];
  }, [artefacts]);

  const maxRisk = useMemo(() => {
    if (artefacts.length === 0) return 0;
    return Math.max(...artefacts.map((a) => a.risk.final_score ?? 0));
  }, [artefacts]);

  const diffChangedItems = useMemo(() => {
    if (!scanDiff) return [];
    const items = [...(scanDiff.risk_band_changed || [])];
    const refs = new Set(items.map((item) => item.bom_ref));
    for (const item of scanDiff.score_changed || []) {
      if (!refs.has(item.bom_ref)) items.push(item);
    }
    return items;
  }, [scanDiff]);

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
                    " border px-2 py-0.5 text-xs font-medium",
                    cbomValidation.valid
                      ? "border-[#1B7A3D] text-[#1B7A3D]"
                      : "border-[#B3261E] text-[#B3261E]"
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
      <div className="mb-6 flex flex-wrap items-center gap-3 border border-border bg-surface px-4 py-3 text-sm">
        <span className="font-medium text-foreground">Scan ID</span>
        <code className="break-all font-mono text-xs text-ink-muted">{id}</code>
        <Button type="button" variant="outline" size="sm" onClick={copyScanId}>
          {scanIdCopied ? "Copied" : "Copy scan ID"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Status" value={scan.status} />
        <StatCard label="Progress" value={`${progress}%`} />
        <StatCard label="Artefacts" value={scan.total_artefacts ?? 0} />
        <StatCard label="Critical" value={scan.critical_risk_count ?? 0} dot="critical" />
        <StatCard label="High" value={scan.high_risk_count ?? 0} dot="high" />
      </div>
      {scan.status === "completed" && summary && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Shor-vulnerable" value={summary.shor_vulnerable_count ?? 0} dot="critical" />
          <StatCard label="Classical hygiene" value={summary.classical_hygiene_count ?? 0} dot="high" />
          <StatCard label="HSM / cloud KMS" value={summary.hsm_cloud_count ?? 0} />
          <StatCard label="Crypto libraries" value={summary.library_count ?? 0} />
        </div>
      )}

      {scan.status !== "completed" && scan.status !== "failed" && (
        <div className="relative mt-4 h-px bg-border">
          <div
            className="absolute left-0 top-0 h-px bg-[#1B4B8C] transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-8 gap-6">
        <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="overview" className="px-4 py-2.5">Overview</TabsTrigger>
          <TabsTrigger value="inventory" className="px-4 py-2.5">Artefacts</TabsTrigger>
          <TabsTrigger value="mosca" className="px-4 py-2.5">Mosca</TabsTrigger>
          <TabsTrigger value="recommendations" className="px-4 py-2.5">Recommendations</TabsTrigger>
          <TabsTrigger value="assistant" className="px-4 py-2.5">Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel p-6">
              <h3 className="text-sm font-semibold text-foreground">Scan summary</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Target type</dt>
                  <dd className="font-medium text-foreground">{scan.target_type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Files scanned</dt>
                  <dd className="font-medium text-foreground">{scan.total_files ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Total artefacts</dt>
                  <dd className="font-medium text-foreground">{scan.total_artefacts ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Created</dt>
                  <dd className="font-medium text-foreground">
                    {scan.created_at ? new Date(scan.created_at).toLocaleString() : "—"}
                  </dd>
                </div>
                {summary?.layers_present && summary.layers_present.length > 0 && (
                  <div>
                    <dt className="text-ink-muted">Detector layers</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {summary.layers_present.join(" · ")}
                    </dd>
                  </div>
                )}
                {cbomValidation && (
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">CycloneDX 1.6</dt>
                    <dd className={cn("font-medium", cbomValidation.valid ? "text-[#1B7A3D]" : "text-[#B3261E]")}>
                      {cbomValidation.valid ? "Valid" : `Invalid (${cbomValidation.error_count} errors)`}
                    </dd>
                  </div>
                )}
              </dl>
              {scan.error_message && (
                <p className="mt-4 text-sm text-[#B3261E]">{scan.error_message}</p>
              )}
            </div>
            {summary && scan.status === "completed" && (
              <div className="panel p-6">
                <RiskDistribution distribution={summary.risk_distribution} total={riskTotal} />
              </div>
            )}
          </div>
          {scan.status === "completed" && summary && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="panel p-6">
                <h3 className="text-sm font-semibold text-foreground">Quantum class (not all crypto is Shor)</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  AES and HMAC are Grover-only. JWT packages are inspected, not scored as RSA. Public-key
                  (RSA/ECDH/ECDSA) is the harvest-now-decrypt-later set.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {Object.entries(summary.quantum_classes || {})
                    .filter(([, n]) => n > 0)
                    .map(([k, n]) => (
                      <li key={k} className="flex items-center justify-between">
                        <span className={cn("border px-2 py-0.5 text-xs font-medium", quantumStyle(k))}>
                          {quantumLabel(k)}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">{n}</span>
                      </li>
                    ))}
                </ul>
              </div>
              <div className="panel p-6">
                <h3 className="text-sm font-semibold text-foreground">Asset mix</h3>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(summary.asset_types || {}).map(([k, n]) => (
                    <div key={k} className="flex justify-between gap-2 border border-border px-3 py-2">
                      <dt className="capitalize text-ink-muted">{k}</dt>
                      <dd className="font-medium text-foreground">{n}</dd>
                    </div>
                  ))}
                </dl>
                {summary.suggested_data_lifetime_x != null && (
                  <p className="mt-4 text-sm text-ink-muted">
                    Certificates imply remaining validity of{" "}
                    <span className="font-semibold text-foreground">{summary.suggested_data_lifetime_x}y</span>
                    . Hint for Mosca X — it does not overwrite your data-lifetime slider.
                  </p>
                )}
              </div>
            </div>
          )}
          {scan.status === "completed" && (
            <div className="mt-6 panel p-6">
              <h3 className="text-sm font-semibold text-foreground">Compare to another scan</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Enter a baseline scan ID to see added/removed artefacts and Mosca category change.
              </p>
              <div className="mt-3 border border-[#1B4B8C] bg-surface px-4 py-3 text-xs text-ink-muted">
                <p className="font-medium text-foreground">How to compare scans</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                  <li>Create and wait for the older baseline scan to reach Completed.</li>
                  <li>From the Scans page, copy the older scan&apos;s full ID using Copy ID.</li>
                  <li>Open the newer completed scan and paste that baseline ID here.</li>
                  <li>Select Run diff.</li>
                </ol>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[16rem] flex-1">
                  <Label htmlFor="diff-against">Baseline scan ID</Label>
                  <Input
                    id="diff-against"
                    value={diffAgainstId}
                    onChange={(e) => setDiffAgainstId(e.target.value)}
                    placeholder="UUID of earlier scan"
                    className="mt-1"
                  />
                </div>
                <Button type="button" variant="outline" disabled={diffLoading} onClick={loadScanDiff}>
                  {diffLoading ? "Loading…" : "Run diff"}
                </Button>
              </div>
              {scanDiff?.counts && (
                <dl
                  className={cn(
                    "mt-4 grid gap-3 border border-transparent p-3 text-sm transition-colors duration-500 sm:grid-cols-2 lg:grid-cols-4",
                    diffHighlight && "border-[#1B4B8C] bg-surface"
                  )}
                >
                  <div>
                    <dt className="text-ink-muted">Added</dt>
                    <dd className="font-semibold text-foreground">{scanDiff.counts.added}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Removed</dt>
                    <dd className="font-semibold text-foreground">{scanDiff.counts.removed}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Risk band changed</dt>
                    <dd className="font-semibold text-foreground">{scanDiff.counts.risk_band_changed}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Critical</dt>
                    <dd className="font-semibold text-foreground">
                      {scanDiff.counts.critical_before} → {scanDiff.counts.critical_after}
                    </dd>
                  </div>
                  {scanDiff.counts.score_changed !== undefined && (
                    <div>
                      <dt className="text-ink-muted">Score changes</dt>
                      <dd className="font-semibold text-foreground">{scanDiff.counts.score_changed}</dd>
                    </div>
                  )}
                </dl>
              )}
              {diffError && <p className="mt-3 text-sm text-[#B3261E]">{diffError}</p>}
              {scanDiff?.mosca?.transition?.label && (
                <p className="mt-3 text-sm font-medium text-[#1B4B8C]">
                  Mosca: {scanDiff.mosca.transition.label}
                </p>
              )}
              {scanDiff && (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {[
                    { label: "Added", items: scanDiff.added || [], border: "border-[#1B7A3D]" },
                    { label: "Removed", items: scanDiff.removed || [], border: "border-[#B3261E]" },
                    { label: "Changed", items: diffChangedItems, border: "border-[#B8781F]" },
                  ].map(({ label, items, border }) => (
                    <div key={label} className={cn("border-l-2 pl-3", border)}>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {label} artefacts
                      </h4>
                      {Array.isArray(items) && items.length > 0 ? (
                        <ul className="mt-2 space-y-2 text-sm">
                          {items.slice(0, 10).map((item, index) => (
                            <li key={`${item.bom_ref || item.name || "item"}-${index}`}>
                              <p className="font-medium text-foreground">{item.name || item.bom_ref || "Unnamed artefact"}</p>
                              <p className="font-mono text-xs text-ink-muted">
                                {item.risk_band || "—"}
                                {item.previous_risk_band ? ` ← ${item.previous_risk_band}` : ""}
                                {item.score_delta !== undefined ? ` · Δ ${item.score_delta.toFixed(2)}` : ""}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-ink-muted">None</p>
                      )}
                      {Array.isArray(items) && items.length > 10 && (
                        <p className="mt-2 text-xs text-ink-muted">Showing 10 of {items.length}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory">
          <div className="panel">
            <div className="flex flex-wrap gap-3 border-b border-border p-4">
              <Input
                placeholder="Search artefacts…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="h-10 bg-surface border border-border bg-white px-3 text-sm text-ink-muted"
              >
                <option value="ALL">All risks</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 bg-surface border border-border bg-white px-3 text-sm text-ink-muted"
              >
                {assetTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t === "ALL" ? "All types" : t}
                  </option>
                ))}
              </select>
              <select
                value={quantumFilter}
                onChange={(e) => setQuantumFilter(e.target.value)}
                className="h-10 bg-surface border border-border bg-white px-3 text-sm text-ink-muted"
              >
                <option value="ALL">All quantum classes</option>
                <option value="shor">Shor (public-key)</option>
                <option value="grover">Grover (symmetric)</option>
                <option value="broken_classical">Broken classically</option>
                <option value="inspect">Inspect</option>
                <option value="none">PQC-safe</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            {filteredArtefacts.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-ink-muted">
                {scan.status === "completed"
                  ? "No matching artefacts found."
                  : "Inventory available after scan completes."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-5 py-3 text-xs font-medium text-ink-muted">Name</th>
                      <th className="px-5 py-3 text-xs font-medium text-ink-muted">Type</th>
                      <th className="px-5 py-3 text-xs font-medium text-ink-muted">Quantum</th>
                      <th className="px-5 py-3 text-xs font-medium text-ink-muted">Risk</th>
                      <th className="px-5 py-3 text-xs font-medium text-ink-muted">Location</th>
                      <th className="px-5 py-3 text-xs font-medium text-ink-muted">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArtefacts.map((a) => {
                      const open = expandedId === a.artefact_id;
                      const qb = String(a.risk.quantum_break || a.raw_metadata?.quantum_break || "unknown");
                      return (
                        <Fragment key={a.artefact_id}>
                          <tr
                            className="cursor-pointer border-b border-border transition-colors duration-150 hover:bg-surface"
                            onClick={() => setExpandedId(open ? null : a.artefact_id)}
                          >
                            <td className="px-5 py-3.5 font-medium text-foreground">{a.name}</td>
                            <td className="px-5 py-3.5 capitalize text-ink-muted">{a.asset_type}</td>
                            <td className="px-5 py-3.5">
                              <span className={cn("border px-2 py-0.5 text-[10px] font-medium uppercase", quantumStyle(qb))}>
                                {qb.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <RiskBadge band={a.risk.risk_band} score={a.risk.final_score} />
                            </td>
                            <td className="max-w-xs truncate px-5 py-3.5 text-ink-muted">
                              {a.file_path}
                              {a.line_number ? `:${a.line_number}` : ""}
                            </td>
                            <td className="px-5 py-3.5 text-ink-muted">
                              {a.recommendation?.action ?? "—"}
                            </td>
                          </tr>
                          {open && (
                            <tr className="bg-surface">
                              <td colSpan={6} className="px-5 py-4">
                                <div className="grid gap-4 sm:grid-cols-3 text-sm">
                                  <div>
                                    <p className="text-xs text-ink-muted">HNDL risk</p>
                                    <p className="font-medium text-foreground">{a.risk.hndl_risk ?? 0} / 10</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-ink-muted">Operational risk</p>
                                    <p className="font-medium text-foreground">{a.risk.operational_risk ?? 0} / 10</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-ink-muted">PQC urgency</p>
                                    <p className="font-medium text-foreground">
                                      {a.recommendation?.timeline_urgency ?? "MONITORING"}
                                    </p>
                                  </div>
                                  {a.primitive && (
                                    <div>
                                      <p className="text-xs text-ink-muted">Primitive</p>
                                      <p className="font-medium text-foreground">{a.primitive}</p>
                                    </div>
                                  )}
                                  {a.algorithm && (
                                    <div>
                                      <p className="text-xs text-ink-muted">Algorithm</p>
                                      <p className="font-medium text-foreground">{a.algorithm}</p>
                                    </div>
                                  )}
                                  {(a.library_name || a.raw_metadata?.purl) && (
                                    <div>
                                      <p className="text-xs text-ink-muted">Library / PURL</p>
                                      <p className="font-medium text-foreground">
                                        {a.raw_metadata?.purl ||
                                          `${a.library_name || ""}${a.library_version ? `@${a.library_version}` : ""}`}
                                      </p>
                                    </div>
                                  )}
                                  {a.raw_metadata?.jwt_alg != null && (
                                    <div>
                                      <p className="text-xs text-ink-muted">JWT alg</p>
                                      <p className="font-medium text-foreground">{String(a.raw_metadata.jwt_alg)}</p>
                                    </div>
                                  )}
                                  {a.raw_metadata?.cloud_provider != null && (
                                    <div>
                                      <p className="text-xs text-ink-muted">Cloud / HSM</p>
                                      <p className="font-medium text-foreground">
                                        {String(a.raw_metadata.cloud_provider)}
                                      </p>
                                    </div>
                                  )}
                                  {a.raw_metadata?.unmapped ? (
                                    <div>
                                      <p className="text-xs text-ink-muted">Taxonomy</p>
                                      <p className="font-medium text-foreground">Unmapped — review manually</p>
                                    </div>
                                  ) : null}
                                </div>
                                {a.recommendation?.rationale && (
                                  <p className="mt-3 text-sm text-ink-muted">{a.recommendation.rationale}</p>
                                )}
                                {a.evidence_snippet && (
                                  <pre className="mt-3 overflow-x-auto bg-surface border border-border bg-white p-3 text-xs text-ink-muted">
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
          <div className="panel p-6">
            {!mosca ? (
              <p className="text-sm text-ink-muted">Mosca analysis available after scan completes.</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Mosca theorem</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Adjust X and Y to model data lifetime and migration time against CRQC scenarios.
                  </p>
                  {mosca.formula && (
                    <code className="mt-3 block bg-surface border border-border bg-surface px-3 py-2 text-xs text-ink-muted">
                      {mosca.formula}
                    </code>
                  )}
                  {mosca.data_lifetime_note && (
                    <p className="mt-2 text-sm text-ink-muted">{mosca.data_lifetime_note}</p>
                  )}
                  {(mosca.suggested_data_lifetime_x != null || mosca.cert_count) ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      <span className="text-ink-muted">
                        {mosca.cert_count ?? 0} certificate(s)
                        {mosca.suggested_data_lifetime_x != null
                          ? ` · remaining validity ~${mosca.suggested_data_lifetime_x}y`
                          : ""}
                      </span>
                      {mosca.suggested_data_lifetime_x != null && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setMoscaX(
                              Math.max(1, Math.min(30, Math.round(Number(mosca.suggested_data_lifetime_x))))
                            )
                          }
                        >
                          Use as X
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="panel-muted p-4">
                    <div className="flex items-center justify-between">
                      <Label>Data lifetime (X)</Label>
                      <span className="font-mono border border-border px-2 py-0.5 text-xs text-[#1B4B8C]">
                        {moscaX}y
                      </span>
                    </div>
                    <Slider className="mt-3" min={1} max={30} step={1} value={[moscaX]} onValueChange={(v) => setMoscaX(v[0] ?? 10)} />
                  </div>
                  <div className="panel-muted p-4">
                    <div className="flex items-center justify-between">
                      <Label>Migration time (Y)</Label>
                      <span className="font-mono border border-border px-2 py-0.5 text-xs text-[#1B4B8C]">
                        {moscaY}y
                      </span>
                    </div>
                    <Slider className="mt-3" min={1} max={15} step={1} value={[moscaY]} onValueChange={(v) => setMoscaY(v[0] ?? 4)} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 panel-muted p-4">
                  <div>
                    <p className="text-xs text-ink-muted">X + Y needed</p>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">{moscaX + moscaY} years</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-muted">Baseline verdict</p>
                    <span className={cn("mt-1 inline-flex  border px-2 py-0.5 text-xs font-medium", urgencyStyle(headlineCategory))}>
                      {headlineCategory}
                    </span>
                  </div>
                  <Button variant="outline" onClick={saveMoscaBaseline} disabled={moscaSaving}>
                    {moscaSaving ? "Saving…" : "Save baseline"}
                  </Button>
                </div>

                <div className="overflow-x-auto border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface text-left">
                        <th className="px-4 py-3 text-xs font-medium text-ink-muted">Scenario</th>
                        <th className="px-4 py-3 text-xs font-medium text-ink-muted">Z (years)</th>
                        <th className="px-4 py-3 text-xs font-medium text-ink-muted">Margin</th>
                        <th className="px-4 py-3 text-xs font-medium text-ink-muted">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientScenarios.map((s) => (
                        <tr key={s.name} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                          <td className="px-4 py-3 text-ink-muted">{s.z_value}</td>
                          <td className={cn("px-4 py-3 font-medium", s.margin < 0 ? "text-[#B3261E]" : "text-[#1B7A3D]")}>
                            {s.margin < 0 ? `-${Math.abs(s.margin)}y` : `+${s.margin}y`}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(" border px-2 py-0.5 text-xs font-medium", urgencyStyle(s.category))}>
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
            <div className="panel px-6 py-12 text-left">
              <p className="text-sm text-ink-muted">
                {scan.status === "completed"
                  ? "No migration actions for this scan."
                  : "Recommendations available after scan completes."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="panel p-4 text-sm text-ink-muted">
                ECDAT does not replace AES with ML-KEM. Symmetric crypto stays AES-256-GCM; public-key
                key-exchange uses ML-KEM (FIPS 203); signatures use ML-DSA (FIPS 204). JWT libraries
                are inspected for <code className="font-mono text-xs">alg</code>, not treated as RSA by default.
              </div>
              {recs.map((r) => (
                <div
                  key={r.artefact_id}
                  className="border border-border border-l-4 border-l-[#1B4B8C] bg-background p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{r.name}</h4>
                      <p className="mt-0.5 font-mono text-xs text-ink-muted">{r.artefact_id}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.quantum_break && (
                          <span className={cn("border px-2 py-0.5 text-[10px] font-medium uppercase", quantumStyle(r.quantum_break))}>
                            {r.quantum_break.replace("_", " ")}
                          </span>
                        )}
                        {r.primitive && (
                          <span className="border border-border px-2 py-0.5 text-[10px] uppercase text-ink-muted">
                            {r.primitive}
                          </span>
                        )}
                        {r.algorithm && (
                          <span className="border border-border px-2 py-0.5 font-mono text-[10px] text-ink-muted">
                            {r.algorithm}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={r.effort === "Low" ? "completed" : r.effort === "Medium" ? "running" : "failed"} />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <p className="text-xs text-ink-muted">Action</p>
                      <p className="mt-0.5 font-medium text-foreground">{r.action || "Review"}</p>
                    </div>
                    {r.primary_pqc && (
                      <div>
                        <p className="text-xs text-ink-muted">PQC standard</p>
                        <p className="mt-0.5 font-medium text-foreground">
                          {r.primary_pqc} {r.nist_standard ? `(${r.nist_standard})` : ""}
                        </p>
                      </div>
                    )}
                    {r.hybrid_pair && (
                      <div>
                        <p className="text-xs text-ink-muted">Hybrid</p>
                        <p className="mt-0.5 font-medium text-foreground">{r.hybrid_pair}</p>
                      </div>
                    )}
                    {r.timeline_urgency && (
                      <div>
                        <p className="text-xs text-ink-muted">Urgency</p>
                        <p className="mt-0.5 font-medium text-foreground">{r.timeline_urgency}</p>
                      </div>
                    )}
                  </div>
                  {r.rationale && (
                    <p className="mt-4 border-t border-border pt-4 text-sm text-ink-muted">{r.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assistant">
          <div className="border border-border bg-surface p-4 text-sm text-foreground">
            <p className="font-medium">AI-generated narration (Groq)</p>
            <p className="mt-1 text-ink-muted">
              Summaries and chat use only deterministic scan data. Artefacts, scores, and CBOM export
              remain authoritative. Detection is never performed by the model.
            </p>
          </div>

          {aiStatus && !aiStatus.available && (
            <p className="mt-4 text-sm text-ink-muted">
              Assistant is off. Enable <code className="border border-border bg-surface px-1 font-mono text-xs">AI_NARRATION_ENABLED</code> and
              set <code className="border border-border bg-surface px-1 font-mono text-xs">GROQ_API_KEY</code> on the API server.
            </p>
          )}

          {scan.status !== "completed" && (
            <p className="mt-4 text-sm text-ink-muted">Available after the scan completes.</p>
          )}

          {scan.status === "completed" && aiStatus?.available && (
            <div className="mt-6 space-y-6">
              <div className="panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">Executive summary</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={narrativeLoading}
                    onClick={runExecutiveNarrative}
                  >
                    {narrativeLoading ? "Generating…" : "Generate summary"}
                  </Button>
                </div>
                {narrativeError && (
                  <p className="mt-3 border border-[#B3261E] bg-red-50 px-3 py-2 text-sm text-[#B3261E]">
                    Summary could not be generated: {narrativeError}
                  </p>
                )}
                {narrative && (
                  <>
                    {narrativeMeta?.contextTruncated && (
                      <p className="mt-3 border border-[#B8781F] bg-amber-50 px-3 py-2 text-xs text-[#7A4B00]">
                        This summary used the top {narrativeMeta.artefactsInContext ?? "selected"} highest-risk artefacts
                        out of {narrativeMeta.totalArtefacts ?? scan.total_artefacts}. The deterministic inventory remains authoritative.
                      </p>
                    )}
                    <NarrativeMarkdown content={narrative} />
                    {narrativeMeta?.disclaimer && (
                      <p className="mt-3 text-xs text-ink-muted">{narrativeMeta.disclaimer}</p>
                    )}
                  </>
                )}
              </div>

              <div className="panel p-6">
                <h3 className="text-sm font-semibold text-foreground">Ask about this scan</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  If a baseline scan ID is set on Overview, chat includes the deterministic diff.
                </p>
                <div className="mt-4 max-h-80 space-y-3 overflow-y-auto overflow-x-hidden">
                  {chatMessages.length === 0 && (
                    <p className="text-sm text-ink-muted">e.g. “What are the top quantum risks?”</p>
                  )}
                  {chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "min-w-0 border px-3 py-2 text-sm",
                        m.role === "user" ? "border border-[#1B4B8C] bg-surface text-foreground" : "border border-border bg-surface text-foreground"
                      )}
                    >
                      <span className="text-[10px] font-semibold text-ink-muted">
                        {m.role === "user" ? "You" : "AI (Groq)"}
                      </span>
                      {m.role === "assistant" ? (
                        <NarrativeMarkdown content={m.text} compact className="mt-1" />
                      ) : (
                        <p className="mt-1 whitespace-pre-wrap text-foreground">{m.text}</p>
                      )}
                    </div>
                  ))}
                </div>
                {chatError && (
                  <p className="mt-3 border border-[#B3261E] bg-red-50 px-3 py-2 text-sm text-[#B3261E]">
                    Assistant error: {chatError}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Your question…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendAssistantMessage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    disabled={chatLoading || !chatInput.trim()}
                    onClick={() => void sendAssistantMessage()}
                  >
                    {chatLoading ? "…" : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
