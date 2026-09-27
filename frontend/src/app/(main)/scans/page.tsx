"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { apiFetch, copyText, getToken } from "@/lib/api";
import type { Scan } from "@/lib/types";

export default function ScansPage() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyScanId(scanId: string) {
    try {
      await copyText(scanId);
      setCopiedId(scanId);
      window.setTimeout(
        () => setCopiedId((current) => (current === scanId ? null : current)),
        1500
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to copy scan ID.");
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    apiFetch<{ scans?: Scan[] }>("/api/v1/scans")
      .then((data) => setScans(data.scans || []))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <PageHeader
        title="Scans"
        description="All cryptographic discovery scans across your estate."
        breadcrumb={["ECDAT", "Scans"]}
        actions={
          <Button asChild>
            <Link href="/scans/new">New scan</Link>
          </Button>
        }
      />

      <div className="panel">
        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={5} />
          </div>
        ) : scans.length === 0 ? (
          <div className="px-6 py-14 text-left">
            <p className="text-sm font-medium text-foreground">No scans yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Create your first scan to discover cryptographic assets.
            </p>
            <Button asChild className="mt-5">
              <Link href="/scans/new">New scan</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">Name</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">Scan ID</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">Artefacts</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">Critical</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">High</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-muted">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {scans.map((s) => (
                  <tr key={s.scan_id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">{s.name}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs text-ink-muted" title={s.scan_id}>
                          {s.scan_id.slice(0, 8)}…
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyScanId(s.scan_id)}
                          title="Copy full scan ID"
                        >
                          {copiedId === s.scan_id ? "Copied" : "Copy ID"}
                        </Button>
                      </div>
                    </td>
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
                    <td className="px-5 py-3.5 text-ink-muted">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/scans/${s.scan_id}`}
                        className="text-sm font-medium text-[#1B4B8C] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
