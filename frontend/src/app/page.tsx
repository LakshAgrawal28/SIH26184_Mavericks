"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CipherScramble from "@/components/CipherScramble";
import { MarketingLayout } from "@/components/marketing/SiteChrome";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/api";

const WORKFLOW = [
  { step: "01", title: "Discover", body: "Upload a zip. Map algorithms, certs, TLS, and libraries with file-level evidence." },
  { step: "02", title: "Score", body: "Quantum vulnerability bands combine HNDL exposure and operational weakness." },
  { step: "03", title: "Timeline", body: "Interactive Mosca X + Y vs Z — migration urgency you can defend in audit." },
  { step: "04", title: "Export", body: "CycloneDX 1.6 CBOM and PQC recommendations tied to each artefact." },
];

const CAPABILITIES = [
  { label: "Evidence", value: "Path · line · snippet" },
  { label: "Risk bands", value: "Critical · high · medium · low" },
  { label: "Standards", value: "NIST PQC · CycloneDX" },
  { label: "Deployment", value: "On-prem · air-gapped ready" },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(13,59,102,0.07),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-[1160px] gap-14 px-6 py-20 lg:grid-cols-[1.1fr_420px] lg:items-center lg:py-28">
          <div className="motion-enter max-w-[38rem]">
            <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">Post-quantum readiness</p>
            <h1 className="text-display mt-4 text-4xl leading-[1.12] text-foreground sm:text-[2.75rem]">
              Cryptographic discovery you can prove in an audit
            </h1>
            <CipherScramble className="mt-6 font-mono text-sm text-foreground/90 sm:text-base" />
            <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">
              ECDAT inventories enterprise cryptography from a single archive — scores quantum risk,
              models Mosca timelines, and exports a standards-compliant CBOM. Built for security engineers
              and government assessors who need precision, not marketing fluff.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">Sign in to console</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/login">Run a demo scan</Link>
              </Button>
            </div>
          </div>

          <div className="motion-enter motion-enter-delay-1 panel-elevated overflow-hidden p-0">
            <div className="border-b border-border/80 bg-surface/80 px-6 py-4">
              <p className="text-xs font-medium text-ink-muted">Live posture preview</p>
              <p className="mt-1 font-mono text-sm text-foreground">mixed-enterprise.zip</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border/60">
              {[
                { l: "Artefacts", v: "26" },
                { l: "Critical", v: "0", c: "text-destructive" },
                { l: "High", v: "0", c: "text-[#a66b12]" },
                { l: "Mosca", v: "Review", c: "text-primary" },
              ].map((item) => (
                <div key={item.l} className="bg-card px-6 py-5">
                  <p className="text-xs text-ink-muted">{item.l}</p>
                  <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${item.c ?? "text-foreground"}`}>
                    {item.v}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-border/80 px-6 py-5">
              <div className="flex justify-between font-mono text-[10px] text-ink-muted">
                <span>0</span>
                <span>Migration timeline</span>
                <span>Z</span>
              </div>
              <div className="relative mt-3 h-0.5 overflow-hidden rounded-full bg-border">
                <div className="absolute inset-y-0 left-0 w-[68%] rounded-full bg-primary transition-[width] duration-700 ease-out" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-border/70 bg-surface/40">
        <div className="mx-auto max-w-[1160px] px-6 py-20">
          <h2 className="text-display text-2xl text-foreground">End-to-end workflow</h2>
          <p className="mt-3 max-w-xl text-[15px] text-ink-muted">
            One connected chain from upload to export — the same flow you use in the console.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((item, i) => (
              <div
                key={item.step}
                className={[
                  "panel-interactive p-6 motion-enter",
                  i === 1 && "motion-enter-delay-1",
                  i === 2 && "motion-enter-delay-2",
                  i === 3 && "motion-enter-delay-3",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <p className="font-mono text-xs font-medium text-primary">{item.step}</p>
                <h3 className="mt-3 text-[15px] font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities">
        <div className="mx-auto max-w-[1160px] px-6 py-20">
          <h2 className="text-display text-2xl text-foreground">Built for assessors</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((cap) => (
              <div key={cap.label} className="panel px-6 py-5 transition-shadow hover:shadow-md">
                <p className="text-xs font-medium text-ink-muted">{cap.label}</p>
                <p className="mt-2 font-mono text-sm text-foreground">{cap.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-border bg-surface/60 px-8 py-7 shadow-sm">
            <p className="max-w-lg text-[15px] leading-relaxed text-ink-muted">
              Ready to inspect your estate? Sign in with operator credentials, upload a corpus demo, or
              point at your own zip archive.
            </p>
            <Button asChild size="lg">
              <Link href="/login">Continue to sign-in</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
