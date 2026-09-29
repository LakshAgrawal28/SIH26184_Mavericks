"use client";

/**
 * Subtle hero atmosphere — adapted from 21st Hero Static Radial Gradient (cult-ui, id 19151).
 * ECDAT primary (#0d3b66), light theme, no WebGL or rainbow shaders.
 */
export default function HeroRadialGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -right-[18%] top-[2%] h-[min(560px,75vw)] w-[min(560px,75vw)] rounded-full bg-[radial-gradient(circle_at_center,rgba(13,59,102,0.2)_0%,transparent_65%)] ecdat-hero-orb ecdat-hero-orb-a" />
      <div className="absolute -left-[12%] bottom-[5%] h-[min(460px,58vw)] w-[min(460px,58vw)] rounded-full bg-[radial-gradient(circle_at_center,rgba(13,59,102,0.14)_0%,transparent_68%)] ecdat-hero-orb ecdat-hero-orb-b" />
      <div className="absolute left-[35%] top-[40%] h-[min(280px,40vw)] w-[min(280px,40vw)] rounded-full bg-[radial-gradient(circle_at_center,rgba(26,107,66,0.1)_0%,transparent_72%)] ecdat-hero-orb ecdat-hero-orb-c" />
    </div>
  );
}
