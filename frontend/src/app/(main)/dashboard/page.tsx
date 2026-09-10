"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ScanSearch } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { apiFetch, getToken } from "@/lib/api";
import type { Scan } from "@/lib/types";

const QUICK_START = [
  {
    name: "mixed-enterprise.zip",
    description: "Java RSA, nginx TLS 1.0, expiring cert, native library",
  },
  {
    name: "java-rsa-aes.zip",
    description: "Classic JCA RSA/ECB patterns in Java source",
  },
  {
    name: "python-crypto.zip",
    description: "hashlib and legacy Python crypto usage",
  },
  {
    name: "weak-configs.zip",
    description: "TLS and nginx configuration weaknesses",
  },
];

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
      <PageHeader
        title="Dashboard"
        description="Overview of cryptographic discovery scans and risk posture."
        actions={
          <Button asChild>
            <Link href="/scans/new">
              <Plus className="h-4 w-4" />
              New scan
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total scans" value={totalScans} />
        <StatCard label="Total artefacts" value={totalArtefacts} />
        <StatCard label="Critical risk" value={totalCritical} dot="critical" />
        <StatCard label="High risk" value={totalHigh} dot="high" />
      </div>

      {accuracy && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Corpus accuracy
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            {accuracy.headline ||
              "Deterministic detector scoreboard against labelled fixtures."}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Recall <span className="font-medium text-zinc-900">{accuracy.recall ?? "—"}</span>
            {" · "}
            Invented algorithms{" "}
            <span className="font-medium text-zinc-900">
              {accuracy.invented_algorithms ?? "—"}
            </span>
            {" · "}
            {accuracy.deterministic ? "Deterministic" : "Non-deterministic"}
          </p>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-900">Recent scans</h2>
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={3} />
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ScanSearch className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-medium text-zinc-900">No scans yet</p>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Upload an archive to get started with cryptographic discovery.
              </p>
              <Button asChild className="mt-5">
                <Link href="/scans/new">Upload archive</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-zinc-500">Name</th>
                    <th className="px-5 py-3 text-xs font-medium text-zinc-500">Status</th>
                    <th className="px-5 py-3 text-xs font-medium text-zinc-500">Artefacts</th>
                    <th className="px-5 py-3 text-xs font-medium text-zinc-500">Critical</th>
                    <th className="px-5 py-3 text-xs font-medium text-zinc-500">High</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr
                      key={s.scan_id}
                      className="border-b border-zinc-100 last:border-0 transition-colors duration-150 hover:bg-zinc-50"
                    >
                      <td className="px-5 py-3.5 font-medium text-zinc-900">{s.name}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-zinc-700">
                        {s.total_artefacts}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-red-600">
                        {s.critical_risk_count}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-orange-600">
                        {s.high_risk_count}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/scans/${s.scan_id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
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
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-900">Quick start</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Bundled demo archives from <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">scanner/corpus/archives/</code>
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {QUICK_START.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/scans/new">Upload</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
