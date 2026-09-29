"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlindSpotSection } from "@/components/landing/BlindSpotSection";
import { CbomSection } from "@/components/landing/CbomSection";
import { CommandCtaSection } from "@/components/landing/CommandCtaSection";
import { DiscoverSection } from "@/components/landing/DiscoverSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { IntelligenceGraphSection } from "@/components/landing/IntelligenceGraphSection";
import { MoscaSection } from "@/components/landing/MoscaSection";
import { PqcSection } from "@/components/landing/PqcSection";
import { MarketingLayout } from "@/components/marketing/SiteChrome";
import { getToken } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const goDashboard = params.get("go") === "dashboard" || params.get("console") === "1";
    if (goDashboard && getToken()) router.replace("/dashboard");
  }, [router]);

  return (
    <MarketingLayout>
      <HeroSection />
      <BlindSpotSection />
      <DiscoverSection />
      <CbomSection />
      <MoscaSection />
      <IntelligenceGraphSection />
      <PqcSection />
      <CommandCtaSection />
    </MarketingLayout>
  );
}
