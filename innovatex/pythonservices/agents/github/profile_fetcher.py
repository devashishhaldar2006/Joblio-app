import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List
from utils.github_client import GitHubClient

async def fetch_profile_node(state: Dict[str, Any]) -> Dict[str, Any]:
    username = state["username"]
    client = GitHubClient()

    # 1. Fetch user profile, repositories, and public events concurrently
    user_res, repos_res, events_res = await asyncio.gather(
        client.get_user(username),
        client.get_user_repos(username, per_page=100),
        client.get_user_events(username, per_page=100)
    )

    login_name = user_res.get("login") or username

    # 2. Extract complete user profile fields
    raw_profile = {
        "name": user_res.get("name"),
        "display_name": user_res.get("name") or login_name,
        "login": login_name,
        "bio": user_res.get("bio"),
        "location": user_res.get("location"),
        "company": user_res.get("company"),
        "blog": user_res.get("blog"),
        "twitter_username": user_res.get("twitter_username"),
        "email": user_res.get("email"),
        "hireable": user_res.get("hireable"),
        "public_repos": user_res.get("public_repos", 0),
        "public_gists": user_res.get("public_gists", 0),
        "followers": user_res.get("followers", 0),
        "following": user_res.get("following", 0),
        "created_at": user_res.get("created_at"),
        "updated_at": user_res.get("updated_at"),
        "avatar_url": user_res.get("avatar_url"),
        "html_url": user_res.get("html_url")
    }

    # 3. Separate source repositories vs forks
    non_forked = [r for r in repos_res if not r.get("fork", False)]
    forked_repos = [r for r in repos_res if r.get("fork", False)]

    # Check for profile README repository (username/username)
    has_profile_readme = False
    profile_readme_text = None
    for r in repos_res:
        if (r.get("name") or "").lower() == login_name.lower():
            readme_txt = await client.get_readme_text(login_name, r.get("name"))
            if readme_txt and len(readme_txt.strip()) > 0:
                has_profile_readme = True
                profile_readme_text = readme_txt
            else:
                has_profile_readme = True
            break

    raw_profile["has_profile_readme"] = has_profile_readme
    raw_profile["profile_readme_length"] = len(profile_readme_text) if profile_readme_text else 0
    raw_profile["forked_repos_count"] = len(forked_repos)
    raw_profile["owned_repos_count"] = len(non_forked)

    # 4. Select candidate repositories for deep README + file tree inspection
    # Check remaining rate limit to avoid exhausting unauthenticated quota
    remaining_quota = client.last_rate_limit.get("remaining")
    is_authenticated = client.last_rate_limit.get("authenticated", False)
    max_deep_inspect = 10 if (is_authenticated or remaining_quota is None or remaining_quota > 30) else max(0, min(5, (remaining_quota - 5) // 2))

    # Prioritize by stars + recent pushes
    sorted_for_inspection = sorted(
        non_forked,
        key=lambda x: (x.get("stargazers_count", 0) * 3 + (1 if x.get("description") else 0), x.get("pushed_at") or ""),
        reverse=True
    )
    inspect_names = {r.get("name") for r in sorted_for_inspection[:max_deep_inspect] if r.get("name")}

    sem = asyncio.Semaphore(5)

    async def inspect_repo_details(repo_name: str):
        async with sem:
            readme_t, tree_d = await asyncio.gather(
                client.get_readme_text(login_name, repo_name),
                client.get_tree(login_name, repo_name)
            )
            return repo_name, readme_t, tree_d

    inspection_map: Dict[str, Dict[str, Any]] = {}
    if inspect_names:
        results = await asyncio.gather(*(inspect_repo_details(name) for name in inspect_names), return_exceptions=True)
        for item in results:
            if isinstance(item, tuple) and len(item) == 3:
                r_name, readme_t, tree_d = item
                tree_files = [
                    t.get("path", "") for t in (tree_d.get("tree") or [])
                    if isinstance(t, dict) and t.get("path")
                ]
                inspection_map[r_name] = {
                    "inspected": True,
                    "readme_text": readme_t,
                    "tree_files": tree_files[:300]
                }

    raw_repos: List[Dict[str, Any]] = []
    for r in non_forked:
        r_name = r.get("name")
        inspected_info = inspection_map.get(r_name, {"inspected": False, "readme_text": None, "tree_files": []})
        license_obj = r.get("license")
        license_name = license_obj.get("spdx_id") or license_obj.get("name") if isinstance(license_obj, dict) else None
        if license_name == "NOASSERTION":
            license_name = "Custom"

        raw_repos.append({
            "name": r_name,
            "full_name": r.get("full_name") or f"{login_name}/{r_name}",
            "description": r.get("description"),
            "homepage": r.get("homepage"),
            "language": r.get("language"),
            "stargazers_count": r.get("stargazers_count", 0),
            "watchers_count": r.get("watchers_count", 0),
            "forks_count": r.get("forks_count", 0),
            "open_issues_count": r.get("open_issues_count", 0),
            "size": r.get("size", 0),
            "archived": bool(r.get("archived", False)),
            "disabled": bool(r.get("disabled", False)),
            "has_issues": bool(r.get("has_issues", True)),
            "has_projects": bool(r.get("has_projects", False)),
            "has_wiki": bool(r.get("has_wiki", False)),
            "has_pages": bool(r.get("has_pages", False)),
            "has_discussions": bool(r.get("has_discussions", False)),
            "license": license_name,
            "created_at": r.get("created_at"),
            "updated_at": r.get("updated_at"),
            "pushed_at": r.get("pushed_at"),
            "topics": r.get("topics") or [],
            "visibility": r.get("visibility", "public"),
            "default_branch": r.get("default_branch", "main"),
            "html_url": r.get("html_url"),
            "inspected": inspected_info["inspected"],
            "readme_text": inspected_info["readme_text"],
            "tree_files": inspected_info["tree_files"]
        })

    return {
        **state,
        "raw_profile": raw_profile,
        "raw_repos": raw_repos,
        "raw_events": events_res or [],
        "rate_limit": client.last_rate_limit,
        "fetched_at": datetime.now(timezone.utc).isoformat()
    }
