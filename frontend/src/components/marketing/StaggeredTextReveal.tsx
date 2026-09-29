"use client";

import { cn } from "@/lib/utils";

type StaggeredTextRevealProps = {
  lines: string[];
  className?: string;
  as?: "h1" | "h2";
};

/** Staggered line reveal — inspired by 21st Animated hero (tommyjepsen, id 1313). */
export function StaggeredTextReveal({ lines, className, as: Tag = "h1" }: StaggeredTextRevealProps) {
  return (
    <Tag className={cn("text-display", className)}>
      {lines.map((line, i) => (
        <span
          key={line}
          className="ecdat-stagger-line block"
          style={{ animationDelay: `${80 + i * 110}ms` }}
        >
          {line}
        </span>
      ))}
    </Tag>
  );
}
