"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { IconEmptyScans } from "@/components/icons/NavIcons";
import { apiFetch, getToken } from "@/lib/api";
import { corpusDemoHref, QUICK_START_CORPUS } from "@/lib/corpus";
import type { Scan } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [accuracy, setAccuracy] = useState<{
    headline?: string;
    recall?: number;
    invented_algorithms?: number;
    deterministic?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    Promise.all([
      apiFetch<{ scans?: Scan[] }>("/api/v1/scans"),
      apiFetch<{
        headline?: string;
        recall?: number;
        invented_algorithms?: number;
        deterministic?: boolean;
      }>("/api/v1/accuracy").catch(() => null),
    ])
      .then(([data, acc]) => {
        setScans(data.scans || []);
        if (acc) setAccuracy(acc);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const totalScans = scans.length;
  const totalCritical = scans.reduce((acc, s) => acc + (s.critical_risk_count ?? 0), 0);
  const totalHigh = scans.reduce((acc, s) => acc + (s.high_risk_count ?? 0), 0);
  const totalArtefacts = scans.reduce((acc, s) => acc + (s.total_artefacts ?? 0), 0);
  const recent = scans.slice(0, 8);

  const openRisk = totalCritical + totalHigh;

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={["NTRO / ECDAT", "Console"]}
        title="Discovery console"
        description="Live posture from completed scans — quantum risk bands, artefact inventory, and CBOM export."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/scans/new?demo=mixed-enterprise.zip">Judge demo</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/scans/new">New scan</Link>
            </Button>
          </div>
        }
        className="!mb-0"
      />

      <section>
        <p className="console-section-label mb-3">Portfolio snapshot</p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total scans" value={totalScans} hint="Completed and in-flight discovery runs" />
          <StatCard label="Total artefacts" value={totalArtefacts} hint="Crypto assets across all scans" />
          <StatCard
            label="Critical risk"
            value={totalCritical}
            dot="critical"
            hint="Aggregated critical band counts"
          />
          <StatCard label="High risk" value={totalHigh} dot="high" hint="Aggregated high band counts" />
        </div>
        {!loading && totalScans > 0 && (
          <p className="mt-3 text-sm text-ink-muted">
            <span className="font-medium text-foreground">{openRisk}</span> artefacts in critical or high bands
            across your scan history.
          </p>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="console-section-label">Activity</p>
            <h2 className="console-section-title text-base">Recent scans</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/scans">View all</Link>
          </Button>
        </div>

      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={3} />
          </div>
        ) : recent.length === 0 ? (
          <div className="px-5 py-10 text-left">
            <IconEmptyScans className="text-ink-muted" />
            <p className="mt-3 text-sm font-medium text-foreground">No scans yet</p>
            <p className="mt-1 max-w-md text-sm text-ink-muted">
              Upload an archive to discover cryptographic assets and export a CBOM.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/scans/new">Upload archive</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="console-data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Artefacts</th>
                  <th>Critical</th>
                  <th>High</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.scan_id}>
                    <td className="font-medium text-foreground">{s.name}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="font-mono text-xs tabular-nums text-ink-muted">
                      {s.total_artefacts}
                    </td>
                    <td className="font-mono text-xs tabular-nums text-destructive">
                      {s.critical_risk_count}
                    </td>
                    <td className="font-mono text-xs tabular-nums text-[#a66b12]">
                      {s.high_risk_count}
                    </td>
                    <td className="text-right">
                      <Link href={`/scans/${s.scan_id}`} className="text-sm font-medium text-primary hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </section>

      {accuracy && (
        <div className="panel flex flex-wrap items-start justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">Corpus accuracy</p>
            <p className="mt-1 text-sm text-foreground">
              {accuracy.headline || "Deterministic detector scoreboard against labelled fixtures."}
            </p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border border-border bg-surface/80 px-3 py-2">
                <dt className="text-[11px] text-ink-muted">Recall</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                  {accuracy.recall != null
                    ? `${Math.round((accuracy.recall <= 1 ? accuracy.recall * 100 : accuracy.recall) * 10) / 10}%`
                    : "—"}
                </dd>
              </div>
              <div className="rounded-md border border-border bg-surface/80 px-3 py-2">
                <dt className="text-[11px] text-ink-muted">Invented algorithms</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                  {accuracy.invented_algorithms ?? "—"}
                </dd>
              </div>
              <div className="rounded-md border border-border bg-surface/80 px-3 py-2">
                <dt className="text-[11px] text-ink-muted">Engine</dt>
                <dd className="mt-0.5 text-sm font-semibold text-foreground">
                  {accuracy.deterministic ? "Deterministic" : "Non-deterministic"}
                </dd>
              </div>
            </dl>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/trust">Full trust report</Link>
          </Button>
        </div>
      )}

      <section>
        <p className="console-section-label">Onboarding</p>
        <h2 className="console-section-title">Quick start</h2>
        <p className="console-section-desc">Bundled demo archives from scanner/corpus/</p>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {QUICK_START_CORPUS.map((item) => (
            <div key={item.file} className="panel flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-mono text-xs text-foreground">{item.file}</p>
                  <span className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[9px] text-ink-muted">
                    {item.tag}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{item.description}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 shrink-0 text-xs" asChild>
                <Link href={corpusDemoHref(item.file)}>Try demo</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
