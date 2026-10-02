import base64
from typing import Dict, Any
from langchain_core.messages import HumanMessage
from utils.github_client import GitHubClient
from utils.llm_config import get_llm_fast
from utils.llm_client import parse_json_from_llm

async def generate_pr_guide(issue_url: str, repo_name: str, issue_number: int) -> Dict[str, Any]:
    client = GitHubClient()
    parts = repo_name.split("/")
    if len(parts) != 2:
        raise ValueError("repo_name must be in owner/repo format")
    owner, repo = parts[0], parts[1]

    # Fetch issue details, tree, and readme
    issue_data = await client.get_issue(owner, repo, issue_number)
    tree_data = await client.get_tree(owner, repo)
    readme_data = await client.get_readme(owner, repo)

    readme_content = ""
    if readme_data and "content" in readme_data:
        try:
            readme_content = base64.b64decode(readme_data["content"]).decode("utf-8", errors="ignore")[:600]
        except Exception:
            readme_content = ""

    # Filter file paths from tree
    all_paths = [item.get("path") for item in tree_data.get("tree", []) if item.get("type") == "blob"][:150]

    # Ask LLM which 2-3 files are most relevant to inspect
    model = get_llm_fast()
    find_files_prompt = f"""Given this issue:
Title: {issue_data.get('title')}
Description: {issue_data.get('body', '')[:600]}

And this list of repository files:
{all_paths[:60]}

Pick top 2 files most likely needing changes. Return ONLY a JSON array of strings, e.g. ["src/index.js", "src/utils.js"]."""

    relevant_files_sample = {}
    try:
        f_res = await model.ainvoke([HumanMessage(content=find_files_prompt)])
        selected_paths = parse_json_from_llm(f_res.content)
        for p in selected_paths[:2]:
            c_data = await client.get_contents(owner, repo, p)
            if c_data and "content" in c_data:
                try:
                    f_text = base64.b64decode(c_data["content"]).decode("utf-8", errors="ignore")
                    relevant_files_sample[p] = f_text[:1200]
                except Exception:
                    pass
    except Exception:
        pass

    prompt = f"""You are a senior open source maintainer guiding a first-time contributor.

Issue: {issue_data.get('title')}
Issue description: {issue_data.get('body', '')[:1000]}
Repo README summary: {readme_content}
File tree paths sample: {all_paths[:40]}
Relevant file snippets: {relevant_files_sample}

Generate a comprehensive step-by-step first PR guide. Return ONLY valid JSON matching this schema:
{{
  "setup_steps": [
    "git clone https://github.com/YOUR_USERNAME/{repo}.git",
    "cd {repo}",
    "npm install (or equivalent language setup command)"
  ],
  "files_to_edit": [
    {{
      "file_path": "path/to/target/file",
      "reason": "Why this file contains the logic to update",
      "what_to_change": "Specific function or logic to modify"
    }}
  ],
  "implementation_hints": [
    "Key pointer 1",
    "Key pointer 2"
  ],
  "pr_title_suggestion": "fix(core): descriptive title referencing issue #{issue_number}",
  "pr_description_template": "## Description\\nBrief explanation of fixes\\n\\nCloses #{issue_number}",
  "things_to_avoid": [
    "Do not modify unrelated formatting or configs",
    "Make sure test suite passes before pushing"
  ],
  "estimated_difficulty": "easy"
}}
"""
    res = await model.ainvoke([HumanMessage(content=prompt)])
    return parse_json_from_llm(res.content)
