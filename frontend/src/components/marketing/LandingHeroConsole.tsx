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

const INVENTORY = [
  { path: "src/tls/nginx.conf", algo: "RSA-2048", band: "Critical" },
  { path: "certs/wildcard.pem", algo: "ECDSA P-256", band: "High" },
  { path: "lib/crypto/hybrid.py", algo: "AES-256-GCM", band: "Low" },
];

const PQC_ROWS = [
  { from: "TLS 1.2 RS256", to: "ML-DSA-65 + ML-KEM-768" },
  { from: "JWT signing", to: "ML-DSA-44 hybrid" },
  { from: "Data at rest", to: "AES-256-GCM (retain)" },
];

const TABS = ["Overview", "Inventory", "Mosca", "PQC"] as const;

export default function LandingHeroConsole() {
  const [activeTab, setActiveTab] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setActiveTab((t) => (t + 1) % TABS.length), 4200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div
      className="panel-elevated overflow-hidden shadow-[0_24px_80px_-24px_rgba(13,59,102,0.18)]"
      role="region"
      aria-label="Product console preview"
    >
      <div className="flex items-center gap-2 border-b border-border/80 bg-[#f6f5f3] px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-border" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-border" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-border" aria-hidden />
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

      <div className="flex gap-1 border-b border-border/80 bg-surface/40 px-3 pt-2" role="tablist" aria-label="Scan views">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === i}
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

      <div className="min-h-[188px] bg-card px-5 py-4" role="tabpanel">
        {activeTab === 0 && (
          <div className="space-y-3 motion-enter">
            {RISK.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-muted">{row.label}</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">{row.value}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                  <div className={cn("h-full rounded-full", row.tone)} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 1 && (
          <ul className="space-y-2 motion-enter">
            {INVENTORY.map((row) => (
              <li
                key={row.path}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-surface/40 px-3 py-2 text-[11px]"
              >
                <span className="truncate font-mono text-foreground">{row.path}</span>
                <span className="shrink-0 text-ink-muted">{row.algo}</span>
                <span className="shrink-0 font-medium text-primary">{row.band}</span>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 2 && (
          <div className="motion-enter space-y-4">
            <p className="text-[11px] text-ink-muted">Mosca inequality · years of safety</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { k: "X", v: "8", sub: "migration" },
                { k: "Y", v: "12", sub: "shelf life" },
                { k: "Z", v: "6", sub: "Q-day est." },
              ].map((m) => (
                <div key={m.k} className="rounded-lg border border-border/70 bg-surface/50 px-2 py-3">
                  <p className="font-mono text-xs font-semibold text-primary">{m.k}</p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">{m.v}</p>
                  <p className="mt-0.5 text-[10px] text-ink-muted">{m.sub}</p>
                </div>
              ))}
            </div>
            <p className="rounded-md border border-primary/20 bg-accent-soft px-3 py-2 text-[11px] leading-relaxed text-foreground">
              X + Y &lt; Z → <span className="font-semibold text-primary">Act now</span> — migrate before data expiry.
            </p>
          </div>
        )}

        {activeTab === 3 && (
          <ul className="space-y-2 motion-enter">
            {PQC_ROWS.map((row) => (
              <li key={row.from} className="rounded-md border border-border/60 px-3 py-2.5 text-[11px]">
                <p className="font-medium text-foreground">{row.from}</p>
                <p className="mt-1 font-mono text-primary">→ {row.to}</p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 border-t border-border/60 pt-3 font-mono text-[10px] leading-relaxed text-ink-muted">
          Evidence: src/tls/nginx.conf:14 · RS256 · hybrid → ML-DSA-65
        </p>
      </div>
    </div>
  );
}
