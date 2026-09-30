"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import RiskBadge from "@/components/RiskBadge";
import { TableSkeleton } from "@/components/Skeleton";
import { Input } from "@/components/ui/input";
import { mapPool } from "@/lib/asyncPool";
import { apiFetch } from "@/lib/api";
import { redirectToLoginOnUnauthorized, requireSessionToken } from "@/lib/auth";
import type { Artefact, Scan } from "@/lib/types";

type ArtefactRow = Artefact & { scan_id: string; scan_name: string };

const MAX_SCANS = 20;
const FETCH_CONCURRENCY = 4;

export default function ArtefactsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ArtefactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!requireSessionToken(router)) return;

    async function load() {
      setLoadError(null);
      try {
        const { scans = [] } = await apiFetch<{ scans?: Scan[] }>("/api/v1/scans");
        const completed = scans.filter((s) => s.status === "completed").slice(0, MAX_SCANS);
        const batches = await mapPool(completed, FETCH_CONCURRENCY, async (scan) => {
          try {
            const data = await apiFetch<{ artefacts?: Artefact[] }>(
              `/api/v1/scans/${scan.scan_id}/artefacts?limit=500`
            );
            return (data.artefacts || []).map((a) => ({
              ...a,
              scan_id: scan.scan_id,
              scan_name: scan.name,
            }));
          } catch {
            return [] as ArtefactRow[];
          }
        });
        setRows(batches.flat());
      } catch (err) {
        if (redirectToLoginOnUnauthorized(err, router)) return;
        setLoadError(err instanceof Error ? err.message : "Could not load artefacts.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.file_path?.toLowerCase().includes(q) ||
        a.scan_name.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <>
      <PageHeader
        title="Artefacts"
        description="Cryptographic assets discovered across completed scans."
        breadcrumb={["ECDAT", "Artefacts"]}
      />

      <div className="mb-4">
        <Input
          placeholder="Search by name, path, or scan…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loadError && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {loadError}
        </p>
      )}

      <div className="panel">
        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-left">
            <p className="text-sm font-medium text-foreground">No artefacts yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Complete a scan to populate the global inventory. Filter by quantum class on a scan
              detail page (Shor vs Grover vs inspect).
            </p>
            <Link
              href="/scans/new"
              className="mt-4 inline-block text-sm font-medium text-[#1B4B8C] hover:underline"
            >
              Start a scan
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="console-data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Scan</th>
                  <th>Risk</th>
                  <th>Location</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={`${a.scan_id}-${a.artefact_id}`}>
                    <td className="font-medium text-foreground">{a.name}</td>
                    <td className="capitalize text-ink-muted">{a.asset_type}</td>
                    <td className="text-ink-muted">{a.scan_name}</td>
                    <td>
                      <RiskBadge band={a.risk.risk_band} score={a.risk.final_score} />
                    </td>
                    <td className="max-w-xs truncate font-mono text-xs text-ink-muted">
                      {a.file_path}
                      {a.line_number ? `:${a.line_number}` : ""}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/scans/${a.scan_id}?tab=inventory`}
                        prefetch
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Open scan
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
