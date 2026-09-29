import type { Artefact, Recommendation, ScanSummary } from "@/lib/types";

export type AgilityMetrics = {
  index: number;
  shorExposurePct: number;
  classicalHygienePct: number;
  pqcSafePct: number;
};

export function computeAgilityMetrics(summary: ScanSummary | null): AgilityMetrics | null {
  if (!summary || summary.total_artefacts <= 0) return null;
  const total = summary.total_artefacts;
  const shor = summary.shor_vulnerable_count ?? summary.quantum_classes?.shor ?? 0;
  const broken =
    summary.classical_hygiene_count ?? summary.quantum_classes?.broken_classical ?? 0;
  const safe = summary.quantum_classes?.none ?? 0;
  const exposed = shor + broken;
  return {
    index: Math.round(Math.max(0, Math.min(100, (1 - exposed / total) * 100))),
    shorExposurePct: Math.round((shor / total) * 1000) / 10,
    classicalHygienePct: Math.round((broken / total) * 1000) / 10,
    pqcSafePct: Math.round((safe / total) * 1000) / 10,
  };
}

export function migrationWaveOne(recs: Recommendation[], limit = 5): Recommendation[] {
  const priority = (r: Recommendation) => {
    const urgency = (r.timeline_urgency || "").toLowerCase();
    if (urgency.includes("immediate") || urgency.includes("critical")) return 0;
    if (urgency.includes("high") || urgency.includes("urgent")) return 1;
    const action = (r.action || "").toLowerCase();
    if (action.includes("migrate") || action.includes("replace")) return 2;
    return 3;
  };
  return [...recs]
    .filter((r) => {
      const qb = (r.quantum_break || "").toLowerCase();
      return qb === "shor" || qb === "broken_classical";
    })
    .sort((a, b) => priority(a) - priority(b))
    .slice(0, limit);
}

export function topRiskArtefacts(artefacts: Artefact[], limit = 3): Artefact[] {
  return [...artefacts]
    .sort((a, b) => (b.risk.final_score ?? 0) - (a.risk.final_score ?? 0))
    .slice(0, limit);
}
