import asyncio
from typing import Dict, Any
from utils.github_client import GitHubClient

async def fetch_profile_node(state: Dict[str, Any]) -> Dict[str, Any]:
    username = state["username"]
    client = GitHubClient()

    # Fetch user profile and repos concurrently
    user_res, repos_res = await asyncio.gather(
        client.get_user(username),
        client.get_user_repos(username, per_page=100)
    )

    # Extract user fields
    raw_profile = {
        "name": user_res.get("name") or user_res.get("login"),
        "login": user_res.get("login"),
        "bio": user_res.get("bio"),
        "location": user_res.get("location"),
        "company": user_res.get("company"),
        "blog": user_res.get("blog"),
        "public_repos": user_res.get("public_repos", 0),
        "followers": user_res.get("followers", 0),
        "following": user_res.get("following", 0),
        "created_at": user_res.get("created_at"),
        "updated_at": user_res.get("updated_at"),
        "avatar_url": user_res.get("avatar_url"),
        "html_url": user_res.get("html_url")
    }

    # Process repos - filter out forks and gather details
    non_forked = [r for r in repos_res if not r.get("fork", False)]

    # Check for user profile README repo (e.g. username/username)
    has_profile_readme = False
    for r in non_forked:
        if r.get("name", "").lower() == username.lower():
            has_profile_readme = True
            break

    raw_profile["has_profile_readme"] = has_profile_readme

    raw_repos = []
    for r in non_forked:
        raw_repos.append({
            "name": r.get("name"),
            "description": r.get("description"),
            "language": r.get("language"),
            "stargazers_count": r.get("stargazers_count", 0),
            "forks_count": r.get("forks_count", 0),
            "open_issues_count": r.get("open_issues_count", 0),
            "size": r.get("size", 0),
            "created_at": r.get("created_at"),
            "updated_at": r.get("updated_at"),
            "pushed_at": r.get("pushed_at"),
            "topics": r.get("topics", []),
            "default_branch": r.get("default_branch", "main"),
            "html_url": r.get("html_url")
        })

    return {
        **state,
        "raw_profile": raw_profile,
        "raw_repos": raw_repos
    }
