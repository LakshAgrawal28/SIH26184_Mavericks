"use client";

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
  if (category === "EXPIRED" || category === "URGENT") return "border-[#B3261E] text-[#B3261E]";
  if (category === "PLAN") return "border-[#B8781F] text-[#B8781F]";
  return "border-[#1B7A3D] text-[#1B7A3D]";
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
    <section className="panel border-l-4 border-l-[#1B4B8C] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Executive summary
          </p>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-muted">
            Posture at a glance for leadership — deterministic engines only; optional AI narration
            does not change scores or exports.
          </p>
        </div>
        <span
          className={cn(
            "border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
            urgencyStyle(moscaCategory)
          )}
        >
          Mosca · {moscaCategory}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="border border-border bg-surface px-3 py-2">
          <dt className="text-xs text-ink-muted">Crypto agility index</dt>
          <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
            {agility ? `${agility.index}` : "—"}
            <span className="text-sm font-normal text-ink-muted"> / 100</span>
          </dd>
        </div>
        <div className="border border-border bg-surface px-3 py-2">
          <dt className="text-xs text-ink-muted">Shor-exposed artefacts</dt>
          <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-[#B3261E]">
            {shorCount}
          </dd>
        </div>
        <div className="border border-border bg-surface px-3 py-2">
          <dt className="text-xs text-ink-muted">Critical + high</dt>
          <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
            {criticalCount}
            <span className="text-ink-muted"> + </span>
            {highCount}
          </dd>
        </div>
        <div className="border border-border bg-surface px-3 py-2">
          <dt className="text-xs text-ink-muted">Mosca X + Y</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {dataLifetimeX ?? "—"}y + {migrationTimeY ?? "—"}y
          </dd>
        </div>
        <div className="border border-border bg-surface px-3 py-2">
          <dt className="text-xs text-ink-muted">Shor share of inventory</dt>
          <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
            {agility ? `${agility.shorExposurePct}%` : "—"}
          </dd>
        </div>
      </dl>

      {waveOne.length > 0 && (
        <div className="mt-5">
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
