import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  completed: "border-[#1B7A3D] text-[#1B7A3D]",
  running: "border-[#1B4B8C] text-[#1B4B8C]",
  processing: "border-[#1B4B8C] text-[#1B4B8C]",
  pending: "border-border text-ink-muted",
  queued: "border-border text-ink-muted",
  failed: "border-[#B3261E] text-[#B3261E]",
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
        "inline-flex border bg-background px-2 py-0.5 text-xs font-medium capitalize",
        styles[tone]
      )}
    >
      {status}
    </span>
  );
}
