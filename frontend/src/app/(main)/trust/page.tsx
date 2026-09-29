"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { apiFetch, getToken } from "@/lib/api";
import { corpusDemoHref } from "@/lib/corpus";

type AccuracyReport = {
  headline?: string;
  recall?: number;
  required_checks?: number;
  required_hits?: number;
  invented_algorithms?: number;
  deterministic?: boolean;
  by_fixture?: {
    fixture: string;
    skipped?: boolean;
    findings?: number;
    required?: number;
    hits?: number;
    recall?: number;
    invented_count?: number;
  }[];
};

type DetectorStatus = {
  semgrep_cli?: boolean;
  layers?: string[];
  cbom_schema?: string;
};

export default function TrustPage() {
  const router = useRouter();
  const [accuracy, setAccuracy] = useState<AccuracyReport | null>(null);
  const [detectors, setDetectors] = useState<DetectorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    Promise.all([
      apiFetch<AccuracyReport>("/api/v1/accuracy"),
      apiFetch<DetectorStatus>("/api/v1/detectors"),
    ])
      .then(([acc, det]) => {
        setAccuracy(acc);
        setDetectors(det);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load trust data"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <PageHeader
        title="Trust & accuracy"
        description="Published, deterministic detector scoreboard — evidence for judges and security reviewers."
        breadcrumb={["ECDAT", "Trust"]}
        actions={
          <Button variant="outline" asChild>
            <Link href={corpusDemoHref("mixed-enterprise.zip")}>Run judge demo scan</Link>
          </Button>
        }
      />

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {error && <p className="text-sm text-[#B3261E]">{error}</p>}

      {!loading && accuracy && (
        <>
          <div className="panel p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Anti-invention guarantee
            </p>
            <p className="mt-2 text-lg font-medium text-foreground">
              {accuracy.headline || "Corpus accuracy report"}
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <dt className="text-ink-muted">Labelled checks</dt>
                <dd className="font-mono font-semibold text-foreground">
                  {accuracy.required_hits ?? "—"}/{accuracy.required_checks ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Recall</dt>
                <dd className="font-mono font-semibold text-foreground">
                  {accuracy.recall != null ? `${(accuracy.recall * 100).toFixed(1)}%` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Invented algorithms</dt>
                <dd className="font-mono font-semibold text-foreground">
                  {accuracy.invented_algorithms ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Deterministic</dt>
                <dd className="font-semibold text-foreground">
                  {accuracy.deterministic ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          </div>

          {detectors && (
            <div className="mt-6 panel p-6">
              <h2 className="text-sm font-semibold text-foreground">Detector stack</h2>
              <p className="mt-1 text-sm text-ink-muted">{detectors.cbom_schema}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {(detectors.layers || []).map((layer) => (
                  <li
                    key={layer}
                    className="border border-border bg-surface px-2 py-1 font-mono text-xs text-foreground"
                  >
                    {layer}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {accuracy.by_fixture && accuracy.by_fixture.length > 0 && (
            <div className="mt-6 panel overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium text-ink-muted">Fixture</th>
                    <th className="px-5 py-3 text-xs font-medium text-ink-muted">Findings</th>
                    <th className="px-5 py-3 text-xs font-medium text-ink-muted">Required hits</th>
                    <th className="px-5 py-3 text-xs font-medium text-ink-muted">Recall</th>
                    <th className="px-5 py-3 text-xs font-medium text-ink-muted">Invented</th>
                  </tr>
                </thead>
                <tbody>
                  {accuracy.by_fixture
                    .filter((row) => !row.skipped)
                    .map((row) => (
                      <tr key={row.fixture} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 font-mono text-foreground">{row.fixture}</td>
                        <td className="px-5 py-3 tabular-nums text-ink-muted">{row.findings ?? "—"}</td>
                        <td className="px-5 py-3 tabular-nums text-foreground">
                          {row.hits ?? "—"}/{row.required ?? "—"}
                        </td>
                        <td className="px-5 py-3 tabular-nums text-foreground">
                          {row.recall != null ? `${(row.recall * 100).toFixed(0)}%` : "—"}
                        </td>
                        <td className="px-5 py-3 tabular-nums text-foreground">
                          {row.invented_count ?? 0}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
