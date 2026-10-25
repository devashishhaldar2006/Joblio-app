from typing import Dict, Any, List

def formatter_node(state: Dict[str, Any]) -> Dict[str, Any]:
    scored_jobs: List[Dict[str, Any]] = state.get("scored_jobs", [])
    final_results = []

    for j in scored_jobs:
        city = j.get("job_city")
        country = j.get("job_country")
        loc_str = f"{city}, {country}" if city and country else (city or country or "Remote / Flexible")

        def _fmt(val):
            try:
                num = float(val)
                return f"{int(num):,}"
            except (ValueError, TypeError):
                return str(val)

        min_sal = j.get("job_min_salary")
        max_sal = j.get("job_max_salary")
        curr = j.get("job_salary_currency") or "$"
        if min_sal and max_sal:
            salary_range = f"{curr}{_fmt(min_sal)} - {curr}{_fmt(max_sal)}"
        elif min_sal:
            salary_range = f"From {curr}{_fmt(min_sal)}"
        else:
            salary_range = "Competitive"

        final_results.append({
            "rank": j.get("rank"),
            "job_id": j.get("job_id"),
            "title": j.get("job_title"),
            "company": j.get("employer_name"),
            "location": loc_str,
            "employment_type": j.get("job_employment_type", "Full-time"),
            "salary_range": salary_range,
            "match_score": j.get("match_score"),
            "match_reason": j.get("match_reason"),
            "jd_bullets": j.get("jd_bullets", []),
            "skill_overlap": j.get("skill_overlap", []),
            "missing_skills": j.get("missing_skills", []),
            "apply_link": j.get("job_apply_link") or "https://google.com/search?q=" + (j.get("job_title", "") + " " + j.get("employer_name", "")),
            "posted_at": j.get("job_posted_at_datetime_utc"),
            "source": j.get("source", "")
        })

    return {
        **state,
        "final_results": final_results
    }
