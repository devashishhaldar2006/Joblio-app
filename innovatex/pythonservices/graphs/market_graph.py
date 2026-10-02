"""
LangGraph Workflow for Market Intelligence & Forecast Pipeline.
Orchestrates: timeseries_builder -> forecast_engine -> trend_classifier -> gap_analyzer.
"""

import asyncio
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END

from agents.market.timeseries_builder import build_skill_timeseries, build_skill_timeseries_async
from agents.market.forecast_engine import forecast_skill
from agents.market.trend_classifier import classify_trend
from agents.market.gap_analyzer import analyze_skill_gap
from utils.skill_dictionary import normalize_skill
from utils.db import get_async_db

class MarketState(TypedDict):
    skill: str
    user_skills: List[str]
    timeseries: Dict[str, Any]
    forecast: Dict[str, Any]
    classification: Dict[str, Any]
    gap_report: Dict[str, Any]
    final_output: Dict[str, Any]

async def timeseries_node(state: MarketState) -> Dict[str, Any]:
    raw_skill = state.get("skill", "Python")
    normalized = normalize_skill(raw_skill) or raw_skill
    ts_data = await build_skill_timeseries_async(normalized)
    return {"skill": normalized, "timeseries": ts_data}

async def forecast_node(state: MarketState) -> Dict[str, Any]:
    raw_skill = state.get("skill", "Python")
    ts_data = state.get("timeseries", {})
    normalized = ts_data.get("skill") or normalize_skill(raw_skill) or raw_skill
    # Run heavy ML Prophet/ARIMA fitting in background thread to avoid blocking FastAPI event loop
    fc_data = await asyncio.to_thread(forecast_skill, normalized, 26, ts_data)
    return {"forecast": fc_data}

async def trend_node(state: MarketState) -> Dict[str, Any]:
    fc_data = state.get("forecast", {})
    ts_data = state.get("timeseries", {})
    class_data = classify_trend(fc_data, ts_data)
    return {"classification": class_data}

async def gap_node(state: MarketState) -> Dict[str, Any]:
    raw_skill = state.get("skill", "Python")
    ts_data = state.get("timeseries", {})
    normalized = ts_data.get("skill") or normalize_skill(raw_skill) or raw_skill
    user_skills = state.get("user_skills", [])
    gap_data = analyze_skill_gap(user_skills)

    # Lookup top co-occurring skills from latest snapshot if available
    db = get_async_db()
    co_occurring: List[str] = []
    try:
        snapshot = await db["marketsnapshots"].find_one(sort=[("week_start", -1)])
        if snapshot and "co_occurrences" in snapshot:
            co_occurrences = snapshot["co_occurrences"]
            # Try case-insensitive lookup
            for k, v in co_occurrences.items():
                if k.lower() == normalized.lower():
                    co_occurring = v
                    break
    except Exception:
        pass

    if not co_occurring:
        # Standard pairings based on skill domain
        domain_pairings = {
            "python": ["Docker", "FastAPI", "PostgreSQL", "AWS", "PyTorch"],
            "react": ["TypeScript", "Next.js", "Tailwind CSS", "Node.js", "GraphQL"],
            "javascript": ["React", "Node.js", "TypeScript", "HTML5", "CSS3"],
            "docker": ["Kubernetes", "AWS", "Linux", "CI/CD", "Terraform"],
            "kubernetes": ["Docker", "Terraform", "AWS", "Helm", "Prometheus"],
            "aws": ["Terraform", "Docker", "Python", "Kubernetes", "PostgreSQL"],
            "node.js": ["Express", "MongoDB", "TypeScript", "React", "PostgreSQL", "Redis"],
            "nodejs": ["Express", "MongoDB", "TypeScript", "React", "PostgreSQL", "Redis"],
            "node": ["Express", "MongoDB", "TypeScript", "React", "PostgreSQL", "Redis"],
            "typescript": ["React", "Node.js", "Next.js", "GraphQL", "Docker"],
            "java": ["Spring Boot", "Microservices", "PostgreSQL", "Kafka", "Docker"],
            "go": ["Kubernetes", "Docker", "gRPC", "PostgreSQL", "AWS"],
            "rust": ["WebAssembly", "C++", "Linux", "Docker", "Tokio"],
            "postgresql": ["Python", "Node.js", "Docker", "Redis", "AWS"],
            "mongodb": ["Node.js", "Express", "React", "TypeScript", "AWS"],
            "fastapi": ["Python", "Docker", "PostgreSQL", "Pydantic", "Redis"],
            "next.js": ["React", "TypeScript", "Tailwind CSS", "Node.js", "GraphQL"]
        }
        co_occurring = domain_pairings.get(normalized.lower(), ["Docker", "Git", "REST API", "SQL", "Linux"])

    final_output = {
        "skill": normalized,
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
