"use client";

const ITEMS = [
  "NIST SP 800-208",
  "NIST PQC · ML-KEM",
  "CycloneDX 1.6 CBOM",
  "ECMA-424",
  "Mosca inequality · X+Y>Z",
  "Harvest-now decrypt-later",
  "Artefact inventory",
  "Quantum risk scoring",
  "Hybrid migration paths",
  "Evidence-backed findings",
];

/** Standards & PS deliverables strip — discover → CBOM → PQC narrative. */
export function StandardsMarquee() {
  const row = ITEMS.map((t) => (
    <span key={t} className="ecdat-marquee-item">
      {t}
    </span>
  ));

  return (
    <div className="relative overflow-hidden border-y border-border bg-surface/90 py-3" aria-hidden>
      <div className="ecdat-marquee-track">
        <div className="ecdat-marquee-group">{row}</div>
        <div className="ecdat-marquee-group" aria-hidden>{row}</div>
      </div>
    </div>
  );
}
