"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { mainNav } from "@/lib/navigation";
import { getToken } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1160px] items-center px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
              E
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-zinc-900">ECDAT</p>
              <p className="mt-0.5 text-[11px] leading-none text-zinc-500">Crypto discovery</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-sm"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-[1160px]">
          {mainNav.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150 sm:py-3 sm:text-xs",
                  active ? "text-indigo-600" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {active && (
                  <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-indigo-600 sm:inset-x-6" />
                )}
                <Icon className={cn("h-5 w-5 sm:h-[22px] sm:w-[22px]", active && "stroke-[2.25]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
