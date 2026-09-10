import type { RiskBand } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { cn } from "@/lib/utils";

const BANDS: RiskBand[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const fillStyles: Record<RiskBand, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-emerald-500",
};

type Props = {
  distribution: Partial<Record<RiskBand, number>>;
  total: number;
};

export default function RiskDistribution({ distribution, total }: Props) {
  const max = Math.max(...BANDS.map((b) => distribution[b] ?? 0), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-900">Risk distribution</h3>
      <div className="mt-4 space-y-3">
        {BANDS.map((band) => {
          const count = distribution[band] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const width = max > 0 ? (count / max) * 100 : 0;
          return (
            <div key={band} className="grid grid-cols-[88px_1fr_72px] items-center gap-3">
              <RiskBadge band={band} />
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={cn("h-full rounded-full transition-all duration-150", fillStyles[band])}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="text-right text-sm tabular-nums text-zinc-600">
                {count}{" "}
                <span className="text-zinc-400">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
