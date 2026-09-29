"use client";

import { useEffect, useState } from "react";
import AnimatedCount from "@/components/AnimatedCount";
import { cn } from "@/lib/utils";

const RISK = [
  { label: "Critical", value: 23, pct: 72, tone: "bg-destructive" },
  { label: "High", value: 89, pct: 58, tone: "bg-[#a66b12]" },
  { label: "Shor-vulnerable", value: 159, pct: 85, tone: "bg-primary" },
  { label: "PQC roadmap", value: 412, pct: 44, tone: "bg-[#1a6b42]" },
];

export default function LandingHeroConsole() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActiveTab((t) => (t + 1) % 4), 3200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="panel-elevated overflow-hidden shadow-[0_24px_80px_-24px_rgba(13,59,102,0.18)]">
      <div className="flex items-center gap-2 border-b border-border/80 bg-[#f6f5f3] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e8a0a0]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e8c97a]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#8bc49a]" />
        <p className="ml-2 flex-1 truncate text-center font-mono text-[10px] text-ink-muted">
          ecdat-zeta.vercel.app/scans/demo-scan
        </p>
      </div>

      <div className="border-b border-border/80 bg-card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-primary uppercase">Live scan</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">demo-scan</h3>
            <p className="mt-1 font-mono text-[11px] text-ink-muted">mixed-enterprise.zip · completed</p>
          </div>
          <span className="rounded-md border border-[#1a6b42]/30 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-[#1a6b42]">
            CBOM valid
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { l: "Artefacts", v: 613 },
            { l: "Libraries", v: 48 },
            { l: "Certs", v: 12 },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-border/70 bg-surface/60 px-3 py-2.5">
              <p className="text-[10px] text-ink-muted">{s.l}</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-foreground">
                <AnimatedCount value={s.v} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border/80 bg-surface/40 px-3 pt-2">
        {["Overview", "Inventory", "Mosca", "PQC"].map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={cn(
              "rounded-t-md px-3 py-1.5 text-[11px] font-medium transition-colors",
              activeTab === i
                ? "bg-card text-foreground shadow-sm"
                : "text-ink-muted hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3 bg-card px-5 py-4">
        {RISK.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "transition-opacity duration-500",
              activeTab === 0 || activeTab === 1 ? "opacity-100" : "opacity-40"
            )}
            style={{ transitionDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-ink-muted">{row.label}</span>
              <span className="font-mono font-medium tabular-nums text-foreground">{row.value}</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
              <div
                className={cn("h-full rounded-full transition-[width] duration-700 ease-out", row.tone)}
                style={{ width: `${row.pct}%` }}
              />
            </div>
          </div>
        ))}
        <p className="border-t border-border/60 pt-3 font-mono text-[10px] leading-relaxed text-ink-muted">
          Evidence: src/tls/nginx.conf:14 · RS256 · hybrid → ML-DSA-65
        </p>
      </div>
    </div>
  );
}
