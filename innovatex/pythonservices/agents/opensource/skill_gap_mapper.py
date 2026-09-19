import json
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from utils.llm_client import get_gemini_model, parse_json_from_llm

async def skill_gap_mapper_node(state: Dict[str, Any]) -> Dict[str, Any]:
    skills = state.get("skills", [])
    explained_issues = state.get("explained_issues", [])

    if not explained_issues:
        return {
            **state,
            "repo_recommendations": []
        }

    # Prepare compact issues summary
    issues_summary = []
    for item in explained_issues:
        issues_summary.append({
            "repo_name": item.get("repo_name"),
            "repo_url": item.get("repo_url"),
            "repo_stars": item.get("repo_stars"),
            "language": item.get("language"),
            "issue_title": item.get("title"),
            "issue_url": item.get("html_url"),
            "issue_number": item.get("number"),
            "explanation": item.get("explanation", {})
        })

    prompt = f"""Given developer skills: {json.dumps(skills)}
And these open source opportunities: {json.dumps(issues_summary, default=str)}

Return ONLY a valid JSON array where each item has:
{{
  "repo_name": string,
  "repo_url": string,
  "repo_stars": number,
  "language": string,
  "issue_title": string,
  "issue_url": string,
  "issue_number": number,
  "match_score": integer (0 to 100 based on overlap between user skills and issue needs),
  "skills_overlap": array of strings (skills developer has that apply),
  "skills_to_learn": array of strings (valuable new concepts this teaches),
  "why_good_fit": string (exactly 1 sentence personalized reason)
}}

Sort the array strictly by match_score descending. Return top 8 items.
Do not wrap with markdown blocks or include comments.
"""
    model = get_gemini_model()
    try:
        res = await model.ainvoke([HumanMessage(content=prompt)])
        repo_recommendations = parse_json_from_llm(res.content)
    except Exception:
        # Fallback generator
        repo_recommendations = []
        for idx, item in enumerate(issues_summary[:8]):
            repo_recommendations.append({
                "repo_name": item.get("repo_name"),
                "repo_url": item.get("repo_url"),
                "repo_stars": item.get("repo_stars", 0),
                "language": item.get("language", "Code"),
                "issue_title": item.get("issue_title"),
                "issue_url": item.get("issue_url"),
                "issue_number": item.get("issue_number", 1),
                "match_score": 90 - (idx * 5),
                "skills_overlap": skills[:2] if skills else [item.get("language", "Dev")],
                "skills_to_learn": item.get("explanation", {}).get("skills_needed", ["Git Workflow"]),
                "why_good_fit": f"Matches your target stack and is designed for developer onboarding."
            })

    return {
        **state,
        "repo_recommendations": repo_recommendations
    }
