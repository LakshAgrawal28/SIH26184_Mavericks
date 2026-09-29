"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type RefObject } from "react";

let registered = false;

/**
 * Runs scoped GSAP/ScrollTrigger setup for a section. Skipped entirely under
 * prefers-reduced-motion, so markup must render its final state by default.
 */
export function useGSAP(scope: RefObject<HTMLElement | null>, setup: (g: typeof gsap) => void) {
  const setupRef = useRef(setup);
  setupRef.current = setup;

  useEffect(() => {
    if (!scope.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }
    const ctx = gsap.context(() => setupRef.current(gsap), scope.current);
    return () => ctx.revert();
  }, [scope]);
}
