import os
import asyncio
import re
import html
import httpx
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
from typing import Dict, Any, List

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = html.unescape(clean)
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()


# ---------------------------------------------------------------------------
# Platform search-link generators (for platforms without free public APIs)
# ---------------------------------------------------------------------------

def _build_platform_links(roles: List[str], skills: List[str], location: str) -> List[Dict[str, str]]:
    """Generate direct search URLs for major job platforms that lack free APIs."""
    primary_role = roles[0] if roles else "Software Engineer"
    skill_str = " ".join(skills[:3]) if skills else ""
    query_raw = f"{primary_role} {skill_str}".strip()
    q = quote_plus(query_raw)
    loc = quote_plus(location) if location else ""
    naukri_kw = query_raw.lower().replace(" ", "-")

    platforms = [
        {
            "name": "LinkedIn",
            "icon": "linkedin",
            "color": "#0A66C2",
            "url": f"https://www.linkedin.com/jobs/search/?keywords={q}" + (f"&location={loc}" if loc else ""),
        },
        {
            "name": "Indeed",
            "icon": "indeed",
            "color": "#2164F3",
            "url": f"https://www.indeed.com/jobs?q={q}" + (f"&l={loc}" if loc else ""),
        },
        {
            "name": "Naukri",
            "icon": "naukri",
            "color": "#4A90D9",
            "url": f"https://www.naukri.com/{naukri_kw}-jobs" + (f"?l={loc}" if loc else ""),
        },
        {
            "name": "Internshala",
            "icon": "internshala",
            "color": "#00A5EC",
            "url": f"https://internshala.com/jobs/{quote_plus(primary_role.lower().replace(' ', '-'))}-jobs",
        },
        {
            "name": "Wellfound",
            "icon": "wellfound",
            "color": "#000000",
            "url": f"https://wellfound.com/role/r/{quote_plus(primary_role.lower().replace(' ', '-'))}",
        },
        {
            "name": "Instahyre",
            "icon": "instahyre",
            "color": "#FF6B35",
            "url": f"https://www.instahyre.com/search-jobs/?search={q}",
        },
        {
            "name": "Y Combinator",
            "icon": "ycombinator",
            "color": "#F26522",
            "url": f"https://www.workatastartup.com/jobs?query={q}",
        },
        {
            "name": "Glassdoor",
            "icon": "glassdoor",
            "color": "#0CAA41",
            "url": f"https://www.glassdoor.com/Job/jobs.htm?sc.keyword={q}" + (f"&locT=C&locKeyword={loc}" if loc else ""),
        },
    ]
    return platforms


