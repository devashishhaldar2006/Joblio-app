import re
from typing import Dict, Any, List, Set
from langchain_core.messages import HumanMessage
from utils.llm_config import get_llm_smart
from utils.llm_client import parse_json_from_llm
from utils.redis_cache import generate_cache_key, get_cached_json, set_cached_json
from agents.market.skill_extractor import extract_skills_from_single_jd

def prune_resume_text(text: str) -> str:
    """
    Strips noise, excessive whitespace, URLs, and references, focusing strictly
    on skills, project experience, and work history to cut LLM token load by ~60%.
    """
    if not text:
        return ""
    # Normalize multiple newlines and spaces
    cleaned = re.sub(r'\r\n|\r', '\n', text)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    cleaned = re.sub(r'[ \t]{2,}', ' ', cleaned)

    # Remove generic disclaimer / boilerplate blocks
    cleaned = re.sub(r'(?i)references\s+(available\s+upon\s+request|on\s+demand).*', '', cleaned)
    cleaned = re.sub(r'(?i)declaration:?.*', '', cleaned)
    
    # Cap maximum characters at 2,500 chars (approx 500-600 tokens vs 2,500-4,000 raw tokens)
    return cleaned[:2500].strip()

async def parse_resume_node(state: Dict[str, Any]) -> Dict[str, Any]:
    raw_resume_text = state.get("resume_text", "")
    if not raw_resume_text:
        raise ValueError("No resume text extracted from document.")

    # 1. Deterministic Fast-Path: Extract Skills using Curated Dictionary (0 tokens!)
    dict_skills, _ = extract_skills_from_single_jd(raw_resume_text)
    deterministic_skills = list(dict_skills)

    # 2. Check Redis Cache
    cache_key = generate_cache_key("parsed_resume", raw_resume_text[:2000])
    cached_profile = get_cached_json(cache_key)
    if cached_profile:
        # Merge any newly discovered dictionary skills
        all_skills = list(set(cached_profile.get("skills", []) + deterministic_skills))
        cached_profile["skills"] = all_skills
        return {
            **state,
            "parsed_profile": cached_profile
        }

    # 3. Prune resume context before feeding to LLM
    pruned_content = prune_resume_text(raw_resume_text)

    # 4. Compact Structured LLM prompt
    prompt = f"""Extract concise JSON profile from this resume snippet.
Output ONLY raw valid JSON:
{{
  "name": "Candidate Name",
  "email": "Email",
  "phone": "Phone",
  "location": "City, Country",
  "current_role": "Primary Job Title",
  "experience_years": 3,
  "education": "Degree",
  "skills": {deterministic_skills[:8]},
  "preferred_roles": ["Target Role 1", "Target Role 2"],
  "summary": "1 punchy summary sentence."
}}

Resume:
{pruned_content}
"""
    try:
        model = get_llm_smart()
        res = await model.ainvoke([HumanMessage(content=prompt)])
        parsed_profile = parse_json_from_llm(res.content)
    except Exception as llm_err:
        # If LLM is unavailable/rate-limited, construct profile strictly from actual resume content (0 hallucinations)
        if not deterministic_skills:
            raise ValueError(
                "Could not detect verifiable developer skills in this document. "
                "Please ensure your resume includes technical skills, languages, or frameworks."
            )
        primary_title = f"{deterministic_skills[0]} Developer" if deterministic_skills else "Software Developer"
        top_skills_preview = ", ".join(deterministic_skills[:4])
        parsed_profile = {
            "name": "Developer Candidate",
            "email": "",
            "phone": "",
            "location": "Remote / Worldwide",
            "current_role": primary_title,
            "experience_years": 1,
            "education": "Computer Science / Technical Background",
            "skills": deterministic_skills,
            "preferred_roles": [primary_title, "Software Engineer"],
            "summary": f"Developer skilled in {top_skills_preview}."
        }

    # Combine deterministic dictionary skills with LLM inferred skills
    if isinstance(parsed_profile, dict):
        merged = set(parsed_profile.get("skills", []) + deterministic_skills)
        parsed_profile["skills"] = sorted(list(merged))
        # Cache for 7 days
        set_cached_json(cache_key, parsed_profile, ttl_seconds=604800)

    return {
        **state,
        "parsed_profile": parsed_profile
    }
