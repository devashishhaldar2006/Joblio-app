"""
Two-pass NLP Skill Extraction Engine for Job Descriptions.
Combines exact-match regex dictionary lookup with pattern-based discovery
of emerging frameworks, computing frequency, percentages, and co-occurrences.
"""

import re
import datetime
from collections import Counter, defaultdict
from typing import List, Dict, Any, Set, Tuple

from utils.skill_dictionary import SKILLS, SKILL_ALIASES, normalize_skill, get_all_skills

# Precompile regex for Pass 1 dictionary skills for high performance
_COMPILED_SKILL_PATTERNS: List[Tuple[str, re.Pattern]] = []

def _init_patterns():
    global _COMPILED_SKILL_PATTERNS
    if _COMPILED_SKILL_PATTERNS:
        return
    
    # Collect all unique skills and aliases
    skill_terms: Dict[str, str] = {}
    for cat, skills in SKILLS.items():
        for s in skills:
            skill_terms[s.lower()] = s
    for alias, target in SKILL_ALIASES.items():
        skill_terms[alias.lower()] = target

    for term, canonical in skill_terms.items():
        # Word boundary match handling special characters like C++, C#, .NET
        escaped = re.escape(term)
        # If term ends with special characters like +, #, . word boundary \b won't match after them
        if term.endswith(("+", "#", ".")):
            pattern = re.compile(rf'(?:\b|(?<=\s)){escaped}(?=\s|[.,;:!?/\)]|$)', re.IGNORECASE)
        elif term.startswith((".", "#")):
            pattern = re.compile(rf'(?:^|\s){escaped}\b', re.IGNORECASE)
        else:
            pattern = re.compile(rf'\b{escaped}\b', re.IGNORECASE)
        _COMPILED_SKILL_PATTERNS.append((canonical, pattern))

_init_patterns()

# Patterns for Pass 2: Unlisted / Emerging skills extraction
EMERGING_PATTERNS = [
    re.compile(r'(?:experience with|proficiency in|knowledge of|familiar with|expertise in|skilled in|strong in|background in)\s+([A-Za-z0-9+#.\s]{2,35})', re.IGNORECASE),
    re.compile(r'(?:hands-on experience with|solid understanding of|working knowledge of)\s+([A-Za-z0-9+#.\s]{2,35})', re.IGNORECASE),
]

# Non-technical stop words to exclude from Pass 2 extraction
NON_TECH_STOPWORDS = {
    "years", "year", "team", "teams", "work", "working", "environment", "communication",
    "skills", "ability", "project", "projects", "development", "production", "design",
    "architecture", "systems", "clients", "stakeholders", "solutions", "best practices",
    "fast-paced", "cross-functional", "multiple", "various", "complex", "large scale",
    "computer science", "related field", "equivalent", "plus", "required", "preferred",
    "responsibilities", "requirements", "qualifications", "strong", "excellent", "proven",
    "track record", "collaborative", "passion", "fast paced", "day-to-day", "business",
    "industry", "written and verbal", "written", "verbal", "interpersonal", "problem solving"
}

def get_current_iso_week(dt: datetime.datetime = None) -> str:
    """Returns ISO week format 'YYYY-Www', e.g. '2026-W38'."""
    target_dt = dt or datetime.datetime.now(datetime.timezone.utc)
    year, week, _ = target_dt.isocalendar()
    return f"{year}-W{week:02d}"

