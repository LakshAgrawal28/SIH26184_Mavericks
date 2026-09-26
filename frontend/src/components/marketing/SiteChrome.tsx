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
        "sticky top-0 z-50 border-b border-border bg-background",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80">
          <IconLogoMark className="text-primary" />
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground">ECDAT</p>
            <p className="text-[11px] leading-tight text-ink-muted">Crypto discovery</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="/#workflow" className="text-ink-muted transition-colors duration-200 hover:text-foreground">
            Workflow
          </a>
          <a href="/#capabilities" className="text-ink-muted transition-colors duration-200 hover:text-foreground">
            Capabilities
          </a>
          <Link href="/login" className="text-ink-muted transition-colors duration-200 hover:text-primary">
            Sign in
          </Link>
        </nav>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/login">Open console</Link>
        </Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">
          Enterprise Cryptographic Discovery &amp; Analysis Tool · CycloneDX CBOM · Mosca timeline
        </p>
        <div className="flex flex-wrap gap-6 text-xs">
          <Link href="/login" className="text-ink-muted transition-colors duration-200 hover:text-primary">
            Operator sign-in
          </Link>
          <Link href="/dashboard" className="text-ink-muted transition-colors duration-200 hover:text-primary">
            Dashboard
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
    <div className={cn("flex min-h-screen flex-col bg-background", className)}>
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
