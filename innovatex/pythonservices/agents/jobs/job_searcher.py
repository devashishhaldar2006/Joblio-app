import os
import asyncio
import re
import html
import httpx
from typing import Dict, Any, List

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = html.unescape(clean)
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()

async def search_jobs_node(state: Dict[str, Any]) -> Dict[str, Any]:
    search_queries = state.get("search_queries", [])
    parsed_profile = state.get("parsed_profile", {})
    skills = parsed_profile.get("skills", [])
    roles = parsed_profile.get("preferred_roles", ["Software Engineer"])

    rapidapi_key = os.getenv("RAPIDAPI_KEY")
    rapidapi_host = os.getenv("RAPIDAPI_HOST", "jsearch.p.rapidapi.com")

    headers = {
        "X-RapidAPI-Key": rapidapi_key or "",
        "X-RapidAPI-Host": rapidapi_host
    }

    raw_jobs = []
    seen_ids = set()

    # 1. Primary Source: JSearch RapidAPI
    async def fetch_jsearch(client: httpx.AsyncClient, q: str) -> List[Dict[str, Any]]:
        if not rapidapi_key or rapidapi_key == "your_rapidapi_key":
            return []
        try:
            resp = await client.get(
                "https://jsearch.p.rapidapi.com/search",
                headers=headers,
                params={"query": q, "page": 1, "num_pages": 1, "date_posted": "week"},
                timeout=12.0
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("data", [])
        except Exception:
            pass
        return []

    async with httpx.AsyncClient() as client:
        jsearch_results = await asyncio.gather(*[fetch_jsearch(client, q) for q in search_queries[:3]])

    for job_list in jsearch_results:
        for j in job_list:
            jid = str(j.get("job_id"))
            if jid and jid not in seen_ids:
                seen_ids.add(jid)
                raw_jobs.append({
                    "job_id": jid,
                    "job_title": j.get("job_title", "Software Engineer"),
                    "employer_name": j.get("employer_name", "Technology Corp"),
                    "job_city": j.get("job_city"),
                    "job_country": j.get("job_country"),
                    "job_description": (j.get("job_description") or "")[:800],
                    "job_apply_link": j.get("job_apply_link") or j.get("job_google_link"),
                    "job_posted_at_datetime_utc": j.get("job_posted_at_datetime_utc"),
                    "job_min_salary": j.get("job_min_salary"),
                    "job_max_salary": j.get("job_max_salary"),
                    "job_salary_currency": j.get("job_salary_currency", "USD"),
                    "job_employment_type": j.get("job_employment_type", "FULLTIME"),
                    "job_required_skills": j.get("job_required_skills") or []
                })

    # 2. Live Secondary Source: Remotive Live Remote Developer Jobs API
    if len(raw_jobs) < 10:
        query_terms = []
        if skills:
            query_terms.extend([s.lower() for s in skills[:3]])
        if roles:
            query_terms.append(roles[0].lower().replace("engineer", "").replace("developer", "").strip())

        async def fetch_remotive(client: httpx.AsyncClient, term: str) -> List[Dict[str, Any]]:
            if not term:
                return []
            try:
                resp = await client.get(
                    "https://remotive.com/api/remote-jobs",
                    params={"search": term, "limit": 10},
                    timeout=10.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("jobs", [])
            except Exception:
                pass
            return []

        async with httpx.AsyncClient() as client:
            remotive_results = await asyncio.gather(*[fetch_remotive(client, t) for t in query_terms if t])

        for r_list in remotive_results:
            for item in r_list:
                jid = f"remotive_{item.get('id')}"
                if jid not in seen_ids:
                    seen_ids.add(jid)
                    desc = clean_html(item.get("description", ""))[:800]
                    raw_jobs.append({
                        "job_id": jid,
                        "job_title": item.get("title", "Software Engineer"),
                        "employer_name": item.get("company_name", "Remote Tech"),
                        "job_city": "Remote",
                        "job_country": item.get("candidate_required_location") or "Worldwide",
                        "job_description": desc,
                        "job_apply_link": item.get("url"),
                        "job_posted_at_datetime_utc": item.get("publication_date"),
                        "job_min_salary": None,
                        "job_max_salary": None,
                        "job_salary_currency": "USD",
                        "job_employment_type": (item.get("job_type") or "FULLTIME").upper(),
                        "job_required_skills": item.get("tags") or []
                    })
                    if len(raw_jobs) >= 25:
                        break
            if len(raw_jobs) >= 25:
                break

    # 3. Live Tertiary Source: Arbeitnow Live Global Tech Jobs API (backup if needed)
    if len(raw_jobs) < 5:
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get("https://www.arbeitnow.com/api/job-board-api", timeout=10.0)
                if r.status_code == 200:
                    data = r.json().get("data", [])
                    for item in data[:15]:
                        jid = f"arbeitnow_{item.get('slug')}"
                        if jid not in seen_ids:
                            seen_ids.add(jid)
                            desc = clean_html(item.get("description", ""))[:800]
                            raw_jobs.append({
                                "job_id": jid,
                                "job_title": item.get("title"),
                                "employer_name": item.get("company_name"),
                                "job_city": item.get("location") or "Remote",
                                "job_country": "Global",
                                "job_description": desc,
                                "job_apply_link": item.get("url"),
                                "job_posted_at_datetime_utc": item.get("created_at"),
                                "job_min_salary": None,
                                "job_max_salary": None,
                                "job_salary_currency": "USD",
                                "job_employment_type": "FULLTIME" if not item.get("remote") else "REMOTE",
                                "job_required_skills": item.get("tags") or []
                            })
                            if len(raw_jobs) >= 20:
                                break
        except Exception:
            pass

    return {
        **state,
        "raw_jobs": raw_jobs[:25]
    }
