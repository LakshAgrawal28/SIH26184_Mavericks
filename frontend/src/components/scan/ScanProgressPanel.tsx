"use client";

import { formatScanStage } from "@/lib/scanProgress";
import { cn } from "@/lib/utils";

type ScanProgressPanelProps = {
  progress: number;
  stage?: string | null;
  status?: string;
  title?: string;
  description?: string;
  className?: string;
  variant?: "default" | "error";
};

export default function ScanProgressPanel({
  progress,
  stage,
  status,
  title = "Discovery in progress",
  description,
  className,
  variant = "default",
}: ScanProgressPanelProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const indeterminate =
    variant !== "error" && (status === "queued" || (clamped === 0 && status === "running"));
  const stageLabel = formatScanStage(stage, status);

  return (
    <div
      className={cn(
        "console-scan-progress",
        variant === "error" && "border-[#B3261E]/40 bg-red-50/30",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="console-section-title">{variant === "error" ? "Scan failed" : title}</p>
        {!indeterminate && (
          <span className="font-mono text-sm tabular-nums text-primary">{clamped}%</span>
        )}
      </div>
      <p className={cn("console-section-desc", variant === "error" && "text-[#B3261E]")}>
        {description ?? stageLabel}
      </p>
      <div
        className={cn("metric-bar mt-3", indeterminate && "metric-bar-indeterminate")}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-busy={indeterminate}
      >
        <div
          className="metric-bar-fill"
          style={indeterminate ? undefined : { width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
