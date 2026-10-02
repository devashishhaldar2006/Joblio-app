import re
from datetime import datetime, timezone
from collections import Counter, defaultdict
from typing import Dict, Any, List, Set

# Curated ecosystem & technology detection rules mapped to categories
TECH_SIGNATURES = [
    {"name": "Python", "category": "Language", "dna": ["Backend", "AI / ML"], "keywords": ["python", ".py", "pyproject.toml", "requirements.txt"]},
    {"name": "TypeScript", "category": "Language", "dna": ["Frontend", "Full Stack", "Backend"], "keywords": ["typescript", ".ts", ".tsx", "tsconfig.json"]},
    {"name": "JavaScript", "category": "Language", "dna": ["Frontend", "Full Stack"], "keywords": ["javascript", ".js", ".jsx", "package.json"]},
    {"name": "C++", "category": "Language", "dna": ["Systems & Tooling"], "keywords": ["c++", "cpp", "cmake", ".cpp", ".hpp"]},
    {"name": "Java", "category": "Language", "dna": ["Backend", "Systems & Tooling"], "keywords": ["java", "pom.xml", "build.gradle", ".java"]},
    {"name": "Go", "category": "Language", "dna": ["Backend", "Systems & Tooling", "DevOps & Cloud"], "keywords": ["golang", "go.mod", ".go"]},
    {"name": "Rust", "category": "Language", "dna": ["Systems & Tooling", "Backend"], "keywords": ["rust", "cargo.toml", ".rs"]},
    {"name": "React", "category": "Frontend", "dna": ["Frontend", "Full Stack"], "keywords": ["react", "reactjs", "jsx", "tsx", "vite.config"]},
    {"name": "Next.js", "category": "Frontend / Full Stack", "dna": ["Frontend", "Full Stack"], "keywords": ["nextjs", "next.js", "next.config"]},
    {"name": "Vue", "category": "Frontend", "dna": ["Frontend"], "keywords": ["vue", "vuejs", "nuxt", ".vue"]},
    {"name": "Tailwind CSS", "category": "Frontend", "dna": ["Frontend"], "keywords": ["tailwind", "tailwindcss", "tailwind.config"]},
    {"name": "Node.js", "category": "Backend", "dna": ["Backend", "Full Stack"], "keywords": ["node", "nodejs", "node.js", "package.json"]},
    {"name": "Express", "category": "Backend", "dna": ["Backend", "Full Stack"], "keywords": ["express", "expressjs"]},
    {"name": "FastAPI", "category": "Backend", "dna": ["Backend", "AI / ML"], "keywords": ["fastapi", "uvicorn"]},
    {"name": "Flask", "category": "Backend", "dna": ["Backend"], "keywords": ["flask"]},
    {"name": "Django", "category": "Backend", "dna": ["Backend", "Full Stack"], "keywords": ["django", "manage.py"]},
    {"name": "Spring Boot", "category": "Backend", "dna": ["Backend"], "keywords": ["spring", "springboot", "spring-boot"]},
    {"name": "LangChain", "category": "AI / ML", "dna": ["AI / ML"], "keywords": ["langchain"]},
    {"name": "LangGraph", "category": "AI / ML", "dna": ["AI / ML"], "keywords": ["langgraph"]},
    {"name": "PyTorch", "category": "AI / ML", "dna": ["AI / ML"], "keywords": ["pytorch", "torch"]},
    {"name": "TensorFlow", "category": "AI / ML", "dna": ["AI / ML"], "keywords": ["tensorflow", "keras"]},
    {"name": "Scikit-Learn", "category": "AI / ML", "dna": ["AI / ML"], "keywords": ["scikit-learn", "sklearn"]},
    {"name": "OpenAI / LLM", "category": "AI / ML", "dna": ["AI / ML"], "keywords": ["openai", "llm", "gpt", "groq", "gemini", "ollama", "rag", "embeddings"]},
    {"name": "MongoDB", "category": "Database", "dna": ["Backend", "Full Stack"], "keywords": ["mongodb", "mongoose", "pymongo", "motor"]},
    {"name": "PostgreSQL", "category": "Database", "dna": ["Backend", "Full Stack"], "keywords": ["postgres", "postgresql", "prisma", "sqlalchemy", "pg"]},
    {"name": "MySQL / SQLite", "category": "Database", "dna": ["Backend"], "keywords": ["mysql", "sqlite", "sql"]},
    {"name": "Redis", "category": "Database", "dna": ["Backend", "DevOps & Cloud"], "keywords": ["redis"]},
    {"name": "Docker", "category": "DevOps & Cloud", "dna": ["DevOps & Cloud", "Backend"], "keywords": ["docker", "dockerfile", "docker-compose"]},
    {"name": "Kubernetes", "category": "DevOps & Cloud", "dna": ["DevOps & Cloud"], "keywords": ["kubernetes", "k8s", "helm"]},
    {"name": "GitHub Actions / CI", "category": "DevOps & Cloud", "dna": ["DevOps & Cloud", "Open Source & Community"], "keywords": [".github/workflows", "ci/cd", "github-actions"]},
    {"name": "AWS / Cloud", "category": "DevOps & Cloud", "dna": ["DevOps & Cloud"], "keywords": ["aws", "gcp", "azure", "terraform", "vercel", "netlify"]},
    {"name": "GraphQL", "category": "API", "dna": ["Backend", "Full Stack"], "keywords": ["graphql", "apollo"]},
]


