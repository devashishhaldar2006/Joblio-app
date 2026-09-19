"""
JSearch API Job Description Scraper.
Fetches real live job postings across broad developer categories on RapidAPI,
extracting job details, requirements, and timestamps for skill intelligence.
"""

import os
import asyncio
import logging
import httpx
from dotenv import load_dotenv
from typing import List, Dict, Any, Set

load_dotenv()

logger = logging.getLogger("market.jd_scraper")
logger.setLevel(logging.INFO)

TARGET_QUERIES = [
    "software engineer",
    "backend developer",
    "frontend developer",
    "full stack developer",
    "machine learning engineer",
    "data scientist",
    "devops engineer",
    "mobile developer",
    "cloud engineer",
    "AI engineer"
]

TARGET_COUNTRIES = "us,in,gb,ca,de"

async def fetch_jobs_for_query(
    client: httpx.AsyncClient,
    query: str,
    page: int = 1,
    num_pages: int = 3,
    date_posted: str = "all"
) -> List[Dict[str, Any]]:
    """
    Query JSearch RapidAPI for a specific query string.
    Supports search-v2 endpoint with fallback to search.
    Handles rate limiting (429) with retry backoff.
    """
    rapidapi_key = os.getenv("RAPIDAPI_KEY", "")
    rapidapi_host = os.getenv("RAPIDAPI_HOST", "jsearch.p.rapidapi.com")

    if not rapidapi_key or rapidapi_key in ("your_rapidapi_key", "RAPIDAPI_KEY"):
        logger.warning("RAPIDAPI_KEY is not configured. Returning empty jobs.")
        return []

    headers = {
        "X-RapidAPI-Key": rapidapi_key,
        "X-RapidAPI-Host": rapidapi_host
    }

    params = {
        "query": query,
        "page": str(page),
        "num_pages": str(num_pages),
        "date_posted": date_posted,
        "country": TARGET_COUNTRIES
    }

    # Primary endpoint on RapidAPI is search-v2, with fallback to search
    endpoints = [
        "https://jsearch.p.rapidapi.com/search-v2",
        "https://jsearch.p.rapidapi.com/search"
    ]

    for url in endpoints:
        for attempt in range(2):
            try:
                resp = await client.get(url, headers=headers, params=params, timeout=25.0)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_data = data.get("data")
                    if isinstance(raw_data, dict):
                        jobs = raw_data.get("jobs", [])
                    elif isinstance(raw_data, list):
                        jobs = raw_data
                    else:
                        jobs = []
                    logger.info(f"Fetched {len(jobs)} jobs for query '{query}' from {url}")
                    return jobs
                elif resp.status_code == 429:
                    logger.warning(f"Rate limited (429) on query '{query}'. Retrying after 10s...")
                    await asyncio.sleep(10.0)
                    continue
                elif resp.status_code == 404:
                    # Try next endpoint
                    break
                else:
                    logger.error(f"JSearch API error {resp.status_code}: {resp.text[:200]}")
                    break
            except Exception as e:
                logger.error(f"Error fetching JSearch jobs for '{query}' (attempt {attempt+1}): {e}")
                if attempt == 0:
                    await asyncio.sleep(2.0)

    return []

async def scrape_weekly_jobs(date_posted: str = "week", max_pages_per_query: int = 3) -> List[Dict[str, Any]]:
    """
    Fetches real job postings from JSearch across 10 developer roles.
    Deduplicates across queries by job_id and extracts standard attributes.
    Target: 500-800 unique job postings per run.
    """
    all_jobs: List[Dict[str, Any]] = []
    seen_ids: Set[str] = set()

    logger.info(f"Starting job scraper across {len(TARGET_QUERIES)} target market queries...")

    async with httpx.AsyncClient() as client:
        for idx, query in enumerate(TARGET_QUERIES):
            try:
                raw_results = await fetch_jobs_for_query(
                    client=client,
                    query=query,
                    page=1,
                    num_pages=max_pages_per_query,
                    date_posted=date_posted
                )

                for job in raw_results:
                    job_id = str(job.get("job_id") or "")
                    if not job_id or job_id in seen_ids:
                        continue
                    
                    seen_ids.add(job_id)

                    # Extract required fields
                    job_record = {
                        "job_id": job_id,
                        "job_title": job.get("job_title", "Software Engineer"),
                        "employer_name": job.get("employer_name", "Tech Company"),
                        "job_country": job.get("job_country", "Global"),
                        "job_description": job.get("job_description") or "",
                        "job_posted_at_datetime_utc": job.get("job_posted_at_datetime_utc"),
                        "job_required_skills": job.get("job_required_skills") or [],
                        "job_employment_type": job.get("job_employment_type", "FULLTIME"),
                        "job_apply_link": job.get("job_apply_link") or job.get("job_google_link") or "",
                        "search_query": query
                    }
                    all_jobs.append(job_record)

            except Exception as exc:
                logger.error(f"Error scraping query '{query}': {exc}")

            # Polite 0.5s rate-limit delay between queries
            await asyncio.sleep(0.5)

    logger.info(f"Successfully collected {len(all_jobs)} unique real job postings.")
    return all_jobs
