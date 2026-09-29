import AnimatedCount from "@/components/AnimatedCount";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  /** 0–100 for optional progress bar under the value */
  progress?: number;
  dot?: "critical" | "high" | "default";
};

export default function StatCard({ label, value, hint, progress, dot = "default" }: StatCardProps) {
  const numeric = typeof value === "number";
  const showBar = progress !== undefined && progress >= 0;

  return (
    <div className="panel-interactive px-4 py-3.5">
      <p className="text-[11px] font-medium tracking-wide text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-xl font-semibold tabular-nums leading-none tracking-tight text-foreground sm:text-2xl",
          dot === "critical" && "text-destructive",
          dot === "high" && "text-[#a66b12]"
        )}
      >
        {numeric ? <AnimatedCount value={value} /> : value}
      </p>
      {showBar && (
        <div className="metric-bar mt-2.5" aria-hidden>
          <div className="metric-bar-fill" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
      {hint && <p className="stat-hint mt-2">{hint}</p>}
    </div>
  );
}