def _analyze_readme_content(readme_text: str, has_repo_license: bool = False) -> Dict[str, Any]:
    if not readme_text or not readme_text.strip():
        return {
            "exists": False,
            "length": 0,
            "word_count": 0,
            "heading_count": 0,
            "code_block_count": 0,
            "score": 0,
            "signals": {
                "project_purpose": False,
                "problem_statement": False,
                "features": False,
                "installation": False,
                "usage": False,
                "screenshots": False,
                "architecture": False,
                "tech_stack": False,
                "api_docs": False,
                "examples": False,
                "contribution": False,
                "license": has_repo_license
            },
            "strong": ["License specified"] if has_repo_license else [],
            "missing": [
                "Project overview",
                "Installation instructions",
                "Usage examples",
                "Screenshots / visuals",
                "Architecture explanation",
                "Tech stack section"
            ]
        }

    text_lower = readme_text.lower()
    words = readme_text.split()
    word_count = len(words)
    headings = re.findall(r"^#{1,4}\s+.+$", readme_text, flags=re.MULTILINE)
    code_blocks = re.findall(r"```", readme_text)
    code_block_count = len(code_blocks) // 2

    signals = {
        "project_purpose": word_count >= 35,
        "problem_statement": any(k in text_lower for k in ["problem", "motivation", "why ", "overview", "about", "background", "objective", "purpose"]),
        "features": any(k in text_lower for k in ["feature", "capabilities", "highlights", "what it does", "key functionalities"]),
        "installation": any(k in text_lower for k in ["install", "setup", "getting started", "prerequisites", "npm install", "npm i", "pip install", "git clone", "yarn add"]),
        "usage": any(k in text_lower for k in ["usage", "how to run", "quick start", "running", "npm run", "python ", "uvicorn", "docker run"]) or code_block_count >= 1,
        "screenshots": any(k in text_lower for k in ["![", "<img", ".png", ".jpg", ".gif", ".mp4", ".webp", "screenshot", "demo", "preview"]),
        "architecture": any(k in text_lower for k in ["architecture", "system design", "structure", "workflow", "pipeline", "diagram", "mermaid", "directory", "folder structure"]),
        "tech_stack": any(k in text_lower for k in ["tech stack", "built with", "technologies", "stack", "frameworks", "dependencies", "tools used"]),
        "api_docs": any(k in text_lower for k in ["api", "endpoint", "routes", "request", "response", "webhook", "graphql", "rest"]),
        "examples": code_block_count >= 2 or any(k in text_lower for k in ["example", "sample", "snippet", "tutorial"]),
        "contribution": any(k in text_lower for k in ["contribut", "pull request", "roadmap", "development", "issue"]),
        "license": has_repo_license or any(k in text_lower for k in ["license", "mit ", "apache", "gpl"])
    }

    label_map = {
        "project_purpose": "Project overview",
        "problem_statement": "Problem statement & context",
        "features": "Feature explanation",
        "installation": "Installation instructions",
        "usage": "Usage instructions",
        "screenshots": "Screenshots / visual demo",
        "architecture": "Architecture explanation",
        "tech_stack": "Tech stack breakdown",
        "api_docs": "API / interface documentation",
        "examples": "Code / usage examples",
        "contribution": "Contribution guidelines",
        "license": "License information"
    }

    strong = [label_map[k] for k, v in signals.items() if v]
    missing = [label_map[k] for k, v in signals.items() if not v]

    # Weighted README quality score (0 - 100)
    pts = 15  # Base for having a non-empty README
    if word_count >= 80:
        pts += 10
    if word_count >= 200:
        pts += 10
    if len(headings) >= 3:
        pts += 8
    if signals["project_purpose"]:
        pts += 8
    if signals["installation"]:
        pts += 12
    if signals["usage"]:
        pts += 10
    if signals["features"] or signals["problem_statement"]:
        pts += 7
    if signals["screenshots"]:
        pts += 7
    if signals["architecture"] or signals["tech_stack"]:
        pts += 7
    if signals["license"] or signals["contribution"]:
        pts += 6

    return {
        "exists": True,
        "length": len(readme_text),
        "word_count": word_count,
        "heading_count": len(headings),
        "code_block_count": code_block_count,
        "score": min(100, pts),
        "signals": signals,
        "strong": strong,
        "missing": missing
    }


