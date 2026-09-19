import json
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from utils.llm_client import get_gemini_model, parse_json_from_llm

async def build_queries_node(state: Dict[str, Any]) -> Dict[str, Any]:
    parsed_profile = state.get("parsed_profile", {})

    prompt = f"""Generate exactly 5 optimized job search queries for JSearch API.
Candidate: {json.dumps(parsed_profile, default=str)}

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
    model = get_gemini_model()
    try:
        res = await model.ainvoke([HumanMessage(content=prompt)])
        queries = parse_json_from_llm(res.content)
        if not isinstance(queries, list) or len(queries) == 0:
            raise ValueError()
    except Exception:
        skills = parsed_profile.get("skills", ["Developer"])
        primary_skill = skills[0] if skills else "Software"
        roles = parsed_profile.get("preferred_roles", ["Software Engineer"])
        queries = [
            f"{roles[0] if roles else 'Software Engineer'} {primary_skill} Remote",
            f"Full Stack Developer {primary_skill}",
            f"Software Engineer React Node",
            f"Backend Engineer Python",
            f"Junior Software Developer"
        ]

    return {
        **state,
        "search_queries": queries[:5]
    }
