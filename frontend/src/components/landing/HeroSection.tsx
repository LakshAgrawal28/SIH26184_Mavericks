"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { HeroNetwork } from "@/components/landing/HeroNetwork";
import { RevealText } from "@/components/landing/primitives";
import { MagneticButton } from "@/components/marketing/MagneticButton";
import { ShimmerCta } from "@/components/marketing/ShimmerCta";
import { Button } from "@/components/ui/button";

const BOOT_LINES = [
  "ecdat://init  cryptographic discovery engine",
  "loading artefact classes  algorithm · key · certificate · protocol · library · cloud · hsm",
  "network online",
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  const reduced = useReducedMotion();
  const [bootStep, setBootStep] = useState(0);

  useEffect(() => {
    if (reduced) {
      setBootStep(BOOT_LINES.length);
      return;
    }
    const timers = BOOT_LINES.map((_, i) => window.setTimeout(() => setBootStep(i + 1), 280 + i * 620));
    return () => timers.forEach(window.clearTimeout);
  }, [reduced]);

  const headlineDelay = reduced ? 0 : 2.1;

  return (
    <section id="hero" className="relative isolate flex min-h-[calc(100svh-60px)] flex-col overflow-hidden">
      <div className="intel-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(56,189,248,0.10),transparent_70%)]"
        aria-hidden
      />
      <HeroNetwork className="opacity-90" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(5,7,11,0.82),transparent_75%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-6 pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4 font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">
          <div className="hidden sm:block">
            <p className="text-foreground">
              NTRO <span className="text-ink-muted">/</span> ECDAT
            </p>
            <p className="mt-1">Enterprise Cryptographic Discovery &amp; Analysis Tool</p>
          </div>
          <p className="flex items-center gap-2">
            <span className="intel-status-dot" aria-hidden />
            System status · Operational
          </p>
        </div>

        <div className="mt-6 min-h-[64px] font-mono text-[11px] leading-6 text-ink-muted" aria-hidden>
          {BOOT_LINES.slice(0, bootStep).map((line, i) => (
            <motion.p
              key={line}
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <span className="text-primary">&gt;</span> {line}
              {i === bootStep - 1 && bootStep < BOOT_LINES.length && (
                <span className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-primary" />
              )}
            </motion.p>
          ))}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <p className="intel-label">SIH 2026 · Problem Statement 26164 · Team Mavericks</p>
          <h1 className="intel-heading mt-6 text-[3.4rem] sm:text-[5.5rem] lg:text-[7.5rem]">
            <RevealText
              text="Know your"
              immediate
              delay={headlineDelay}
              stagger={0.1}
              className="block" wordClassName="intel-gradient-text"
            />
            <RevealText
              text="cryptography."
              immediate
              delay={headlineDelay + 0.2}
              className="block" wordClassName="intel-accent-text"
            />
          </h1>
          <motion.p
            className="mt-8 max-w-xl text-base text-ink-muted sm:text-lg"
            initial={reduced ? false : { opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: headlineDelay + 0.55, ease: EASE }}
          >
            Discover. Assess. Prepare for the Post-Quantum Era.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: headlineDelay + 0.8, ease: EASE }}
          >
            <MagneticButton>
              <ShimmerCta>
                <Button asChild size="lg" className="h-12 px-7 font-mono text-xs tracking-[0.14em] uppercase">
                  <Link href="/login">Launch live demo →</Link>
                </Button>
              </ShimmerCta>
            </MagneticButton>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-border bg-transparent px-7 font-mono text-xs tracking-[0.14em] uppercase"
            >
              <a href="#blind-spot">See how it works</a>
            </Button>
          </motion.div>
          <motion.p
            className="mt-5 font-mono text-[11px] text-ink-muted"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: headlineDelay + 1 }}
          >
            demo login · <span className="text-foreground">admin@example.com</span> /{" "}
            <span className="text-foreground">admin123</span>
          </motion.p>
        </div>
      </div>
    </section>
  );
}