def _analyze_engineering_signals(repo: Dict[str, Any], readme_info: Dict[str, Any]) -> Dict[str, Any]:
    tree_files: List[str] = repo.get("tree_files") or []
    files_lower = [f.lower() for f in tree_files]

    has_tests = any(
        "test" in f or "spec" in f or "__tests__" in f or "pytest" in f or "jest" in f
        for f in files_lower
    )
    has_ci = any(
        ".github/workflows" in f or ".gitlab-ci" in f or ".circleci" in f or "jenkinsfile" in f
        for f in files_lower
    )
    has_docker = any("dockerfile" in f or "docker-compose" in f for f in files_lower)
    has_linter_or_config = any(
        any(cfg in f for cfg in [".eslintrc", "prettier", "tsconfig.json", "pyproject.toml", "setup.cfg", ".flake8", " ruff", "vite.config", "next.config", "Makefile"])
        for f in files_lower
    )
    has_gitignore = any(f.endswith(".gitignore") for f in files_lower)
    has_env_example = any(".env.example" in f or ".env.sample" in f or ".env.template" in f for f in files_lower)
    has_dependency_manifest = any(
        any(m in f for m in ["package.json", "requirements.txt", "pyproject.toml", "pipfile", "cargo.toml", "go.mod", "pom.xml", "build.gradle", "gemfile", "composer.json"])
        for f in files_lower
    )

    has_frontend = any(
        any(fe in f for fe in ["src/components", "src/pages", "public/", "index.html", "app.jsx", "app.tsx", ".vue", "tailwind.config"])
        for f in files_lower
    ) or (repo.get("language") in ["HTML", "CSS", "Vue", "Svelte"])

    has_backend = any(
        any(be in f for be in ["controllers/", "routes/", "models/", "main.py", "app.py", "server.js", "app.js", "manage.py", "api/", "cmd/", "internal/"])
        for f in files_lower
    ) or (repo.get("language") in ["Python", "Go", "Rust", "Java", "C#", "PHP", "Ruby"])

    top_dirs = {f.split("/")[0] for f in tree_files if "/" in f}
    is_modular = len(top_dirs) >= 2 or len(tree_files) >= 8

    # Calculate engineering score (0-100)
    eng_score = 25 if (repo.get("size", 0) > 10 or len(tree_files) > 3) else 10
    if is_modular:
        eng_score += 20
    if has_dependency_manifest:
        eng_score += 15
    if has_gitignore:
        eng_score += 10
    if has_linter_or_config or has_env_example:
        eng_score += 10
    if has_tests:
        eng_score += 10
    if has_ci or has_docker:
        eng_score += 10

    # If tree was not inspected, estimate conservatively from metadata
    if not repo.get("inspected"):
        size = repo.get("size", 0)
        eng_score = 45 if size > 100 else 30 if size > 15 else 15

    return {
        "tree_inspected": bool(repo.get("inspected")),
        "file_count": len(tree_files),
        "top_level_dirs": sorted(list(top_dirs))[:10],
        "is_modular": is_modular,
        "has_tests": has_tests,
        "has_ci": has_ci,
        "has_docker": has_docker,
        "has_dependency_manifest": has_dependency_manifest,
        "has_gitignore": has_gitignore,
        "has_env_example": has_env_example,
        "has_linter_or_config": has_linter_or_config,
        "has_frontend": has_frontend,
        "has_backend": has_backend,
        "is_fullstack": bool(has_frontend and has_backend),
        "score": min(100, eng_score)
    }


