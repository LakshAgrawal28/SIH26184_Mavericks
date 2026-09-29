"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
};

/** Subtle magnetic pull on hover — inspired by 21st magnetic button patterns. */
export function MagneticButton({ children, className, strength = 0.28 }: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null);

  function onMove(e: React.PointerEvent<HTMLSpanElement>) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    ref.current.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  }

  function onLeave() {
    if (!ref.current) return;
    ref.current.style.transform = "";
  }

  return (
    <span
      ref={ref}
      className={cn("ecdat-magnetic inline-flex transition-transform duration-200 ease-out", className)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </span>
  );
}
