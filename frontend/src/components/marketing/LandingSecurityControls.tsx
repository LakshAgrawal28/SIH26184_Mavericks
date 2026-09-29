"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const CONTROLS = [
  {
    id: "onprem",
    glyph: "01",
    title: "On-prem & air-gap",
    body: "Run the full stack where classified workloads live — Docker on your metal, no mandatory cloud egress.",
  },
  {
    id: "evidence",
    glyph: "02",
    title: "Evidence-first findings",
    body: "Every artefact ships path, line, and snippet so judges can trace claims from upload to export.",
  },
  {
    id: "cbom",
    glyph: "03",
    title: "CycloneDX CBOM 1.6",
    body: "Schema-valid cryptographic-asset export aligned with NTRO PS 26164 deliverables — not a screenshot.",
  },
  {
    id: "pqc",
    glyph: "04",
    title: "NIST PQC grounded",
    body: "Recommendations cite FIPS 203/204 paths; Mosca timelines tie urgency to migration, not hype.",
  },
  {
    id: "deterministic",
    glyph: "05",
    title: "Deterministic core",
    body: "Detection and scoring stay reproducible — the assistant narrates, tables remain authoritative.",
  },
] as const;

/** Interactive security block — adapted from 21st Alqemist Security (id 14889). */
export default function LandingSecurityControls() {
  const [active, setActive] = useState<(typeof CONTROLS)[number]["id"]>("onprem");
  const selected = CONTROLS.find((c) => c.id === active) ?? CONTROLS[0];

  return (
    <section className="border-b border-border/70 bg-surface/40">
      <div className="mx-auto max-w-[1180px] px-6 py-20">
        <ScrollReveal className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Enterprise posture</p>
          <h2 className="text-display mt-3 text-3xl text-foreground">Security controls judges can click through</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
            ECDAT is built for sovereign deployment: isolation where it matters, standards-backed export, and audit-friendly
            evidence — the same story in the marketing walkthrough and the live console.
          </p>
        </ScrollReveal>

        <ScrollReveal delayMs={80} className="mt-12">
          <div className="panel-elevated grid min-h-[360px] overflow-hidden lg:grid-cols-12">
            <div className="hidden place-items-center border-r border-border/80 bg-[linear-gradient(160deg,rgba(13,59,102,0.06),transparent)] lg:col-span-5 lg:grid">
              <div className="text-center">
                <p className="font-mono text-5xl font-semibold tabular-nums text-primary/90">{selected.glyph}</p>
                <p className="mt-4 max-w-[14rem] text-sm font-medium leading-snug text-foreground">{selected.title}</p>
              </div>
            </div>
            <div className="lg:col-span-7">
              {CONTROLS.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-expanded={isActive}
                    onClick={() => setActive(item.id)}
                    className={cn(
                      "block w-full border-b border-border/70 px-6 py-5 text-left transition-colors last:border-b-0",
                      isActive ? "bg-card" : "bg-surface/30 hover:bg-card/80"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono text-[11px] font-semibold",
                          isActive
                            ? "border-primary/30 bg-primary/5 text-primary"
                            : "border-border/80 bg-card text-ink-muted"
                        )}
                      >
                        {item.glyph}
                      </span>
                      <span className="text-base font-semibold text-foreground">{item.title}</span>
                    </div>
                    {isActive && (
                      <p className="mt-3 max-w-xl pl-11 text-sm leading-relaxed text-ink-muted motion-enter">
                        {item.body}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