def analyze_repos_node(state: Dict[str, Any]) -> Dict[str, Any]:
    raw_profile: Dict[str, Any] = state.get("raw_profile", {})
    raw_repos: List[Dict[str, Any]] = state.get("raw_repos", [])
    raw_events: List[Dict[str, Any]] = state.get("raw_events", [])
    now = datetime.now(timezone.utc)

    # ------------------------------------------------------------------
    # 1. PROFILE COMPLETENESS ANALYSIS (Section 6)
    # ------------------------------------------------------------------
    has_avatar = bool(raw_profile.get("avatar_url"))
    has_display_name = bool(raw_profile.get("name") and raw_profile.get("name").strip() != raw_profile.get("login"))
    has_bio = bool(raw_profile.get("bio") and len(raw_profile.get("bio").strip()) >= 10)
    has_location = bool(raw_profile.get("location"))
    has_company = bool(raw_profile.get("company"))
    has_blog = bool(raw_profile.get("blog") and len(raw_profile.get("blog").strip()) > 0)
    has_twitter = bool(raw_profile.get("twitter_username"))
    has_profile_readme = bool(raw_profile.get("has_profile_readme"))
    has_repos = len(raw_repos) > 0

    profile_elements = [
        {
            "key": "identity",
            "label": "Identity & Display Name",
            "present": bool(raw_profile.get("name")),
            "value": raw_profile.get("name") or None,
            "observation": f"Display name is set to '{raw_profile.get('name')}'." if raw_profile.get("name") else "This information is currently unavailable (only handle is visible).",
            "why_it_matters": "A clear display name helps recruiters, collaborators, and engineering leads match your GitHub handle to your resume or application.",
            "recommended_action": "Add your full name in GitHub Profile Settings."
        },
        {
            "key": "bio",
            "label": "Developer Bio",
            "present": has_bio,
            "value": raw_profile.get("bio") or None,
            "observation": f"Bio present ({len(raw_profile.get('bio') or '')} chars)." if has_bio else "This information is currently unavailable.",
            "why_it_matters": "Your bio is the first summary visitors read to understand your engineering focus, core stack, and current role.",
            "recommended_action": "Write a concise 1–2 sentence bio stating your primary technical domain and core technologies."
        },
        {
            "key": "professional_context",
            "label": "Professional Context (Location / Organization)",
            "present": bool(has_location or has_company),
            "value": " • ".join(filter(None, [raw_profile.get("company"), raw_profile.get("location")])) or None,
            "observation": "Location and/or organization context is provided." if (has_location or has_company) else "Location and organization fields are currently unavailable.",
            "why_it_matters": "Provides time-zone, regional, or institutional context for hiring teams and open-source maintainers.",
            "recommended_action": "Add your city/country or current university/company in GitHub Profile Settings."
        },
        {
            "key": "external_links",
            "label": "External Portfolio / Social Links",
            "present": bool(has_blog or has_twitter),
            "value": raw_profile.get("blog") or (f"@{raw_profile.get('twitter_username')}" if has_twitter else None),
            "observation": f"External link configured ({raw_profile.get('blog') or raw_profile.get('twitter_username')})." if (has_blog or has_twitter) else "External portfolio or social links are currently unavailable.",
            "why_it_matters": "External links allow visitors to view your live portfolio, LinkedIn, or technical writing directly from your profile.",
            "recommended_action": "Link your personal portfolio website or LinkedIn URL in the Website field."
        },
        {
            "key": "profile_readme",
            "label": "Profile README (username/username)",
            "present": has_profile_readme,
            "value": f"Active ({raw_profile.get('profile_readme_length', 0)} chars)" if has_profile_readme else None,
            "observation": f"Special profile repository '{raw_profile.get('login')}/{raw_profile.get('login')}' is active." if has_profile_readme else "No profile-level README repository was detected.",
            "why_it_matters": "A profile README acts as a customizable landing page above your repositories, highlighting your flagship work and technical focus.",
            "recommended_action": f"Create a public repository named '{raw_profile.get('login')}' with a README.md introducing your work and featured projects."
        },
        {
            "key": "public_repositories",
            "label": "Public Repository Presence",
            "present": has_repos,
            "value": f"{len(raw_repos)} source repositories",
            "observation": f"{len(raw_repos)} non-forked public repositories available for inspection." if has_repos else "No non-forked public repositories are currently visible.",
            "why_it_matters": "Public source repositories provide verifiable evidence of how you structure code, document systems, and solve problems.",
            "recommended_action": "Publish or un-private key engineering projects with clean documentation."
        }
    ]

    # ------------------------------------------------------------------
    # 2. PER-REPOSITORY QUALITY, DOCS, ENGINEERING & DEPTH (Sections 7, 8, 12)
    # ------------------------------------------------------------------
    analyzed_repos: List[Dict[str, Any]] = []
    languages_list: List[str] = []
    lang_repos_map: Dict[str, List[str]] = defaultdict(list)
    tech_repos_map: Dict[str, Set[str]] = defaultdict(set)
    tech_meta_map: Dict[str, Dict[str, Any]] = {}

    total_stars = 0
    total_forks = 0
    total_size = 0
    repos_with_desc = 0
    repos_with_topics = 0
    repos_with_homepage = 0
    repos_with_license = 0
    repos_with_open_issues = 0
    repos_pushed_30d = 0
    repos_pushed_90d = 0
    repos_pushed_180d = 0

    inspected_repos_count = 0
    inspected_with_readme = 0
    inspected_with_install = 0
    inspected_with_usage = 0
    inspected_with_screenshots = 0
    inspected_with_arch = 0
    signal_totals = Counter()

    push_dates: List[datetime] = []
    monthly_repo_pushes = Counter()

    for r in raw_repos:
        r_name = r.get("name") or "unnamed"
        stars = r.get("stargazers_count", 0)
        forks = r.get("forks_count", 0)
        size = r.get("size", 0)
        desc = (r.get("description") or "").strip()
        topics = r.get("topics") or []
        homepage = (r.get("homepage") or "").strip()
        license_name = r.get("license")
        lang = r.get("language")

        total_stars += stars
        total_forks += forks
        total_size += size

        if desc:
            repos_with_desc += 1
        if len(topics) > 0:
            repos_with_topics += 1
        if homepage:
            repos_with_homepage += 1
        if license_name:
            repos_with_license += 1
        if r.get("open_issues_count", 0) > 0:
            repos_with_open_issues += 1

        if lang:
            languages_list.append(lang)
            lang_repos_map[lang].append(r_name)

        # Timestamps & Maintenance State Classification
        pushed_at_str = r.get("pushed_at")
        created_at_str = r.get("created_at")
        days_since_push = None
        days_since_created = None

        if pushed_at_str:
            try:
                p_date = datetime.fromisoformat(pushed_at_str.replace("Z", "+00:00"))
                push_dates.append(p_date)
                days_since_push = max(0, (now - p_date).days)
                month_key = p_date.strftime("%Y-%m")
                monthly_repo_pushes[month_key] += 1
                if days_since_push <= 30:
                    repos_pushed_30d += 1
                if days_since_push <= 90:
                    repos_pushed_90d += 1
                if days_since_push <= 180:
                    repos_pushed_180d += 1
            except Exception:
                pass

        if created_at_str:
            try:
                c_date = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                days_since_created = max(0, (now - c_date).days)
            except Exception:
                pass

        if r.get("archived"):
            lifecycle_state = "Archived"
        elif days_since_created is not None and days_since_created <= 30:
            lifecycle_state = "Recently created"
        elif days_since_push is not None and days_since_push <= 60:
            lifecycle_state = "Active"
        elif days_since_push is not None and days_since_push <= 180:
            lifecycle_state = "Stable"
        elif stars >= 5 or homepage:
            lifecycle_state = "Stable"
        else:
            lifecycle_state = "Dormant"

        # README & Documentation analysis
        readme_info = _analyze_readme_content(r.get("readme_text"), bool(license_name))
        if r.get("inspected"):
            inspected_repos_count += 1
            if readme_info["exists"]:
                inspected_with_readme += 1
                for sig_k, sig_v in readme_info["signals"].items():
                    if sig_v:
                        signal_totals[sig_k] += 1
                if readme_info["signals"]["installation"]:
                    inspected_with_install += 1
                if readme_info["signals"]["usage"]:
                    inspected_with_usage += 1
                if readme_info["signals"]["screenshots"]:
                    inspected_with_screenshots += 1
                if readme_info["signals"]["architecture"]:
                    inspected_with_arch += 1
        else:
            # Estimate documentation score when not deep-inspected
            est_doc = 0
            if desc:
                est_doc += 35
            if len(topics) > 0:
                est_doc += 20
            if homepage:
                est_doc += 20
            if license_name:
                est_doc += 15
            readme_info["score"] = est_doc

        # Engineering signals
        eng_info = _analyze_engineering_signals(r, readme_info)

        # Technology signature detection for this repo
        searchable_blob = " ".join([
            r_name.lower(),
            desc.lower(),
            (lang or "").lower(),
            " ".join(t.lower() for t in topics),
            " ".join(f.lower() for f in (r.get("tree_files") or [])[:150]),
            (r.get("readme_text") or "")[:3000].lower()
        ])
        repo_detected_techs: List[str] = []
        if lang:
            repo_detected_techs.append(lang)
        for sig in TECH_SIGNATURES:
            if any(kw in searchable_blob for kw in sig["keywords"]):
                t_name = sig["name"]
                if t_name not in repo_detected_techs:
                    repo_detected_techs.append(t_name)
                tech_repos_map[t_name].add(r_name)
                tech_meta_map[t_name] = sig

        # Sub-scores for Repository Health (0-100)
        doc_sub = readme_info["score"]
        if desc:
            doc_sub = min(100, doc_sub + 10)
        eng_sub = eng_info["score"]

        # Maintenance sub-score (does not penalize stable/completed projects unfairly)
        if lifecycle_state == "Active":
            maint_sub = 90
        elif lifecycle_state == "Recently created":
            maint_sub = 80
        elif lifecycle_state == "Stable":
            maint_sub = 75
        elif lifecycle_state == "Archived":
            maint_sub = 65
        else:
            maint_sub = 45

        # Discoverability sub-score
        disc_sub = 0
        if desc:
            disc_sub += 35
        if len(topics) >= 3:
            disc_sub += 30
        elif len(topics) >= 1:
            disc_sub += 15
        if homepage:
            disc_sub += 20
        if readme_info["exists"]:
            disc_sub += 15
        disc_sub = min(100, disc_sub)

        # Community sub-score
        comm_sub = 20
        if stars >= 10:
            comm_sub += 45
        elif stars >= 3:
            comm_sub += 30
        elif stars >= 1:
            comm_sub += 15
        if forks >= 1:
            comm_sub += 20
        if license_name or readme_info["signals"].get("contribution"):
            comm_sub += 15
        comm_sub = min(100, comm_sub)

        repo_health_score = round(
            doc_sub * 0.30 +
            eng_sub * 0.30 +
            maint_sub * 0.15 +
            disc_sub * 0.15 +
            comm_sub * 0.10
        )

        # Observable standout reasons & gaps
        standout_reasons: List[str] = []
        if len(repo_detected_techs) >= 3:
            standout_reasons.append(f"Multiple technologies ({', '.join(repo_detected_techs[:4])})")
        if lifecycle_state in ("Active", "Recently created"):
            standout_reasons.append("Active development")
        if eng_info["is_fullstack"]:
            standout_reasons.append("Backend + frontend architecture")
        if any(t in repo_detected_techs for t in ["LangGraph", "LangChain", "PyTorch", "TensorFlow", "OpenAI / LLM", "Scikit-Learn"]):
            standout_reasons.append("AI / ML integration")
        if readme_info["exists"] and readme_info["score"] >= 60:
            standout_reasons.append("Detailed documentation")
        if eng_info["has_tests"] or eng_info["has_ci"] or eng_info["has_docker"]:
            standout_reasons.append("Testing / CI / containerization signals")
        if homepage:
            standout_reasons.append("Live deployment / homepage link")
        if stars > 0:
            standout_reasons.append(f"{stars} star{'s' if stars != 1 else ''}")

        repo_gaps: List[str] = []
        if not desc:
            repo_gaps.append("Missing repository description")
        if len(topics) == 0:
            repo_gaps.append("No repository topic tags")
        if r.get("inspected") and not readme_info["exists"]:
            repo_gaps.append("Missing README.md")
        elif r.get("inspected") and readme_info["score"] < 50:
            repo_gaps.append("README lacks setup or usage instructions")
        if not license_name:
            repo_gaps.append("No open-source license specified")
        if not homepage and eng_info["has_frontend"]:
            repo_gaps.append("No live demo or deployment URL linked")

        # Project Depth Classification
        depth_score = (
            (25 if size >= 150 or eng_info["file_count"] >= 15 else 10 if size >= 20 else 0) +
            (20 if len(repo_detected_techs) >= 3 else 10 if len(repo_detected_techs) >= 2 else 0) +
            (20 if eng_info["is_fullstack"] or eng_info["is_modular"] else 0) +
            (20 if readme_info["score"] >= 55 else 10 if readme_info["exists"] else 0) +
            (15 if lifecycle_state in ("Active", "Stable", "Recently created") else 0)
        )

        if depth_score >= 65 and len(standout_reasons) >= 2:
            depth_class = "Flagship"
        elif lifecycle_state == "Dormant" and depth_score < 45:
            depth_class = "Dormant"
        elif depth_score >= 40:
            depth_class = "Supporting"
        else:
            depth_class = "Experimental"

        analyzed_repos.append({
            "name": r_name,
            "full_name": r.get("full_name"),
            "description": desc or None,
            "homepage": homepage or None,
            "language": lang,
            "stargazers_count": stars,
            "watchers_count": r.get("watchers_count", 0),
            "forks_count": forks,
            "open_issues_count": r.get("open_issues_count", 0),
            "size": size,
            "license": license_name,
            "topics": topics,
            "visibility": r.get("visibility", "public"),
            "default_branch": r.get("default_branch", "main"),
            "created_at": created_at_str,
            "updated_at": r.get("updated_at"),
            "pushed_at": pushed_at_str,
            "days_since_push": days_since_push,
            "html_url": r.get("html_url"),
            "lifecycle_state": lifecycle_state,
            "depth_classification": depth_class,
            "depth_score": depth_score,
            "health_score": repo_health_score,
            "breakdown": {
                "documentation": doc_sub,
                "engineering": eng_sub,
                "maintenance": maint_sub,
                "discoverability": disc_sub,
                "community": comm_sub
            },
            "readme": {
                "inspected": bool(r.get("inspected")),
                "exists": readme_info["exists"],
                "length": readme_info["length"],
                "word_count": readme_info["word_count"],
                "heading_count": readme_info["heading_count"],
                "code_block_count": readme_info["code_block_count"],
                "score": readme_info["score"],
                "signals": readme_info["signals"],
                "strong": readme_info["strong"],
                "missing": readme_info["missing"]
            },
            "engineering": eng_info,
            "detected_technologies": repo_detected_techs,
            "standout_reasons": standout_reasons,
            "gaps": repo_gaps
        })

    total_repos = len(raw_repos)

    # ------------------------------------------------------------------
    # 3. TECHNOLOGY INTELLIGENCE & DEVELOPER DNA (Sections 10 & 11)
    # ------------------------------------------------------------------
    lang_counter = Counter(languages_list)
    top_languages = [item[0] for item in lang_counter.most_common(5)]
    language_distribution = [
        {
            "name": k,
            "count": v,
            "percentage": round((v / len(languages_list) * 100), 1) if languages_list else 0,
            "repositories": lang_repos_map[k][:8]
        }
        for k, v in lang_counter.most_common(8)
    ]

    detected_technologies = []
    for t_name, r_set in sorted(tech_repos_map.items(), key=lambda x: len(x[1]), reverse=True):
        meta = tech_meta_map.get(t_name, {})
        detected_technologies.append({
            "name": t_name,
            "category": meta.get("category", "Technology"),
            "count": len(r_set),
            "repositories": sorted(list(r_set))[:10]
        })

    # Developer DNA calculation from observable repo evidence
    dna_categories = [
        "AI / ML",
        "Full Stack",
        "Backend",
        "Frontend",
        "DevOps & Cloud",
        "Systems & Tooling",
        "Open Source & Community"
    ]
    dna_results = []
    for cat in dna_categories:
        matching_techs = [
            t["name"] for t in detected_technologies
            if cat in tech_meta_map.get(t["name"], {}).get("dna", [])
        ]
        matching_repos = set()
        for t_name in matching_techs:
            matching_repos.update(tech_repos_map.get(t_name, set()))

        evidence_items = []
        if cat == "Full Stack":
            fs_repos = [ar["name"] for ar in analyzed_repos if ar["engineering"]["is_fullstack"]]
            matching_repos.update(fs_repos)
            if fs_repos:
                evidence_items.append(f"{len(fs_repos)} full-stack repository structure(s) detected ({', '.join(fs_repos[:3])})")
        if cat == "Open Source & Community":
            licensed_repos = [ar["name"] for ar in analyzed_repos if ar["license"]]
            starred_repos = [ar["name"] for ar in analyzed_repos if ar["stargazers_count"] > 0]
            matching_repos.update(licensed_repos)
            matching_repos.update(starred_repos)
            if total_stars > 0:
                evidence_items.append(f"{total_stars} public stars across {len(starred_repos)} repositories")
            if licensed_repos:
                evidence_items.append(f"{len(licensed_repos)} repositories include open-source licenses")
            if raw_profile.get("forked_repos_count", 0) > 0:
                evidence_items.append(f"{raw_profile.get('forked_repos_count')} upstream repositories forked")

        if matching_techs:
            evidence_items.append(f"Technologies detected: {', '.join(matching_techs[:5])}")
        if matching_repos:
            evidence_items.append(f"Observed in {len(matching_repos)} repositories: {', '.join(sorted(list(matching_repos))[:4])}")

        repo_ratio = (len(matching_repos) / max(1, total_repos)) * 100
        strength = min(100, round(repo_ratio * 0.7 + min(30, len(matching_techs) * 8))) if (matching_repos or evidence_items) else 0

        if strength > 0:
            dna_results.append({
                "category": cat,
                "strength": strength,
                "repository_count": len(matching_repos),
                "repositories": sorted(list(matching_repos))[:8],
                "technologies": matching_techs[:6],
                "evidence": evidence_items
            })

    dna_results.sort(key=lambda x: x["strength"], reverse=True)

    # ------------------------------------------------------------------
    # 4. ACTIVITY INTELLIGENCE (Section 9)
    # ------------------------------------------------------------------
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

    # Analyze public events for commit/PR/issue activity
    event_counts = Counter()
    monthly_events = Counter()
    active_event_repos = Counter()
    event_dates: List[datetime] = []

    for ev in raw_events:
        ev_type = ev.get("type", "Other")
        event_counts[ev_type] += 1
        repo_n = (ev.get("repo") or {}).get("name", "")
        if repo_n:
            short_n = repo_n.split("/")[-1]
            active_event_repos[short_n] += 1
        created_s = ev.get("created_at")
        if created_s:
            try:
                ev_dt = datetime.fromisoformat(created_s.replace("Z", "+00:00"))
                event_dates.append(ev_dt)
                monthly_events[ev_dt.strftime("%Y-%m")] += 1
            except Exception:
                pass

    # Build 12-month timeline ending at current month
    monthly_timeline = []
    cur_year = now.year
    cur_month = now.month
    for i in range(11, -1, -1):
        m = cur_month - i
        y = cur_year
        while m <= 0:
            m += 12
            y -= 1
        ym = f"{y:04d}-{m:02d}"
        month_label = datetime(y, m, 1).strftime("%b %Y")
        pushes_cnt = monthly_repo_pushes.get(ym, 0)
        events_cnt = monthly_events.get(ym, 0)
        combined_signal = pushes_cnt + events_cnt
        monthly_timeline.append({
            "month": ym,
            "label": month_label,
            "short_label": datetime(y, m, 1).strftime("%b"),
            "repo_updates": pushes_cnt,
            "public_events": events_cnt,
            "total_signal": combined_signal
        })

    most_active_month_obj = max(monthly_timeline, key=lambda x: x["total_signal"], default=None)
    most_active_period = (
        f"{most_active_month_obj['label']} ({most_active_month_obj['total_signal']} signals)"
        if most_active_month_obj and most_active_month_obj["total_signal"] > 0
        else "No recent public activity recorded"
    )

    active_repo_names = [ar["name"] for ar in analyzed_repos if ar["lifecycle_state"] in ("Active", "Recently created")]
    dormant_repo_names = [ar["name"] for ar in analyzed_repos if ar["lifecycle_state"] == "Dormant"]

    activity_insights = []
    if repos_pushed_30d > 0:
        activity_insights.append(f"Recent public activity is concentrated in {repos_pushed_30d} repositor{'y' if repos_pushed_30d == 1 else 'ies'} updated within the last 30 days ({', '.join(active_repo_names[:4])}).")
    elif repos_pushed_90d > 0:
        activity_insights.append(f"{repos_pushed_90d} repositor{'y has' if repos_pushed_90d == 1 else 'ies have'} been updated within the last 90 days, with no pushes in the past 30 days.")
    else:
        activity_insights.append("No public repository pushes were observed within the past 90 days.")

    if len(dormant_repo_names) > 0:
        activity_insights.append(f"{len(dormant_repo_names)} of {total_repos} repositories have not been updated in over 6 months ({', '.join(dormant_repo_names[:4])}).")

    pr_events = event_counts.get("PullRequestEvent", 0) + event_counts.get("PullRequestReviewEvent", 0)
    issue_events = event_counts.get("IssuesEvent", 0) + event_counts.get("IssueCommentEvent", 0)
    push_events = event_counts.get("PushEvent", 0)

    # ------------------------------------------------------------------
    # 5. DOCUMENTATION INTELLIGENCE SUMMARY (Section 8)
    # ------------------------------------------------------------------
    inspected_repos_list = [ar for ar in analyzed_repos if ar["readme"]["inspected"]]
    avg_doc_score = (
        round(sum(ar["readme"]["score"] for ar in inspected_repos_list) / len(inspected_repos_list))
        if inspected_repos_list
        else round((repos_with_desc / max(1, total_repos)) * 50)
    )

    doc_strong_areas = []
    doc_missing_areas = []
    if inspected_repos_count > 0:
        if inspected_with_readme == inspected_repos_count:
            doc_strong_areas.append(f"All {inspected_repos_count} inspected repositories contain a README.md file")
        elif inspected_with_readme > 0:
            doc_strong_areas.append(f"{inspected_with_readme} of {inspected_repos_count} inspected repositories contain a README.md file")
        else:
            doc_missing_areas.append("None of the inspected repositories contain a README.md file")

        if repos_with_desc >= max(1, round(total_repos * 0.7)):
            doc_strong_areas.append(f"Repository descriptions present on {repos_with_desc} of {total_repos} repositories")
        else:
            doc_missing_areas.append(f"{total_repos - repos_with_desc} of {total_repos} repositories lack short descriptions")

        if inspected_with_install >= max(1, inspected_repos_count // 2):
            doc_strong_areas.append(f"Installation/setup instructions found in {inspected_with_install} of {inspected_repos_count} inspected READMEs")
        else:
            doc_missing_areas.append(f"Installation instructions missing in {inspected_repos_count - inspected_with_install} of {inspected_repos_count} inspected READMEs")

        if inspected_with_usage >= max(1, inspected_repos_count // 2):
            doc_strong_areas.append(f"Usage examples included in {inspected_with_usage} of {inspected_repos_count} inspected READMEs")
        else:
            doc_missing_areas.append(f"Usage examples missing in {inspected_repos_count - inspected_with_usage} of {inspected_repos_count} inspected READMEs")

        if inspected_with_screenshots == 0:
            doc_missing_areas.append("Screenshots or visual demos are missing across inspected READMEs")
        else:
            doc_strong_areas.append(f"Visual screenshots/demos present in {inspected_with_screenshots} inspected README(s)")

        if inspected_with_arch == 0:
            doc_missing_areas.append("Architecture or system structure explanations are missing")
        else:
            doc_strong_areas.append(f"Architecture explanations present in {inspected_with_arch} inspected README(s)")

    documentation_intelligence = {
        "score": avg_doc_score,
        "inspected_count": inspected_repos_count,
        "readme_count": inspected_with_readme,
        "install_count": inspected_with_install,
        "usage_count": inspected_with_usage,
        "screenshots_count": inspected_with_screenshots,
        "architecture_count": inspected_with_arch,
        "strong_areas": doc_strong_areas,
        "missing_areas": doc_missing_areas,
        "signal_coverage": dict(signal_totals)
    }

    # ------------------------------------------------------------------
    # 6. PROJECT DEPTH & FEATURED CANDIDATES (Section 12)
    # ------------------------------------------------------------------
    sorted_by_depth = sorted(
        analyzed_repos,
        key=lambda x: (x["health_score"] * 0.6 + x["depth_score"] * 0.4, x["stargazers_count"]),
        reverse=True
    )
    featured_candidates = [
        {
            "name": r["name"],
            "description": r["description"],
            "language": r["language"],
            "health_score": r["health_score"],
            "depth_classification": r["depth_classification"],
            "lifecycle_state": r["lifecycle_state"],
            "stargazers_count": r["stargazers_count"],
            "forks_count": r["forks_count"],
            "html_url": r["html_url"],
            "homepage": r["homepage"],
            "standout_reasons": r["standout_reasons"] or ["Public source repository"],
            "detected_technologies": r["detected_technologies"][:6]
        }
        for r in sorted_by_depth[:4]
    ]

    # Sort best_repos for backward compatibility while enriching with full intelligence
    best_repos = sorted_by_depth[:6]

    # ------------------------------------------------------------------
    # 7. COMMUNITY & DISCOVERABILITY ANALYSIS (Sections 13 & 14)
    # ------------------------------------------------------------------
    starred_repos_list = [r for r in analyzed_repos if r["stargazers_count"] > 0]
    if len(starred_repos_list) == 0:
        community_interpretation = "Public repositories have not yet accumulated external stars or forks; community visibility is at an early stage."
    elif len(starred_repos_list) <= 2:
        names_str = ", ".join(r["name"] for r in starred_repos_list[:2])
        community_interpretation = f"Public community interaction is currently concentrated around {len(starred_repos_list)} repositor{'y' if len(starred_repos_list) == 1 else 'ies'} ({names_str})."
    else:
        community_interpretation = f"External community engagement is distributed across {len(starred_repos_list)} public repositories totaling {total_stars} stars and {total_forks} forks."

    discoverability_missing = []
    discoverability_present = []
    if repos_with_topics < max(1, round(total_repos * 0.5)):
        discoverability_missing.append(f"Repository topics missing on {total_repos - repos_with_topics} of {total_repos} repositories")
    else:
        discoverability_present.append(f"Repository topics configured on {repos_with_topics} of {total_repos} repositories")

    if repos_with_desc < max(1, round(total_repos * 0.8)):
        discoverability_missing.append(f"Repository descriptions missing on {total_repos - repos_with_desc} of {total_repos} repositories")
    else:
        discoverability_present.append(f"Descriptions provided for {repos_with_desc} of {total_repos} repositories")

    if not has_profile_readme:
        discoverability_missing.append("Profile README (username/username)")
    else:
        discoverability_present.append("Profile README active")

    if inspected_with_screenshots == 0 and inspected_repos_count > 0:
        discoverability_missing.append("Project screenshots or visual previews in READMEs")
    elif inspected_with_screenshots > 0:
        discoverability_present.append(f"Project visuals included in {inspected_with_screenshots} README(s)")

    if repos_with_homepage == 0 and total_repos > 0:
        discoverability_missing.append("Live deployment or documentation URLs on repositories")
    elif repos_with_homepage > 0:
        discoverability_present.append(f"External homepage/demo URLs linked on {repos_with_homepage} repositor{'y' if repos_with_homepage == 1 else 'ies'}")

    repo_analysis = {
        "total_repos": total_repos,
        "forked_repos_count": raw_profile.get("forked_repos_count", 0),
        "inspected_repos_count": inspected_repos_count,
        "total_stars": total_stars,
        "total_forks": total_forks,
        "avg_repo_size": round(total_size / total_repos, 1) if total_repos > 0 else 0,
        "repos_with_desc": repos_with_desc,
        "desc_percentage": round((repos_with_desc / total_repos) * 100, 1) if total_repos > 0 else 0,
        "repos_with_topics": repos_with_topics,
        "topics_percentage": round((repos_with_topics / total_repos) * 100, 1) if total_repos > 0 else 0,
        "repos_with_homepage": repos_with_homepage,
        "homepage_percentage": round((repos_with_homepage / total_repos) * 100, 1) if total_repos > 0 else 0,
        "repos_with_license": repos_with_license,
        "license_percentage": round((repos_with_license / total_repos) * 100, 1) if total_repos > 0 else 0,
        "repos_with_open_issues": repos_with_open_issues,
        "repos_pushed_30d": repos_pushed_30d,
        "repos_pushed_90d": repos_pushed_90d,
        "repos_pushed_180d": repos_pushed_180d,
        "top_languages": top_languages,
        "primary_language": top_languages[0] if top_languages else "N/A",
        "language_distribution": language_distribution,
        "unique_languages_count": len(lang_counter),
        "detected_technologies": detected_technologies,
        "developer_dna": dna_results,
        "longest_streak_days": longest_streak,
        "profile_completeness": {
            "elements": profile_elements,
            "present_count": sum(1 for el in profile_elements if el["present"]),
            "total_count": len(profile_elements)
        },
        "documentation_intelligence": documentation_intelligence,
        "activity_intelligence": {
            "monthly_timeline": monthly_timeline,
            "most_active_period": most_active_period,
            "longest_streak_days": longest_streak,
            "active_repositories": active_repo_names,
            "recently_inactive_repositories": dormant_repo_names,
            "event_breakdown": {
                "push_events": push_events,
                "pr_events": pr_events,
                "issue_events": issue_events,
                "total_public_events": len(raw_events)
            },
            "insights": activity_insights
        },
        "project_depth": {
            "flagship_count": sum(1 for r in analyzed_repos if r["depth_classification"] == "Flagship"),
            "supporting_count": sum(1 for r in analyzed_repos if r["depth_classification"] == "Supporting"),
            "experimental_count": sum(1 for r in analyzed_repos if r["depth_classification"] == "Experimental"),
            "dormant_count": sum(1 for r in analyzed_repos if r["depth_classification"] == "Dormant"),
            "featured_candidates": featured_candidates
        },
        "community_intelligence": {
            "followers": raw_profile.get("followers", 0),
            "following": raw_profile.get("following", 0),
            "stars_received": total_stars,
            "forks_received": total_forks,
            "pr_participation": pr_events,
            "issue_participation": issue_events,
            "starred_repos_count": len(starred_repos_list),
            "interpretation": community_interpretation
        },
        "discoverability_intelligence": {
            "present": discoverability_present,
            "missing": discoverability_missing
        },
        "repositories": analyzed_repos,
        "best_repos": best_repos
    }

    return {
        **state,
        "repo_analysis": repo_analysis
    }
