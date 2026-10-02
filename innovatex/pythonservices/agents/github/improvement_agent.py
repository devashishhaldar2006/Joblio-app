from datetime import datetime, timezone
from typing import Dict, Any, List


def build_recommendations(
    raw_profile: Dict[str, Any],
    repo_analysis: Dict[str, Any],
    profile_score: Dict[str, Any]
) -> List[Dict[str, Any]]:
    recommendations: List[Dict[str, Any]] = []
    username = raw_profile.get("login") or "developer"
    repos: List[Dict[str, Any]] = repo_analysis.get("repositories", [])
    total_repos = len(repos)
    doc_intel = repo_analysis.get("documentation_intelligence", {})
    inspected_count = repo_analysis.get("inspected_repos_count", 0)

    # 1. Critical check: No public source repositories
    if total_repos == 0:
        recommendations.append({
            "id": "rec_publish_repositories",
            "title": "Publish public source repositories",
            "severity": "Critical",
            "category": "Profile Completeness",
            "impact": "High",
            "effort": "Medium",
            "observation": f"@{username} currently has 0 non-forked public repositories.",
            "interpretation": "Without public source repositories, technical reviewers cannot evaluate your code structure, documentation, or engineering depth.",
            "rationale": "Public source repositories are the primary evidence source for your GitHub profile.",
            "evidence": [
                {"label": "Owned Public Repositories", "value": "0"},
                {"label": "Forked Repositories", "value": str(raw_profile.get("forked_repos_count", 0))}
            ],
            "actions": [
                "Select 2–3 original projects that represent your best engineering work",
                "Remove any hardcoded secrets or credentials and verify .gitignore",
                "Make the repositories public and include a clear README.md"
            ],
            "estimatedBenefit": "+25 to +40 pts (Modelled)",
            "verificationCriteria": "At least 1 non-forked public repository is visible on GitHub.",
            "verificationRule": {"type": "min_repos", "threshold": 1},
            "aiAction": {
                "type": "profile_readme",
                "label": "Generate Profile README",
                "targetRepo": None
            },
            "goalWeights": {
                "Improve GitHub profile": 100,
                "Prepare for internships": 100,
                "Prepare for placements": 100,
                "Improve open-source presence": 100,
                "Showcase projects": 100,
                "Improve documentation": 90
            },
            "status": "open"
        })

    # 2. Profile README (username/username)
    if not raw_profile.get("has_profile_readme"):
        recommendations.append({
            "id": "rec_profile_readme",
            "title": "Create a GitHub profile README",
            "severity": "High",
            "category": "Profile Completeness",
            "impact": "High",
            "effort": "Low",
            "observation": f"Your public profile currently has no '{username}/{username}' profile README repository.",
            "interpretation": "Visitors landing on your profile only see GitHub's default repository list without an executive overview of your technical focus or flagship projects.",
            "rationale": "A concise profile README immediately communicates your core engineering domains, featured repositories, and contact links.",
            "evidence": [
                {"label": "Repository Checked", "value": f"github.com/{username}/{username}"},
                {"label": "Status", "value": "Not found"}
            ],
            "actions": [
                f"Create a new public repository named '{username}'",
                "Initialize it with a README.md file",
                "Include a brief technical introduction, core technologies, 2–3 featured project links, and contact information"
            ],
            "estimatedBenefit": "+5 to +6 pts (Modelled)",
            "verificationCriteria": f"Public repository '{username}/{username}' exists with a non-empty README.md.",
            "verificationRule": {"type": "has_profile_readme"},
            "aiAction": {
                "type": "profile_readme",
                "label": "Generate Profile README",
                "targetRepo": None
            },
            "goalWeights": {
                "Improve GitHub profile": 95,
                "Prepare for internships": 95,
                "Prepare for placements": 95,
                "Improve open-source presence": 75,
                "Showcase projects": 92,
                "Improve documentation": 85
            },
            "status": "open"
        })

    # 3. Missing Repository READMEs or Weak Flagship READMEs
    inspected_repos = [r for r in repos if r["readme"]["inspected"]]
    missing_readme_repos = [r for r in inspected_repos if not r["readme"]["exists"]]
    weak_readme_repos = [r for r in inspected_repos if r["readme"]["exists"] and r["readme"]["score"] < 55]

    if missing_readme_repos:
        target_r = missing_readme_repos[0]
        repo_names = [r["name"] for r in missing_readme_repos]
        recommendations.append({
            "id": f"rec_missing_readme_{target_r['name'].lower()}",
            "title": f"Add README documentation to {', '.join(repo_names[:2])}" + (f" (+{len(repo_names)-2} more)" if len(repo_names) > 2 else ""),
            "severity": "Critical" if len(missing_readme_repos) >= max(1, len(inspected_repos) // 2) else "High",
            "category": "Documentation",
            "impact": "High",
            "effort": "Medium",
            "observation": f"{len(missing_readme_repos)} of {len(inspected_repos)} inspected repositories have no README.md ({', '.join(repo_names[:4])}).",
            "interpretation": "Repositories without a README cannot be evaluated or executed by visitors without reading raw source files.",
            "rationale": f"Adding a structured README to {target_r['name']} and other undocumented repositories provides clear context on purpose, architecture, and setup.",
            "evidence": [
                {"label": "Undocumented Repositories", "value": ", ".join(repo_names[:5])},
                {"label": "Inspected Coverage", "value": f"{len(inspected_repos) - len(missing_readme_repos)} / {len(inspected_repos)} have READMEs"}
            ],
            "actions": [
                f"Create README.md in {target_r['name']} explaining project purpose and problem solved",
                "Add step-by-step installation and local run commands",
                "Document the technology stack and architecture overview"
            ],
            "estimatedBenefit": "+4 to +8 pts (Modelled)",
            "verificationCriteria": f"Repository '{target_r['name']}' contains a README.md with setup and overview sections.",
            "verificationRule": {"type": "repo_has_readme", "targetRepo": target_r["name"]},
            "targetRepo": target_r["name"],
            "aiAction": {
                "type": "repo_readme",
                "label": f"Generate README for {target_r['name']}",
                "targetRepo": target_r["name"]
            },
            "goalWeights": {
                "Improve GitHub profile": 92,
                "Prepare for internships": 90,
                "Prepare for placements": 92,
                "Improve open-source presence": 95,
                "Showcase projects": 95,
                "Improve documentation": 100
            },
            "status": "open"
        })

    if weak_readme_repos:
        target_r = weak_readme_repos[0]
        missing_sigs = target_r["readme"]["missing"][:4]
        recommendations.append({
            "id": f"rec_upgrade_readme_{target_r['name'].lower()}",
            "title": f"Expand README depth in '{target_r['name']}'",
            "severity": "High" if target_r["depth_classification"] in ("Flagship", "Supporting") else "Medium",
            "category": "Documentation",
            "impact": "High",
            "effort": "Low",
            "observation": f"'{target_r['name']}' has a README ({target_r['readme']['word_count']} words, score {target_r['readme']['score']}/100) missing {', '.join(missing_sigs[:3]).lower()}.",
            "interpretation": "A minimal README leaves gaps regarding how the system is architected, installed, and used.",
            "rationale": "Enhancing flagship project documentation with setup commands, architecture notes, and usage examples makes technical depth immediately visible.",
            "evidence": [
                {"label": "Repository", "value": target_r["name"]},
                {"label": "Current README Score", "value": f"{target_r['readme']['score']} / 100 ({target_r['readme']['word_count']} words)"},
                {"label": "Missing Sections", "value": ", ".join(missing_sigs) or "Setup / Architecture"}
            ],
            "actions": [
                f"Add installation and quick-start commands to {target_r['name']}/README.md",
                "Include an architecture or folder structure overview",
                "Add usage examples or screenshots demonstrating the output"
            ],
            "estimatedBenefit": "+3 to +5 pts (Modelled)",
            "verificationCriteria": f"README score for '{target_r['name']}' reaches >= 65/100 with installation and usage sections.",
            "verificationRule": {"type": "repo_readme_score", "targetRepo": target_r["name"], "threshold": 65},
            "targetRepo": target_r["name"],
            "aiAction": {
                "type": "repo_readme",
                "label": f"Generate Improved README ({target_r['name']})",
                "targetRepo": target_r["name"]
            },
            "goalWeights": {
                "Improve GitHub profile": 85,
                "Prepare for internships": 88,
                "Prepare for placements": 90,
                "Improve open-source presence": 88,
                "Showcase projects": 94,
                "Improve documentation": 98
            },
            "status": "open"
        })

    # 4. Missing Repository Descriptions
    no_desc_repos = [r for r in repos if not r.get("description")]
    if no_desc_repos:
        target_r = no_desc_repos[0]
        no_desc_names = [r["name"] for r in no_desc_repos]
        recommendations.append({
            "id": "rec_repo_descriptions",
            "title": f"Add concise descriptions to {len(no_desc_repos)} repositor{'y' if len(no_desc_repos) == 1 else 'ies'}",
            "severity": "High" if len(no_desc_repos) >= 3 else "Medium",
            "category": "Discoverability",
            "impact": "High",
            "effort": "Low",
            "observation": f"{len(no_desc_repos)} of {total_repos} public repositories have no repository description ({', '.join(no_desc_names[:4])}).",
            "interpretation": "When browsing a profile, repository cards without descriptions force viewers to click into each repository just to learn what it is.",
            "rationale": "Adding a 1-sentence summary in the 'About' sidebar of each repository improves scannability and search indexing.",
            "evidence": [
                {"label": "Repositories Missing Description", "value": f"{len(no_desc_repos)} of {total_repos}"},
                {"label": "Affected Repositories", "value": ", ".join(no_desc_names[:6])}
            ],
            "actions": [
                f"Open repository settings ('About' gear icon) on {', '.join(no_desc_names[:3])}",
                "Add a 1-sentence summary stating what the project does and its primary stack"
            ],
            "estimatedBenefit": "+3 to +5 pts (Modelled)",
            "verificationCriteria": f"Repository '{target_r['name']}' has a non-empty description.",
            "verificationRule": {"type": "repo_has_description", "targetRepo": target_r["name"]},
            "targetRepo": target_r["name"],
            "aiAction": {
                "type": "repo_description",
                "label": f"Generate Description ({target_r['name']})",
                "targetRepo": target_r["name"]
            },
            "goalWeights": {
                "Improve GitHub profile": 88,
                "Prepare for internships": 86,
                "Prepare for placements": 86,
                "Improve open-source presence": 85,
                "Showcase projects": 90,
                "Improve documentation": 88
            },
            "status": "open"
        })

    # 5. Missing Repository Topics
    no_topic_repos = [r for r in repos if not r.get("topics") or len(r.get("topics")) == 0]
    if no_topic_repos:
        target_r = no_topic_repos[0]
        no_topic_names = [r["name"] for r in no_topic_repos]
        recommendations.append({
            "id": "rec_repo_topics",
            "title": f"Add GitHub topic tags to {len(no_topic_repos)} repositor{'y' if len(no_topic_repos) == 1 else 'ies'}",
            "severity": "Medium",
            "category": "Discoverability",
            "impact": "Medium",
            "effort": "Low",
            "observation": f"{len(no_topic_repos)} of {total_repos} repositories have 0 topic tags ({', '.join(no_topic_names[:4])}).",
            "interpretation": "Without topic tags, frameworks and ecosystems used inside the repository are harder to discover at a glance.",
            "rationale": "Adding 4–6 relevant tags (e.g., language, framework, domain) surfaces your technology footprint on repository cards and GitHub search.",
            "evidence": [
                {"label": "Topics Coverage", "value": f"{total_repos - len(no_topic_repos)} / {total_repos} ({repo_analysis.get('topics_percentage', 0)}%)"},
                {"label": "Untagged Repositories", "value": ", ".join(no_topic_names[:6])}
            ],
            "actions": [
                f"Click the gear icon next to 'About' on {target_r['name']}",
                "Add 4–6 lowercase tags representing the language, framework, database, and domain"
            ],
            "estimatedBenefit": "+2 to +4 pts (Modelled)",
            "verificationCriteria": f"Repository '{target_r['name']}' has at least 1 topic tag configured.",
            "verificationRule": {"type": "repo_has_topics", "targetRepo": target_r["name"]},
            "targetRepo": target_r["name"],
            "aiAction": {
                "type": "repo_topics",
                "label": f"Generate Topics ({target_r['name']})",
                "targetRepo": target_r["name"]
            },
            "goalWeights": {
                "Improve GitHub profile": 80,
                "Prepare for internships": 78,
                "Prepare for placements": 78,
                "Improve open-source presence": 92,
                "Showcase projects": 85,
                "Improve documentation": 75
            },
            "status": "open"
        })

    # 6. Missing Profile Bio or External Links
    if not raw_profile.get("bio") or not (raw_profile.get("blog") or raw_profile.get("twitter_username")):
        missing_fields = []
        if not raw_profile.get("bio"):
            missing_fields.append("developer bio")
        if not (raw_profile.get("blog") or raw_profile.get("twitter_username")):
            missing_fields.append("external website/portfolio link")
        if not (raw_profile.get("location") or raw_profile.get("company")):
            missing_fields.append("location/organization")

        recommendations.append({
            "id": "rec_profile_metadata",
            "title": f"Complete profile {' and '.join(missing_fields[:2])}",
            "severity": "Medium",
            "category": "Profile Completeness",
            "impact": "Medium",
            "effort": "Low",
            "observation": f"Profile metadata currently lacks {', '.join(missing_fields)}.",
            "interpretation": "Visitors cannot quickly identify your specialization or navigate to your portfolio/LinkedIn from your GitHub sidebar.",
            "rationale": "Populating your bio and website field takes under two minutes and provides immediate professional context.",
            "evidence": [
                {"label": "Bio", "value": raw_profile.get("bio") or "Empty"},
                {"label": "Website / Portfolio", "value": raw_profile.get("blog") or "Empty"},
                {"label": "Location / Company", "value": " / ".join(filter(None, [raw_profile.get("location"), raw_profile.get("company")])) or "Empty"}
            ],
            "actions": [
                "Open GitHub Profile -> Edit profile",
                "Add a concise bio highlighting your primary engineering stack and focus area",
                "Add your personal portfolio, LinkedIn, or technical blog URL in the Website field"
            ],
            "estimatedBenefit": "+2 to +3 pts (Modelled)",
            "verificationCriteria": "Profile bio and website/blog fields are populated on GitHub.",
            "verificationRule": {"type": "profile_has_bio_or_blog"},
            "aiAction": {
                "type": "profile_bio",
                "label": "Generate Profile Bio",
                "targetRepo": None
            },
            "goalWeights": {
                "Improve GitHub profile": 84,
                "Prepare for internships": 92,
                "Prepare for placements": 90,
                "Improve open-source presence": 70,
                "Showcase projects": 82,
                "Improve documentation": 65
            },
            "status": "open"
        })

    # 7. Engineering Hygiene: Testing & CI/CD on Flagship/Top Repos
    top_cand = repos[0] if repos else None
    ci_test_repos = [r for r in repos if r["engineering"]["has_tests"] or r["engineering"]["has_ci"]]
    if total_repos > 0 and len(ci_test_repos) == 0 and top_cand:
        recommendations.append({
            "id": "rec_engineering_tests_ci",
            "title": f"Add automated tests or GitHub Actions CI to '{top_cand['name']}'",
            "severity": "Medium",
            "category": "Repository Quality",
            "impact": "High",
            "effort": "Medium",
            "observation": f"0 of {inspected_count or total_repos} inspected repositories contain test directories or CI workflow configurations.",
            "interpretation": "Public codebases without automated tests or CI workflows provide less evidence of production engineering practices.",
            "rationale": f"Adding even a focused unit/integration test suite and a `.github/workflows/ci.yml` pipeline to your flagship project ('{top_cand['name']}') demonstrates strong engineering discipline.",
            "evidence": [
                {"label": "Repositories with Tests/CI", "value": f"0 / {inspected_count or total_repos}"},
                {"label": "Recommended Target", "value": top_cand["name"]}
            ],
            "actions": [
                f"Add a basic test suite in '{top_cand['name']}' covering core endpoints or utility functions",
                "Create `.github/workflows/ci.yml` to run linting and tests on push",
                "Include a build status badge in the README"
            ],
            "estimatedBenefit": "+3 to +5 pts (Modelled)",
            "verificationCriteria": f"Repository '{top_cand['name']}' contains test files or a `.github/workflows` configuration.",
            "verificationRule": {"type": "repo_has_ci_or_tests", "targetRepo": top_cand["name"]},
            "targetRepo": top_cand["name"],
            "aiAction": {
                "type": "repo_summary",
                "label": f"Generate Engineering Summary ({top_cand['name']})",
                "targetRepo": top_cand["name"]
            },
            "goalWeights": {
                "Improve GitHub profile": 78,
                "Prepare for internships": 85,
                "Prepare for placements": 88,
                "Improve open-source presence": 88,
                "Showcase projects": 84,
                "Improve documentation": 70
            },
            "status": "open"
        })

    # 8. Visuals / Live Demo URLs for Showcase Readiness
    if total_repos > 0 and doc_intel.get("screenshots_count", 0) == 0 and repo_analysis.get("repos_with_homepage", 0) == 0 and top_cand:
        recommendations.append({
            "id": "rec_showcase_visuals_demos",
            "title": f"Add screenshots or a live demo URL to '{top_cand['name']}'",
            "severity": "Low",
            "category": "Project Depth",
            "impact": "Medium",
            "effort": "Low",
            "observation": f"0 inspected READMEs contain screenshots/GIFs and 0 of {total_repos} repositories link a live deployment URL.",
            "interpretation": "Reviewers evaluating multiple candidates rarely clone and build locally on first pass; visual previews and live links make project scope immediately tangible.",
            "rationale": f"Adding 1–2 architecture diagrams or UI screenshots and linking a deployed URL in '{top_cand['name']}' significantly improves project presentation.",
            "evidence": [
                {"label": "READMEs with Screenshots", "value": f"{doc_intel.get('screenshots_count', 0)} / {inspected_count}"},
                {"label": "Repositories with Demo URL", "value": f"{repo_analysis.get('repos_with_homepage', 0)} / {total_repos}"}
            ],
            "actions": [
                f"Capture a screenshot, terminal output, or architecture diagram for '{top_cand['name']}' and embed it in README.md",
                "If deployed, add the live URL to the repository 'Website' field"
            ],
            "estimatedBenefit": "+2 to +3 pts (Modelled)",
            "verificationCriteria": f"'{top_cand['name']}' has a homepage URL or visual assets in README.md.",
            "verificationRule": {"type": "repo_has_demo_or_visuals", "targetRepo": top_cand["name"]},
            "targetRepo": top_cand["name"],
            "aiAction": {
                "type": "project_highlights",
                "label": "Generate Project Highlights",
                "targetRepo": top_cand["name"]
            },
            "goalWeights": {
                "Improve GitHub profile": 75,
                "Prepare for internships": 84,
                "Prepare for placements": 85,
                "Improve open-source presence": 72,
                "Showcase projects": 98,
                "Improve documentation": 82
            },
            "status": "open"
        })

    # 9. Open Source Licensing
    if total_repos > 0 and repo_analysis.get("repos_with_license", 0) == 0 and top_cand:
        recommendations.append({
            "id": "rec_open_source_license",
            "title": "Add open-source licenses to public repositories",
            "severity": "Low",
            "category": "Community",
            "impact": "Low",
            "effort": "Low",
            "observation": f"0 of {total_repos} public repositories specify a standard open-source license (e.g., MIT, Apache-2.0).",
            "interpretation": "Repositories without a license default to 'all rights reserved', which discourages open-source reuse or contributions.",
            "rationale": "Adding an MIT or Apache-2.0 LICENSE file clarifies permissions for collaborators.",
            "evidence": [
                {"label": "Licensed Repositories", "value": f"0 / {total_repos}"}
            ],
            "actions": [
                f"Add a LICENSE file (such as MIT) to '{top_cand['name']}' and other flagship repositories"
            ],
            "estimatedBenefit": "+1 to +2 pts (Modelled)",
            "verificationCriteria": "At least 1 public repository includes a recognized open-source license.",
            "verificationRule": {"type": "min_licensed_repos", "threshold": 1},
            "targetRepo": top_cand["name"],
            "aiAction": {
                "type": "repo_summary",
                "label": f"Generate Project Summary ({top_cand['name']})",
                "targetRepo": top_cand["name"]
            },
            "goalWeights": {
                "Improve GitHub profile": 65,
                "Prepare for internships": 60,
                "Prepare for placements": 60,
                "Improve open-source presence": 96,
                "Showcase projects": 68,
                "Improve documentation": 75
            },
            "status": "open"
        })

    return recommendations


async def generate_improvements_node(state: Dict[str, Any]) -> Dict[str, Any]:
    raw_profile = state.get("raw_profile", {})
    repo_analysis = state.get("repo_analysis", {})
    profile_score = state.get("profile_score", {})
    rate_limit = state.get("rate_limit", {})
    fetched_at = state.get("fetched_at") or datetime.now(timezone.utc).isoformat()

    recommendations = build_recommendations(raw_profile, repo_analysis, profile_score)

    # Map structured recommendations to legacy `improvements` format for backward compatibility
    legacy_improvements = []
    for rec in recommendations[:6]:
        sev_lower = rec["severity"].lower()
        pri = "high" if sev_lower in ("critical", "high") else "medium" if sev_lower == "medium" else "low"
        legacy_improvements.append({
            "id": rec["id"],
            "priority": pri,
            "severity": rec["severity"],
            "category": rec["category"],
            "title": rec["title"],
            "issue": rec["observation"],
            "action": " ".join(rec["actions"][:2]),
            "impact": f"{rec['interpretation']} ({rec['estimatedBenefit']})"
        })

    overall_val = profile_score.get("totalScore", profile_score.get("overall_score", 0))
    status_label = (
        "Strong Public Signal" if overall_val >= 80
        else "Established Profile" if overall_val >= 65
        else "Developing Profile" if overall_val >= 45
        else "Early / Incomplete Public Signal"
    )

    score_obj = {
        "overall_score": overall_val,
        "totalScore": overall_val,
        "statusLabel": status_label,
        "tier": status_label,
        "methodologyVersion": profile_score.get("methodologyVersion", "v2.1"),
        "confidence": profile_score.get("confidence", 0.9),
        "confidenceLabel": profile_score.get("confidenceLabel", "High confidence"),
        "dimensions": profile_score.get("dimensions", []),
        "projection": profile_score.get("projection", {}),
        "warnings": profile_score.get("warnings", []),
        "breakdown": {
            "completeness": {"score": profile_score.get("completeness_score", 0), "max": 15},
            "quality": {"score": profile_score.get("quality_score", 0), "max": 20},
            "documentation": {"score": profile_score.get("documentation_score", 0), "max": 15},
            "activity": {"score": profile_score.get("activity_score", 0), "max": 15},
            "breadth": {"score": profile_score.get("breadth_score", 0), "max": 10},
            "depth": {"score": profile_score.get("depth_score", 0), "max": 10},
            "community": {"score": profile_score.get("community_score", 0), "max": 5},
            "discoverability": {"score": profile_score.get("discoverability_score", 0), "max": 10}
        }
    }

    final_report = {
        "methodologyVersion": profile_score.get("methodologyVersion", "v2.1"),
        "username": raw_profile.get("login") or state.get("username"),
        "name": raw_profile.get("name"),
        "display_name": raw_profile.get("display_name"),
        "bio": raw_profile.get("bio"),
        "location": raw_profile.get("location"),
        "company": raw_profile.get("company"),
        "blog": raw_profile.get("blog"),
        "twitter_username": raw_profile.get("twitter_username"),
        "avatar_url": raw_profile.get("avatar_url"),
        "profile_url": raw_profile.get("html_url"),
        "overall_score": overall_val,
        "totalScore": overall_val,
        "statusLabel": status_label,
        "tier": status_label,
        "confidence": profile_score.get("confidence", 0.9),
        "confidenceLabel": profile_score.get("confidenceLabel", "High confidence"),
        "category_scores": profile_score,
        "score": score_obj,
        "dimensions": profile_score.get("dimensions", []),
        "projection": profile_score.get("projection", {}),
        "warnings": profile_score.get("warnings", []),
        "profile": raw_profile,
        "repo_analysis": repo_analysis,
        "repositories": repo_analysis.get("repositories", []),
        "top_languages": repo_analysis.get("top_languages", []),
        "language_distribution": repo_analysis.get("language_distribution", []),
        "detected_technologies": repo_analysis.get("detected_technologies", []),
        "developer_dna": repo_analysis.get("developer_dna", []),
        "total_stars": repo_analysis.get("total_stars", 0),
        "total_forks": repo_analysis.get("total_forks", 0),
        "public_repos": raw_profile.get("public_repos", 0),
        "owned_repos_count": repo_analysis.get("total_repos", 0),
        "followers": raw_profile.get("followers", 0),
        "following": raw_profile.get("following", 0),
        "best_repos": repo_analysis.get("best_repos", []),
        "featured_candidates": repo_analysis.get("project_depth", {}).get("featured_candidates", []),
        "recommendations": recommendations,
        "improvements": legacy_improvements,
        "rate_limit": rate_limit,
        "fetched_at": fetched_at,
        "analyzed_at": datetime.now(timezone.utc).isoformat()
    }

    return {
        **state,
        "improvements": legacy_improvements,
        "recommendations": recommendations,
        "final_report": final_report
    }