async def search_jobs_node(state: Dict[str, Any]) -> Dict[str, Any]:
    search_queries = state.get("search_queries", [])
    parsed_profile = state.get("parsed_profile", {})
    skills = parsed_profile.get("skills", [])
    roles = parsed_profile.get("preferred_roles", ["Software Engineer"])
    location_override = state.get("location_override", "")

    rapidapi_key = os.getenv("RAPIDAPI_KEY")
    rapidapi_host = os.getenv("RAPIDAPI_HOST", "jsearch.p.rapidapi.com")

    headers = {
        "X-RapidAPI-Key": rapidapi_key or "",
        "X-RapidAPI-Host": rapidapi_host
    }

    raw_jobs: List[Dict[str, Any]] = []
    seen_ids: set = set()

    # Build query terms used by multiple secondary sources
    query_terms: List[str] = []
    if skills:
        query_terms.extend([s.lower() for s in skills[:3]])
    if roles:
        query_terms.append(roles[0].lower().replace("engineer", "").replace("developer", "").strip())
    query_terms = [t for t in query_terms if t]

    # =========================================================================
    # Source helpers (all run in parallel below)
    # =========================================================================

    # 1. JSearch RapidAPI (primary, aggregates LinkedIn / Indeed / Glassdoor)
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

    # 2. Remotive (remote developer jobs)
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

    # 3. Arbeitnow (global tech jobs)
    async def fetch_arbeitnow(client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        try:
            resp = await client.get(
                "https://www.arbeitnow.com/api/job-board-api",
                timeout=10.0
            )
            if resp.status_code == 200:
                return resp.json().get("data", [])[:15]
        except Exception:
            pass
        return []

    # 4. RemoteOK (popular remote job board — free JSON API)
    async def fetch_remoteok(client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        try:
            resp = await client.get(
                "https://remoteok.com/api",
                headers={"User-Agent": "InnovateX/1.0"},
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                # First item is metadata, skip it
                return [j for j in data[1:] if isinstance(j, dict)][:20]
        except Exception:
            pass
        return []

    # 5. Jobicy (remote-first jobs with salary data)
    async def fetch_jobicy(client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        try:
            resp = await client.get(
                "https://jobicy.com/api/v2/remote-jobs",
                params={"count": 15, "tag": skills[0].lower() if skills else "developer"},
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("jobs", [])
        except Exception:
            pass
        return []

    # 6. LinkedIn Guest API (Live jobs & internships without auth tokens)
    async def fetch_linkedin(client: httpx.AsyncClient, q: str, loc: str) -> List[Dict[str, Any]]:
        try:
            url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
            headers_li = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            params_li = {
                "keywords": q,
                "location": loc or "Remote",
                "start": 0
            }
            resp = await client.get(url, headers=headers_li, params=params_li, timeout=9.0)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                cards = soup.find_all('li')
                results = []
                for card in cards[:12]:
                    title_el = card.find('h3', class_='base-search-card__title')
                    comp_el = card.find('h4', class_='base-search-card__subtitle')
                    loc_el = card.find('span', class_='job-search-card__location')
                    link_el = card.find('a', class_='base-card__full-link')
                    time_el = card.find('time')
                    if title_el and link_el and link_el.get('href'):
                        results.append({
                            "title": title_el.get_text(strip=True),
                            "company": comp_el.get_text(strip=True) if comp_el else "Tech Company",
                            "location": loc_el.get_text(strip=True) if loc_el else (loc or "Remote"),
                            "link": link_el['href'],
                            "date": time_el.get_text(strip=True) if time_el else None
                        })
                return results
        except Exception:
            pass
        return []

    # 7. Internshala (Live internships with verified stipend details)
    async def fetch_internshala(client: httpx.AsyncClient, role: str) -> List[Dict[str, Any]]:
        try:
            clean_role = role.lower().replace("engineer", "").replace("developer", "").strip() or "software"
            url = f"https://internshala.com/internships/{clean_role}-development-internship"
            headers_ish = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            resp = await client.get(url, headers=headers_ish, timeout=9.0)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                cards = soup.find_all('div', class_='individual_internship')
                results = []
                for c in cards[:12]:
                    heading = c.find('h3') or c.find('h2') or c.find('a')
                    company = c.find('p', class_='company-name') or c.find('div', class_='company-name')
                    stip = c.find('span', class_='stipend')
                    loc = c.find('a', class_='location_link') or c.find('span', class_='location_link')
                    link = c.find('a', class_='job-title-href') or c.find('a', class_='view_detail_button') or c.find('a', href=True)
                    if heading and link and link.get('href'):
                        href = link['href']
                        if not href.startswith('http'):
                            href = 'https://internshala.com' + href
                        results.append({
                            "title": heading.get_text(strip=True),
                            "company": company.get_text(strip=True) if company else "Startup",
                            "location": loc.get_text(strip=True) if loc else "Remote",
                            "stipend": stip.get_text(strip=True) if stip else "Performance / Unpaid",
                            "link": href
                        })
                return results
        except Exception:
            pass
        return []

    # 8. Y Combinator / Hacker News Startup Hiring
    async def fetch_ycombinator(client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        try:
            r = await client.get("https://hacker-news.firebaseio.com/v0/jobstories.json", timeout=5.0)
            if r.status_code == 200:
                ids = r.json()[:10]
                tasks = [client.get(f"https://hacker-news.firebaseio.com/v0/item/{jid}.json", timeout=3.5) for jid in ids]
                item_resps = await asyncio.gather(*tasks, return_exceptions=True)
                results = []
                for res in item_resps:
                    if isinstance(res, httpx.Response) and res.status_code == 200:
                        data = res.json()
                        title = data.get("title", "")
                        url = data.get("url") or f"https://news.ycombinator.com/item?id={data.get('id')}"
                        comp = "YC Startup"
                        for separator in ["is hiring", "Is Hiring", "is looking", "Is Looking"]:
                            if separator in title:
                                comp = title.split(separator)[0].strip()
                                break
                        results.append({
                            "title": title,
                            "company": comp,
                            "link": url,
                            "id": str(data.get("id"))
                        })
                return results
        except Exception:
            pass
        return []

    # =========================================================================
    # Parallel fetch — all sources at once for speed
    # =========================================================================
    async with httpx.AsyncClient() as client:
        all_tasks = []

        # JSearch queries (up to 3)
        for q in search_queries[:3]:
            all_tasks.append(("jsearch", fetch_jsearch(client, q)))

        # LinkedIn Guest API
        primary_role = roles[0] if roles else "Software Engineer"
        all_tasks.append(("linkedin", fetch_linkedin(client, f"{primary_role} intern", location_override or "")))

        # Internshala
        all_tasks.append(("internshala", fetch_internshala(client, primary_role)))

        # Y Combinator
        all_tasks.append(("ycombinator", fetch_ycombinator(client)))

        # Remotive queries
        for t in query_terms:
            all_tasks.append(("remotive", fetch_remotive(client, t)))

        # Arbeitnow
        all_tasks.append(("arbeitnow", fetch_arbeitnow(client)))

        # RemoteOK
        all_tasks.append(("remoteok", fetch_remoteok(client)))

        # Jobicy
        all_tasks.append(("jobicy", fetch_jobicy(client)))

        labels = [t[0] for t in all_tasks]
        coros = [t[1] for t in all_tasks]
        results = await asyncio.gather(*coros, return_exceptions=True)

    # =========================================================================
    # Normalize results from each source
    # =========================================================================
    for label, result in zip(labels, results):
        if isinstance(result, Exception) or not isinstance(result, list):
            continue

        for item in result:
            if len(raw_jobs) >= 45:
                break

            if label == "jsearch":
                jid = str(item.get("job_id"))
                if not jid or jid in seen_ids:
                    continue
                seen_ids.add(jid)
                pub = item.get("job_publisher") or "JSearch"
                title_val = item.get("job_title", "Software Engineer")
                emp_type = item.get("job_employment_type", "FULLTIME")
                if "intern" in title_val.lower():
                    emp_type = "INTERNSHIP"
                raw_jobs.append({
                    "job_id": jid,
                    "job_title": title_val,
                    "employer_name": item.get("employer_name", "Technology Corp"),
                    "job_city": item.get("job_city"),
                    "job_country": item.get("job_country"),
                    "job_description": (item.get("job_description") or "")[:800],
                    "job_apply_link": item.get("job_apply_link") or item.get("job_google_link"),
                    "job_posted_at_datetime_utc": item.get("job_posted_at_datetime_utc"),
                    "job_min_salary": item.get("job_min_salary"),
                    "job_max_salary": item.get("job_max_salary"),
                    "job_salary_currency": item.get("job_salary_currency", "USD"),
                    "job_employment_type": emp_type,
                    "job_required_skills": item.get("job_required_skills") or [],
                    "source": pub
                })

            elif label == "linkedin":
                link_url = item.get("link", "")
                jid = f"li_{abs(hash(link_url))}"
                if jid in seen_ids:
                    continue
                seen_ids.add(jid)
                title_val = item.get("title", "Software Engineer Intern")
                is_intern = "intern" in title_val.lower() or "internship" in title_val.lower()
                raw_jobs.append({
                    "job_id": jid,
                    "job_title": title_val,
                    "employer_name": item.get("company", "Tech Company"),
                    "job_city": item.get("location", "Remote"),
                    "job_country": "Global",
                    "job_description": f"Role: {title_val} at {item.get('company')}. Location: {item.get('location')}. Applied directly on LinkedIn.",
                    "job_apply_link": link_url,
                    "job_posted_at_datetime_utc": item.get("date"),
                    "job_min_salary": None,
                    "job_max_salary": None,
                    "job_salary_currency": "USD",
                    "job_employment_type": "INTERNSHIP" if is_intern else "FULLTIME",
                    "job_required_skills": skills[:4] if skills else [],
                    "source": "LinkedIn"
                })

            elif label == "internshala":
                link_url = item.get("link", "")
                jid = f"ish_{abs(hash(link_url))}"
                if jid in seen_ids:
                    continue
                seen_ids.add(jid)
                title_val = item.get("title", "Software Intern")
                raw_jobs.append({
                    "job_id": jid,
                    "job_title": title_val if "intern" in title_val.lower() else f"{title_val} Intern",
                    "employer_name": item.get("company", "Startup"),
                    "job_city": item.get("location", "Remote"),
                    "job_country": "India / Remote",
                    "job_description": f"Internship: {title_val} at {item.get('company')}. Location: {item.get('location')}. Stipend: {item.get('stipend')}.",
                    "job_apply_link": link_url,
                    "job_posted_at_datetime_utc": "Recently",
                    "job_min_salary": None,
                    "job_max_salary": None,
                    "job_salary_currency": "INR",
                    "job_employment_type": "INTERNSHIP",
                    "job_required_skills": skills[:4] if skills else [],
                    "source": "Internshala"
                })

            elif label == "ycombinator":
                jid = f"yc_{item.get('id')}"
                if jid in seen_ids:
                    continue
                seen_ids.add(jid)
                title_val = item.get("title", "YC Startup Developer")
                raw_jobs.append({
                    "job_id": jid,
                    "job_title": title_val,
                    "employer_name": item.get("company", "YC Startup"),
                    "job_city": "Remote / Hybrid",
                    "job_country": "Global",
                    "job_description": f"{title_val} - High growth Y Combinator backed startup.",
                    "job_apply_link": item.get("link"),
                    "job_posted_at_datetime_utc": "Recently",
                    "job_min_salary": None,
                    "job_max_salary": None,
                    "job_salary_currency": "USD",
                    "job_employment_type": "INTERNSHIP" if "intern" in title_val.lower() else "FULLTIME",
                    "job_required_skills": skills[:4] if skills else [],
                    "source": "Y Combinator"
                })

            elif label == "remotive":
                jid = f"remotive_{item.get('id')}"
                if jid in seen_ids:
                    continue
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
                    "job_required_skills": item.get("tags") or [],
                    "source": "Remotive"
                })

            elif label == "arbeitnow":
                jid = f"arbeitnow_{item.get('slug')}"
                if jid in seen_ids:
                    continue
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
                    "job_required_skills": item.get("tags") or [],
                    "source": "Arbeitnow"
                })

            elif label == "remoteok":
                jid = f"remoteok_{item.get('id')}"
                if jid in seen_ids:
                    continue
                seen_ids.add(jid)
                desc = clean_html(item.get("description", ""))[:800]
                sal_min = None
                sal_max = None
                salary_raw = item.get("salary")
                if salary_raw and isinstance(salary_raw, str):
                    nums = re.findall(r'\d[\d,]*', salary_raw)
                    if len(nums) >= 2:
                        sal_min = int(nums[0].replace(",", ""))
                        sal_max = int(nums[1].replace(",", ""))
                    elif len(nums) == 1:
                        sal_min = int(nums[0].replace(",", ""))
                raw_jobs.append({
                    "job_id": jid,
                    "job_title": item.get("position", "Remote Developer"),
                    "employer_name": item.get("company", "Remote Startup"),
                    "job_city": "Remote",
                    "job_country": item.get("location", "Worldwide"),
                    "job_description": desc,
                    "job_apply_link": item.get("url") or item.get("apply_url"),
                    "job_posted_at_datetime_utc": item.get("date"),
                    "job_min_salary": sal_min,
                    "job_max_salary": sal_max,
                    "job_salary_currency": "USD",
                    "job_employment_type": "REMOTE",
                    "job_required_skills": item.get("tags") or [],
                    "source": "RemoteOK"
                })

            elif label == "jobicy":
                jid = f"jobicy_{item.get('id')}"
                if jid in seen_ids:
                    continue
                seen_ids.add(jid)
                desc = clean_html(item.get("jobDescription", ""))[:800]
                sal_min = item.get("annualSalaryMin")
                sal_max = item.get("annualSalaryMax")
                raw_jobs.append({
                    "job_id": jid,
                    "job_title": item.get("jobTitle", "Remote Developer"),
                    "employer_name": item.get("companyName", "Remote Company"),
                    "job_city": "Remote",
                    "job_country": item.get("jobGeo", "Worldwide"),
                    "job_description": desc,
                    "job_apply_link": item.get("url"),
                    "job_posted_at_datetime_utc": item.get("pubDate"),
                    "job_min_salary": sal_min,
                    "job_max_salary": sal_max,
                    "job_salary_currency": item.get("salaryCurrency", "USD"),
                    "job_employment_type": (item.get("jobType") or "FULLTIME").upper().replace(" ", ""),
                    "job_required_skills": [],
                    "source": "Jobicy"
                })

    # =========================================================================
    # Build platform search links for platforms without public APIs
    # =========================================================================
    platform_links = _build_platform_links(roles, skills, location_override or "")

    return {
        **state,
        "raw_jobs": raw_jobs[:45],
        "platform_links": platform_links
    }

