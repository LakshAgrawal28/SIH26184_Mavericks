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

  return (
    <div className="space-y-6">
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

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total scans" value={totalScans} />
        <StatCard label="Total artefacts" value={totalArtefacts} />
        <StatCard label="Critical risk" value={totalCritical} dot="critical" />
        <StatCard label="High risk" value={totalHigh} dot="high" />
      </div>

      <PageHeader
        className="!mb-3 !mt-2"
        title="Recent scans"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/scans">View all</Link>
          </Button>
        }
      />

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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2.5 text-[11px] font-medium text-ink-muted">Name</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-ink-muted">Status</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-ink-muted">Artefacts</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-ink-muted">Critical</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-ink-muted">High</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.scan_id} className="border-b border-border/80 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-ink-muted">
                      {s.total_artefacts}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-[#fca5a5]">
                      {s.critical_risk_count}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-[#fcd34d]">
                      {s.high_risk_count}
                    </td>
                    <td className="px-4 py-2.5 text-right">
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

      {accuracy && (
        <div className="panel flex flex-wrap items-start justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">Corpus accuracy</p>
            <p className="mt-1 text-sm text-foreground">
              {accuracy.headline || "Deterministic detector scoreboard against labelled fixtures."}
            </p>
            <p className="mt-1.5 font-mono text-xs text-ink-muted">
              Recall {accuracy.recall ?? "—"}
              {" · "}
              Invented algorithms {accuracy.invented_algorithms ?? "—"}
              {" · "}
              {accuracy.deterministic ? "Deterministic" : "Non-deterministic"}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/trust">Full trust report</Link>
          </Button>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-foreground">Quick start</h2>
        <p className="mt-0.5 text-xs text-ink-muted">Bundled demo archives from scanner/corpus/</p>
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
