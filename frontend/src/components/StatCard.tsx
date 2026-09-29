import AnimatedCount from "@/components/AnimatedCount";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  dot?: "critical" | "high" | "default";
};

export default function StatCard({ label, value, dot = "default" }: StatCardProps) {
  const numeric = typeof value === "number";

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
    </div>
  );
}
