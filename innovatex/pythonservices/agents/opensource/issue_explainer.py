import asyncio
import json
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from utils.llm_client import get_gemini_model, parse_json_from_llm

async def issue_explainer_node(state: Dict[str, Any]) -> Dict[str, Any]:
    experience_level = state.get("experience_level", "beginner")
    filtered_repos = state.get("filtered_repos", [])
    issues_per_repo = state.get("issues_per_repo", {})

    model = get_gemini_model()

    async def explain_single_issue(repo: Dict[str, Any], issue: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""Explain this GitHub issue to a {experience_level} developer.

Repo: {repo.get('full_name')} (language: {repo.get('language')}, description: {repo.get('description')})
Issue title: {issue.get('title')}
Issue body: {issue.get('body')[:1000]}

Return ONLY valid JSON matching this exact schema:
{{
  "plain_explanation": "Explain what exactly needs to be done in simple, actionable language.",
  "difficulty": "easy",
  "skills_needed": ["skill1", "skill2"],
  "estimated_time": "2-4 hours",
  "good_for_learning": "What specific practical concept this contribution teaches you"
}}

difficulty must be one of: 'easy', 'medium', 'hard'.
Do not wrap with markdown or preamble.
"""
        try:
            res = await model.ainvoke([HumanMessage(content=prompt)])
            parsed = parse_json_from_llm(res.content)
            return {
                **issue,
                "repo_name": repo.get("full_name"),
                "repo_url": repo.get("html_url"),
                "repo_stars": repo.get("stars"),
                "language": repo.get("language"),
                "explanation": parsed
            }
        except Exception:
            return {
                **issue,
                "repo_name": repo.get("full_name"),
                "repo_url": repo.get("html_url"),
                "repo_stars": repo.get("stars"),
                "language": repo.get("language"),
                "explanation": {
                    "plain_explanation": issue.get("title"),
                    "difficulty": "easy" if experience_level == "beginner" else "medium",
                    "skills_needed": [repo.get("language") or "General"],
                    "estimated_time": "1-3 hours",
                    "good_for_learning": f"Working with {repo.get('language')} codebase and GitHub workflow"
                }
            }

    tasks = []
    for repo in filtered_repos:
        repo_issues = issues_per_repo.get(repo.get("full_name"), [])
        for issue in repo_issues[:2]:
            tasks.append(explain_single_issue(repo, issue))

    if tasks:
        # Run concurrently with gather
        explained_issues = await asyncio.gather(*tasks)
    else:
        explained_issues = []

    return {
        **state,
        "explained_issues": explained_issues
    }
