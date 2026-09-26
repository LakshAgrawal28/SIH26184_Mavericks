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
    <div className="panel-interactive px-5 py-4">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground",
          dot === "critical" && "text-[#B3261E]",
          dot === "high" && "text-[#B8781F]"
        )}
      >
        {numeric ? <AnimatedCount value={value} /> : value}
      </p>
    </div>
  );
}
