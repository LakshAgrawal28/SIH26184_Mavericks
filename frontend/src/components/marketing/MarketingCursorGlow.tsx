"use client";

import { useEffect, useRef, useState } from "react";

const TRAIL_LAG = [0.08, 0.05, 0.032];
const MAGNETIC =
  'a[href="/login"], a[href="/dashboard"], a[href="/signup"], [data-magnetic], [data-slot="button"]';

/**
 * Navy pointer spotlight + lagging trail + magnetic ring expansion (desktop only).
 */
export function MarketingCursorGlow() {
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    setActive(true);
    document.documentElement.classList.add("ecdat-marketing-cursor");

    let x = 0;
    let y = 0;
    let ringX = 0;
    let ringY = 0;
    const trail = TRAIL_LAG.map(() => ({ x: 0, y: 0 }));
    let ringScale = 1;
    let targetRingScale = 1;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const el = document.elementFromPoint(x, y);
      const magnetic = el?.closest(MAGNETIC);
      targetRingScale = magnetic ? 1.85 : 1;
    };

    const tick = () => {
      ringX += (x - ringX) * 0.18;
      ringY += (y - ringY) * 0.18;
      ringScale += (targetRingScale - ringScale) * 0.12;

      let px = x;
      let py = y;
      trail.forEach((t, i) => {
        t.x += (px - t.x) * TRAIL_LAG[i];
        t.y += (py - t.y) * TRAIL_LAG[i];
        const node = trailRefs.current[i];
        if (node) node.style.transform = `translate(${t.x}px, ${t.y}px) translate(-50%, -50%)`;
        px = t.x;
        py = t.y;
      });

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      if (spotRef.current) {
        spotRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) scale(${ringScale})`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("ecdat-marketing-cursor");
    };
  }, []);

  if (!active) return null;

  return (
    <div className="ecdat-cursor-layer pointer-events-none fixed inset-0 z-[200]" aria-hidden>
      <div ref={glowRef} className="ecdat-cursor-glow" />
      <div ref={spotRef} className="ecdat-cursor-spot" />
      {TRAIL_LAG.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
          className="ecdat-cursor-trail"
          style={{ opacity: 0.35 - i * 0.08 }}
        />
      ))}
      <div ref={ringRef} className="ecdat-cursor-ring" />
    </div>
  );
}
