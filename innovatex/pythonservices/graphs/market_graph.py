"""
LangGraph Workflow for Market Intelligence & Forecast Pipeline.
Orchestrates: timeseries_builder -> forecast_engine -> trend_classifier -> gap_analyzer.
"""

from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END

from agents.market.timeseries_builder import build_skill_timeseries
from agents.market.forecast_engine import forecast_skill
from agents.market.trend_classifier import classify_trend
from agents.market.gap_analyzer import analyze_skill_gap
from utils.db import get_sync_db

class MarketState(TypedDict):
    skill: str
    user_skills: List[str]
    timeseries: Dict[str, Any]
    forecast: Dict[str, Any]
    classification: Dict[str, Any]
    gap_report: Dict[str, Any]
    final_output: Dict[str, Any]

async def timeseries_node(state: MarketState) -> Dict[str, Any]:
    skill = state.get("skill", "Python")
    ts_data = build_skill_timeseries(skill)
    return {"timeseries": ts_data}

async def forecast_node(state: MarketState) -> Dict[str, Any]:
    skill = state.get("skill", "Python")
    ts_data = state.get("timeseries", {})
    fc_data = forecast_skill(skill, weeks_ahead=26, timeseries_data=ts_data)
    return {"forecast": fc_data}

async def trend_node(state: MarketState) -> Dict[str, Any]:
    fc_data = state.get("forecast", {})
    ts_data = state.get("timeseries", {})
    class_data = classify_trend(fc_data, ts_data)
    return {"classification": class_data}

async def gap_node(state: MarketState) -> Dict[str, Any]:
    user_skills = state.get("user_skills", [])
    gap_data = analyze_skill_gap(user_skills)

    # Lookup top co-occurring skills from latest snapshot if available
    db = get_sync_db()
    co_occurring: List[str] = []
    try:
        snapshot = db["marketsnapshots"].find_one(sort=[("week_start", -1)])
        if snapshot and "co_occurrences" in snapshot:
            co_occurring = snapshot["co_occurrences"].get(state.get("skill"), [])
    except Exception:
        pass

    if not co_occurring:
        # Standard pairings based on skill domain
        domain_pairings = {
            "Python": ["Docker", "FastAPI", "PostgreSQL", "AWS", "PyTorch"],
            "React": ["TypeScript", "Next.js", "Tailwind CSS", "Node.js", "GraphQL"],
            "JavaScript": ["React", "Node.js", "TypeScript", "HTML5", "CSS3"],
            "Docker": ["Kubernetes", "AWS", "Linux", "CI/CD", "Terraform"],
            "Kubernetes": ["Docker", "Terraform", "AWS", "Helm", "Prometheus"],
            "AWS": ["Terraform", "Docker", "Python", "Kubernetes", "PostgreSQL"],
            "Node.js": ["Express", "MongoDB", "TypeScript", "React", "PostgreSQL"],
            "Java": ["Spring Boot", "Microservices", "PostgreSQL", "Kafka", "Docker"]
        }
        co_occurring = domain_pairings.get(state.get("skill"), ["Docker", "Git", "REST API", "SQL", "Linux"])

    final_output = {
        "skill": state.get("skill"),
        "timeseries": state.get("timeseries"),
        "forecast": state.get("forecast"),
        "classification": state.get("classification"),
        "gap_report": gap_data,
        "co_occurring_skills": co_occurring
    }

    return {
        "gap_report": gap_data,
        "final_output": final_output
    }

def build_market_graph():
    workflow = StateGraph(MarketState)

    workflow.add_node("timeseries_builder", timeseries_node)
    workflow.add_node("forecast_engine", forecast_node)
    workflow.add_node("trend_classifier", trend_node)
    workflow.add_node("gap_analyzer", gap_node)

    workflow.set_entry_point("timeseries_builder")
    workflow.add_edge("timeseries_builder", "forecast_engine")
    workflow.add_edge("forecast_engine", "trend_classifier")
    workflow.add_edge("trend_classifier", "gap_analyzer")
    workflow.add_edge("gap_analyzer", END)

    return workflow.compile()

market_pipeline = build_market_graph()
