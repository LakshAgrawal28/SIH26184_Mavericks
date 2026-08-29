from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class ScanCreateResponse(BaseModel):
    scan_id: str
    name: str
    target_type: str
    status: str
    created_at: str | None = None


class ScanSummary(BaseModel):
    scan_id: str
    name: str
    status: str
    total_files: int = 0
    total_artefacts: int = 0
    critical_risk_count: int = 0
    high_risk_count: int = 0
    progress_percentage: int = 0
    current_stage: str | None = None
    created_at: str | None = None


class ArtefactOut(BaseModel):
    artefact_id: str
    name: str
    asset_type: str
    algorithm: str | None = None
    file_path: str | None = None
    line_number: int | None = None
    confidence: float
    evidence_snippet: str | None = None
    risk: dict
    recommendation: dict


class ContextUpdate(BaseModel):
    data_lifetime_x: float | None = Field(default=None, ge=1, le=50)
    migration_time_y: float | None = Field(default=None, ge=1, le=30)
    sensitivity_score: int | None = Field(default=None, ge=1, le=10)
    exposure_score: int | None = Field(default=None, ge=1, le=10)
    business_criticality: int | None = Field(default=None, ge=1, le=10)
