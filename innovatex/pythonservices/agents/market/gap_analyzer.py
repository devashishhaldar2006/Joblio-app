"""
Personalized Developer Skill Gap Analyzer.
Cross-references a developer's stack against live market trajectory models,
computing portfolio alignment, identifying deprecation risks, and surfacing opportunities.
"""

from typing import List, Dict, Any, Set
from utils.skill_dictionary import normalize_skill
from utils.db import get_sync_db
from agents.market.timeseries_builder import build_skill_timeseries
from agents.market.forecast_engine import forecast_skill
from agents.market.trend_classifier import classify_trend

OPPORTUNITY_RATIONALE = {
    "Kubernetes": "Accelerating container orchestration demand across enterprise cloud migrations.",
    "Terraform": "High demand for declarative Infrastructure as Code across multi-cloud environments.",
    "FastAPI": "Fastest-growing Python backend framework for high-throughput AI & microservice APIs.",
    "LangChain": "Crucial ecosystem skill for production LLM orchestration and compound AI systems.",
    "LangGraph": "High-value framework for complex stateful agentic workflows and multi-agent coordination.",
    "PyTorch": "Standard foundation for deep learning model training, fine-tuning, and research.",
    "Docker": "Universal industry prerequisite for containerized application deployments.",
    "TypeScript": "Enterprise industry standard providing static type safety to modern web codebases.",
    "Next.js": "Dominant React production framework with server components and edge rendering.",
    "PostgreSQL": "Most demanded relational database with superior extensibility and vector search.",
    "Redis": "Essential in-memory data store for caching, rate limiting, and real-time streaming.",
    "dbt": "Rapidly growing standard for data transformations in modern cloud analytics pipelines.",
    "Apache Kafka": "Cornerstone for distributed event streaming and real-time event-driven microservices.",
    "Tailwind CSS": "High-velocity modern styling framework dominating contemporary web development.",
    "AWS": "Largest global cloud provider with persistent high demand for certified cloud engineers.",
    "RAG": "High-demand LLM architecture integrating retrieval systems with generative AI models."
}

def analyze_skill_gap(user_skills: List[str]) -> Dict[str, Any]:
    """
    Evaluates developer's skill set against market demand forecasts.
    Returns portfolio score, market alignment, risk alerts, and growth opportunities.
    """
    normalized_user_skills: List[str] = []
    seen: Set[str] = set()
    for s in user_skills:
        norm = normalize_skill(s)
        if norm and norm.lower() not in seen:
            seen.add(norm.lower())
            normalized_user_skills.append(norm)

    if not normalized_user_skills:
        normalized_user_skills = ["Python", "JavaScript", "React", "Node.js", "SQL"]

    db = get_sync_db()

    # Retrieve latest market snapshot to discover top rising & emerging skills
    snapshot = db["marketsnapshots"].find_one(sort=[("week_start", -1)])
    top_market_skills: List[str] = []
    if snapshot and "top_skills" in snapshot:
        top_market_skills = [item.get("skill") for item in snapshot["top_skills"] if item.get("skill")]

    if not top_market_skills:
        top_market_skills = [
            "Python", "JavaScript", "TypeScript", "React", "Docker",
            "Kubernetes", "AWS", "FastAPI", "Next.js", "PostgreSQL",
            "Node.js", "PyTorch", "Terraform", "LangChain", "Redis"
        ]

    your_skills_forecast: List[Dict[str, Any]] = []
    risk_skills: List[str] = []
    rising_or_stable_count = 0
    total_percentage_demand = 0.0

    user_skills_lower = {s.lower() for s in normalized_user_skills}

    # Evaluate each user skill
    for skill_name in normalized_user_skills:
        ts_data = build_skill_timeseries(skill_name)
        fc_data = forecast_skill(skill_name, weeks_ahead=26, timeseries_data=ts_data)
        classification = classify_trend(fc_data, ts_data)

        trend = classification.get("trend", "STABLE")
        change_pct = classification.get("change_6m_pct", 0.0)
        curr_pct = fc_data.get("current_percentage", 10.0)
        demand_rank = classification.get("demand_rank", 20)

        total_percentage_demand += curr_pct

        if trend in ("RISING", "STABLE", "EMERGING"):
            rising_or_stable_count += 1

        if trend in ("DECLINING", "DYING"):
            risk_skills.append(skill_name)
            action = "Consider Pivoting" if trend == "DYING" else "Watch"
        elif trend == "RISING":
            action = "Deepen"
        elif trend == "EMERGING":
            action = "Double Down"
        else:
            action = "Keep"

        your_skills_forecast.append({
            "skill": skill_name,
            "trend": trend,
            "change_6m_pct": change_pct,
            "current_rank": demand_rank,
            "current_percentage": curr_pct,
            "action": action,
            "verdict": classification.get("verdict", "")
        })

    # Portfolio Score: normalized coverage score out of 100
    avg_demand = total_percentage_demand / max(1, len(normalized_user_skills))
    portfolio_score = round(min(98.0, max(25.0, avg_demand * 1.5 + (rising_or_stable_count / len(normalized_user_skills)) * 30.0)), 1)
    
    # Market Alignment %
    market_alignment = round((rising_or_stable_count / float(len(normalized_user_skills))) * 100.0, 1)

    # Find Top 5 Opportunity Skills that user doesn't have
    candidates: List[Dict[str, Any]] = []
    for skill_candidate in top_market_skills:
        if skill_candidate.lower() in user_skills_lower:
            continue

        c_ts = build_skill_timeseries(skill_candidate)
        c_fc = forecast_skill(skill_candidate, weeks_ahead=26, timeseries_data=c_ts)
        c_class = classify_trend(c_fc, c_ts)

        c_trend = c_class.get("trend", "STABLE")
        if c_trend in ("RISING", "EMERGING"):
            chg = c_class.get("change_6m_pct", 15.0)
            conf = c_class.get("confidence", 0.8)
            why_text = OPPORTUNITY_RATIONALE.get(
                skill_candidate,
                f"Accelerating market demand (+{chg}% projected) with strong industry adoption."
            )
            candidates.append({
                "skill": skill_candidate,
                "trend": c_trend,
                "change_6m_pct": chg,
                "confidence": conf,
                "priority_score": chg * conf,
                "why": why_text
            })

    # Sort opportunities by priority_score descending
    candidates.sort(key=lambda x: x["priority_score"], reverse=True)
    opportunity_skills = candidates[:5]

    # Generate personalized AI recommendation text
    top_opps = [o["skill"] for o in opportunity_skills[:2]]
    opp_str = " and ".join(top_opps) if top_opps else "emerging cloud skills"
    if risk_skills:
        risk_str = ", ".join(risk_skills)
        recommendation = (
            f"Your current stack demonstrates {market_alignment}% alignment with active industry postings. "
            f"Note that demand for {risk_str} is softening; we recommend modernizing those competencies. "
            f"Adding {opp_str} will position you in the top tier of developer demand over the next 6 months."
        )
    else:
        recommendation = (
            f"Your developer portfolio is solidly aligned with top market demands ({market_alignment}% rising or stable). "
            f"To accelerate compensation and senior role velocity, proactively integrate {opp_str} into your production projects."
        )

    return {
        "portfolio_score": portfolio_score,
        "market_alignment": market_alignment,
        "your_skills_forecast": your_skills_forecast,
        "risk_skills": risk_skills,
        "opportunity_skills": opportunity_skills,
        "recommendation": recommendation
    }
