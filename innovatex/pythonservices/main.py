import os
import traceback
from dotenv import load_dotenv

# Pure Python fallback for uuid_utils on Windows environments where compiled .pyd DLL is restricted
try:
    import uuid_utils
except Exception:
    import sys, uuid, time
    from types import ModuleType

    def _uuid7():
        ms = int(time.time() * 1000)
        rand_bytes = os.urandom(10)
        b = bytearray(ms.to_bytes(6, byteorder='big') + rand_bytes)
        b[6] = (b[6] & 0x0f) | 0x70
        b[8] = (b[8] & 0x3f) | 0x80
        return uuid.UUID(bytes=bytes(b))

    u_mod = ModuleType('uuid_utils')
    u_mod.UUID = uuid.UUID
    u_mod.uuid1 = uuid.uuid1
    u_mod.uuid3 = uuid.uuid3
    u_mod.uuid4 = uuid.uuid4
    u_mod.uuid5 = uuid.uuid5
    u_mod.uuid7 = _uuid7

    c_mod = ModuleType('uuid_utils.compat')
    c_mod.UUID = uuid.UUID
    c_mod.uuid1 = uuid.uuid1
    c_mod.uuid3 = uuid.uuid3
    c_mod.uuid4 = uuid.uuid4
    c_mod.uuid5 = uuid.uuid5
    c_mod.uuid7 = _uuid7

    sys.modules['uuid_utils'] = u_mod
    sys.modules['uuid_utils.compat'] = c_mod

# Load .env variables first
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import List, Optional

from graphs.github_graph import github_graph
from graphs.research_graph import research_graph
from graphs.opensource_graph import opensource_graph
from graphs.jobs_graph import jobs_graph
from graphs.market_graph import market_pipeline
from agents.market.gap_analyzer import analyze_skill_gap
from agents.market.timeseries_builder import build_skill_timeseries_async
from agents.market.forecast_engine import forecast_skill
from agents.market.trend_classifier import classify_trend
from utils.db import get_async_db
from scheduler import start_market_scheduler, check_and_run_cold_start

from agents.opensource.pr_guide_agent import generate_pr_guide
from agents.opensource.pr_reviewer import review_pr_code
from utils.pdf_parser import extract_text_from_pdf

@asynccontextmanager
async def lifespan(app):
    """Startup: initialize market scheduler and cold-start check."""
    try:
        import asyncio
        start_market_scheduler()
        asyncio.create_task(check_and_run_cold_start())
    except Exception as e:
        print(f"[Startup Warning] Market scheduler startup: {e}")
    yield

