"""
Trend Classifier for Developer Skills.
Applies mathematical classification rules to determine market trajectories:
EMERGING, RISING, STABLE, DECLINING, or DYING, calculating momentum and peaks.
"""

from typing import Dict, Any, Optional
from utils.db import get_sync_db

def get_skill_demand_rank(skill_name: str, current_pct: float) -> int:
    """Finds relative rank of skill demand against latest snapshot or dataset."""
    try:
        db = get_sync_db()
        snapshot = db["marketsnapshots"].find_one(sort=[("week_start", -1)])
        if snapshot and "top_skills" in snapshot:
            for idx, item in enumerate(snapshot["top_skills"]):
                if item.get("skill", "").lower() == skill_name.lower():
                    return idx + 1
        # Fallback rank estimation based on percentage
        if current_pct >= 40.0:
            return 3
        elif current_pct >= 25.0:
            return 8
        elif current_pct >= 15.0:
            return 15
        elif current_pct >= 5.0:
            return 30
        return 50
    except Exception:
        return 10

def classify_trend(
    forecast_result: Dict[str, Any],
    timeseries_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Classifies the skill trend into EMERGING, RISING, STABLE, DECLINING, or DYING.
    Computes momentum, projected peak week, and actionable verdict text.
    """
    skill = forecast_result.get("skill", "")
    current_pct = float(forecast_result.get("current_percentage", 0.0))
    forecast_6m = float(forecast_result.get("forecast_percentage_6m", current_pct))
    confidence = float(forecast_result.get("confidence", 0.70))
    forecast_series = forecast_result.get("forecast_series", [])

    # Calculate 6-month change %
    if current_pct > 0.05:
        change_pct = round(((forecast_6m - current_pct) / current_pct) * 100.0, 1)
    else:
        change_pct = round((forecast_6m - current_pct) * 100.0, 1) if forecast_6m > current_pct else 0.0

    # Trend categorization rules
    # Note priority: DYING before DECLINING; EMERGING takes precedence if current is small (<5%) and growing fast (>20%)
    if current_pct < 5.0 and change_pct > 20.0:
        trend = "EMERGING"
        verdict = "Early mover advantage — high risk, high reward"
    elif change_pct < -30.0:
        trend = "DYING"
        verdict = "Declining rapidly — prioritize migration"
    elif change_pct < -10.0:
        trend = "DECLINING"
        verdict = "Demand softening — consider complementing with modern alternatives"
    elif change_pct > 10.0:
        trend = "RISING"
        verdict = "Strong investment — demand accelerating"
    else:
        trend = "STABLE"
        verdict = "Safe skill — maintain and deepen"

    # Determine peak week from forecast series
    peak_week = forecast_series[0]["week"] if forecast_series else "Current"
    max_val = -1.0
    for item in forecast_series:
        val = item.get("predicted", 0.0)
        if val > max_val:
            max_val = val
            peak_week = item.get("week", peak_week)

    # Compute momentum from timeseries rolling averages: (4w - 13w) / 13w * 100
    rolling_4w = timeseries_data.get("rolling_4w") if timeseries_data else None
    rolling_13w = timeseries_data.get("rolling_13w") if timeseries_data else None

    if rolling_4w is not None and rolling_13w is not None and rolling_13w > 0:
        momentum = round(((rolling_4w - rolling_13w) / rolling_13w) * 100.0, 1)
    else:
        # Approximate momentum from WoW/MoM or change
        momentum = round(change_pct / 3.0, 1)

    demand_rank = get_skill_demand_rank(skill, current_pct)

    return {
        "trend": trend,
        "change_6m_pct": change_pct,
        "demand_rank": demand_rank,
        "momentum": momentum,
        "peak_week": peak_week,
        "verdict": verdict,
        "confidence": confidence
    }
