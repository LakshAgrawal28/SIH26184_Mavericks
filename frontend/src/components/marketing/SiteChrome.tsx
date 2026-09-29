"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { IconLogoMark } from "@/components/icons/NavIcons";
import { MarketingCursorGlow } from "@/components/marketing/MarketingCursorGlow";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/api";
import { cn } from "@/lib/utils";

export function SiteHeader({ className }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getToken()));
  }, []);

  return (
    <header
      className={cn(
        "ecdat-glass-header sticky top-0 z-50 border-b border-white/40",
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
          <a href="/#impact" className="text-ink-muted transition-colors hover:text-foreground">
            NTRO fit
          </a>
          <a href="/#workflow" className="text-ink-muted transition-colors hover:text-foreground">
            Pipeline
          </a>
          <a href="/#capabilities" className="text-ink-muted transition-colors hover:text-foreground">
            Proof
          </a>
          {signedIn ? (
            <Link href="/dashboard" className="font-medium text-primary transition-colors hover:text-primary/80">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="text-ink-muted transition-colors hover:text-primary">
              Sign in
            </Link>
          )}
        </nav>
        <Button asChild size="sm" className="shrink-0 shadow-sm">
          <Link href={signedIn ? "/dashboard" : "/login"}>
            {signedIn ? "Open dashboard" : "Open console"}
          </Link>
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
          <span className="font-medium text-foreground">Team Mavericks</span> · SIH 2026 PS 26164 · ECDAT —
          Enterprise Cryptographic Discovery &amp; Analysis Tool.
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
    <div className={cn("ecdat-marketing-root flex min-h-screen flex-col", className)}>
      <MarketingCursorGlow />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
