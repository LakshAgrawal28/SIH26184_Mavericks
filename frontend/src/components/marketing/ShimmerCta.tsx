"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ShimmerCtaProps = {
  children: ReactNode;
  className?: string;
};

/** Shimmer highlight on primary CTAs — inspired by 21st Shimmer Button (Shatlyk1011, id 10380). */
export function ShimmerCta({ children, className }: ShimmerCtaProps) {
  return <span className={cn("ecdat-shimmer-cta relative inline-flex overflow-hidden rounded-[var(--radius-md)]", className)}>{children}</span>;
}
