import { cn } from "@/lib/utils";
import type { RiskBand } from "@/lib/types";
import { riskBandBorder, riskBandText } from "@/lib/risk-colors";

export default function RiskBadge({
  band,
  score,
}: {
  band: RiskBand | string;
  score?: number;
}) {
  const b = band as RiskBand;
  const text = riskBandText[b] ?? "text-ink-muted";
  const border = riskBandBorder[b] ?? "border-border";
  return (
    <span
      className={cn(
        "inline-flex rounded-md border bg-card px-2 py-0.5 font-mono text-xs font-medium",
        text,
        border
      )}
    >
      {band}
      {score !== undefined ? ` (${score})` : ""}
    </span>
  );
}
