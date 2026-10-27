from typing import Dict, Any
from langchain_core.messages import HumanMessage
from utils.llm_config import get_llm_smart
from utils.llm_client import parse_json_from_llm
from utils.redis_cache import generate_cache_key, get_cached_json, set_cached_json

async def parse_resume_node(state: Dict[str, Any]) -> Dict[str, Any]:
    resume_text = state.get("resume_text", "")
    if not resume_text:
        raise ValueError("No resume text extracted from document.")

    # 1. Check Redis Cache (Resume hashing prevents re-parsing the same resume multiple times)
    cache_key = generate_cache_key("parsed_resume", resume_text[:3000])
    cached_profile = get_cached_json(cache_key)
    if cached_profile:
        return {
            **state,
            "parsed_profile": cached_profile
        }

    prompt = f"""Extract structured JSON from this resume.
Return ONLY valid JSON, no markdown, no surrounding comments:
{{
  "name": "Candidate Full Name",
  "email": "Email Address",
  "phone": "Phone Number",
  "location": "City, Country",
  "current_role": "Current or Recent Title",
  "experience_years": 3,
  "education": "Degree and University",
  "skills": ["Python", "React", "Docker", "Node.js"],
  "preferred_roles": ["Full Stack Engineer", "Backend Engineer"],
  "preferred_locations": ["Remote", "Bangalore", "San Francisco"],
  "summary": "2 sentences high impact professional overview."
}}

Resume Content:
{resume_text[:4000]}
"""
    model = get_llm_smart()
    res = await model.ainvoke([HumanMessage(content=prompt)])
    parsed_profile = parse_json_from_llm(res.content)

    # 2. Save in Redis for 7 days (604,800 seconds)
    if parsed_profile:
        set_cached_json(cache_key, parsed_profile, ttl_seconds=604800)

    return {
        **state,
        "parsed_profile": parsed_profile
    }
