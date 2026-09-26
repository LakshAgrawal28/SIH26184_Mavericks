"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { mainNav } from "@/lib/navigation";
import { getToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { IconLogoMark } from "@/components/icons/NavIcons";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen bg-surface">
      <aside
        className="hidden w-[232px] shrink-0 flex-col border-r border-border bg-background md:flex"
        aria-label="Primary"
      >
        <div className="border-b border-border px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-3 text-foreground transition-opacity duration-200 hover:opacity-90">
            <IconLogoMark className="text-primary" />
            <div>
              <p className="text-sm font-semibold leading-tight">ECDAT</p>
              <p className="text-[11px] leading-tight text-ink-muted">Crypto discovery</p>
            </div>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0 px-2 py-3">
          {mainNav.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                  active
                    ? "border-primary bg-accent-soft text-primary"
                    : "border-transparent text-ink-muted hover:border-border hover:bg-surface hover:text-foreground"
                )}
              >
                <Icon className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center border-b border-border bg-background px-4 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 text-foreground">
            <IconLogoMark className="h-7 w-7 text-[#1B4B8C]" />
            <span className="text-sm font-semibold">ECDAT</span>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1080px] flex-1 bg-background px-4 py-6 pb-20 md:px-8 md:pb-8 md:shadow-[inset_1px_0_0_var(--border)]">
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
          aria-label="Main navigation"
        >
          <div className="flex">
            {mainNav.map((item) => {
              const active = item.match ? item.match(pathname) : pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 border-t-2 py-2 text-[10px] font-medium",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-muted"
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
