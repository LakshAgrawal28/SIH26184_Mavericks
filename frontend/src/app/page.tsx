"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CipherScramble from "@/components/CipherScramble";
import { GlassPanel } from "@/components/marketing/GlassPanel";
import HeroRadialGlow from "@/components/marketing/HeroRadialGlow";
import { MagneticButton } from "@/components/marketing/MagneticButton";
import { MarketingHeroSpotlight } from "@/components/marketing/MarketingHeroSpotlight";
import { ShimmerCta } from "@/components/marketing/ShimmerCta";
import { StaggeredTextReveal } from "@/components/marketing/StaggeredTextReveal";
import LandingAnimatedProof from "@/components/marketing/LandingAnimatedProof";
import LandingHeroConsole from "@/components/marketing/LandingHeroConsole";
import LandingSecurityControls from "@/components/marketing/LandingSecurityControls";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { MarketingLayout } from "@/components/marketing/SiteChrome";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/api";

const TRUST = [
  "Smart India Hackathon 2026",
  "PS 26164 · NTRO",
  "CycloneDX CBOM 1.6",
  "NIST PQC FIPS 203/204",
  "On-prem & air-gap",
];

const PILLARS = [
  {
    title: "Harvest now, decrypt later",
    body: "Long-lived RSA, ECDSA, and TLS keys in your zip today are tomorrow's plaintext. ECDAT surfaces what adversaries are already archiving.",
  },
  {
    title: "Evidence, not guesses",
    body: "Every finding ships with path, line, and snippet — the same artefact table judges can click through in the live demo.",
  },
  {
    title: "Mosca you can defend",
    body: "Interactive X + Y vs Z timelines tie quantum risk to migration urgency, aligned with NTRO's post-quantum readiness mandate.",
  },
];

const HERO_STATS = [
  { value: "613", label: "Artefacts per demo scan" },
  { value: "100%", label: "Corpus recall target" },
  { value: "5", label: "Steps · upload to CBOM" },
];

