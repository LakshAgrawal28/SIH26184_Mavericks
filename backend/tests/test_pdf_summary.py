import uuid
from datetime import datetime, timezone

from app.cbom.builder import build_pdf_summary
from app.models import Artefact, Scan


def test_build_pdf_summary_produces_valid_pdf():
    scan = Scan(
        id=uuid.uuid4(),
        name="demo-scan",
        target_type="zip_archive",
        status="completed",
        total_files=12,
        total_artefacts=2,
        critical_risk_count=1,
        high_risk_count=1,
        data_lifetime_x=10.0,
        migration_time_y=4.0,
        created_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
    )
    artefacts = [
        Artefact(
            scan_id=scan.id,
            bom_ref="art:1",
            name="RSA-2048 cert",
            asset_type="certificate",
            algorithm="RSA",
            primitive="asymmetric",
            file_path="certs/server.pem",
            risk_band="CRITICAL",
            final_risk_score=9.0,
            recommendation_action="Migrate",
            primary_pqc="ML-KEM",
        ),
        Artefact(
            scan_id=scan.id,
            bom_ref="art:2",
            name="AES-256-GCM",
            asset_type="symmetric-key",
            algorithm="AES",
            primitive="symmetric",
            file_path="src/crypto.py",
            line_number=42,
            risk_band="LOW",
            final_risk_score=2.0,
            recommendation_action="Keep",
        ),
    ]
    mosca = {
        "overall_category": "PLAN",
        "interpretation": "Plan migration before harvest window closes.",
        "parameters": {"data_lifetime_x": 10.0, "migration_time_y": 4.0, "total_time_needed": 14.0},
        "scenarios": [
            {"name": "Baseline", "z_value": 10.0, "margin": -4.0, "category": "EXPIRED"},
        ],
    }
    pdf = build_pdf_summary(scan, artefacts, mosca)
    assert pdf[:4] == b"%PDF"
    assert len(pdf) > 4000
