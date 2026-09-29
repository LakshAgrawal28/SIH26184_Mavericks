"use client";

import { useEffect, useRef, useState } from "react";
import AnimatedCount from "@/components/AnimatedCount";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { cn } from "@/lib/utils";

const METRICS = [
  { key: "Recall", display: "100", suffix: "%", sub: "on published corpus fixtures", animate: 100 },
  { key: "Invented algos", display: "0", suffix: "", sub: "deterministic detection", animate: 0 },
  { key: "Standards", display: "3", suffix: "", sub: "FIPS 203 · 204 · CycloneDX", animate: 3 },
  { key: "Deploy", display: "1", suffix: "-click", sub: "Docker · Render · Vercel", animate: 1 },
] as const;

const HIGHLIGHT = {
  label: "Corpus validation",
  value: 100,
  targetLabel: "Target: 100%",
};

/** KPI grid with scroll reveals — adapted from 21st Advanced Stats (uilayout.contact, id 19070). */
export default function LandingAnimatedProof() {
  const goalRef = useRef<HTMLDivElement>(null);
  const [barActive, setBarActive] = useState(false);

  useEffect(() => {
    const el = goalRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setBarActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-stretch">
      <ScrollReveal className="panel p-7 lg:flex lg:flex-col lg:justify-between">
        <div ref={goalRef}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Primary goal</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{HIGHLIGHT.label}</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Benchmarks on the published corpus — judges see reproducible recall, not hand-waved demos.
          </p>
        </div>
        <div className="mt-8">
          <div className="mb-2 flex items-end justify-between">
            <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
              <AnimatedCount value={HIGHLIGHT.value} durationMs={900} />%
            </span>
            <span className="mb-1 text-xs font-medium text-ink-muted">{HIGHLIGHT.targetLabel}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface">
            <div className={cn("ecdat-proof-bar h-full rounded-full bg-primary", barActive && "is-visible")} />
          </div>
        </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((item, index) => (
          <ScrollReveal
            key={item.key}
            delayMs={60 + index * 50}
            className={cn(
              "panel-muted px-4 py-5 text-center transition-colors sm:text-left",
              "hover:border-primary/25 hover:bg-card"
            )}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{item.key}</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
              <AnimatedCount value={item.animate} durationMs={800 + index * 120} />
              {item.suffix}
            </p>
            <p className="mt-1 text-[10px] text-ink-muted">{item.sub}</p>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
