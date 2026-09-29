"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Navy pointer glow + soft trailing ring for marketing pages only.
 * Patterns inspired by 21st Cursor (1896) and Cursor Spotlight (18361) — adapted in-house.
 */
export function MarketingCursorGlow() {
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
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
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const tick = () => {
      ringX += (x - ringX) * 0.14;
      ringY += (y - ringY) * 0.14;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
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
      <div ref={ringRef} className="ecdat-cursor-ring" />
    </div>
  );
}
