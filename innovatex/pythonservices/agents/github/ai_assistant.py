import json
from typing import Dict, Any, Optional
from langchain_core.messages import HumanMessage, SystemMessage
from utils.llm_config import get_llm_fast


def _find_repo(report: Dict[str, Any], target_repo: Optional[str]) -> Dict[str, Any]:
    repos = report.get("repositories") or report.get("repo_analysis", {}).get("repositories") or report.get("best_repos") or []
    if target_repo:
        for r in repos:
            if (r.get("name") or "").lower() == target_repo.lower():
                return r
    return repos[0] if repos else {}


def _build_deterministic_fallback(action_type: str, report: Dict[str, Any], repo: Dict[str, Any]) -> str:
    username = report.get("username") or "developer"
    display_name = report.get("display_name") or report.get("name") or username
    top_langs = report.get("top_languages") or []
    techs = [t.get("name") for t in (report.get("detected_technologies") or [])[:8] if t.get("name")]
    featured = report.get("featured_candidates") or report.get("best_repos") or []
    repo_name = repo.get("name") or "Project"
    repo_lang = repo.get("language") or (top_langs[0] if top_langs else "Software")
    repo_techs = repo.get("detected_technologies") or [repo_lang]
    repo_desc = repo.get("description") or f"A {repo_lang} engineering repository by @{username}."
    dirs = (repo.get("engineering") or {}).get("top_level_dirs") or ["src"]

    if action_type == "ci_workflow":
        return f"""name: CI Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Runtime ({repo_lang})
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Linter & Static Analysis
        run: npm run lint --if-present

      - name: Run Test Suite
        run: npm test --if-present
"""

    if action_type == "contributing_guide":
        return f"""# Contributing to {repo_name}

Thank you for your interest in contributing to {repo_name}! We welcome contributions from developers of all skill levels.

## Development Setup
1. Fork the repository on GitHub.
2. Clone your local fork:
   ```bash
   git clone https://github.com/{username}/{repo_name}.git
   cd {repo_name}
   ```
3. Install project dependencies:
   ```bash
   npm install
   ```

## Branching & Commit Guidelines
- Create a dedicated feature branch: `git checkout -b feat/your-feature-name`
- Follow Conventional Commits format: `feat:`, `fix:`, `docs:`, `refactor:`

## Submitting Pull Requests
- Ensure all tests pass prior to pushing.
- Link relevant issues in your PR description.
"""

    if action_type == "profile_bio":
        stack_str = ", ".join((techs or top_langs)[:4]) or "Full-Stack Software"
        dna_top = (report.get("developer_dna") or [{}])[0].get("category", "Software Engineering")
        return f"Software Engineer focused on {dna_top} • Building with {stack_str}."

    if action_type == "profile_readme":
        feat_items = []
        for r in featured[:4]:
            r_url = r.get("html_url") or f"https://github.com/{username}/{r.get('name', '')}"
            r_lang = r.get("language") or "Code"
            r_desc = r.get("description") or "Public source repository"
            feat_items.append(f"- **[{r.get('name')}]({r_url})** ({r_lang}) — {r_desc}")
        feat_lines = "\n".join(feat_items) or "- Public engineering repositories coming soon."
        return f"""# {display_name} (@{username})

{report.get('bio') or f'Software Engineer building systems with {", ".join((techs or top_langs)[:5]) or "modern web & backend technologies"}.'}

### Technical Stack & Ecosystems
- **Languages:** {', '.join(top_langs) or 'Not specified'}
- **Technologies Detected:** {', '.join(techs) or 'Not specified'}

### Featured Projects
{feat_lines}

### Public Links
- **GitHub:** [github.com/{username}](https://github.com/{username})
{f"- **Website:** [{report.get('blog')}]({report.get('blog')})" if report.get('blog') else ""}
"""

    if action_type == "project_highlights":
        lines = []
        for r in featured[:3]:
            reasons = ", ".join((r.get("standout_reasons") or [])[:3]) or "Core source repository"
            lines.append(f"### {r.get('name')} ({r.get('language') or 'Multi-language'})\n- **Summary:** {r.get('description') or 'Engineering implementation.'}\n- **Key Signals:** {reasons}\n- **Repository:** {r.get('html_url')}")
        return "\n\n".join(lines) if lines else "No featured repositories available yet."

    if action_type == "repo_description":
        return f"{repo_name}: {repo_lang} application built with {', '.join(repo_techs[:3])}."

    if action_type == "repo_topics":
        tags = [t.lower().replace(" ", "-").replace(".", "") for t in repo_techs[:6]]
        if repo_lang and repo_lang.lower() not in tags:
            tags.insert(0, repo_lang.lower())
        return ", ".join(dict.fromkeys(tags))

    if action_type == "repo_summary":
        return f"""### {repo_name} — Engineering Overview
- **Primary Language:** {repo_lang}
- **Detected Stack:** {', '.join(repo_techs)}
- **Lifecycle State:** {repo.get('lifecycle_state', 'Active')}
- **Top-Level Structure:** {', '.join(dirs)}
- **Summary:** {repo_desc}"""

    # Default: repo_readme
    return f"""# {repo_name}

{repo_desc}

## Overview

`{repo_name}` is a {repo_lang} project developed by [@{username}](https://github.com/{username}).

## Tech Stack

- **Primary Language:** {repo_lang}
- **Detected Technologies:** {', '.join(repo_techs)}

## Project Structure

```text
{repo_name}/
{chr(10).join(f'├── {d}/' for d in dirs[:6])}
└── README.md
```

## Getting Started

### Prerequisites

Ensure you have the required runtime and package manager for **{repo_lang}** installed.

### Installation

```bash
git clone https://github.com/{username}/{repo_name}.git
cd {repo_name}
```

## Usage

Refer to the main entry point in `{dirs[0] if dirs else 'src'}` to configure environment variables and launch the application.

## License

Distributed under an open-source license. See `LICENSE` for more information.
"""


