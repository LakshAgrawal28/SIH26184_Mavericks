import type { RiskBand } from "@/lib/types";

const BANDS: RiskBand[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

type Props = {
  distribution: Partial<Record<RiskBand, number>>;
  total: number;
};

export default function RiskDistribution({ distribution, total }: Props) {
  const max = Math.max(...BANDS.map((b) => distribution[b] ?? 0), 1);

  return (
    <div className="risk-distribution">
      <h3>Risk Distribution</h3>
      <div className="risk-bars">
        {BANDS.map((band) => {
          const count = distribution[band] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const width = max > 0 ? (count / max) * 100 : 0;
          return (
            <div key={band} className="risk-row">
              <span className={`badge ${band}`}>{band}</span>
              <div className="risk-bar-track">
                <div className={`risk-bar-fill ${band}`} style={{ width: `${width}%` }} />
              </div>
              <span className="risk-count">
                {count} <span className="risk-pct">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