const PIPELINE = [
  { n: "01", title: "Discover", detail: "Zip upload · multi-language corpus · certs & TLS configs" },
  { n: "02", title: "Score", detail: "Shor vs Grover vs classical hygiene · HNDL-weighted bands" },
  { n: "03", title: "Timeline", detail: "Mosca engine · scenario sliders · expiry-aware urgency" },
  { n: "04", title: "Recommend", detail: "ML-KEM / ML-DSA / AES-256-GCM — use-case aware, not generic" },
  { n: "05", title: "Export", detail: "CycloneDX 1.6 cryptographic-asset CBOM · schema validated" },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const goDashboard = params.get("go") === "dashboard" || params.get("console") === "1";
    if (goDashboard && getToken()) router.replace("/dashboard");
  }, [router]);

  return (
    <MarketingLayout>
      {/* Hero */}
      <MarketingHeroSpotlight className="relative overflow-hidden border-b border-border/70">
        <HeroRadialGlow />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(13,59,102,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(13,59,102,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_80%_70%_at_50%_-20%,rgba(13,59,102,0.12),transparent)]" />
        <div className="ecdat-hero-grain" aria-hidden />

        <div className="relative mx-auto max-w-[1180px] px-6 pb-16 pt-10 lg:pb-24 lg:pt-14">
          <div className="flex flex-wrap items-center gap-2">
            {TRUST.map((item, i) => (
              <span
                key={item}
                className="ecdat-trust-pill rounded-full border border-border/80 bg-card/90 px-3 py-1 text-[11px] font-medium text-ink-muted shadow-sm"
                style={{ animationDelay: `${40 + i * 55}ms` }}
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-12 grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10">
            <div className="motion-enter motion-enter-delay-1 max-w-[40rem]">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                Team Mavericks · Blockchain &amp; Cybersecurity
              </p>
              <StaggeredTextReveal
                className="mt-4 text-[2.35rem] leading-[1.06] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.35rem]"
                lines={["The security X-ray", "for enterprise cryptography"]}
              />
              <CipherScramble className="mt-6 font-mono text-sm text-foreground/85 sm:text-base" />
              <p className="mt-5 text-base leading-relaxed text-ink-muted sm:text-[17px]">
                <strong className="font-semibold text-foreground">ECDAT</strong> closes the loop NTRO asked for:
                discover with proof, score quantum exposure, model Mosca timelines, recommend NIST PQC paths, and
                export a validated CBOM — from a single archive upload.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <MagneticButton>
                  <ShimmerCta>
                    <Button asChild size="lg" className="h-11 px-6 shadow-md">
                      <Link href="/login">Launch live demo</Link>
                    </Button>
                  </ShimmerCta>
                </MagneticButton>
                <Button variant="outline" asChild size="lg" className="h-11 px-6">
                  <a href="https://ecdat-api-iqgx.onrender.com/docs" target="_blank" rel="noreferrer">
                    API documentation
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-ink-muted">
                Demo login: <span className="font-mono text-foreground">admin@example.com</span> /{" "}
                <span className="font-mono text-foreground">admin123</span>
              </p>
              <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border/70 pt-8">
                {HERO_STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">{s.label}</dt>
                    <dd className="text-display mt-1 text-2xl text-primary sm:text-[1.65rem]">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="motion-enter motion-enter-delay-2 lg:translate-y-2">
              <LandingHeroConsole />
            </div>
          </div>
        </div>
      </MarketingHeroSpotlight>

      {/* Impact */}
      <section id="impact" className="border-b border-border/70 bg-surface/50">
        <div className="mx-auto max-w-[1180px] px-6 py-20">
          <ScrollReveal className="max-w-2xl">
            <h2 className="text-display text-3xl text-foreground">Built for Problem Statement 26164</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
              Judges should see a product, not a slide deck. ECDAT is a full-stack platform you can run on-prem
              where classified workloads live — with the same UI we ship on Vercel and Render.
            </p>
          </ScrollReveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PILLARS.map((p, i) => (
              <ScrollReveal key={p.title} delayMs={i * 70}>
                <GlassPanel as="article" spotlight className="panel-interactive h-full p-7">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">{p.body}</p>
                </GlassPanel>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="workflow" className="border-b border-border/70">
        <div className="mx-auto max-w-[1180px] px-6 py-20">
          <ScrollReveal>
            <h2 className="text-display text-3xl text-foreground">Five-step closed loop</h2>
            <p className="mt-3 max-w-xl text-[17px] text-ink-muted">
              Every step in the marketing story is the same path in the console — upload through export.
            </p>
          </ScrollReveal>
          <ol className="mt-14 grid gap-4 lg:grid-cols-5">
            {PIPELINE.map((step, i) => (
              <ScrollReveal key={step.n} delayMs={i * 55} className="h-full">
                <li className="relative panel h-full p-5">
                  <p className="font-mono text-xs font-semibold text-primary">{step.n}</p>
                  <h3 className="mt-2 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">{step.detail}</p>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      <LandingSecurityControls />

      {/* Proof */}
      <section id="capabilities" className="bg-card">
        <div className="mx-auto max-w-[1180px] px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <ScrollReveal>
              <div>
                <h2 className="text-display text-3xl text-foreground">Proof of quality</h2>
                <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
                  Corpus accuracy tests, schema-validated CBOM export, and grounded Groq narration that cannot
                  invent findings — deterministic tables remain authoritative.
                </p>
                <Button asChild className="mt-8" variant="outline">
                  <Link href="/login">Run corpus demo scan</Link>
                </Button>
              </div>
            </ScrollReveal>
            <ScrollReveal delayMs={90}>
              <LandingAnimatedProof />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-8 px-6 py-16 sm:flex-row sm:items-center">
          <ScrollReveal className="max-w-xl">
          <div>
            <h2 className="text-display text-2xl sm:text-3xl">Ready for the 5-minute judge walkthrough?</h2>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85">
              Sign in, upload <span className="font-mono">mixed-enterprise.zip</span>, open Mosca, export CBOM,
              ask the assistant a question — all without leaving the product.
            </p>
          </div>
          </ScrollReveal>
          <ScrollReveal delayMs={80}>
          <MagneticButton>
            <ShimmerCta>
              <Button
                asChild
                size="lg"
                className="h-11 shrink-0 border-0 bg-white px-8 text-primary hover:bg-white/95"
              >
                <Link href="/login">Open ECDAT console</Link>
              </Button>
            </ShimmerCta>
          </MagneticButton>
          </ScrollReveal>
        </div>
      </section>
    </MarketingLayout>
  );
}
