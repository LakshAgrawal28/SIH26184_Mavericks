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
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-[1120px] gap-12 px-6 py-16 lg:grid-cols-[1fr_380px] lg:py-20">
          <div className="motion-enter max-w-[36rem]">
            <p className="text-xs font-medium tracking-wide text-primary">Post-quantum readiness</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Cryptographic discovery you can prove in an audit
            </h1>
            <CipherScramble className="mt-5 font-mono text-sm text-foreground sm:text-base" />
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              ECDAT inventories enterprise cryptography from a single archive — scores quantum risk,
              models Mosca timelines, and exports a standards-compliant CBOM. Built for security engineers
              and government assessors who need precision, not marketing fluff.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href="/login">Sign in to console</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Run a demo scan</Link>
              </Button>
            </div>
          </div>

          <div className="motion-enter motion-enter-delay-1 panel-elevated p-0">
            <div className="border-b border-border bg-surface px-5 py-3">
              <p className="text-xs font-medium text-ink-muted">Live posture preview</p>
              <p className="font-mono text-sm text-foreground">mixed-enterprise.zip</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border">
              {[
                { l: "Artefacts", v: "26" },
                { l: "Critical", v: "0", c: "text-[#B3261E]" },
                { l: "High", v: "0", c: "text-[#B8781F]" },
                { l: "Mosca", v: "Review", c: "text-primary" },
              ].map((item) => (
                <div key={item.l} className="bg-background px-5 py-4 transition-colors duration-200">
                  <p className="text-xs text-ink-muted">{item.l}</p>
                  <p className={`mt-1 font-mono text-xl font-semibold tabular-nums ${item.c ?? "text-foreground"}`}>
                    {item.v}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-5 py-4">
              <div className="flex justify-between font-mono text-[10px] text-ink-muted">
                <span>0</span>
                <span>Migration timeline</span>
                <span>Z</span>
              </div>
              <div className="relative mt-2 h-px bg-border">
                <div className="absolute left-0 top-0 h-px w-[68%] bg-primary transition-[width] duration-700 ease-out" />
                <div className="absolute left-[72%] top-[-5px] h-2.5 w-px bg-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-border bg-surface">
        <div className="mx-auto max-w-[1120px] px-6 py-16">
          <h2 className="text-lg font-semibold text-foreground">End-to-end workflow</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            One connected chain from upload to export — the same flow you use in the console.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((item, i) => (
              <div
                key={item.step}
                className={[
                  "panel-interactive p-5 motion-enter",
                  i === 1 && "motion-enter-delay-1",
                  i === 2 && "motion-enter-delay-2",
                  i === 3 && "motion-enter-delay-3",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <p className="font-mono text-xs text-primary">{item.step}</p>
                <h3 className="mt-2 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="bg-background">
        <div className="mx-auto max-w-[1120px] px-6 py-16">
          <h2 className="text-lg font-semibold text-foreground">Built for assessors</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((cap) => (
              <div key={cap.label} className="panel px-5 py-4 transition-colors duration-200 hover:bg-surface">
                <p className="text-xs font-medium text-ink-muted">{cap.label}</p>
                <p className="mt-1 font-mono text-sm text-foreground">{cap.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border border-border bg-surface px-6 py-5">
            <p className="max-w-lg text-sm text-ink-muted">
              Ready to inspect your estate? Sign in with operator credentials, upload a corpus demo, or
              point at your own zip archive.
            </p>
            <Button asChild>
              <Link href="/login">Continue to sign-in</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
