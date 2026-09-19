from typing import Dict, Any

def calculate_score_node(state: Dict[str, Any]) -> Dict[str, Any]:
    raw_profile = state.get("raw_profile", {})
    repo_analysis = state.get("repo_analysis", {})

    # 1. Profile Completeness (max 25 pts)
    # Bio: +5, Location: +4, Company: +3, Blog/link: +5, Profile README: +8
    completeness = 0
    if raw_profile.get("bio"):
        completeness += 5
    if raw_profile.get("location"):
        completeness += 4
    if raw_profile.get("company"):
        completeness += 3
    if raw_profile.get("blog"):
        completeness += 5
    if raw_profile.get("has_profile_readme"):
        completeness += 8

    # 2. Repository Quality (max 35 pts)
    # Avg stars, % with desc, % with topics, language diversity
    total_repos = repo_analysis.get("total_repos", 0)
    total_stars = repo_analysis.get("total_stars", 0)
    desc_pct = repo_analysis.get("desc_percentage", 0)
    topics_pct = repo_analysis.get("topics_percentage", 0)
    unique_langs = repo_analysis.get("unique_languages_count", 0)

    quality = 0
    # Description coverage: up to 10 pts
    quality += (desc_pct / 100.0) * 10.0

    # Topics coverage: up to 8 pts
    quality += (topics_pct / 100.0) * 8.0

    # Stars scaling: up to 10 pts (10+ stars = full marks, 1-9 proportional)
    stars_score = min(10.0, (total_stars / 10.0) * 10.0)
    quality += stars_score

    # Language diversity: up to 7 pts (>= 3 langs gives full 7, 2 langs = 4, 1 lang = 2)
    if unique_langs >= 3:
        quality += 7
    elif unique_langs == 2:
        quality += 4
    elif unique_langs == 1:
        quality += 2

    quality = min(35.0, round(quality, 1))

    # 3. Activity & Consistency (max 25 pts)
    # Repos pushed in last 30 days & 90 days
    pushed_30d = repo_analysis.get("repos_pushed_30d", 0)
    pushed_90d = repo_analysis.get("repos_pushed_90d", 0)
    streak = repo_analysis.get("longest_streak_days", 0)

    activity = 0
    if pushed_30d >= 3:
        activity += 12
    elif pushed_30d >= 1:
        activity += 8

    if pushed_90d >= 5:
        activity += 8
    elif pushed_90d >= 2:
        activity += 5

    # Streak bonus
    activity += min(5, streak)
    activity = min(25.0, round(activity, 1))

    # 4. Community Impact (max 15 pts)
    # Followers, total stars, total forks
    followers = raw_profile.get("followers", 0)
    total_forks = repo_analysis.get("total_forks", 0)

    community = 0
    community += min(6.0, (followers / 20.0) * 6.0)
    community += min(5.0, (total_stars / 20.0) * 5.0)
    community += min(4.0, (total_forks / 10.0) * 4.0)
    community = min(15.0, round(community, 1))

    overall = round(completeness + quality + activity + community)

    profile_score = {
        "overall_score": overall,
        "completeness_score": round(completeness),
        "quality_score": round(quality),
        "activity_score": round(activity),
        "community_score": round(community)
    }

    return {
        **state,
        "profile_score": profile_score
    }
