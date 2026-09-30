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
          <h2 className="console-section-title">API connection</h2>
          <p className="console-section-desc">
            Backend URL used for scan and discovery requests.
          </p>
          <p className="mt-3 border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground">
            {API_URL}
          </p>
        </div>

        <div className="panel p-6">
          <h2 className="console-section-title">Session</h2>
          <p className="console-section-desc">
            Sign out of the current operator session on this device.
          </p>
          <Button variant="outline" className="mt-4" onClick={logout}>
            Sign out
          </Button>
        </div>

        <div className="panel p-6">
          <h2 className="console-section-title">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            ECDAT — Enterprise Cryptographic Discovery &amp; Analysis Tool.
            CycloneDX CBOM export, quantum risk scoring, and Mosca timeline analysis.
          </p>
        </div>
      </div>
    </>
  );
}
