"use client";

import type { ReactNode } from "react";
import type { AgilityMetrics } from "@/lib/scanInsights";
import type { Recommendation } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  moscaCategory: string;
  agility: AgilityMetrics | null;
  shorCount: number;
  criticalCount: number;
  highCount: number;
  waveOne: Recommendation[];
  dataLifetimeX?: number;
  migrationTimeY?: number;
};

function urgencyStyle(category: string) {
  if (category === "EXPIRED" || category === "URGENT") return "border-destructive/40 bg-destructive/5 text-destructive";
  if (category === "PLAN") return "border-[#a66b12]/40 bg-[#a66b12]/8 text-[#a66b12]";
  return "border-[#1B7A3D]/35 bg-[#1B7A3D]/8 text-[#1B7A3D]";
}

function MetricCell({
  label,
  value,
  sub,
  barPct,
  barTone = "primary",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  barPct?: number;
  barTone?: "primary" | "risk";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/80 px-3.5 py-3">
      <dt className="text-[11px] font-medium text-ink-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</dd>
      {barPct !== undefined && (
        <div className="metric-bar mt-2.5" aria-hidden>
          <div
            className={cn("metric-bar-fill", barTone === "risk" && "bg-destructive")}
            style={{ width: `${Math.min(100, barPct)}%` }}
          />
        </div>
      )}
      {sub && <p className="stat-hint mt-1.5">{sub}</p>}
    </div>
  );
}

export default function ExecutiveSummaryStrip({
  moscaCategory,
  agility,
  shorCount,
  criticalCount,
  highCount,
  waveOne,
  dataLifetimeX,
  migrationTimeY,
}: Props) {
  return (
    <section className="panel border-l-4 border-l-primary p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Executive summary</p>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-muted">
            Posture at a glance for leadership — deterministic engines only; optional AI narration does not change
            scores or exports.
          </p>
        </div>
        <span
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
            urgencyStyle(moscaCategory)
          )}
        >
          Mosca · {moscaCategory}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCell
          label="Crypto agility index"
          value={
            agility ? (
              <>
                {agility.index}
                <span className="text-sm font-normal text-ink-muted"> / 100</span>
              </>
            ) : (
              "—"
            )
          }
          sub="Higher = less quantum + classical hygiene exposure"
          barPct={agility?.index}
        />
        <MetricCell
          label="Shor-exposed artefacts"
          value={shorCount}
          sub="Public-key harvest-now-decrypt-later set"
          barPct={agility?.shorExposurePct}
          barTone="risk"
        />
        <MetricCell
          label="Critical + high"
          value={
            <>
              {criticalCount}
              <span className="text-ink-muted"> + </span>
              {highCount}
            </>
          }
          sub="Risk band counts from deterministic scoring"
        />
        <MetricCell
          label="Mosca X + Y"
          value={
            <span className="text-lg">
              {dataLifetimeX ?? "—"}y + {migrationTimeY ?? "—"}y
            </span>
          }
          sub="Data lifetime (X) + migration horizon (Y)"
        />
        <MetricCell
          label="PQC-safe share"
          value={agility ? `${agility.pqcSafePct}%` : "—"}
          sub="Artefacts with no quantum break class"
          barPct={agility?.pqcSafePct}
        />
      </dl>

      {waveOne.length > 0 && (
        <div className="mt-5 border-t border-border/80 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Migration wave 1 (highest urgency)
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {waveOne.map((r) => (
              <li
                key={r.artefact_id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-2 last:border-0"
              >
                <span className="font-medium text-foreground">{r.name}</span>
                <span className="text-ink-muted">
                  {r.primary_pqc || r.action}
                  {r.hybrid_pair ? ` · hybrid ${r.hybrid_pair}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
