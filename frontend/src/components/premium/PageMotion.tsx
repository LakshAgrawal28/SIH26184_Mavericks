"use client";

import type { ReactNode } from "react";

export function PageMotion({ children }: { children: ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
