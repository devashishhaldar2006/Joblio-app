import json
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from utils.llm_config import get_llm_smart
from utils.llm_client import parse_json_from_llm

async def build_queries_node(state: Dict[str, Any]) -> Dict[str, Any]:
    parsed_profile = state.get("parsed_profile", {})
    query_override = state.get("query_override")
    location_override = state.get("location_override")

    user_hint = ""
    if query_override:
        user_hint += f"\nUser specifically requested search role/keywords: '{query_override}'."
    if location_override:
        user_hint += f"\nUser specifically requested location: '{location_override}'."

    prompt = f"""Generate exactly 5 optimized job search queries for JSearch API.
Candidate: {json.dumps(parsed_profile, default=str)}{user_hint}

Return ONLY a JSON array of 5 strings.
Each query must combine role + top skill + preferred location, for example:
[
  "Full Stack Developer React Node.js Remote",
  "Python Backend Engineer FastAPI Remote",
  "Software Engineer Python AWS",
  "Frontend Developer React TypeScript",
  "AI Engineer Python LLM"
]
Do not wrap with markdown or commentary.
"""
    model = get_llm_smart()
    queries = []
    try:
        res = await model.ainvoke([HumanMessage(content=prompt)])
        parsed = parse_json_from_llm(res.content)
        if isinstance(parsed, list) and len(parsed) > 0:
            queries = [q for q in parsed if isinstance(q, str)]
    except Exception:
        pass

    if not queries:
        skills = parsed_profile.get("skills", ["Developer"])
        primary_skill = skills[0] if skills else "Software"
        roles = parsed_profile.get("preferred_roles", ["Software Engineer"])
        target_role = query_override or (roles[0] if roles else 'Software Engineer')
        target_loc = location_override or 'Remote'
        queries = [
            f"{target_role} {primary_skill} {target_loc}",
            f"{target_role} {primary_skill}",
            f"Full Stack Developer {primary_skill}",
            f"Software Engineer React Node",
            f"Backend Engineer Python"
        ]

    # If user provided a specific query, ensure it is in the first position
    if query_override:
        custom_query = f"{query_override} {location_override or ''}".strip()
        if custom_query not in queries:
            queries = [custom_query] + [q for q in queries if q != custom_query]

    return {
        **state,
        "search_queries": queries[:5]
    }
