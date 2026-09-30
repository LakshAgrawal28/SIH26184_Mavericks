"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageMotion } from "@/components/premium/PageMotion";
import { mainNav } from "@/lib/navigation";
import { getToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { IconLogoMark } from "@/components/icons/NavIcons";

function ConsoleAuthPlaceholder() {
  return (
    <div className="console-canvas flex min-h-screen">
      <aside
        className="hidden w-[248px] shrink-0 border-r border-border bg-card/95 md:block"
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col p-6 md:p-8">
        <div className="h-7 w-40 max-w-full animate-pulse rounded-md bg-surface" />
        <div className="mt-6 h-48 w-full animate-pulse rounded-lg bg-surface" />
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setSessionReady(true);
  }, [router]);

  if (!sessionReady) {
    return <ConsoleAuthPlaceholder />;
  }

  return (
    <div className="console-canvas flex min-h-screen">
      <aside
        className="hidden w-[248px] shrink-0 flex-col border-r border-border bg-card/95 backdrop-blur-xl md:flex"
        aria-label="Primary"
      >
        <div className="border-b border-border/80 px-4 py-5">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 rounded-lg transition-opacity duration-200 hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-primary">
              <IconLogoMark className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">ECDAT</p>
              <p className="text-[11px] text-ink-muted">Discovery console</p>
            </div>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 pb-6">
          {mainNav.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "bg-accent-soft text-primary shadow-sm"
                    : "text-ink-muted hover:bg-surface hover:text-foreground"
                )}
              >
                <Icon className="shrink-0 opacity-90" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/80 px-5 py-4">
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Deterministic scans · CBOM export · Mosca timeline
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border/80 bg-card/70 px-4 backdrop-blur-md md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2.5 text-foreground">
            <IconLogoMark className="h-7 w-7 text-primary" />
            <span className="text-sm font-semibold tracking-tight">ECDAT</span>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-5 pb-20 md:px-8 md:py-6 md:pb-8">
          <PageMotion>{children}</PageMotion>
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
          aria-label="Main navigation"
        >
          <div className="flex px-1 pt-1">
            {mainNav.map((item) => {
              const active = item.match ? item.match(pathname) : pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-ink-muted"
                  )}
                >
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
