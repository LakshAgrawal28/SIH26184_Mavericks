"use client";

import type { ReactNode } from "react";
import { EntrySplash } from "@/components/premium/EntrySplash";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <EntrySplash />
      {children}
    </>
  );
}
