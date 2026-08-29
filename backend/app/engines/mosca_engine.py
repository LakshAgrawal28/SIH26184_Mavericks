from app.engines.taxonomy import MOSCA_SCENARIOS


def compute_mosca(x: float, y: float, final_risk: float = 0.0) -> dict:
    total = x + y
    scenarios = []
    worst_category = "MONITOR"

    for sc in MOSCA_SCENARIOS:
        z = sc["z_value"]
        margin = round(z - total, 2)
        if margin < 0:
            category = "EXPIRED"
        elif margin < 2:
            category = "URGENT"
        elif final_risk >= 5.5:
            category = "PLAN"
        else:
            category = "MONITOR"

        if category == "EXPIRED":
            worst_category = "EXPIRED"
        elif category == "URGENT" and worst_category != "EXPIRED":
            worst_category = "URGENT"
        elif category == "PLAN" and worst_category in ("MONITOR",):
            worst_category = "PLAN"

        scenarios.append(
            {
                "name": sc["name"],
                "z_value": z,
                "margin": margin,
                "category": category,
            }
        )

    return {
        "parameters": {
            "data_lifetime_x": x,
            "migration_time_y": y,
            "total_time_needed": total,
        },
        "scenarios": scenarios,
        "overall_category": worst_category,
    }
