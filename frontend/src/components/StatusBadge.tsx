import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  running: "bg-indigo-50 text-indigo-700",
  processing: "bg-indigo-50 text-indigo-700",
  pending: "bg-zinc-100 text-zinc-600",
  queued: "bg-zinc-100 text-zinc-600",
  failed: "bg-red-50 text-red-700",
};

export function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "completed";
  if (s === "running" || s === "processing") return "running";
  if (s === "failed") return "failed";
  return "pending";
}

export default function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        styles[tone]
      )}
    >
      {status}
    </span>
  );
}
