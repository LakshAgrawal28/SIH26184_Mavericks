"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ExecutiveSummaryStrip from "@/components/scan/ExecutiveSummaryStrip";
import ScanExportCenter from "@/components/scan/ScanExportCenter";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { apiFetch, getToken } from "@/lib/api";
import { computeAgilityMetrics, migrationWaveOne } from "@/lib/scanInsights";
import type { MoscaResult, Recommendation, Scan, ScanSummary } from "@/lib/types";

export default function ExecutivePage() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [mosca, setMosca] = useState<MoscaResult | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [scanMeta, setScanMeta] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);

  const completed = useMemo(
    () => scans.filter((s) => s.status === "completed"),
    [scans]
  );

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    apiFetch<{ scans?: Scan[] }>("/api/v1/scans")
      .then((data) => {
        const list = data.scans || [];
        setScans(list);
        const first = list.find((s) => s.status === "completed");
        if (first) setSelectedId(first.scan_id);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!selectedId) return;
    Promise.all([
      apiFetch<ScanSummary>(`/api/v1/scans/${selectedId}/summary`),
      apiFetch<MoscaResult>(`/api/v1/scans/${selectedId}/mosca`),
      apiFetch<{ recommendations?: Recommendation[] }>(
        `/api/v1/scans/${selectedId}/recommendations`
      ),
      apiFetch<Scan>(`/api/v1/scans/${selectedId}`),
    ])
      .then(([sum, mos, rec, meta]) => {
        setSummary(sum);
        setMosca(mos);
        setRecs(rec.recommendations || []);
        setScanMeta(meta);
      })
      .catch(() => {
        setSummary(null);
        setMosca(null);
        setRecs([]);
      });
  }, [selectedId]);

  const agility = computeAgilityMetrics(summary);
  const waveOne = migrationWaveOne(recs);
  const moscaCategory = mosca?.baseline_category || mosca?.overall_category || "MONITOR";

  const orgTotals = useMemo(() => {
    return completed.reduce(
      (acc, s) => {
        acc.artefacts += s.total_artefacts ?? 0;
        acc.critical += s.critical_risk_count ?? 0;
        acc.high += s.high_risk_count ?? 0;
        return acc;
      },
      { artefacts: 0, critical: 0, high: 0 }
    );
  }, [completed]);

  return (
    <>
      <PageHeader
        title="Executive view"
        description="CISO-oriented posture — Mosca urgency, agility index, and wave-1 migration targets."
        breadcrumb={["ECDAT", "Executive"]}
        actions={
          selectedId ? (
            <Button asChild>
              <Link href={`/scans/${selectedId}?tab=exports`}>Open exports</Link>
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : completed.length === 0 ? (
        <div className="panel px-6 py-12 text-sm text-ink-muted">
          <p>No completed scans yet. Run the mixed-enterprise demo to populate this view.</p>
          <Button asChild className="mt-4">
            <Link href="/scans/new?demo=mixed-enterprise.zip">Start demo scan</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="panel px-4 py-3">
              <p className="text-xs text-ink-muted">Completed scans</p>
              <p className="text-2xl font-semibold tabular-nums">{completed.length}</p>
            </div>
            <div className="panel px-4 py-3">
              <p className="text-xs text-ink-muted">Inventory across scans</p>
              <p className="text-2xl font-semibold tabular-nums">{orgTotals.artefacts}</p>
            </div>
            <div className="panel px-4 py-3">
              <p className="text-xs text-ink-muted">Open critical + high</p>
              <p className="text-2xl font-semibold tabular-nums">
                {orgTotals.critical} + {orgTotals.high}
              </p>
            </div>
          </div>

          <div className="mb-6 panel p-4">
            <label className="text-xs font-medium text-ink-muted" htmlFor="exec-scan">
              Focus scan
            </label>
            <select
              id="exec-scan"
              className="mt-1 h-10 w-full max-w-md border border-border bg-surface px-3 text-sm"
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {completed.map((s) => (
                <option key={s.scan_id} value={s.scan_id}>
                  {s.name} · {s.total_artefacts} artefacts
                </option>
              ))}
            </select>
          </div>

          {summary && (
            <ExecutiveSummaryStrip
              moscaCategory={moscaCategory}
              agility={agility}
              shorCount={summary.shor_vulnerable_count ?? 0}
              criticalCount={summary.critical_risk_count}
              highCount={summary.high_risk_count}
              waveOne={waveOne}
              dataLifetimeX={scanMeta?.data_lifetime_x}
              migrationTimeY={scanMeta?.migration_time_y}
            />
          )}

          {selectedId && <ScanExportCenter className="mt-6" scanId={selectedId} />}
        </>
      )}
    </>
  );
}
