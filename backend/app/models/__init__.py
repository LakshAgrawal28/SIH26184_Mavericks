import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), default="Admin")
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="admin")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    target_type: Mapped[str] = mapped_column(String(50), default="zip_archive")
    status: Mapped[str] = mapped_column(String(50), default="queued", index=True)
    storage_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    total_files: Mapped[int] = mapped_column(Integer, default=0)
    total_artefacts: Mapped[int] = mapped_column(Integer, default=0)
    critical_risk_count: Mapped[int] = mapped_column(Integer, default=0)
    high_risk_count: Mapped[int] = mapped_column(Integer, default=0)
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    current_stage: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_lifetime_x: Mapped[float] = mapped_column(Float, default=10.0)
    migration_time_y: Mapped[float] = mapped_column(Float, default=4.0)
    sensitivity_score: Mapped[int] = mapped_column(Integer, default=7)
    exposure_score: Mapped[int] = mapped_column(Integer, default=7)
    business_criticality: Mapped[int] = mapped_column(Integer, default=7)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    artefacts: Mapped[list["Artefact"]] = relationship(back_populates="scan", cascade="all, delete-orphan")


class Artefact(Base):
    __tablename__ = "artefacts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"), index=True)
    bom_ref: Mapped[str] = mapped_column(String(512), index=True)
    name: Mapped[str] = mapped_column(String(255))
    asset_type: Mapped[str] = mapped_column(String(50), index=True)
    algorithm: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    primitive: Mapped[str | None] = mapped_column(String(128), nullable=True)
    key_size: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mode: Mapped[str | None] = mapped_column(String(64), nullable=True)
    library_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    library_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    line_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detection_method: Mapped[str] = mapped_column(String(128), default="regex")
    confidence: Mapped[float] = mapped_column(Float, default=0.8)
    evidence_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    hndl_risk: Mapped[float] = mapped_column(Float, default=0.0)
    operational_risk: Mapped[float] = mapped_column(Float, default=0.0)
    final_risk_score: Mapped[float] = mapped_column(Float, default=0.0, index=True)
    risk_band: Mapped[str] = mapped_column(String(20), default="LOW", index=True)

    recommendation_action: Mapped[str | None] = mapped_column(String(64), nullable=True)
    primary_pqc: Mapped[str | None] = mapped_column(String(128), nullable=True)
    hybrid_pair: Mapped[str | None] = mapped_column(String(128), nullable=True)
    recommendation_rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    effort_level: Mapped[str | None] = mapped_column(String(32), nullable=True)

    scan: Mapped["Scan"] = relationship(back_populates="artefacts")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"), index=True)
    format: Mapped[str] = mapped_column(String(32))
    storage_path: Mapped[str] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
