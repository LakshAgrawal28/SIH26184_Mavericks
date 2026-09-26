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
        <div className="panel p-6">
          <h2 className="text-sm font-semibold text-foreground">API connection</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Backend URL used for scan and discovery requests.
          </p>
          <p className="mt-3 border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground">
            {API_URL}
          </p>
        </div>

        <div className="panel p-6">
          <h2 className="text-sm font-semibold text-foreground">Session</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Sign out of the current operator session on this device.
          </p>
          <Button variant="outline" className="mt-4" onClick={logout}>
            Sign out
          </Button>
        </div>

        <div className="panel p-6">
          <h2 className="text-sm font-semibold text-foreground">About</h2>
          <p className="mt-2 text-sm text-ink-muted">
            ECDAT — Enterprise Cryptographic Discovery &amp; Analysis Tool.
            CycloneDX CBOM export, quantum risk scoring, and Mosca timeline analysis.
          </p>
        </div>
      </div>
    </>
  );
}
