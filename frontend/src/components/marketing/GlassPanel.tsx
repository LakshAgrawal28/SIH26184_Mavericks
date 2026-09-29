"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  /** Tracks pointer for specular highlight — inspired by 21st Glass Card (28259). */
  spotlight?: boolean;
  as?: "div" | "article" | "section";
};

export function GlassPanel({
  children,
  className,
  spotlight = false,
  as: Tag = "div",
}: GlassPanelProps) {
  const style = spotlight
    ? ({
        ["--glass-x" as string]: "50%",
        ["--glass-y" as string]: "50%",
      } as CSSProperties)
    : undefined;

  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (!spotlight) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty("--glass-x", `${px}%`);
    e.currentTarget.style.setProperty("--glass-y", `${py}%`);
  }

  return (
    <Tag
      className={cn("ecdat-glass-panel", spotlight && "ecdat-glass-spotlight", className)}
      style={style}
      onPointerMove={spotlight ? onMove : undefined}
    >
      {children}
    </Tag>
  );
}
