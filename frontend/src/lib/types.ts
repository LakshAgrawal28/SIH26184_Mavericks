export type RiskBand = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type Scan = {
  scan_id: string;
  name: string;
  status: string;
  target_type?: string;
  total_artefacts: number;
  total_files?: number;
  critical_risk_count: number;
  high_risk_count: number;
  progress_percentage?: number;
  current_stage?: string;
  error_message?: string;
  data_lifetime_x?: number;
  migration_time_y?: number;
  created_at?: string;
  completed_at?: string;
};

export type ScanSummary = {
  scan_id: string;
  name: string;
  status: string;
  total_artefacts: number;
  risk_distribution: Partial<Record<RiskBand, number>>;
  critical_risk_count: number;
  high_risk_count: number;
};

export type ArtefactRisk = {
  hndl_risk: number;
  operational_risk: number;
  final_score: number;
  risk_band: RiskBand;
};

export type Artefact = {
  artefact_id: string;
  name: string;
  asset_type: string;
  algorithm?: string;
  confidence?: number;
  file_path: string;
  line_number?: number;
  evidence_snippet?: string;
  risk: ArtefactRisk;
  recommendation?: {
    action?: string;
    primary_pqc?: string;
    hybrid_pair?: string;
    rationale?: string;
    effort?: string;
    nist_standard?: string;
    timeline_urgency?: string;
  };
};

export type MoscaScenario = {
  name: string;
  z_value: number;
  margin: number;
  category: string;
};

export type MoscaResult = {
  scan_id?: string;
  parameters: {
    data_lifetime_x: number;
    migration_time_y: number;
    total_time_needed?: number;
  };
  overall_category: string;
  scenarios: MoscaScenario[];
};

export type Recommendation = {
  artefact_id: string;
  name: string;
  action: string;
  primary_pqc?: string;
  hybrid_pair?: string;
  effort: string;
  rationale?: string;
  nist_standard?: string;
  timeline_urgency?: string;
};
