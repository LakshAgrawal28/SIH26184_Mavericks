"use client";

import Link from "next/link";
import { HeroNetwork } from "@/components/landing/HeroNetwork";
import { BlurReveal, RevealText } from "@/components/landing/primitives";
import { MagneticButton } from "@/components/marketing/MagneticButton";
import { ShimmerCta } from "@/components/marketing/ShimmerCta";
import { Button } from "@/components/ui/button";

export function CommandCtaSection() {
  return (
    <section
      id="command"
      className="relative isolate overflow-hidden border-t border-border bg-background py-14 sm:py-16"
    >
      <HeroNetwork variant="reconstruct" density={32} className="opacity-[0.28]" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(13,59,102,0.07),transparent_72%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center justify-center px-6 text-center">
        <BlurReveal>
          <p className="font-mono text-[11px] tracking-[0.3em] text-ink-muted uppercase">
            <span className="text-primary">08</span> // NTRO / ECDAT
          </p>
        </BlurReveal>
        <RevealText
          as="h2"
          text="Cryptographic visibility for the post-quantum era."
          className="intel-heading mt-5 block max-w-3xl text-[1.65rem] sm:text-3xl"
          wordClassName="intel-gradient-text"
        />
        <BlurReveal delay={0.4} className="mt-12">
          <MagneticButton>
            <ShimmerCta>
              <Button asChild size="lg" className="h-12 px-8 font-mono text-xs tracking-[0.18em] uppercase">
                <Link href="/login">Explore ECDAT →</Link>
              </Button>
            </ShimmerCta>
          </MagneticButton>
        </BlurReveal>
        <BlurReveal delay={0.55}>
          <p className="mt-6 font-mono text-[11px] text-ink-muted">
            upload <span className="text-foreground">mixed-enterprise.zip</span> · review Mosca · export CBOM
          </p>
        </BlurReveal>
      </div>
    </section>
  );
}
