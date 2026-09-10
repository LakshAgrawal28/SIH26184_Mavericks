"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import RiskBadge from "@/components/RiskBadge";
import { TableSkeleton } from "@/components/Skeleton";
import { Input } from "@/components/ui/input";
import { apiFetch, getToken } from "@/lib/api";
import type { Artefact, Scan } from "@/lib/types";

type ArtefactRow = Artefact & { scan_id: string; scan_name: string };

export default function ArtefactsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ArtefactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    async function load() {
      try {
        const { scans = [] } = await apiFetch<{ scans?: Scan[] }>("/api/v1/scans");
        const completed = scans.filter((s) => s.status === "completed");
        const all: ArtefactRow[] = [];
        for (const scan of completed.slice(0, 20)) {
          const data = await apiFetch<{ artefacts?: Artefact[] }>(
            `/api/v1/scans/${scan.scan_id}/artefacts`
          );
          for (const a of data.artefacts || []) {
            all.push({ ...a, scan_id: scan.scan_id, scan_name: scan.name });
          }
        }
        setRows(all);
      } catch {
        router.replace("/login");
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

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-zinc-900">No artefacts yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Complete a scan to populate the global inventory.
            </p>
            <Link
              href="/scans/new"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Start a scan
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Name</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Scan</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Risk</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Location</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={`${a.scan_id}-${a.artefact_id}`}
                    className="border-b border-zinc-100 last:border-0 transition-colors duration-150 hover:bg-zinc-50"
                  >
                    <td className="px-5 py-3.5 font-medium text-zinc-900">{a.name}</td>
                    <td className="px-5 py-3.5 text-zinc-600">{a.scan_name}</td>
                    <td className="px-5 py-3.5">
                      <RiskBadge band={a.risk.risk_band} score={a.risk.final_score} />
                    </td>
                    <td className="max-w-xs truncate px-5 py-3.5 text-zinc-500">
                      {a.file_path}
                      {a.line_number ? `:${a.line_number}` : ""}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/scans/${a.scan_id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
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
