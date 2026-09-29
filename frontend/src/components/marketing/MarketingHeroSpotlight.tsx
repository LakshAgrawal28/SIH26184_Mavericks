"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";

type MarketingHeroSpotlightProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Hero wrapper: cursor-tracked radial reveal (21st Cursor Spotlight 18361 — in-house light theme).
 */
export function MarketingHeroSpotlight({ children, className }: MarketingHeroSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty("--spot-x", `${x}px`);
    ref.current.style.setProperty("--spot-y", `${y}px`);
    ref.current.style.setProperty("--spot-opacity", "1");
  }

  function onLeave() {
    ref.current?.style.setProperty("--spot-opacity", "0");
  }

  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={
        {
          ["--spot-x" as string]: "50%",
          ["--spot-y" as string]: "40%",
          ["--spot-opacity" as string]: "0",
        } as CSSProperties
      }
    >
      <div className="ecdat-hero-spotlight-vignette pointer-events-none absolute inset-0" aria-hidden />
      <div className="ecdat-hero-spotlight-beam pointer-events-none absolute inset-0" aria-hidden />
      {children}
    </div>
  );
}
