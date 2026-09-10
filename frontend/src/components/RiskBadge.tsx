import { cn } from "@/lib/utils";
import type { RiskBand } from "@/lib/types";

const bandStyles: Record<RiskBand, string> = {
  CRITICAL: "bg-red-50 text-red-700",
  HIGH: "bg-orange-50 text-orange-700",
  MEDIUM: "bg-amber-50 text-amber-800",
  LOW: "bg-emerald-50 text-emerald-700",
};

export default function RiskBadge({
  band,
  score,
}: {
  band: RiskBand | string;
  score?: number;
}) {
  const style = bandStyles[band as RiskBand] ?? "bg-zinc-100 text-zinc-600";
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", style)}>
      {band}
      {score !== undefined ? ` (${score})` : ""}
    </span>
  );
}
