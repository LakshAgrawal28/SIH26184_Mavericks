"use client";

import { useGSAP } from "@/components/landing/useGsap";
import { useRef } from "react";
import { GlowCard, RevealText, SampleTag, BlurReveal } from "@/components/landing/primitives";
import { SCAN_SOURCES } from "@/lib/landingDemoData";

export function BlindSpotSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(root, (gsap) => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: "[data-scan-grid]", start: "top 75%", end: "bottom 45%", scrub: 0.6 },
    });
    gsap.utils.toArray<HTMLElement>("[data-scan-card]").forEach((card, i) => {
      const target = Number(card.dataset.progress);
      const bar = card.querySelector<HTMLElement>("[data-bar]");
      const beam = card.querySelector<HTMLElement>("[data-beam]");
      const pct = card.querySelector<HTMLElement>("[data-pct]");
      const counter = { v: 0 };
      const at = i * 0.18;
      tl.fromTo(beam, { xPercent: -100, opacity: 0 }, { xPercent: 420, opacity: 1, duration: 1, ease: "none" }, at)
        .fromTo(bar, { scaleX: 0 }, { scaleX: target / 100, duration: 1, ease: "none" }, at)
        .to(
          counter,
          {
            v: target,
            duration: 1,
            ease: "none",
            onUpdate: () => {
              if (pct) pct.textContent = `${Math.round(counter.v)}%`;
            },
          },
          at
        )
        .fromTo(card.querySelector("[data-wire]"), { scaleY: 0 }, { scaleY: 1, duration: 0.4 }, at + 0.8);
    });
    tl.fromTo("[data-core]", { opacity: 0.35, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.5 }, 1.3);
  });

  return (
    <section id="blind-spot" ref={root} className="relative border-t border-border py-28 sm:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="intel-label">
          <span className="text-primary">02</span> // The cryptographic blind spot
        </p>
        <h2 className="intel-heading mt-6 text-[2.6rem] sm:text-6xl lg:text-[5.2rem]">
          <RevealText text="You can't protect" className="block" wordClassName="intel-gradient-text" />
          <RevealText text="what you can't see." delay={0.25} className="block" wordClassName="intel-accent-text" />
        </h2>
        <BlurReveal delay={0.2}>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-[17px]">
            Cryptography hides in source code, compiled binaries, third-party libraries and container images. ECDAT
            scans every layer of the estate from a single archive, so nothing stays invisible.
          </p>
        </BlurReveal>

        <div data-scan-grid className="mt-16">
          <div className="mb-4 flex justify-end">
            <SampleTag />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SCAN_SOURCES.map((s) => (
              <div key={s.id} data-scan-card data-progress={s.progress} className="relative">
                <GlowCard className="overflow-hidden p-5">
                  <div
                    data-beam
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-[rgba(56,189,248,0.18)] to-transparent"
                    aria-hidden
                  />
                  <p className="intel-label text-[10px]">{s.label}</p>
                  <p className="mt-2 truncate font-mono text-xs text-foreground/80">{s.detail}</p>
                  <div className="mt-6 flex items-end justify-between">
                    <span className="font-mono text-[10px] tracking-[0.14em] text-ink-muted uppercase">Scanning</span>
                    <span data-pct className="font-mono text-2xl text-foreground tabular-nums">
                      {s.progress}%
                    </span>
                  </div>
                  <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/5">
                    <div
                      data-bar
                      className="h-full origin-left rounded-full bg-gradient-to-r from-[var(--intel-blue)] to-[var(--intel-cyan)]"
                      style={{ transform: `scaleX(${s.progress / 100})` }}
                    />
                  </div>
                </GlowCard>
                <div
                  data-wire
                  className="mx-auto hidden h-14 w-px origin-top bg-gradient-to-b from-[var(--intel-cyan)] to-transparent lg:block"
                  aria-hidden
                />
              </div>
            ))}
          </div>

          <div
            data-core
            className="intel-glass mx-auto mt-6 flex max-w-md items-center justify-between gap-4 px-6 py-4 lg:mt-0"
          >
            <div>
              <p className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">Correlation core</p>
              <p className="mt-1 font-mono text-lg tracking-[0.2em] text-foreground">ECDAT</p>
            </div>
            <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-primary uppercase">
              <span className="intel-status-dot" aria-hidden />
              Ingesting 4 sources
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
