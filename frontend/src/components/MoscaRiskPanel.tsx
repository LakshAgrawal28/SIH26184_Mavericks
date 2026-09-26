"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const Z_BASELINE = 10;

type MoscaRiskPanelProps = {
  dataLifetimeX: number;
  migrationTimeY: number;
  zValue?: number;
  sticky?: boolean;
};

export default function MoscaRiskPanel({
  dataLifetimeX,
  migrationTimeY,
  zValue = Z_BASELINE,
  sticky = true,
}: MoscaRiskPanelProps) {
  const needed = dataLifetimeX + migrationTimeY;
  const margin = zValue - needed;
  const atRisk = needed > zValue;
  const warning = !atRisk && margin < 2;

  const verdict = atRisk ? "At risk" : warning ? "Warning" : "Safe";
  const verdictBorder = atRisk
    ? "border-[#B3261E] text-[#B3261E]"
    : warning
      ? "border-[#B8781F] text-[#B8781F]"
      : "border-[#1B7A3D] text-[#1B7A3D]";

  const targetBarPct = Math.min(100, (needed / Math.max(zValue, needed, 1)) * 100);
  const zPct = Math.min(100, (zValue / Math.max(zValue, needed, 1)) * 100);
  const barColor = atRisk ? "bg-[#B3261E]" : warning ? "bg-[#B8781F]" : "bg-[#1B7A3D]";

  const [drawPct, setDrawPct] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDrawPct(targetBarPct * t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [targetBarPct, dataLifetimeX, migrationTimeY, zValue]);

  const axisMax = Math.max(zValue, needed);

  return (
    <div className={cn("panel p-6", sticky && "lg:sticky lg:top-6")}>
      <h3 className="text-sm font-semibold text-foreground">Mosca risk preview</h3>
      <p className="mt-1 font-mono text-xs text-ink-muted">
        Baseline scenario · Z = {zValue} years
      </p>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between font-mono text-xs">
          <span className="text-ink-muted">X + Y needed</span>
          <span className="font-medium tabular-nums text-foreground">{needed} yrs</span>
        </div>
        <div className="relative pt-4">
          <div className="flex justify-between font-mono text-[10px] text-ink-muted">
            <span>0</span>
            <span>{axisMax}y</span>
          </div>
          <div className="relative mt-1 h-px bg-border">
            <div
              className={cn("absolute left-0 top-0 h-px transition-none", barColor)}
              style={{ width: `${drawPct}%` }}
            />
            <div
              className="absolute top-[-6px] h-3 w-px bg-[#1B4B8C]"
              style={{ left: `${zPct}%` }}
              title={`Z = ${zValue}y`}
            />
            <span
              className="absolute top-3 -translate-x-1/2 font-mono text-[10px] text-[#1B4B8C]"
              style={{ left: `${zPct}%` }}
            >
              Z
            </span>
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-muted">
            <span>timeline</span>
            <span>Z marker</span>
          </div>
        </div>
      </div>

      <div className={cn("mt-6 border bg-background px-4 py-3", verdictBorder)}>
        <p className="text-sm font-semibold">{verdict}</p>
        <p className="mt-0.5 text-xs opacity-90">
          {atRisk
            ? `Margin expired by ${Math.abs(margin)} years`
            : `${margin} years of safety margin`}
        </p>
      </div>

      <div className="mt-4 border border-border bg-surface px-3 py-2.5">
        <code className="block text-center font-mono text-xs text-foreground">
          X + Y {atRisk ? ">" : "≤"} Z → {atRisk ? "At risk" : "Within margin"}
        </code>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
        <div className="border border-border bg-background px-3 py-2">
          <dt className="text-ink-muted">Data lifetime (X)</dt>
          <dd className="mt-0.5 font-medium text-foreground">{dataLifetimeX}y</dd>
        </div>
        <div className="border border-border bg-background px-3 py-2">
          <dt className="text-ink-muted">Migration (Y)</dt>
          <dd className="mt-0.5 font-medium text-foreground">{migrationTimeY}y</dd>
        </div>
      </dl>
    </div>
  );
}
