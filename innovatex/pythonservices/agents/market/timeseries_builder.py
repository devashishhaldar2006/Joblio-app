"""
Timeseries Builder for Skill Demand Intelligence.
Queries historical weekly frequency records from MongoDB, performs gap
interpolation, and computes rolling analytics (4w, 13w, 52w, WoW, MoM, YoY).
"""

import datetime
from typing import Dict, Any, List, Optional
import numpy as np

from utils.db import get_sync_db, get_async_db
from utils.skill_dictionary import normalize_skill

def week_str_from_date(dt: datetime.datetime) -> str:
    """Format datetime into ISO week string 'YYYY-Www'."""
    year, week, _ = dt.isocalendar()
    return f"{year}-W{week:02d}"

def parse_date(val: Any) -> datetime.datetime:
    """Parse various date formats into timezone-naive UTC datetime."""
    if isinstance(val, datetime.datetime):
        return val.replace(tzinfo=None)
    if isinstance(val, str):
        try:
            return datetime.datetime.fromisoformat(val.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            pass
    return datetime.datetime.now()

def interpolate_missing_weeks(series: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Interpolates any missing weeks in a time series using linear interpolation.
    Assumes series is sorted chronologically by week_start.
    """
    if len(series) <= 1:
        return series

    interpolated: List[Dict[str, Any]] = [series[0]]
    for i in range(1, len(series)):
        prev = interpolated[-1]
        curr = series[i]

        prev_date = parse_date(prev.get("week_start") or prev.get("date"))
        curr_date = parse_date(curr.get("week_start") or curr.get("date"))

        # Gap in days
        gap_days = (curr_date - prev_date).days
        gap_weeks = int(round(gap_days / 7.0))

        if gap_weeks > 1:
            # Interpolate missing points
            p_pct = prev.get("percentage_of_total", 0.0)
            c_pct = curr.get("percentage_of_total", 0.0)
            p_cnt = prev.get("count", 0)
            c_cnt = curr.get("count", 0)

            for step in range(1, gap_weeks):
                fraction = step / float(gap_weeks)
                interp_date = prev_date + datetime.timedelta(days=7 * step)
                interp_pct = round(p_pct + fraction * (c_pct - p_pct), 2)
                interp_cnt = int(round(p_cnt + fraction * (c_cnt - p_cnt)))
                interpolated.append({
                    "week": week_str_from_date(interp_date),
                    "week_start": interp_date,
                    "date": interp_date.strftime("%Y-%m-%d"),
                    "percentage_of_total": interp_pct,
                    "count": interp_cnt,
                    "is_interpolated": True
                })

        interpolated.append(curr)

    return interpolated

def compute_rolling_metrics(timeseries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes rolling averages (4w, 13w, 52w) and delta changes (WoW, MoM, YoY).
    """
    if not timeseries:
        return {
            "rolling_4w": 0.0,
            "rolling_13w": 0.0,
            "rolling_52w": None,
            "wow_change": 0.0,
            "mom_change": 0.0,
            "yoy_change": None
        }

    pcts = [item["percentage_of_total"] for item in timeseries]
    n = len(pcts)

    # Rolling averages
    rolling_4w = round(float(np.mean(pcts[-4:])), 2) if n >= 4 else round(float(np.mean(pcts)), 2)
    rolling_13w = round(float(np.mean(pcts[-13:])), 2) if n >= 13 else round(float(np.mean(pcts)), 2)
    rolling_52w = round(float(np.mean(pcts[-52:])), 2) if n >= 52 else None

    # Week over week
    if n >= 2 and pcts[-2] > 0:
        wow_change = round(((pcts[-1] - pcts[-2]) / pcts[-2]) * 100.0, 2)
    else:
        wow_change = 0.0

    # Month over month (4 weeks ago)
    if n >= 5 and pcts[-5] > 0:
        mom_change = round(((pcts[-1] - pcts[-5]) / pcts[-5]) * 100.0, 2)
    elif n >= 2 and pcts[0] > 0:
        mom_change = round(((pcts[-1] - pcts[0]) / pcts[0]) * 100.0, 2)
    else:
        mom_change = 0.0

    # Year over year (52 weeks ago)
    if n >= 53 and pcts[-53] > 0:
        yoy_change = round(((pcts[-1] - pcts[-53]) / pcts[-53]) * 100.0, 2)
    else:
        yoy_change = None

    return {
        "rolling_4w": rolling_4w,
        "rolling_13w": rolling_13w,
        "rolling_52w": rolling_52w,
        "wow_change": wow_change,
        "mom_change": mom_change,
        "yoy_change": yoy_change
    }

def build_skill_timeseries(skill: str) -> Dict[str, Any]:
    """
    Synchronous builder: Query MongoDB for skill datapoints and compute timeseries.
    """
    normalized = normalize_skill(skill)
    db = get_sync_db()
    collection = db["skilldatapoints"]

    # Search with regex case-insensitive for exact skill name
    cursor = collection.find(
        {"skill_name": {"$regex": f"^{normalized}$", "$options": "i"}}
    ).sort("week_start", 1)

    raw_docs = list(cursor)
    clean_series: List[Dict[str, Any]] = []

    for doc in raw_docs:
        w_start = parse_date(doc.get("week_start"))
        clean_series.append({
            "week": week_str_from_date(w_start),
            "week_start": w_start,
            "date": w_start.strftime("%Y-%m-%d"),
            "percentage_of_total": float(doc.get("percentage_of_total", 0.0)),
            "count": int(doc.get("count", 0)),
            "is_interpolated": False
        })

    # Gap interpolation
    full_series = interpolate_missing_weeks(clean_series)
    metrics = compute_rolling_metrics(full_series)

    # Simplified series structure for ML and frontend
    ts_output = [
        {
            "week": item["week"],
            "date": item["date"],
            "percentage": item["percentage_of_total"],
            "count": item["count"]
        }
        for item in full_series
    ]

    return {
        "skill": normalized,
        "weeks_of_data": len(full_series),
        "timeseries": ts_output,
        "current_percentage": ts_output[-1]["percentage"] if ts_output else 0.0,
        **metrics
    }

async def build_skill_timeseries_async(skill: str) -> Dict[str, Any]:
    """
    Asynchronous builder for FastAPI endpoints and Async workflows.
    """
    normalized = normalize_skill(skill)
    db = get_async_db()
    collection = db["skilldatapoints"]

    cursor = collection.find(
        {"skill_name": {"$regex": f"^{normalized}$", "$options": "i"}}
    ).sort("week_start", 1)

    raw_docs = await cursor.to_list(length=2000)
    clean_series: List[Dict[str, Any]] = []

    for doc in raw_docs:
        w_start = parse_date(doc.get("week_start"))
        clean_series.append({
            "week": week_str_from_date(w_start),
            "week_start": w_start,
            "date": w_start.strftime("%Y-%m-%d"),
            "percentage_of_total": float(doc.get("percentage_of_total", 0.0)),
            "count": int(doc.get("count", 0)),
            "is_interpolated": False
        })

    full_series = interpolate_missing_weeks(clean_series)
    metrics = compute_rolling_metrics(full_series)

    ts_output = [
        {
            "week": item["week"],
            "date": item["date"],
            "percentage": item["percentage_of_total"],
            "count": item["count"]
        }
        for item in full_series
    ]

    return {
        "skill": normalized,
        "weeks_of_data": len(full_series),
        "timeseries": ts_output,
        "current_percentage": ts_output[-1]["percentage"] if ts_output else 0.0,
        **metrics
    }
