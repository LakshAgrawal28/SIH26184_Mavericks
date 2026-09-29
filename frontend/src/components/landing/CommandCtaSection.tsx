"use client";

import Link from "next/link";
import { HeroNetwork } from "@/components/landing/HeroNetwork";
import { BlurReveal, RevealText } from "@/components/landing/primitives";
import { MagneticButton } from "@/components/marketing/MagneticButton";
import { ShimmerCta } from "@/components/marketing/ShimmerCta";
import { Button } from "@/components/ui/button";

export function CommandCtaSection() {
  return (
    <section id="command" className="relative isolate overflow-hidden border-t border-border bg-black">
      <HeroNetwork variant="reconstruct" density={38} className="opacity-45" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_45%_at_50%_50%,rgba(0,0,0,0.9),transparent_80%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[50vh] max-w-[1280px] flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
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
