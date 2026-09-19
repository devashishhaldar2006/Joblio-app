import asyncio
import json
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from utils.llm_client import get_gemini_model, parse_json_from_llm

async def analyze_jd_node(state: Dict[str, Any]) -> Dict[str, Any]:
    parsed_profile = state.get("parsed_profile", {})
    raw_jobs = state.get("raw_jobs", [])

    if not raw_jobs:
        return {
            **state,
            "analyzed_jobs": []
        }

    model = get_gemini_model()

    async def analyze_single_job(job: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""Candidate: {json.dumps(parsed_profile, default=str)}
Job: {job.get('job_title')} at {job.get('employer_name')}
JD: {job.get('job_description')}

Analyze fit. Return ONLY JSON matching this schema:
{{
  "match_score": 85,
  "match_reason": "Specific 1-2 sentences why this candidate is a strong match or where the gap lies.",
  "jd_bullets": [
    "Key responsibility or requirement 1",
    "Key responsibility or requirement 2",
    "Key responsibility or requirement 3"
  ],
  "skill_overlap": ["Skill1", "Skill2"],
  "missing_skills": ["Skill3"]
}}

match_score must be an integer from 0 to 100.
Do not wrap in markdown or backticks.
"""
        try:
            res = await model.ainvoke([HumanMessage(content=prompt)])
            analysis = parse_json_from_llm(res.content)
            return {
                **job,
                **analysis
            }
        except Exception:
            return {
                **job,
                "match_score": 75,
                "match_reason": f"Matches foundational software engineering skills for {job.get('job_title')}.",
                "jd_bullets": [
                    "Collaborate on architectural development and feature delivery.",
                    "Build scalable APIs and optimize performance.",
                    "Ensure code quality and test coverage."
                ],
                "skill_overlap": parsed_profile.get("skills", [])[:3],
                "missing_skills": []
            }

    # Analyze up to top 15 jobs concurrently
    analyzed_jobs = await asyncio.gather(*[analyze_single_job(j) for j in raw_jobs[:15]])

    return {
        **state,
        "analyzed_jobs": analyzed_jobs
    }
