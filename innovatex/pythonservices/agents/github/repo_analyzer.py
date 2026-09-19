from datetime import datetime, timezone
from collections import Counter
from typing import Dict, Any, List

def analyze_repos_node(state: Dict[str, Any]) -> Dict[str, Any]:
    raw_repos: List[Dict[str, Any]] = state.get("raw_repos", [])
    now = datetime.now(timezone.utc)

    languages = []
    total_stars = 0
    total_forks = 0
    total_size = 0
    repos_with_desc = 0
    repos_with_topics = 0
    repos_with_open_issues = 0
    repos_pushed_30d = 0
    repos_pushed_90d = 0

    push_dates = []

    for r in raw_repos:
        total_stars += r.get("stargazers_count", 0)
        total_forks += r.get("forks_count", 0)
        total_size += r.get("size", 0)

        if r.get("description"):
            repos_with_desc += 1

        if r.get("topics") and len(r.get("topics")) > 0:
            repos_with_topics += 1

        if r.get("open_issues_count", 0) > 0:
            repos_with_open_issues += 1

        lang = r.get("language")
        if lang:
            languages.append(lang)

        pushed_at_str = r.get("pushed_at")
        if pushed_at_str:
            try:
                p_date = datetime.fromisoformat(pushed_at_str.replace("Z", "+00:00"))
                push_dates.append(p_date)
                diff_days = (now - p_date).days
                if diff_days <= 30:
                    repos_pushed_30d += 1
                if diff_days <= 90:
                    repos_pushed_90d += 1
            except Exception:
                pass

    total_repos = len(raw_repos)
    lang_counter = Counter(languages)
    top_languages = [item[0] for item in lang_counter.most_common(3)]
    language_distribution = [
        {"name": k, "count": v, "percentage": round((v / len(languages) * 100), 1) if languages else 0}
        for k, v in lang_counter.most_common(5)
    ]

    # Calculate longest contribution streak proxy from sorted push dates
    push_dates.sort()
    longest_streak = 0
    current_streak = 0
    last_date = None
    for d in push_dates:
        if last_date is None:
            current_streak = 1
        else:
            diff = (d.date() - last_date.date()).days
            if diff == 1:
                current_streak += 1
            elif diff > 1:
                current_streak = 1
        if current_streak > longest_streak:
            longest_streak = current_streak
        last_date = d

    # Best 3 repos by stars
    sorted_repos = sorted(raw_repos, key=lambda x: x.get("stargazers_count", 0), reverse=True)
    best_repos = sorted_repos[:3]

    repo_analysis = {
        "total_repos": total_repos,
        "total_stars": total_stars,
        "total_forks": total_forks,
        "avg_repo_size": round(total_size / total_repos, 1) if total_repos > 0 else 0,
        "repos_with_desc": repos_with_desc,
        "desc_percentage": round((repos_with_desc / total_repos) * 100, 1) if total_repos > 0 else 0,
        "repos_with_topics": repos_with_topics,
        "topics_percentage": round((repos_with_topics / total_repos) * 100, 1) if total_repos > 0 else 0,
        "repos_with_open_issues": repos_with_open_issues,
        "repos_pushed_30d": repos_pushed_30d,
        "repos_pushed_90d": repos_pushed_90d,
        "top_languages": top_languages,
        "language_distribution": language_distribution,
        "unique_languages_count": len(lang_counter),
        "longest_streak_days": longest_streak,
        "best_repos": best_repos
    }

    return {
        **state,
        "repo_analysis": repo_analysis
    }
