"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BorderBeamCardProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

/**
 * Rotating gradient border — pattern from 21st Moving Border (phucbm, id 9450)
 * and Border Trail (ibelick, id 1650).
 */
export function BorderBeamCard({ children, className, innerClassName }: BorderBeamCardProps) {
  return (
    <div className={cn("ecdat-border-beam relative rounded-[var(--radius-lg)] p-[2px]", className)}>
      <div className="ecdat-border-beam-glow" aria-hidden />
      <div
        className={cn(
          "relative rounded-[calc(var(--radius-lg)-2px)] bg-card shadow-[var(--shadow-elevated)]",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
