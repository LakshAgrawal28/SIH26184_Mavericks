"use client";

import { cn } from "@/lib/utils";

/**
 * Animated mesh atmosphere — inspired by 21st Background Gradient Animation
 * (manuarora700, id 1134) and blue meshy background (reuno-ui).
 */
export function MeshGradientBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="ecdat-mesh-blob ecdat-mesh-blob-a" />
      <div className="ecdat-mesh-blob ecdat-mesh-blob-b" />
      <div className="ecdat-mesh-blob ecdat-mesh-blob-c" />
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(13,59,102,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(13,59,102,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
