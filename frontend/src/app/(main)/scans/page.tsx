"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { apiFetch, getToken } from "@/lib/api";
import type { Scan } from "@/lib/types";

export default function ScansPage() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

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
            <Link href="/scans/new">
              <Plus className="h-4 w-4" />
              New scan
            </Link>
          </Button>
        }
      />

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={5} />
          </div>
        ) : scans.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-zinc-900">No scans yet</p>
            <p className="mt-1 text-sm text-zinc-500">
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
                <tr className="border-b border-zinc-200 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Name</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Artefacts</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Critical</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">High</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {scans.map((s) => (
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
                    <td className="px-5 py-3.5 text-zinc-500">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/scans/${s.scan_id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
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
