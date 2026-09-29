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
    <div className="panel-interactive px-6 py-5">
      <p className="text-xs font-medium tracking-wide text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-3 text-[2rem] font-semibold tabular-nums leading-none tracking-tight text-foreground",
          dot === "critical" && "text-destructive",
          dot === "high" && "text-[#a66b12]"
        )}
      >
        {numeric ? <AnimatedCount value={value} /> : value}
      </p>
    </div>
  );
}
