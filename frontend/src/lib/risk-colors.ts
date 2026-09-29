import type { RiskBand } from "@/lib/types";

export const riskBandText: Record<RiskBand, string> = {
  CRITICAL: "text-destructive",
  HIGH: "text-[#a66b12]",
  MEDIUM: "text-[#8a6d1f]",
  LOW: "text-[#1a6b42]",
};

export const riskBandBorder: Record<RiskBand, string> = {
  CRITICAL: "border-destructive/35",
  HIGH: "border-[#a66b12]/35",
  MEDIUM: "border-[#8a6d1f]/35",
  LOW: "border-[#1a6b42]/35",
};

export const riskBandFill: Record<RiskBand, string> = {
  CRITICAL: "bg-destructive",
  HIGH: "bg-[#a66b12]",
  MEDIUM: "bg-[#8a6d1f]",
  LOW: "bg-[#1a6b42]",
};