def extract_skills_from_single_jd(jd_text: str, explicit_skills: List[str] = None) -> Tuple[Set[str], List[str]]:
    """
    Extracts matched skills from a single job description text.
    Returns (set_of_canonical_skills, list_of_raw_pattern_candidates).
    """
    found_skills: Set[str] = set()
    emerging_candidates: List[str] = []

    # Include explicit skills from JSearch if provided
    if explicit_skills:
        for s in explicit_skills:
            if isinstance(s, str) and s.strip():
                canonical = normalize_skill(s.strip())
                found_skills.add(canonical)

    if not jd_text:
        return found_skills, emerging_candidates

    # Pass 1: Dictionary Matching
    for canonical, pattern in _COMPILED_SKILL_PATTERNS:
        if pattern.search(jd_text):
            found_skills.add(canonical)

    # Pass 2: Pattern-based extraction for emerging terms
    for ep in EMERGING_PATTERNS:
        matches = ep.findall(jd_text)
        for m in matches:
            cleaned = m.strip().split(",")[0].split(".")[0].split(";")[0].split(" and ")[0].strip()
            cleaned_lower = cleaned.lower()
            words = cleaned.split()
            # Filter to 1-4 words, not purely numeric, not in stopwords, and not already extracted
            if 1 <= len(words) <= 4 and len(cleaned) >= 3:
                if not any(stop in cleaned_lower for stop in NON_TECH_STOPWORDS):
                    canonical = normalize_skill(cleaned)
                    if canonical in found_skills:
                        continue
                    # Check titlecase / alphanumeric format
                    if re.match(r'^[A-Za-z0-9+#.]+(?:\s+[A-Za-z0-9+#.]+)*$', cleaned):
                        emerging_candidates.append(cleaned.title())

    return found_skills, emerging_candidates

def extract_skills_from_jobs(jobs: List[Dict[str, Any]], week_override: str = None) -> Dict[str, Any]:
    """
    Extracts skills, frequencies, percentages, co-occurrences, and emerging terms across jobs.
    """
    total_jobs = len(jobs)
    if total_jobs == 0:
        return {
            "week": week_override or get_current_iso_week(),
            "total_jobs": 0,
            "skill_counts": {},
            "skill_percentages": {},
            "emerging_skills": [],
            "co_occurrences": {}
        }

    skill_counts = Counter()
    emerging_counter = Counter()
    # Co-occurrence graph: skill -> Counter of other skills
    co_occurrences_map: Dict[str, Counter] = defaultdict(Counter)

    for job in jobs:
        desc = job.get("job_description") or ""
        title = job.get("job_title") or ""
        combined_text = f"{title}\n{desc}"
        explicit = job.get("job_required_skills") or []

        matched_skills, emerging_candidates = extract_skills_from_single_jd(combined_text, explicit)

        # Update frequencies
        for s in matched_skills:
            skill_counts[s] += 1

        # Update emerging candidates
        for ec in emerging_candidates:
            emerging_counter[ec] += 1

        # Update co-occurrences
        matched_list = list(matched_skills)
        for i in range(len(matched_list)):
            for j in range(len(matched_list)):
                if i != j:
                    co_occurrences_map[matched_list[i]][matched_list[j]] += 1

    # Percentages
    skill_percentages: Dict[str, float] = {
        skill: round((count / total_jobs) * 100.0, 2)
        for skill, count in skill_counts.items()
    }

    # Emerging skills: seen at least 3% of jobs or 50+ times, not in standard SKILLS
    all_standard_skills_lower = {s.lower() for s in get_all_skills()}
    emerging_skills: List[str] = []
    threshold = max(3, int(total_jobs * 0.03))
    for term, count in emerging_counter.most_common(20):
        if count >= threshold and term.lower() not in all_standard_skills_lower:
            emerging_skills.append(term)

    # Format top 5 co-occurrences per skill
    co_occurrences_output: Dict[str, List[str]] = {}
    for skill, counter in co_occurrences_map.items():
        top_pairs = [pair[0] for pair in counter.most_common(5)]
        co_occurrences_output[skill] = top_pairs

    week_str = week_override or get_current_iso_week()

    return {
        "week": week_str,
        "total_jobs": total_jobs,
        "skill_counts": dict(skill_counts.most_common()),
        "skill_percentages": skill_percentages,
        "emerging_skills": emerging_skills[:10],
        "co_occurrences": co_occurrences_output
    }