async def generate_ai_fix(
    action_type: str,
    report: Dict[str, Any],
    target_repo: Optional[str] = None,
    custom_instructions: Optional[str] = None
) -> Dict[str, Any]:
    repo = _find_repo(report, target_repo)
    username = report.get("username") or "developer"

    context_summary = {
        "username": username,
        "display_name": report.get("display_name") or report.get("name"),
        "bio": report.get("bio"),
        "location": report.get("location"),
        "company": report.get("company"),
        "blog": report.get("blog"),
        "top_languages": report.get("top_languages", []),
        "detected_technologies": [t.get("name") for t in (report.get("detected_technologies") or [])[:12]],
        "developer_dna": [
            {"category": d.get("category"), "strength": d.get("strength"), "repos": d.get("repositories", [])[:4]}
            for d in (report.get("developer_dna") or [])[:4]
        ],
        "featured_candidates": [
            {
                "name": r.get("name"),
                "description": r.get("description"),
                "language": r.get("language"),
                "technologies": r.get("detected_technologies", []),
                "standout_reasons": r.get("standout_reasons", []),
                "html_url": r.get("html_url")
            }
            for r in (report.get("featured_candidates") or report.get("best_repos") or [])[:5]
        ]
    }

    repo_context = {
        "name": repo.get("name"),
        "description": repo.get("description"),
        "language": repo.get("language"),
        "detected_technologies": repo.get("detected_technologies", []),
        "top_level_dirs": (repo.get("engineering") or {}).get("top_level_dirs", []),
        "file_count": (repo.get("engineering") or {}).get("file_count", 0),
        "has_tests": (repo.get("engineering") or {}).get("has_tests", False),
        "has_ci": (repo.get("engineering") or {}).get("has_ci", False),
        "has_docker": (repo.get("engineering") or {}).get("has_docker", False),
        "is_fullstack": (repo.get("engineering") or {}).get("is_fullstack", False),
        "missing_readme_sections": (repo.get("readme") or {}).get("missing", []),
        "html_url": repo.get("html_url")
    } if repo else {}

    task_prompts = {
        "profile_readme": f"Generate a clean, factual, high-signal GitHub Profile README.md (`{username}/{username}`) using ONLY the real profile data, detected technologies, and featured repositories provided. Do not invent fake metrics, awards, or unverified claims.",
        "profile_bio": "Generate 3 concise, factual GitHub Bio options (each under 160 characters) tailored to this developer's actual detected technologies and repository focus.",
        "project_highlights": "Generate structured portfolio/resume project highlights for the developer's top repositories based strictly on observable technologies and engineering signals.",
        "repo_readme": f"Generate a production-quality, well-structured README.md for repository `{repo_context.get('name')}`. Include Overview, Tech Stack, Architecture/Directory Structure (using actual `top_level_dirs`), Getting Started / Installation, Usage, and Contributing sections. Do not fabricate non-existent features.",
        "repo_description": f"Generate 3 crisp, high-signal 1-sentence GitHub repository descriptions (each under 120 characters) for `{repo_context.get('name')}` based on its actual language and detected technologies.",
        "repo_topics": f"Generate 6 to 8 accurate lowercase GitHub topic tags (comma-separated) for repository `{repo_context.get('name')}` based on its language, frameworks, and domain.",
        "repo_summary": f"Generate a concise technical architecture & engineering summary for `{repo_context.get('name')}` suitable for a project showcase or technical interview."
    }

    instruction_text = task_prompts.get(action_type, task_prompts["repo_readme"])
    if custom_instructions:
        instruction_text += f"\nAdditional user instructions: {custom_instructions}"

    system_msg = (
        "You are a precise Developer Intelligence assistant. "
        "Never invent fake stars, fake achievements, or unsupported technologies. "
        "Ground all generated content strictly in the provided JSON telemetry. "
        "Output clean Markdown or text directly without wrapping the entire response in outer ```markdown fences."
    )
    user_msg = f"""Task: {instruction_text}

Developer Context:
{json.dumps(context_summary, indent=2, default=str)}

Target Repository Context:
{json.dumps(repo_context, indent=2, default=str)}
"""

    try:
        model = get_llm_fast(temperature=0.25)
        res = await model.ainvoke([SystemMessage(content=system_msg), HumanMessage(content=user_msg)])
        content = (res.content or "").strip()
        if content.startswith("```markdown"):
            content = content[len("```markdown"):].strip()
            if content.endswith("```"):
                content = content[:-3].strip()
        elif content.startswith("```") and content.endswith("```"):
            content = content[3:-3].strip()
        if not content:
            content = _build_deterministic_fallback(action_type, report, repo)
    except Exception:
        content = _build_deterministic_fallback(action_type, report, repo)

    return {
        "actionType": action_type,
        "targetRepo": repo.get("name") if repo else None,
        "content": content,
        "basedOn": {
            "username": username,
            "repository": repo.get("name") if repo else None,
            "technologies": repo_context.get("detected_technologies") or context_summary["detected_technologies"][:6]
        }
    }


