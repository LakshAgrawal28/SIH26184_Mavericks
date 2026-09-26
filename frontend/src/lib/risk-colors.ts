import type { RiskBand } from "@/lib/types";

/** Risk-band palette — semantic use only (never decorative chrome). */
export const riskBandText: Record<RiskBand, string> = {
  CRITICAL: "text-[#B3261E]",
  HIGH: "text-[#B8781F]",
  MEDIUM: "text-[#B8781F]",
  LOW: "text-[#1B7A3D]",
};

export const riskBandBorder: Record<RiskBand, string> = {
  CRITICAL: "border-[#B3261E]",
  HIGH: "border-[#B8781F]",
  MEDIUM: "border-[#B8781F]",
  LOW: "border-[#1B7A3D]",
};

export const riskBandFill: Record<RiskBand, string> = {
  CRITICAL: "bg-[#B3261E]",
  HIGH: "bg-[#B8781F]",
  MEDIUM: "bg-[#B8781F]",
  LOW: "bg-[#1B7A3D]",
};
