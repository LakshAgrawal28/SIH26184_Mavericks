import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  dot?: "critical" | "high" | "default";
};

export default function StatCard({ label, value, dot = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {dot !== "default" && (
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              dot === "critical" && "bg-red-500",
              dot === "high" && "bg-orange-500"
            )}
          />
        )}
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      </div>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900",
          dot === "critical" && "text-red-600",
          dot === "high" && "text-orange-600"
        )}
      >
        {value}
      </p>
    </div>
  );
}
