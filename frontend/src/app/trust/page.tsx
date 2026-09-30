"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { MarketingLayout } from "@/components/marketing/SiteChrome";
import {
  TrustPageContent,
  type AccuracyReport,
  type DetectorStatus,
} from "@/components/trust/TrustPageContent";
import { apiFetch, getToken } from "@/lib/api";

export default function TrustPage() {
  const [accuracy, setAccuracy] = useState<AccuracyReport | null>(null);
  const [detectors, setDetectors] = useState<DetectorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getToken()));
    setAuthReady(true);
  }, []);

  useEffect(() => {
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
  }, []);

  const content = (
    <TrustPageContent
      accuracy={accuracy}
      detectors={detectors}
      loading={loading}
      error={error}
      signedIn={signedIn}
    />
  );

  if (!authReady) {
    return <div className="theme-console min-h-screen bg-background text-foreground" />;
  }

  if (signedIn) {
    return (
      <div className="theme-console min-h-screen bg-background text-foreground">
        <AppShell>{content}</AppShell>
      </div>
    );
  }

  return (
    <MarketingLayout>
      <div className="theme-console mx-auto w-full max-w-[1120px] px-4 py-8 md:px-8 md:py-10">
        {content}
      </div>
    </MarketingLayout>
  );
}
