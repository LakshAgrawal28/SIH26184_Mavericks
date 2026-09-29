"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { LandingScrollProgress } from "@/components/landing/LandingScrollProgress";
import { MarketingCursorGlow } from "@/components/marketing/MarketingCursorGlow";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/#blind-spot", n: "02", label: "Blind spot" },
  { href: "/#discover", n: "03", label: "Discover" },
  { href: "/#cbom", n: "04", label: "CBOM" },
  { href: "/#risk", n: "05", label: "Risk" },
  { href: "/#graph", n: "06", label: "Graph" },
  { href: "/#pqc", n: "07", label: "PQC" },
];

export function SiteHeader({ className }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getToken()));
  }, []);

  return (
    <header className={cn("ecdat-glass-header sticky top-0 z-50 border-b border-border", className)}>
      <div className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between gap-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-4 whitespace-nowrap transition-opacity duration-200 hover:opacity-85"
        >
          <span className="font-mono text-[12px] font-medium tracking-[0.2em] text-foreground">
            NTRO <span className="text-ink-muted">/</span> <span className="text-primary">ECDAT</span>
          </span>
          <span className="hidden items-center gap-2 border-l border-border pl-4 font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase lg:flex">
            <span className="intel-status-dot" aria-hidden />
            System status · Operational
          </span>
        </Link>
        <nav className="hidden items-center gap-5 whitespace-nowrap xl:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="text-[12px] font-medium tracking-tight text-ink-muted transition-colors hover:text-foreground"
            >
              <span className="text-primary/70">{s.n}</span> {s.label}
            </a>
          ))}
          <Link
            href="/trust"
            className="font-mono text-[11px] tracking-[0.08em] text-ink-muted uppercase transition-colors hover:text-primary"
          >
            Trust &amp; accuracy
          </Link>
          {signedIn ? (
            <Link href="/dashboard" className="font-mono text-[11px] tracking-[0.08em] text-primary uppercase">
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="font-mono text-[11px] tracking-[0.08em] text-ink-muted uppercase transition-colors hover:text-primary"
            >
              Sign in
            </Link>
          )}
        </nav>
        <Button asChild size="sm" className="shrink-0">
          <Link href={signedIn ? "/dashboard" : "/login"}>{signedIn ? "Open dashboard" : "Open console"}</Link>
        </Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md font-mono text-[11px] leading-relaxed tracking-[0.04em] text-ink-muted">
          <span className="text-foreground">Team Mavericks</span> · SIH 2026 PS 26164 · ECDAT — Enterprise
          Cryptographic Discovery &amp; Analysis Tool
        </p>
        <div className="flex flex-wrap gap-6 font-mono text-[11px] tracking-[0.08em] uppercase">
          <Link href="/trust" className="text-ink-muted transition-colors hover:text-primary">
            Trust &amp; accuracy
          </Link>
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

export function MarketingLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("theme-intel ecdat-marketing-root flex min-h-screen flex-col", className)}>
      <MarketingCursorGlow />
      <LandingScrollProgress />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
