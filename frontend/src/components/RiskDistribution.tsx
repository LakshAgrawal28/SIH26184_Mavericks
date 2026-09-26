import type { RiskBand } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { cn } from "@/lib/utils";
import { riskBandFill } from "@/lib/risk-colors";

const BANDS: RiskBand[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

type Props = {
  distribution: Partial<Record<RiskBand, number>>;
  total: number;
};

export default function RiskDistribution({ distribution, total }: Props) {
  const max = Math.max(...BANDS.map((b) => distribution[b] ?? 0), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">Risk distribution</h3>
      <div className="mt-4 space-y-3">
        {BANDS.map((band) => {
          const count = distribution[band] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const width = max > 0 ? (count / max) * 100 : 0;
          return (
            <div key={band} className="grid grid-cols-[96px_1fr_72px] items-center gap-3">
              <RiskBadge band={band} />
              <div className="relative h-px bg-border">
                <div
                  className={cn("absolute left-0 top-0 h-px transition-[width] duration-500 ease-out", riskBandFill[band])}
                  style={{ width: `${width}%` }}
                />
                <div className="absolute -top-2 left-0 h-4 w-px bg-border opacity-60" />
                <div className="absolute -top-2 right-0 h-4 w-px bg-border opacity-60" />
              </div>
              <span className="text-right font-mono text-sm tabular-nums text-ink-muted">
                {count}{" "}
                <span className="text-border">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
