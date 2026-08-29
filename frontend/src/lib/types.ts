export type RiskBand = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type Scan = {
  scan_id: string;
  name: string;
  status: string;
  total_artefacts: number;
  total_files?: number;
  critical_risk_count: number;
  high_risk_count: number;
  progress_percentage?: number;
  current_stage?: string;
  error_message?: string;
  created_at?: string;
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
  file_path: string;
  line_number?: number;
  evidence_snippet?: string;
  risk: ArtefactRisk;
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
  };
  overall_category: string;
  scenarios: MoscaScenario[];
};

export type Recommendation = {
  artefact_id: string;
  name: string;
  action: string;
  primary_pqc: string;
  hybrid_pair: string;
  effort: string;
};
