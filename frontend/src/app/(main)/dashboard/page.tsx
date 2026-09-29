"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CipherScramble from "@/components/CipherScramble";
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
    <>
      <section className="mb-10">
        <p className="text-xs font-semibold tracking-[0.1em] text-primary uppercase">Console</p>
        <CipherScramble className="mt-3 font-mono text-sm text-foreground md:text-base" />
        <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-ink-muted">
          Live posture from completed discovery scans — Shor vs Grover vs hygiene, HSM/cloud, and quantum risk bands.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total scans" value={totalScans} />
        <StatCard label="Total artefacts" value={totalArtefacts} />
        <StatCard label="Critical risk" value={totalCritical} dot="critical" />
        <StatCard label="High risk" value={totalHigh} dot="high" />
      </div>

      <PageHeader
        className="mt-8"
        title="Recent scans"
        actions={
          <Button asChild>
            <Link href="/scans/new">New scan</Link>
          </Button>
        }
      />

      <div className="panel">
        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={3} />
          </div>
        ) : recent.length === 0 ? (
          <div className="px-6 py-12 text-left">
            <IconEmptyScans className="text-ink-muted" />
            <p className="mt-4 text-sm font-medium text-foreground">No scans yet</p>
            <p className="mt-1 max-w-md text-sm text-ink-muted">
              Upload an archive to discover cryptographic assets and export a CBOM.
            </p>
            <Button asChild className="mt-5">
              <Link href="/scans/new">Upload archive</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">Name</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">Artefacts</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">Critical</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">High</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.scan_id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">{s.name}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-3.5 font-mono tabular-nums text-ink-muted">
                      {s.total_artefacts}
                    </td>
                    <td className="px-5 py-3.5 font-mono tabular-nums text-[#B3261E]">
                      {s.critical_risk_count}
                    </td>
                    <td className="px-5 py-3.5 font-mono tabular-nums text-[#B8781F]">
                      {s.high_risk_count}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/scans/${s.scan_id}`}
                        className="text-sm font-medium text-[#1B4B8C] hover:underline"
                      >
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
        <div className="mt-8 panel px-5 py-4">
          <p className="text-xs font-medium text-ink-muted">Corpus accuracy</p>
          <p className="mt-1 text-sm text-foreground">
            {accuracy.headline ||
              "Deterministic detector scoreboard against labelled fixtures."}
          </p>
          <p className="mt-2 font-mono text-sm text-ink-muted">
            Recall {accuracy.recall ?? "—"}
            {" · "}
            Invented algorithms {accuracy.invented_algorithms ?? "—"}
            {" · "}
            {accuracy.deterministic ? "Deterministic" : "Non-deterministic"}
          </p>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Quick start</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Bundled demo archives from{" "}
          <code className="border border-border bg-surface px-1.5 py-0.5 font-mono text-xs">
            scanner/corpus/archives/
          </code>
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {QUICK_START_CORPUS.map((item) => (
            <div
              key={item.file}
              className="panel flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-mono text-sm text-foreground">{item.file}</p>
                  <span className="shrink-0 border border-border px-2 py-0.5 font-mono text-[10px] text-ink-muted">
                    {item.tag}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">{item.description}</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={corpusDemoHref(item.file)}>Try demo</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