async def answer_ai_command(
    query: str,
    report: Dict[str, Any],
    changes: Optional[list] = None
) -> Dict[str, Any]:
    if not report or not report.get("username"):
        return {
            "query": query,
            "answer": "No GitHub profile is currently loaded in the workspace. Connect and sync a GitHub username first so I can analyze real repository and profile evidence.",
            "evidence": [],
            "suggestedActions": []
        }

    username = report.get("username")
    compact_context = {
        "username": username,
        "overallScore": report.get("overall_score"),
        "methodologyVersion": report.get("methodologyVersion", "v2.1"),
        "confidenceLabel": report.get("confidenceLabel"),
        "dimensions": [
            {
                "dimension": d.get("dimension"),
                "score": d.get("score"),
                "maxScore": d.get("maxScore"),
                "percentage": d.get("percentage"),
                "primaryIssue": d.get("primaryIssue"),
                "reasons": d.get("reasons", [])
            }
            for d in (report.get("dimensions") or [])
        ],
        "projection": report.get("projection"),
        "languageDistribution": report.get("language_distribution", []),
        "detectedTechnologies": report.get("detected_technologies", [])[:12],
        "developerDna": report.get("developer_dna", []),
        "repositories": [
            {
                "name": r.get("name"),
                "language": r.get("language"),
                "healthScore": r.get("health_score"),
                "depthClassification": r.get("depth_classification"),
                "lifecycleState": r.get("lifecycle_state"),
                "stars": r.get("stargazers_count"),
                "readmeScore": (r.get("readme") or {}).get("score"),
                "gaps": r.get("gaps", []),
                "standoutReasons": r.get("standout_reasons", [])
            }
            for r in (report.get("repositories") or [])[:15]
        ],
        "topRecommendations": [
            {
                "title": rec.get("title"),
                "severity": rec.get("severity"),
                "category": rec.get("category"),
                "observation": rec.get("observation"),
                "estimatedBenefit": rec.get("estimatedBenefit")
            }
            for rec in (report.get("recommendations") or [])[:6]
        ],
        "recentChanges": changes or report.get("changes") or []
    }

    system_msg = (
        "You are the GitHub Developer Intelligence AI Command Center. "
        "Answer the user's question concisely, factually, and analytically using ONLY the provided GitHub telemetry. "
        "Distinguish observation from interpretation and recommendation. "
        "Never invent repositories, stars, commits, or missing data. "
        "Format with clear Markdown bullet points and bold key repository names and numbers."
    )
    user_msg = f"""User Question: {query}

Analyzed GitHub Snapshot (@{username}):
{json.dumps(compact_context, indent=2, default=str)}
"""

    try:
        model = get_llm_fast(temperature=0.15)
        res = await model.ainvoke([SystemMessage(content=system_msg), HumanMessage(content=user_msg)])
        answer_text = (res.content or "").strip()
    except Exception:
        # Deterministic analytical fallback if LLM is unreachable
        dims = compact_context["dimensions"]
        weakest_dims = sorted(dims, key=lambda d: d.get("percentage", 0))[:2]
        weakest_repos = sorted(compact_context["repositories"], key=lambda r: r.get("healthScore", 0))[:3]
        top_recs = compact_context["topRecommendations"][:3]
        answer_text = (
            f"### Analytical Summary for @{username} (Score: {compact_context['overallScore']}/100)\n\n"
            f"- **Lowest Scoring Dimensions:** " +
            ", ".join(f"**{d['dimension']}** ({d['score']}/{d['maxScore']} — {d['primaryIssue']})" for d in weakest_dims) + "\n"
            f"- **Repositories Needing Attention:** " +
            (", ".join(f"**{r['name']}** ({r['healthScore']}/100)" for r in weakest_repos) or "None") + "\n"
            f"- **Top Priority Actions:** " +
            ("; ".join(f"{r['title']} ({r['estimatedBenefit']})" for r in top_recs) or "None")
        )

    return {
        "query": query,
        "username": username,
        "answer": answer_text,
        "methodologyVersion": compact_context["methodologyVersion"]
    }
