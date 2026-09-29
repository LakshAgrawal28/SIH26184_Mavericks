"use client";

/**
 * Subtle hero atmosphere — adapted from 21st Hero Static Radial Gradient (cult-ui, id 19151).
 * ECDAT primary (#0d3b66), light theme, no WebGL or rainbow shaders.
 */
export default function HeroRadialGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -right-[20%] top-[5%] h-[min(520px,70vw)] w-[min(520px,70vw)] rounded-full bg-[radial-gradient(circle_at_center,rgba(13,59,102,0.11)_0%,transparent_68%)] ecdat-hero-orb ecdat-hero-orb-a" />
      <div className="absolute -left-[15%] bottom-[10%] h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full bg-[radial-gradient(circle_at_center,rgba(13,59,102,0.07)_0%,transparent_70%)] ecdat-hero-orb ecdat-hero-orb-b" />
    </div>
  );
}
