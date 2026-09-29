"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconLogoMark } from "@/components/icons/NavIcons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/70 bg-[#fbfbfa]/85 backdrop-blur-xl",
        className
      )}
    >
      <div className="mx-auto flex h-[60px] max-w-[1160px] items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-85">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-primary">
            <IconLogoMark className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">ECDAT</p>
            <p className="text-[11px] text-ink-muted">Cryptographic discovery</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-[13px] md:flex">
          <a href="/#workflow" className="text-ink-muted transition-colors hover:text-foreground">
            Workflow
          </a>
          <a href="/#capabilities" className="text-ink-muted transition-colors hover:text-foreground">
            Capabilities
          </a>
          <Link href="/login" className="text-ink-muted transition-colors hover:text-primary">
            Sign in
          </Link>
        </nav>
        <Button asChild size="sm" className="shrink-0 shadow-sm">
          <Link href="/login">Open console</Link>
        </Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-surface/50">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-4 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-xs leading-relaxed text-ink-muted">
          Enterprise Cryptographic Discovery &amp; Analysis Tool — evidence-backed inventory, quantum risk,
          and CycloneDX CBOM export.
        </p>
        <div className="flex flex-wrap gap-6 text-xs">
          <Link href="/login" className="text-ink-muted transition-colors hover:text-primary">
            Operator sign-in
          </Link>
          <Link href="/signup" className="text-ink-muted transition-colors hover:text-primary">
            Create account
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
