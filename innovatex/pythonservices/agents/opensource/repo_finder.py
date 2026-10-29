import asyncio
from typing import Dict, Any, List
from utils.github_client import GitHubClient

async def repo_finder_node(state: Dict[str, Any]) -> Dict[str, Any]:
    preferred_language = state.get("preferred_language", "javascript").lower()
    experience_level = state.get("experience_level", "beginner").lower()
    custom_query = (state.get("query") or "").strip()

    client = GitHubClient()

    # Determine star range based on experience level
    if experience_level == "beginner":
        star_filter = "stars:100..2500"
    elif experience_level == "intermediate":
        star_filter = "stars:2000..10000"
    else:
        star_filter = "stars:>5000"

    if custom_query:
        query = f"{custom_query} language:{preferred_language} {star_filter} good-first-issues:>0"
    else:
        query = f"language:{preferred_language} {star_filter} good-first-issues:>1"
    raw_repos = await client.search_repositories(query=query, sort="updated", per_page=10)

    # Concurrently fetch open 'good first issue' issues for these repos
    async def fetch_issues(repo: Dict[str, Any]):
        owner = repo.get("owner", {}).get("login")
        repo_name = repo.get("name")
        if not owner or not repo_name:
            return repo, []
        issues = await client.get_repo_issues(owner, repo_name, labels="good first issue", state="open", per_page=3)
        # Exclude pull requests which also count as issues in GitHub REST API
        real_issues = [i for i in issues if "pull_request" not in i]
        return repo, real_issues

    repo_issues_pairs = await asyncio.gather(*[fetch_issues(r) for r in raw_repos])

    filtered_repos = []
    issues_per_repo = {}

    for repo, issues in repo_issues_pairs:
        if len(issues) > 0:
            full_name = repo.get("full_name")
            filtered_repos.append({
                "id": repo.get("id"),
                "full_name": full_name,
                "name": repo.get("name"),
                "owner": repo.get("owner", {}).get("login"),
                "description": repo.get("description"),
                "stars": repo.get("stargazers_count", 0),
                "language": repo.get("language") or preferred_language,
                "html_url": repo.get("html_url"),
                "updated_at": repo.get("updated_at")
            })
            issues_per_repo[full_name] = [
                {
                    "id": i.get("id"),
                    "number": i.get("number"),
                    "title": i.get("title"),
                    "body": (i.get("body") or "")[:500],
                    "html_url": i.get("html_url"),
                    "created_at": i.get("created_at")
                }
                for i in issues[:2]
            ]

    # Keep top 6 repos by stars
    filtered_repos = sorted(filtered_repos, key=lambda x: x["stars"], reverse=True)[:6]

    return {
        **state,
        "raw_repos": raw_repos,
        "filtered_repos": filtered_repos,
        "issues_per_repo": issues_per_repo
    }
