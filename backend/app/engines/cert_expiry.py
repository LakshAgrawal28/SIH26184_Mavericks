"""Certificate expiry urgency scoring."""
from datetime import datetime, timezone


def compute_expiry_urgency(days_to_expiry: int | None) -> tuple[float, str]:
    """Return (urgency_multiplier, label) for a cert.
    multiplier: 1.0 (active) → 3.0 (expired)
    """
    if days_to_expiry is None:
        return 1.0, "UNKNOWN"
    if days_to_expiry < 0:
        return 3.0, "EXPIRED"
    if days_to_expiry < 30:
        return 2.5, "CRITICAL"
    if days_to_expiry < 90:
        return 1.8, "WARNING"
    return 1.0, "ACTIVE"
