from typing import Dict, Any, List, Optional

METHODOLOGY_VERSION = "v2.1"

DEFAULT_WEIGHTS = {
    "profile_completeness": 15,
    "repository_quality": 20,
    "documentation": 15,
    "activity_consistency": 15,
    "technical_breadth": 10,
    "project_depth": 10,
    "community_collaboration": 5,
    "discoverability": 10
}


def _confidence_label(conf: float) -> str:
    if conf >= 0.85:
        return "High confidence"
    if conf >= 0.60:
        return "Medium confidence"
    return "Limited data"


def calculateProfileScore(
    raw_profile: Dict[str, Any],
    repo_analysis: Dict[str, Any],
    weights: Optional[Dict[str, int]] = None
) -> Dict[str, Any]:
    w = {**DEFAULT_WEIGHTS, **(weights or {})}
    total_repos = repo_analysis.get("total_repos", 0)
    inspected_count = repo_analysis.get("inspected_repos_count", 0)
    repos = repo_analysis.get("repositories", [])
    doc_intel = repo_analysis.get("documentation_intelligence", {})
    act_intel = repo_analysis.get("activity_intelligence", {})
    depth_intel = repo_analysis.get("project_depth", {})
    comm_intel = repo_analysis.get("community_intelligence", {})

    warnings: List[str] = []
    if total_repos == 0:
        warnings.append("Insufficient public repository data to evaluate repository-dependent dimensions.")
    elif inspected_count < total_repos:
        warnings.append(f"Deep README & file-tree inspection performed on top {inspected_count} of {total_repos} public repositories.")

    repo_conf = round(min(1.0, 0.55 + (inspected_count / max(1, min(total_repos, 10))) * 0.40), 2) if total_repos > 0 else 0.35

    # ------------------------------------------------------------------
    # 1. Profile Completeness (Max 15)
    # ------------------------------------------------------------------
    max_pc = w["profile_completeness"]
    pc_raw = 0.0
    pc_reasons = []

    if raw_profile.get("name"):
        pc_raw += 2.0
        pc_reasons.append(f"Display name configured ({raw_profile.get('name')})")
    else:
        pc_reasons.append("Display name is currently unavailable")

    if raw_profile.get("bio") and len((raw_profile.get("bio") or "").strip()) >= 10:
        pc_raw += 3.0
        pc_reasons.append("Developer bio present")
    else:
        pc_reasons.append("Developer bio is missing or minimal")

    if raw_profile.get("location") or raw_profile.get("company"):
        pc_raw += 2.0
        pc_reasons.append("Professional context (location/company) provided")
    else:
        pc_reasons.append("Location and organization fields are empty")

    if raw_profile.get("blog") or raw_profile.get("twitter_username"):
        pc_raw += 2.5
        pc_reasons.append("External portfolio or social link configured")
    else:
        pc_reasons.append("No external website or portfolio link configured")

    if raw_profile.get("has_profile_readme"):
        pc_raw += 4.0
        pc_reasons.append(f"Profile README repository ({raw_profile.get('login')}/{raw_profile.get('login')}) is active")
    else:
        pc_reasons.append("No profile-level README repository detected")

    if total_repos > 0:
        pc_raw += 1.5
        pc_reasons.append(f"{total_repos} public source repositories available")

    pc_score = round(min(max_pc, (pc_raw / 15.0) * max_pc), 1)
    pc_pct = round((pc_score / max_pc) * 100) if max_pc else 0

    # ------------------------------------------------------------------
    # 2. Repository Quality (Max 20)
    # ------------------------------------------------------------------
    max_rq = w["repository_quality"]
    if total_repos == 0:
        rq_score = 0.0
        rq_pct = 0
        rq_reasons = ["Insufficient public data to evaluate this dimension (0 public repositories)."]
    else:
        avg_eng = sum(r["engineering"]["score"] for r in repos) / total_repos
        avg_health = sum(r["health_score"] for r in repos) / total_repos
        modular_count = sum(1 for r in repos if r["engineering"]["is_modular"])
        manifest_count = sum(1 for r in repos if r["engineering"]["has_dependency_manifest"])
        ci_or_test_count = sum(1 for r in repos if r["engineering"]["has_tests"] or r["engineering"]["has_ci"] or r["engineering"]["has_docker"])

        rq_pct = min(100, round(avg_eng * 0.55 + avg_health * 0.45))
        rq_score = round((rq_pct / 100.0) * max_rq, 1)
        rq_reasons = [
            f"{modular_count} of {total_repos} repositories demonstrate modular multi-file/directory organization",
            f"{manifest_count} of {inspected_count or total_repos} inspected repositories include standard dependency manifests",
            f"{ci_or_test_count} repositories contain automated test, CI/CD, or containerization configurations"
        ]

    # ------------------------------------------------------------------
    # 3. Documentation (Max 15)
    # ------------------------------------------------------------------
    max_doc = w["documentation"]
    if total_repos == 0:
        doc_score = 0.0
        doc_pct = 0
        doc_reasons = ["Insufficient public data to evaluate this dimension (0 public repositories)."]
    else:
        readme_cnt = doc_intel.get("readme_count", 0)
        install_cnt = doc_intel.get("install_count", 0)
        usage_cnt = doc_intel.get("usage_count", 0)
        desc_cnt = repo_analysis.get("repos_with_desc", 0)
        doc_pct = min(100, round(doc_intel.get("score", 0) * 0.75 + repo_analysis.get("desc_percentage", 0) * 0.25))
        doc_score = round((doc_pct / 100.0) * max_doc, 1)
        doc_reasons = [
            f"{readme_cnt} of {inspected_count} inspected repositories contain README files",
            f"{install_cnt} of {inspected_count} inspected repositories include setup/installation instructions",
            f"{usage_cnt} of {inspected_count} inspected repositories provide usage examples or code blocks",
            f"{desc_cnt} of {total_repos} repositories have short summary descriptions"
        ]

    # ------------------------------------------------------------------
    # 4. Activity & Consistency (Max 15)
    # ------------------------------------------------------------------
    max_act = w["activity_consistency"]
    pushed_30d = repo_analysis.get("repos_pushed_30d", 0)
    pushed_90d = repo_analysis.get("repos_pushed_90d", 0)
    pushed_180d = repo_analysis.get("repos_pushed_180d", 0)
    pub_events = act_intel.get("event_breakdown", {}).get("total_public_events", 0)
    active_months = sum(1 for m in act_intel.get("monthly_timeline", []) if m.get("total_signal", 0) > 0)

    act_raw_pct = 0
    if pushed_30d >= 2:
        act_raw_pct += 35
    elif pushed_30d == 1:
        act_raw_pct += 25
    if pushed_90d >= 3:
        act_raw_pct += 25
    elif pushed_90d >= 1:
        act_raw_pct += 15
    elif pushed_180d >= 1:
        act_raw_pct += 10
    act_raw_pct += min(25, active_months * 4)
    act_raw_pct += min(15, pub_events // 3)

    act_pct = min(100, act_raw_pct) if total_repos > 0 else 0
    act_score = round((act_pct / 100.0) * max_act, 1)
    act_reasons = [
        f"{pushed_30d} repositor{'y' if pushed_30d == 1 else 'ies'} updated in the last 30 days ({pushed_90d} in the last 90 days)",
        f"Public activity observed across {active_months} of the last 12 months",
        f"{pub_events} recent public GitHub events recorded in telemetry window"
    ]

    # ------------------------------------------------------------------
    # 5. Technical Breadth (Max 10)
    # ------------------------------------------------------------------
    max_tb = w["technical_breadth"]
    unique_langs = repo_analysis.get("unique_languages_count", 0)
    detected_techs = repo_analysis.get("detected_technologies", [])
    dna_list = repo_analysis.get("developer_dna", [])

    tb_pct = min(100, unique_langs * 15 + len(detected_techs) * 6 + len(dna_list) * 5) if total_repos > 0 else 0
    tb_score = round((tb_pct / 100.0) * max_tb, 1)
    tb_reasons = [
        f"{unique_langs} distinct primary programming language(s) across public repositories",
        f"{len(detected_techs)} languages, frameworks, and tools detected from repository evidence",
        f"{len(dna_list)} technical domain pattern(s) identified in Developer DNA"
    ]

    # ------------------------------------------------------------------
    # 6. Project Depth (Max 10)
    # ------------------------------------------------------------------
    max_pd = w["project_depth"]
    flagship_cnt = depth_intel.get("flagship_count", 0)
    supporting_cnt = depth_intel.get("supporting_count", 0)
    fullstack_cnt = sum(1 for r in repos if r["engineering"]["is_fullstack"])

    if total_repos == 0:
        pd_pct = 0
        pd_score = 0.0
        pd_reasons = ["Insufficient public data to evaluate project depth."]
    else:
        avg_depth = sum(r["depth_score"] for r in repos[:5]) / min(len(repos), 5)
        pd_pct = min(100, round(avg_depth * 0.7 + min(30, flagship_cnt * 15 + supporting_cnt * 5)))
        pd_score = round((pd_pct / 100.0) * max_pd, 1)
        pd_reasons = [
            f"{flagship_cnt} flagship project(s) and {supporting_cnt} supporting project(s) identified",
            f"{fullstack_cnt} repository architecture(s) combine backend and frontend layers",
            f"Average top-project depth score of {round(avg_depth)}/100"
        ]

    # ------------------------------------------------------------------
    # 7. Community & Collaboration (Max 5)
    # ------------------------------------------------------------------
    max_cc = w["community_collaboration"]
    total_stars = repo_analysis.get("total_stars", 0)
    total_forks = repo_analysis.get("total_forks", 0)
    followers = raw_profile.get("followers", 0)
    pr_events = comm_intel.get("pr_participation", 0)
    licensed_cnt = repo_analysis.get("repos_with_license", 0)

    cc_pct = min(
        100,
        min(35, total_stars * 4) +
        min(20, total_forks * 5) +
        min(20, followers * 2) +
        min(15, pr_events * 5) +
        min(10, licensed_cnt * 3)
    )
    cc_score = round((cc_pct / 100.0) * max_cc, 1)
    cc_reasons = [
        f"{total_stars} star(s) and {total_forks} fork(s) received across public repositories",
        f"{followers} follower(s) and {pr_events} recent public PR/review event(s)",
        f"{licensed_cnt} of {total_repos} repositories include open-source licenses for collaboration"
    ]

    # ------------------------------------------------------------------
    # 8. Discoverability (Max 10)
    # ------------------------------------------------------------------
    max_disc = w["discoverability"]
    desc_pct = repo_analysis.get("desc_percentage", 0)
    topics_pct = repo_analysis.get("topics_percentage", 0)
    homepage_cnt = repo_analysis.get("repos_with_homepage", 0)
    has_prof_readme = bool(raw_profile.get("has_profile_readme"))

    disc_pct = min(
        100,
        round(
            desc_pct * 0.35 +
            topics_pct * 0.30 +
            (20 if has_prof_readme else 0) +
            min(15, homepage_cnt * 5)
        )
    )
    disc_score = round((disc_pct / 100.0) * max_disc, 1)
    disc_reasons = [
        f"{repo_analysis.get('repos_with_desc', 0)} of {total_repos} repositories have descriptions ({desc_pct}%)",
        f"{repo_analysis.get('repos_with_topics', 0)} of {total_repos} repositories have topic tags ({topics_pct}%)",
        f"Profile README is {'present' if has_prof_readme else 'missing'}; {homepage_cnt} repositor{'y' if homepage_cnt == 1 else 'ies'} link live demos/websites"
    ]

    dimensions = [
        {
            "id": "profile_completeness",
            "dimension": "Profile Completeness",
            "score": pc_score,
            "maxScore": max_pc,
            "percentage": pc_pct,
            "confidence": 0.98,
            "confidenceLabel": "High confidence",
            "primaryIssue": (
                "Profile identity and README are well-configured."
                if pc_pct >= 80
                else "Missing profile README or external portfolio context."
                if not has_prof_readme
                else "Several public profile metadata fields are currently blank."
            ),
            "observation": f"{repo_analysis.get('profile_completeness', {}).get('present_count', 0)} of {repo_analysis.get('profile_completeness', {}).get('total_count', 6)} core profile elements are populated.",
            "interpretation": "Complete profile metadata lowers friction for recruiters and collaborators verifying your identity.",
            "reasons": pc_reasons,
            "evidence": [
                {"label": "Display Name", "value": raw_profile.get("name") or "Not set"},
                {"label": "Bio Length", "value": f"{len(raw_profile.get('bio') or '')} chars"},
                {"label": "Profile README", "value": "Present" if has_prof_readme else "Missing"},
                {"label": "Website / Blog", "value": raw_profile.get("blog") or "Not set"},
                {"label": "Location / Company", "value": " / ".join(filter(None, [raw_profile.get("location"), raw_profile.get("company")])) or "Not set"}
            ]
        },
        {
            "id": "repository_quality",
            "dimension": "Repository Quality",
            "score": rq_score,
            "maxScore": max_rq,
            "percentage": rq_pct,
            "confidence": repo_conf,
            "confidenceLabel": _confidence_label(repo_conf),
            "primaryIssue": (
                "Strong modular repository structure and engineering signals."
                if rq_pct >= 75
                else "Limited automated testing, CI/CD, or configuration hygiene across repositories."
            ),
            "observation": f"Evaluated {total_repos} public source repositories ({inspected_count} deep-inspected for file tree and manifests).",
            "interpretation": "Engineering structure, dependency manifests, and test/CI configs demonstrate production readiness.",
            "reasons": rq_reasons,
            "evidence": [
                {"label": "Source Repositories", "value": str(total_repos)},
                {"label": "Deep-Inspected", "value": str(inspected_count)},
                {"label": "Modular Structure", "value": f"{sum(1 for r in repos if r['engineering']['is_modular'])} repos"},
                {"label": "Dependency Manifests", "value": f"{sum(1 for r in repos if r['engineering']['has_dependency_manifest'])} repos"},
                {"label": "Tests / CI / Docker", "value": f"{sum(1 for r in repos if r['engineering']['has_tests'] or r['engineering']['has_ci'] or r['engineering']['has_docker'])} repos"}
            ]
        },
        {
            "id": "documentation",
            "dimension": "Documentation",
            "score": doc_score,
            "maxScore": max_doc,
            "percentage": doc_pct,
            "confidence": repo_conf,
            "confidenceLabel": _confidence_label(repo_conf),
            "primaryIssue": (
                f"{doc_intel.get('readme_count', 0)} of {inspected_count} inspected repositories have READMEs; {doc_intel.get('install_count', 0)} include setup steps."
                if inspected_count > 0
                else "No repositories available to inspect documentation."
            ),
            "observation": f"Average README quality score is {doc_intel.get('score', 0)}/100 across {inspected_count} inspected repositories.",
            "interpretation": "Clear setup instructions, architecture explanations, and usage examples allow others to evaluate and run your code quickly.",
            "reasons": doc_reasons,
            "evidence": [
                {"label": "Inspected Repositories", "value": str(inspected_count)},
                {"label": "README Present", "value": f"{doc_intel.get('readme_count', 0)} / {inspected_count}"},
                {"label": "Setup Instructions", "value": f"{doc_intel.get('install_count', 0)} / {inspected_count}"},
                {"label": "Usage Examples", "value": f"{doc_intel.get('usage_count', 0)} / {inspected_count}"},
                {"label": "Visuals / Screenshots", "value": f"{doc_intel.get('screenshots_count', 0)} / {inspected_count}"},
                {"label": "Architecture Notes", "value": f"{doc_intel.get('architecture_count', 0)} / {inspected_count}"}
            ]
        },
        {
            "id": "activity_consistency",
            "dimension": "Activity & Consistency",
            "score": act_score,
            "maxScore": max_act,
            "percentage": act_pct,
            "confidence": 0.92,
            "confidenceLabel": "High confidence",
            "primaryIssue": (
                f"{pushed_30d} repositor{'y' if pushed_30d == 1 else 'ies'} updated in the last 30 days."
                if pushed_30d > 0
                else "No public repository updates recorded in the last 30 days."
            ),
            "observation": f"{pushed_90d} repositories updated in the past 90 days; active in {active_months} of the last 12 months.",
            "interpretation": "Consistent public maintenance signals ongoing technical engagement, though private work is not visible via public API.",
            "reasons": act_reasons,
            "evidence": [
                {"label": "Updated (Last 30d)", "value": f"{pushed_30d} repos"},
                {"label": "Updated (Last 90d)", "value": f"{pushed_90d} repos"},
                {"label": "Active Months (12m)", "value": f"{active_months} / 12"},
                {"label": "Most Active Period", "value": act_intel.get("most_active_period", "N/A")},
                {"label": "Recent Public Events", "value": str(pub_events)}
            ]
        },
        {
            "id": "technical_breadth",
            "dimension": "Technical Breadth",
            "score": tb_score,
            "maxScore": max_tb,
            "percentage": tb_pct,
            "confidence": repo_conf,
            "confidenceLabel": _confidence_label(repo_conf),
            "primaryIssue": f"{unique_langs} primary language(s) and {len(detected_techs)} technologies detected.",
            "observation": f"Detected {', '.join(t['name'] for t in detected_techs[:5]) or 'limited technology metadata'}.",
            "interpretation": "Demonstrates familiarity across multiple tools, languages, and ecosystems in public repositories.",
            "reasons": tb_reasons,
            "evidence": [
                {"label": "Unique Languages", "value": str(unique_langs)},
                {"label": "Top Languages", "value": ", ".join(repo_analysis.get("top_languages", [])[:4]) or "None"},
                {"label": "Detected Technologies", "value": str(len(detected_techs))},
                {"label": "Developer DNA Domains", "value": str(len(dna_list))}
            ]
        },
        {
            "id": "project_depth",
            "dimension": "Project Depth",
            "score": pd_score,
            "maxScore": max_pd,
            "percentage": pd_pct,
            "confidence": repo_conf,
            "confidenceLabel": _confidence_label(repo_conf),
            "primaryIssue": (
                f"{flagship_cnt} flagship project(s) demonstrate multi-layered engineering depth."
                if flagship_cnt > 0
                else "Public repositories are primarily small or single-layer projects."
            ),
            "observation": f"{flagship_cnt} Flagship, {supporting_cnt} Supporting, {depth_intel.get('experimental_count', 0)} Experimental, {depth_intel.get('dormant_count', 0)} Dormant.",
            "interpretation": "Recruiters and engineering leads look for 2–3 deep flagship projects rather than many small toy repositories.",
            "reasons": pd_reasons,
            "evidence": [
                {"label": "Flagship Projects", "value": str(flagship_cnt)},
                {"label": "Supporting Projects", "value": str(supporting_cnt)},
                {"label": "Full-Stack Architectures", "value": str(fullstack_cnt)},
                {"label": "Avg Repo Size", "value": f"{repo_analysis.get('avg_repo_size', 0)} KB"}
            ]
        },
        {
            "id": "community_collaboration",
            "dimension": "Community & Collaboration",
            "score": cc_score,
            "maxScore": max_cc,
            "percentage": cc_pct,
            "confidence": 0.95,
            "confidenceLabel": "High confidence",
            "primaryIssue": comm_intel.get("interpretation", "Public community signals evaluated."),
            "observation": f"{total_stars} stars, {total_forks} forks, {followers} followers, {licensed_cnt} licensed repositories.",
            "interpretation": "Community metrics reflect external visibility and collaboration readiness, not intrinsic engineering skill.",
            "reasons": cc_reasons,
            "evidence": [
                {"label": "Stars Received", "value": str(total_stars)},
                {"label": "Forks Received", "value": str(total_forks)},
                {"label": "Followers", "value": str(followers)},
                {"label": "Licensed Repositories", "value": f"{licensed_cnt} / {total_repos}"},
                {"label": "Recent PR Events", "value": str(pr_events)}
            ]
        },
        {
            "id": "discoverability",
            "dimension": "Discoverability",
            "score": disc_score,
            "maxScore": max_disc,
            "percentage": disc_pct,
            "confidence": 0.96,
            "confidenceLabel": "High confidence",
            "primaryIssue": (
                f"{total_repos - repo_analysis.get('repos_with_topics', 0)} repositories lack topic tags; {total_repos - repo_analysis.get('repos_with_desc', 0)} lack descriptions."
                if disc_pct < 80 and total_repos > 0
                else "Projects are well-tagged and described for search and browsing."
            ),
            "observation": f"Descriptions: {desc_pct}%, Topics: {topics_pct}%, Live Demo URLs: {homepage_cnt}.",
            "interpretation": "Descriptions, topics, and live links allow visitors to understand what your projects do without cloning the code.",
            "reasons": disc_reasons,
            "evidence": [
                {"label": "Descriptions Coverage", "value": f"{repo_analysis.get('repos_with_desc', 0)} / {total_repos} ({desc_pct}%)"},
                {"label": "Topics Coverage", "value": f"{repo_analysis.get('repos_with_topics', 0)} / {total_repos} ({topics_pct}%)"},
                {"label": "Homepage / Demo Links", "value": f"{homepage_cnt} / {total_repos}"},
                {"label": "Profile README", "value": "Active" if has_prof_readme else "Missing"}
            ]
        }
    ]

    total_score = round(sum(d["score"] for d in dimensions))
    overall_confidence = round(sum(d["confidence"] for d in dimensions) / len(dimensions), 2)

    # ------------------------------------------------------------------
    # Modelled Optimization Projection (Section 21)
    # ------------------------------------------------------------------
    projection_factors = []
    projected_gain = 0.0

    if not has_prof_readme:
        gain = round((4.0 / 15.0) * max_pc + 2.0, 1)
        projected_gain += gain
        projection_factors.append({"action": "Add Profile README (username/username)", "estimatedDelta": f"+{round(gain)} pts"})

    if not raw_profile.get("bio") or not (raw_profile.get("blog") or raw_profile.get("twitter_username")):
        gain = 3.0
        projected_gain += gain
        projection_factors.append({"action": "Complete profile bio & external portfolio link", "estimatedDelta": f"+{round(gain)} pts"})

    if total_repos > 0 and desc_pct < 90:
        gain = round(((100 - desc_pct) / 100.0) * 5.0, 1)
        if gain >= 1.0:
            projected_gain += gain
            projection_factors.append({"action": "Add clear descriptions to all public repositories", "estimatedDelta": f"+{round(gain)} pts"})

    if total_repos > 0 and topics_pct < 80:
        gain = round(((100 - topics_pct) / 100.0) * 4.0, 1)
        if gain >= 1.0:
            projected_gain += gain
            projection_factors.append({"action": "Add 3–5 topic tags to repositories", "estimatedDelta": f"+{round(gain)} pts"})

    if total_repos > 0 and doc_pct < 75:
        gain = round(((85 - doc_pct) / 100.0) * max_doc * 0.7, 1)
        if gain >= 1.0:
            projected_gain += gain
            projection_factors.append({"action": "Upgrade top repository READMEs (setup, usage, architecture)", "estimatedDelta": f"+{round(gain)} pts"})

    projected_score = min(98, round(total_score + projected_gain))

    return {
        "totalScore": total_score,
        "maxScore": 100,
        "methodologyVersion": METHODOLOGY_VERSION,
        "confidence": overall_confidence,
        "confidenceLabel": _confidence_label(overall_confidence),
        "dimensions": dimensions,
        "warnings": warnings,
        "projection": {
            "label": "Modelled projection",
            "disclaimer": "Modelled projection based on completing observable metadata and documentation improvements. Not a guaranteed outcome.",
            "currentScore": total_score,
            "projectedScore": projected_score,
            "potentialGain": max(0, projected_score - total_score),
            "factors": projection_factors
        },
        # Backward-compatible summary fields
        "overall_score": total_score,
        "completeness_score": round(pc_score),
        "quality_score": round(rq_score),
        "documentation_score": round(doc_score),
        "activity_score": round(act_score),
        "breadth_score": round(tb_score),
        "depth_score": round(pd_score),
        "community_score": round(cc_score),
        "discoverability_score": round(disc_score)
    }


def calculate_score_node(state: Dict[str, Any]) -> Dict[str, Any]:
    raw_profile = state.get("raw_profile", {})
    repo_analysis = state.get("repo_analysis", {})
    score_result = calculateProfileScore(raw_profile, repo_analysis)
    return {
        **state,
        "profile_score": score_result
    }
