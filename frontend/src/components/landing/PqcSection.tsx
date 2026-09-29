"use client";

import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { GlowCard, SectionHeader } from "@/components/landing/primitives";
import { PQC_CANDIDATES } from "@/lib/landingDemoData";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const STEPS = ["Current", "ECDAT analysis", "Candidates"] as const;

export function PqcSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-25% 0px" });
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setStep(2);
      return;
    }
    setStep(0);
    const t1 = window.setTimeout(() => setStep(1), 1200);
    const t2 = window.setTimeout(() => setStep(2), 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [inView, reduced, run]);

  const exposed = step >= 1;

  return (
    <section id="pqc" className="landing-section">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionHeader
          index="07"
          kicker="PQC migration"
          title="From vulnerable to quantum-ready."
          body="ECDAT maps each exposed asset to NIST post-quantum and hybrid candidates, weighing security level, latency and cost for your team to review. It supports the decision — it does not rewrite your cryptography for you."
        />

        <div ref={ref} className="landing-stack">
          <ol className="mb-6 flex flex-wrap items-center gap-2">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors",
                    i <= step ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-ink-muted"
                  )}
                >
                  {String(i + 1).padStart(2, "0")} {label}
                </button>
                {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" aria-hidden />}
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setRun((r) => r + 1)}
                className="ml-2 font-mono text-[10px] tracking-[0.14em] text-ink-muted uppercase hover:text-foreground"
              >
                ↻ Replay
              </button>
            </li>
          </ol>

          <LayoutGroup>
            <div className="flex flex-col items-center">
              <motion.div
                layout
                transition={{ duration: 0.7, ease: EASE }}
                className={cn(
                  "intel-glass w-full max-w-md overflow-hidden px-6 py-5 text-center transition-[border-color,box-shadow] duration-700",
                  exposed && "border-[color:var(--intel-red)]/45 shadow-[0_0_60px_rgba(239,68,68,0.18)]"
                )}
              >
                <motion.p layout="position" className="intel-label text-[10px]">
                  {exposed ? "ECDAT analysis" : "Current"}
                </motion.p>
                <motion.p layout="position" className="mt-2 font-mono text-3xl text-foreground">
                  RSA-2048
                </motion.p>
                <AnimatePresence mode="popLayout">
                  {exposed && (
                    <motion.div
                      key="exposure"
                      initial={{ opacity: 0, height: 0, filter: "blur(6px)" }}
                      animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.6, ease: EASE }}
                    >
                      <p className="mt-4 rounded-md border border-[color:var(--intel-red)]/40 bg-[color:var(--intel-red)]/10 py-2 font-mono text-xs tracking-[0.18em] text-[#fca5a5]">
                        ⚠ HIGH QUANTUM EXPOSURE
                      </p>
                      <p className="mt-3 font-mono text-[11px] text-ink-muted">
                        Shor-breakable · X + Y &gt; Z · key transport in 3 services
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                className="h-12 w-px origin-top bg-gradient-to-b from-[var(--intel-cyan)] to-transparent"
                animate={{ scaleY: step >= 2 ? 1 : 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                aria-hidden
              />

              <div className="grid w-full gap-4 md:grid-cols-3">
                {PQC_CANDIDATES.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={false}
                    animate={
                      step >= 2
                        ? { opacity: 1, y: 0, filter: "blur(0px)" }
                        : { opacity: 0.15, y: 24, filter: "blur(8px)" }
                    }
                    transition={{ duration: 0.7, ease: EASE, delay: step >= 2 ? i * 0.12 : 0 }}
                  >
                    <GlowCard className="h-full p-6">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">{c.standard}</p>
                        <span className="font-mono text-[10px] text-ink-muted">candidate for review</span>
                      </div>
                      <p className="mt-3 font-mono text-xl text-foreground">{c.name}</p>
                      <p className="mt-2 text-sm text-ink-muted">{c.role}</p>
                      <dl className="mt-5 grid grid-cols-3 gap-2 font-mono text-[10px]">
                        {(
                          [
                            ["Security", c.security],
                            ["Latency", c.latency],
                            ["Cost", c.cost],
                          ] as const
                        ).map(([k, v]) => (
                          <div key={k} className="rounded-md border border-border bg-white/[0.02] p-2">
                            <dt className="tracking-[0.12em] text-ink-muted uppercase">{k}</dt>
                            <dd className="mt-1 leading-snug text-foreground/90">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </LayoutGroup>
        </div>
      </div>
    </section>
  );
}
