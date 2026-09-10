import { cn } from "@/lib/utils";

const Z_BASELINE = 10;

type MoscaRiskPanelProps = {
  dataLifetimeX: number;
  migrationTimeY: number;
  zValue?: number;
  sticky?: boolean;
};

export default function MoscaRiskPanel({
  dataLifetimeX,
  migrationTimeY,
  zValue = Z_BASELINE,
  sticky = true,
}: MoscaRiskPanelProps) {
  const needed = dataLifetimeX + migrationTimeY;
  const margin = zValue - needed;
  const atRisk = needed > zValue;
  const warning = !atRisk && margin < 2;

  const verdict = atRisk ? "At risk" : warning ? "Warning" : "Safe";
  const verdictStyle = atRisk
    ? "border-red-200 bg-red-50 text-red-800"
    : warning
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  const barPct = Math.min(100, (needed / Math.max(zValue, needed, 1)) * 100);
  const zPct = Math.min(100, (zValue / Math.max(zValue, needed, 1)) * 100);

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-6 shadow-sm",
        sticky && "lg:sticky lg:top-6"
      )}
    >
      <h3 className="text-sm font-semibold text-zinc-900">Mosca risk preview</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Baseline scenario · Z = {zValue} years
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">X + Y needed</span>
          <span className="font-medium tabular-nums text-zinc-900">{needed} yrs</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-150",
              atRisk ? "bg-red-500" : warning ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ width: `${barPct}%` }}
          />
          <div
            className="absolute top-0 h-full w-0.5 bg-indigo-600"
            style={{ left: `${zPct}%` }}
            title={`Z = ${zValue}y`}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>0</span>
          <span>Z marker</span>
          <span>{Math.max(zValue, needed)}y</span>
        </div>
      </div>

      <div className={cn("mt-6 rounded-lg border px-4 py-3 text-center", verdictStyle)}>
        <p className="text-sm font-semibold">{verdict}</p>
        <p className="mt-0.5 text-xs opacity-80">
          {atRisk
            ? `Margin expired by ${Math.abs(margin)} years`
            : `${margin} years of safety margin`}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
        <code className="block text-center text-xs text-zinc-700">
          X + Y {atRisk ? ">" : "≤"} Z → {atRisk ? "At Risk" : "Within margin"}
        </code>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          <dt className="text-zinc-500">Data lifetime (X)</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{dataLifetimeX}y</dd>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          <dt className="text-zinc-500">Migration (Y)</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{migrationTimeY}y</dd>
        </div>
      </dl>
    </div>
  );
}
