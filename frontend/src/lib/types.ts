export type RiskBand = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type QuantumBreak =
  | "shor"
  | "grover"
  | "none"
  | "broken_classical"
  | "inspect"
  | "unknown";

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
  suggested_data_lifetime_x?: number | null;
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
  detection_methods?: Record<string, number>;
  layers_present?: string[];
  critical_risk_count: number;
  high_risk_count: number;
  asset_types?: Record<string, number>;
  primitives?: Record<string, number>;
  quantum_classes?: Partial<Record<QuantumBreak, number>>;
  shor_vulnerable_count?: number;
  classical_hygiene_count?: number;
  hsm_cloud_count?: number;
  library_count?: number;
  suggested_data_lifetime_x?: number | null;
  keep_or_inspect_count?: number;
};

export type ArtefactRisk = {
  hndl_risk: number;
  operational_risk: number;
  final_score: number;
  risk_band: RiskBand;
  quantum_break?: QuantumBreak | string;
};

export type Artefact = {
  artefact_id: string;
  name: string;
  asset_type: string;
  algorithm?: string;
  primitive?: string;
  library_name?: string;
  library_version?: string;
  mode?: string;
  key_size?: string;
  confidence?: number;
  file_path: string;
  line_number?: number;
  evidence_snippet?: string;
  detection_method?: string;
  raw_metadata?: {
    quantum_break?: string;
    qv?: number;
    use_case?: string;
    unmapped?: boolean;
    jwt_alg?: string;
    cloud_provider?: string;
    purl?: string;
    days_to_expiry?: number;
    [key: string]: unknown;
  };
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
  formula?: string;
  interpretation?: string;
  live?: boolean;
  suggested_data_lifetime_x?: number | null;
  cert_count?: number;
  data_lifetime_note?: string;
  parameters: {
    data_lifetime_x: number;
    migration_time_y: number;
    total_time_needed?: number;
  };
  saved_parameters?: {
    data_lifetime_x: number;
    migration_time_y: number;
  };
  overall_category: string;
  baseline_category?: string;
  scenarios: MoscaScenario[];
  transition?: {
    from: string;
    to: string;
    changed: boolean;
    improved?: boolean;
    worsened?: boolean;
    label: string;
  };
};

export type Recommendation = {
  artefact_id: string;
  name: string;
  action: string;
  algorithm?: string;
  primitive?: string;
  quantum_break?: string;
  use_case?: string;
  primary_pqc?: string;
  hybrid_pair?: string;
  effort: string;
  rationale?: string;
  nist_standard?: string;
  timeline_urgency?: string;
};
