from typing import Dict, Any
from langchain_core.messages import HumanMessage
from utils.llm_config import get_llm_fast
from utils.llm_client import parse_json_from_llm

async def review_pr_code(user_code: str, issue_url: str, original_code: str = "") -> Dict[str, Any]:
    model = get_llm_fast()
    prompt = f"""You are a strict but encouraging open source maintainer reviewing a pull request.

Issue Context / URL: {issue_url}
Original code context:
{original_code or "(Not provided / new implementation)"}

Contributor's solution:
{user_code}

Review this thoroughly as a real maintainer would. Return ONLY valid JSON:
{{
  "verdict": "approve",
  "overall_feedback": "Detailed paragraph explaining the quality and architecture of the PR.",
  "good_things": [
    "Highlight 1",
    "Highlight 2"
  ],
  "issues": [
    {{
      "type": "bug",
      "description": "Specific issue description",
      "suggestion": "How to resolve it",
      "line_hint": "Near logic handling null values or edge cases"
    }}
  ],
  "revised_code_suggestion": "Complete corrected clean code ready to copy-paste",
  "ready_to_submit": true
}}

verdict must be one of: 'approve', 'request_changes', 'needs_work'.
issue type must be one of: 'bug', 'style', 'logic', 'performance'.
Do not wrap with markdown code blocks.
"""
    res = await model.ainvoke([HumanMessage(content=prompt)])
    return parse_json_from_llm(res.content)
