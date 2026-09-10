"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("ecdat_token");
    router.replace("/login");
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Application configuration and session management."
        breadcrumb={["ECDAT", "Settings"]}
      />

      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">API connection</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Backend URL used for scan and discovery requests.
          </p>
          <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-700">
            {API_URL}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Session</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Sign out of the current operator session on this device.
          </p>
          <Button variant="outline" className="mt-4" onClick={logout}>
            Sign out
          </Button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">About</h2>
          <p className="mt-2 text-sm text-zinc-500">
            ECDAT — Enterprise Cryptographic Discovery &amp; Analysis Tool.
            CycloneDX CBOM export, quantum risk scoring, and Mosca timeline analysis.
          </p>
        </div>
      </div>
    </>
  );
}
