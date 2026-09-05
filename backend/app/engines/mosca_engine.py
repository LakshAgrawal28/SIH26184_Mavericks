from app.engines.taxonomy import MOSCA_SCENARIOS

CATEGORY_RANK = {"MONITOR": 0, "PLAN": 1, "URGENT": 2, "EXPIRED": 3}


def classify_margin(margin: float, final_risk: float = 0.0) -> str:
    if margin < 0:
        return "EXPIRED"
    if margin < 2:
        return "URGENT"
    if final_risk >= 5.5:
        return "PLAN"
    return "MONITOR"


def compute_mosca(
    x: float,
    y: float,
    final_risk: float = 0.0,
    extra_z: float | None = None,
) -> dict:
    total = round(float(x) + float(y), 2)
    scenarios = []
    worst_category = "MONITOR"

    rows = list(MOSCA_SCENARIOS)
    if extra_z is not None:
        rows = rows + [{"name": "Custom", "z_value": float(extra_z)}]

    for sc in rows:
        z = float(sc["z_value"])
        margin = round(z - total, 2)
        category = classify_margin(margin, final_risk)
        if CATEGORY_RANK[category] > CATEGORY_RANK[worst_category]:
            worst_category = category
        scenarios.append(
            {
                "name": sc["name"],
                "z_value": z,
                "margin": margin,
                "category": category,
                "expired": margin < 0,
            }
        )

    baseline = next((s for s in scenarios if s["name"] == "Baseline"), scenarios[0] if scenarios else None)

    return {
        "formula": "IF (X + Y) > Z THEN confidentiality is already expired under Mosca's theorem",
        "parameters": {
            "data_lifetime_x": float(x),
            "migration_time_y": float(y),
            "total_time_needed": total,
        },
        "scenarios": scenarios,
        "overall_category": worst_category,
        "baseline_category": baseline["category"] if baseline else worst_category,
        "interpretation": _interpret(worst_category, total, baseline),
    }


def describe_transition(previous: str, current: str) -> dict:
    return {
        "from": previous,
        "to": current,
        "changed": previous != current,
        "improved": CATEGORY_RANK.get(current, 0) < CATEGORY_RANK.get(previous, 0),
        "worsened": CATEGORY_RANK.get(current, 0) > CATEGORY_RANK.get(previous, 0),
        "label": f"{previous} → {current}" if previous != current else current,
    }


def _interpret(overall: str, total: float, baseline: dict | None) -> str:
    z = baseline["z_value"] if baseline else 10.0
    margin = baseline["margin"] if baseline else round(z - total, 2)
    if overall == "EXPIRED":
        return (
            f"X+Y={total}y exceeds baseline CRQC arrival Z={z}y "
            f"(margin {margin}y). Harvest-now-decrypt-later data is already overdue for PQC."
        )
    if overall == "URGENT":
        return (
            f"X+Y={total}y leaves less than 2 years versus Z={z}y. "
            "Start hybrid PQC migration immediately."
        )
    if overall == "PLAN":
        return "Quantum-vulnerable public-key crypto is present; schedule migration before the margin closes."
    return "Current Mosca margin is comfortable under the selected X/Y, but continue monitoring."