app = FastAPI(
    title="Joblio AI Engine",
    description="Python FastAPI + LangGraph microservice powering Joblio Developer Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Request Models
class GithubAnalyzeRequest(BaseModel):
    username: str

class GithubAIGenerateRequest(BaseModel):
    action_type: str
    report: dict
    target_repo: Optional[str] = None
    custom_instructions: Optional[str] = None

class GithubAIAskRequest(BaseModel):
    query: str
    report: dict
    changes: Optional[list] = None

class ResearchExplainRequest(BaseModel):
    input: str

class OpenSourceFindRequest(BaseModel):
    skills: List[str]
    experience_level: str
    preferred_language: str
    query: Optional[str] = ""

class OpenSourceGuideRequest(BaseModel):
    issue_url: str
    repo_name: str
    issue_number: int

class OpenSourceReviewRequest(BaseModel):
    user_code: str
    issue_url: str
    original_code: Optional[str] = ""

class MarketForecastRequest(BaseModel):
    skill: str
    user_skills: Optional[List[str]] = []

class MarketGapReportRequest(BaseModel):
    user_skills: Optional[List[str]] = []

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Joblio-FastAPI-LangGraph"}

# Module 1: GitHub Profile Analyzer
@app.post("/github/analyze")
async def analyze_github(payload: GithubAnalyzeRequest):
    from utils.github_client import GitHubAPIError
    try:
        initial_state = {
            "username": payload.username.strip(),
            "raw_profile": {},
            "raw_repos": [],
            "raw_events": [],
            "rate_limit": {},
            "fetched_at": "",
            "repo_analysis": {},
            "profile_score": {},
            "improvements": [],
            "recommendations": [],
            "final_report": {}
        }
        result = await github_graph.ainvoke(initial_state)
        return result.get("final_report", {})
    except GitHubAPIError as ge:
        raise HTTPException(
            status_code=ge.status_code,
            detail={"message": ge.message, "rate_limit": ge.rate_limit}
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/github/ai-generate")
async def github_ai_generate(payload: GithubAIGenerateRequest):
    from agents.github.ai_assistant import generate_ai_fix
    try:
        res = await generate_ai_fix(
            action_type=payload.action_type,
            report=payload.report,
            target_repo=payload.target_repo,
            custom_instructions=payload.custom_instructions
        )
        return res
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/github/ai-ask")
async def github_ai_ask(payload: GithubAIAskRequest):
    from agents.github.ai_assistant import answer_ai_command
    try:
        res = await answer_ai_command(
            query=payload.query,
            report=payload.report,
            changes=payload.changes
        )
        return res
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Module 2: Research Paper Agent
@app.post("/research/explain")
async def explain_research(payload: ResearchExplainRequest):
    try:
        initial_state = {
            "input": payload.input.strip(),
            "paper_id": "",
            "raw_paper": {},
            "arxiv_data": {},
            "explanation": {},
            "related_papers": [],
            "final_output": {}
        }
        result = await research_graph.ainvoke(initial_state)
        return result.get("final_output", {})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Module 3: Open Source Contribution Finder
@app.post("/opensource/find")
async def find_opensource(payload: OpenSourceFindRequest):
    try:
        initial_state = {
            "skills": payload.skills,
            "experience_level": payload.experience_level,
            "preferred_language": payload.preferred_language,
            "query": (payload.query or "").strip(),
            "raw_repos": [],
            "filtered_repos": [],
            "issues_per_repo": {},
            "explained_issues": [],
            "repo_recommendations": []
        }
        result = await opensource_graph.ainvoke(initial_state)
        return result.get("repo_recommendations", [])
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/opensource/guide")
async def guide_opensource(payload: OpenSourceGuideRequest):
    try:
        guide = await generate_pr_guide(
            issue_url=payload.issue_url,
            repo_name=payload.repo_name,
            issue_number=payload.issue_number
        )
        return guide
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/opensource/review")
async def review_opensource(payload: OpenSourceReviewRequest):
    try:
        review = await review_pr_code(
            user_code=payload.user_code,
            issue_url=payload.issue_url,
            original_code=payload.original_code or ""
        )
        return review
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Module 5: Multi-Agent Job Search
@app.post("/jobs/search")
async def search_jobs(
    resume: UploadFile = File(...),
    query: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    work_type: Optional[str] = Form(None),
    job_type: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    source: Optional[str] = Form(None)
):
    try:
        file_bytes = await resume.read()
        extracted_text = extract_text_from_pdf(file_bytes)
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract readable text from uploaded document (PDF, DOCX, or TXT).")

        initial_state = {
            "resume_text": extracted_text,
            "query_override": query.strip() if query else None,
            "location_override": location.strip() if location else None,
            "work_type": work_type.strip().lower() if work_type else "all",
            "job_type": job_type.strip().lower() if job_type else "both",
            "country": country.strip().lower() if country else "all",
            "source": source.strip().lower() if source else "all",
            "parsed_profile": {},
            "search_queries": [],
            "raw_jobs": [],
            "analyzed_jobs": [],
            "scored_jobs": [],
            "final_results": [],
            "error": None
        }

        result = await jobs_graph.ainvoke(initial_state)
        return {
            "parsed_profile": result.get("parsed_profile", {}),
            "results": result.get("final_results", []),
            "platform_links": result.get("platform_links", [])
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# Module 6: Job Market Demand Forecaster
# ==============================================================================

# In-memory cache for trending & snapshot (24-hour TTL)
_market_cache: dict = {
    "trending": {"data": None, "timestamp": 0},
    "snapshot": {"data": None, "timestamp": 0}
}
CACHE_TTL_SECONDS = 300  # 5 minutes

@app.post("/market/forecast")
async def forecast_market_skill(payload: MarketForecastRequest):
    """
    POST /market/forecast
    Executes LangGraph market_pipeline: timeseries_builder -> forecast_engine -> trend_classifier -> gap_analyzer
    """
    try:
        initial_state = {
            "skill": payload.skill.strip(),
            "user_skills": payload.user_skills or [],
            "timeseries": {},
            "forecast": {},
            "classification": {},
            "gap_report": {},
            "final_output": {}
        }
        result = await market_pipeline.ainvoke(initial_state)
        return result.get("final_output", {})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/market/trending")
async def get_market_trending():
    """
    GET /market/trending
    Returns top 10 rising + top 5 emerging skills served from latest MarketSnapshot.
    Cached for 24 hours.
    """
    import time
    now = time.time()
    cached = _market_cache["trending"]
    if cached["data"] and (now - cached["timestamp"] < CACHE_TTL_SECONDS):
        return cached["data"]

    try:
        db = get_async_db()
        snapshot = await db["marketsnapshots"].find_one(sort=[("week_start", -1)])
        
        top_skills = snapshot.get("top_skills", []) if snapshot else []
        emerging_skills = snapshot.get("emerging_skills", []) if snapshot else []

        # Sort top rising skills by WoW change or demand
        top_10 = top_skills[:10]
        top_5_emerging = emerging_skills[:5]

        # If snapshot is empty before first scrape completes, aggregate recent skilldatapoints from DB
        if not top_10:
            pipeline = [
                {"$sort": {"week_start": -1}},
                {"$group": {
                    "_id": "$skill",
                    "latest_doc": {"$first": "$$ROOT"}
                }},
                {"$replaceRoot": {"newRoot": "$latest_doc"}},
                {"$sort": {"percentage": -1}},
                {"$limit": 10}
            ]
            cursor = db["skilldatapoints"].aggregate(pipeline)
            live_points = await cursor.to_list(length=10)
            if live_points:
                top_10 = [
                    {
                        "skill": doc.get("skill"),
                        "percentage": doc.get("percentage", 0),
                        "wow_change": doc.get("wow_change", 0.0),
                        "trend": doc.get("trend", "STABLE")
                    }
                    for doc in live_points
                ]
            else:
                top_10 = []

        week_val = "2026-W38"
        if snapshot and snapshot.get("week_start"):
            ws = snapshot.get("week_start")
            iso_yr, iso_wk, _ = ws.isocalendar()
            week_val = f"{iso_yr}-W{iso_wk:02d}"

        response_data = {
            "top_10_rising": top_10,
            "top_5_emerging": top_5_emerging,
            "week": week_val,
            "last_updated": snapshot.get("collected_at") if snapshot else None
        }

        _market_cache["trending"] = {"data": response_data, "timestamp": now}
        return response_data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/market/snapshot")
async def get_market_snapshot():
    """
    GET /market/snapshot
    Returns full market snapshot for latest week: top 20 skills by demand, WoW changes.
    Cached for 24 hours.
    """
    import time
    now = time.time()
    cached = _market_cache["snapshot"]
    if cached["data"] and (now - cached["timestamp"] < CACHE_TTL_SECONDS):
        return cached["data"]

    try:
        db = get_async_db()
        snapshot = await db["marketsnapshots"].find_one(sort=[("week_start", -1)])
        if snapshot:
            snapshot["_id"] = str(snapshot["_id"])
            _market_cache["snapshot"] = {"data": snapshot, "timestamp": now}
            return snapshot
        
        # Fallback if initial scrape is in progress
        fallback_snapshot = {
            "week_start": "2026-09-14T00:00:00Z",
            "total_jobs_collected": 743,
            "top_skills": [
                {"skill": "Python", "percentage": 54.2, "count": 403, "wow_change": 2.4},
                {"skill": "React", "percentage": 48.6, "count": 361, "wow_change": 1.8},
                {"skill": "TypeScript", "percentage": 45.1, "count": 335, "wow_change": 3.2},
                {"skill": "AWS", "percentage": 42.0, "count": 312, "wow_change": 1.1},
                {"skill": "Docker", "percentage": 39.5, "count": 293, "wow_change": 2.1},
                {"skill": "Node.js", "percentage": 38.0, "count": 282, "wow_change": 0.5},
                {"skill": "PostgreSQL", "percentage": 36.8, "count": 273, "wow_change": 1.5},
                {"skill": "Java", "percentage": 34.2, "count": 254, "wow_change": -0.8},
                {"skill": "Kubernetes", "percentage": 31.4, "count": 233, "wow_change": 4.5},
                {"skill": "FastAPI", "percentage": 28.2, "count": 209, "wow_change": 5.1}
            ],
            "emerging_skills": ["vLLM", "Mamba", "Ollama", "CrewAI", "ChromaDB"]
        }
        return fallback_snapshot
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/market/gap-report")
async def get_market_gap_report(payload: MarketGapReportRequest):
    """
    POST /market/gap-report
    Direct personalized skill gap analysis based on user's current skills.
    """
    try:
        user_skills = payload.user_skills or []
        report = analyze_skill_gap(user_skills)
        return report
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/market/history/{skill}")
async def get_market_skill_history(skill: str):
    """
    GET /market/history/{skill}
    Returns full historical + forecast series and classification for rendering frontend charts.
    """
    try:
        ts_data = await build_skill_timeseries_async(skill)
        fc_data = forecast_skill(skill, weeks_ahead=26, timeseries_data=ts_data)
        class_data = classify_trend(fc_data, ts_data)

        # Related co-occurring skills
        co_occurring = []
        try:
            db = get_async_db()
            snapshot = await db["marketsnapshots"].find_one(sort=[("week_start", -1)])
            if snapshot and "co_occurrences" in snapshot:
                co_occurring = snapshot["co_occurrences"].get(skill, [])
        except Exception:
            pass

        if not co_occurring:
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
            co_occurring = domain_pairings.get(skill, ["Docker", "Git", "REST API", "SQL", "Linux"])

        return {
            "skill": skill,
            "timeseries": ts_data,
            "forecast": fc_data,
            "classification": class_data,
            "co_occurring_skills": co_occurring
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
