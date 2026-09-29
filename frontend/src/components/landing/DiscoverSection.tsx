"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Counter, GlowCard, RiskBadge, SectionHeader } from "@/components/landing/primitives";
import {
  ARTEFACT_KIND_LABEL,
  DISCOVERED_ARTEFACTS,
  DISCOVERY_CATEGORIES,
  DISCOVERY_TOTAL,
} from "@/lib/landingDemoData";
import { cn } from "@/lib/utils";

const STAGES = ["Blurred", "Scanned", "Identified", "Classified"] as const;
const STEP_MS = 620;
const EASE = [0.16, 1, 0.3, 1] as const;

export function DiscoverSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduced = useReducedMotion();
  // One tick per stage per artefact; artefact i is at stage (tick - i * STAGES.length).
  const [tick, setTick] = useState(0);
  const finalTick = DISCOVERED_ARTEFACTS.length * STAGES.length;

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setTick(finalTick);
      return;
    }
    const id = window.setInterval(() => {
      setTick((t) => {
        if (t >= finalTick) {
          window.clearInterval(id);
          return t;
        }
        return t + 1;
      });
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [inView, reduced, finalTick]);

  const activeIndex = Math.min(DISCOVERED_ARTEFACTS.length - 1, Math.floor(tick / STAGES.length));
  const activeStage = tick >= finalTick ? STAGES.length - 1 : tick % STAGES.length;
  const active = DISCOVERED_ARTEFACTS[activeIndex];
  const docked = DISCOVERED_ARTEFACTS.slice(0, tick >= finalTick ? DISCOVERED_ARTEFACTS.length : activeIndex);

  return (
    <section id="discover" className="relative border-t border-border py-28 sm:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionHeader
          index="03"
          kicker="Discovery"
          title="Discover every cryptographic artefact."
          body="Each finding is scanned, identified, classified by type and risk, and locked into the inventory with its file path and line as evidence."
          sample
        />

        <div ref={ref} className="mt-16 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <GlowCard className="relative overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="intel-label">Live artefact stream</p>
              <p className="font-mono text-[11px] text-ink-muted">
                {Math.min(docked.length + (tick >= finalTick ? 0 : 1), DISCOVERED_ARTEFACTS.length)} /{" "}
                {DISCOVERED_ARTEFACTS.length}
              </p>
            </div>

            <div className="relative mt-8 flex min-h-[210px] items-center justify-center overflow-hidden rounded-xl border border-border bg-black/30 p-6">
              {activeStage === 1 && <div className="intel-scanline" aria-hidden />}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={active.name}
                  className="w-full max-w-sm text-center"
                  initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(6px)", transition: { duration: 0.25 } }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <motion.p
                    className="font-mono text-3xl tracking-tight text-foreground sm:text-4xl"
                    animate={{ filter: activeStage === 0 ? "blur(10px)" : "blur(0px)", opacity: activeStage === 0 ? 0.5 : 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    {activeStage < 2 ? active.name.replace(/[A-Za-z0-9]/g, "▒") : active.name}
                  </motion.p>
                  <p className="mt-3 font-mono text-[11px] text-ink-muted">{activeStage >= 1 ? active.path : "…"}</p>
                  <div className="mt-5 flex h-6 items-center justify-center gap-2">
                    {activeStage >= 2 && (
                      <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-primary uppercase">
                        {ARTEFACT_KIND_LABEL[active.kind]}
                      </span>
                    )}
                    {activeStage >= 3 && <RiskBadge risk={active.risk} />}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <ol className="mt-6 grid grid-cols-4 gap-2">
              {STAGES.map((stage, i) => (
                <li
                  key={stage}
                  className={cn(
                    "rounded-md border px-2 py-2 text-center font-mono text-[10px] tracking-[0.12em] uppercase transition-colors duration-300",
                    i <= activeStage
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-ink-muted"
                  )}
                >
                  {stage}
                </li>
              ))}
            </ol>
          </GlowCard>

          <div className="grid gap-3">
            <GlowCard className="flex items-end justify-between p-6">
              <div>
                <p className="intel-label">Artefacts inventoried</p>
                <p className="mt-2 font-mono text-5xl text-foreground">
                  <Counter value={DISCOVERY_TOTAL} />
                </p>
              </div>
              <p className="max-w-[10rem] text-right font-mono text-[10px] leading-relaxed text-ink-muted uppercase">
                Each with path, line &amp; snippet evidence
              </p>
            </GlowCard>
            {DISCOVERY_CATEGORIES.map((c) => {
              const items = docked.filter((a) => a.category === c.id);
              const receiving = tick < finalTick && active.category === c.id && activeStage === 3;
              return (
                <GlowCard
                  key={c.id}
                  className={cn(
                    "flex items-center justify-between gap-4 px-5 py-4 transition-[border-color,box-shadow] duration-300",
                    receiving && "border-primary/50 shadow-[0_0_30px_rgba(56,189,248,0.18)]"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] tracking-[0.14em] text-ink-muted uppercase">{c.label}</p>
                    <div className="mt-2 flex min-h-[22px] flex-wrap gap-1.5">
                      <AnimatePresence>
                        {items.map((a) => (
                          <motion.span
                            key={a.name}
                            layout
                            initial={reduced ? false : { opacity: 0, y: -14, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 0.45, ease: EASE }}
                            className="rounded border border-border bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-foreground/85"
                          >
                            {a.name}
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      {items.length === 0 && (
                        <span className="font-mono text-[10px] text-ink-muted/60">{c.samples.slice(0, 2).join(" · ")}</span>
                      )}
                    </div>
                  </div>
                  <p className="shrink-0 font-mono text-2xl text-foreground">
                    <Counter value={c.count} />
                  </p>
                </GlowCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
