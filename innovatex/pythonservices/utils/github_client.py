import os
import base64
import httpx
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

class GitHubAPIError(Exception):
    def __init__(self, message: str, status_code: int = 500, rate_limit: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.rate_limit = rate_limit or {}

class GitHubClient:
    def __init__(self, token: Optional[str] = None):
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.base_url = "https://api.github.com"
        self.last_rate_limit: Dict[str, Any] = {
            "limit": 60,
            "remaining": None,
            "used": None,
            "reset_at": None,
            "authenticated": bool(self.token and self.token != "your_github_personal_access_token")
        }

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "Joblio-Developer-Platform"
        }
        if self.token and self.token != "your_github_personal_access_token":
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _update_rate_limit(self, response: httpx.Response):
        try:
            limit = response.headers.get("x-ratelimit-limit")
            remaining = response.headers.get("x-ratelimit-remaining")
            used = response.headers.get("x-ratelimit-used")
            reset_ts = response.headers.get("x-ratelimit-reset")
            reset_iso = None
            if reset_ts:
                reset_iso = datetime.fromtimestamp(int(reset_ts), tz=timezone.utc).isoformat()
            self.last_rate_limit = {
                "limit": int(limit) if limit is not None else self.last_rate_limit.get("limit", 60),
                "remaining": int(remaining) if remaining is not None else self.last_rate_limit.get("remaining"),
                "used": int(used) if used is not None else self.last_rate_limit.get("used"),
                "reset_at": reset_iso,
                "authenticated": bool(self.token and self.token != "your_github_personal_access_token")
            }
        except Exception:
            pass

    def _handle_error(self, resp: httpx.Response, context: str = "GitHub API"):
        self._update_rate_limit(resp)
        if resp.status_code == 404:
            raise GitHubAPIError(f"{context} not found on GitHub.", status_code=404, rate_limit=self.last_rate_limit)
        if resp.status_code in (403, 429):
            remaining = self.last_rate_limit.get("remaining")
            reset_at = self.last_rate_limit.get("reset_at")
            if remaining == 0 or resp.status_code == 429:
                msg = f"GitHub API rate limit exceeded. Resets at {reset_at or 'shortly'}."
                raise GitHubAPIError(msg, status_code=429, rate_limit=self.last_rate_limit)
            raise GitHubAPIError(f"GitHub access forbidden ({context}).", status_code=403, rate_limit=self.last_rate_limit)
        if resp.status_code == 401:
            raise GitHubAPIError("GitHub token unauthorized or expired.", status_code=401, rate_limit=self.last_rate_limit)
        resp.raise_for_status()

    async def get_user(self, username: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/users/{username}",
                headers=self._get_headers(),
                timeout=15.0
            )
            if resp.status_code != 200:
                self._handle_error(resp, f"GitHub user '@{username}'")
            self._update_rate_limit(resp)
            return resp.json()

    async def get_user_repos(self, username: str, per_page: int = 100) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/users/{username}/repos",
                headers=self._get_headers(),
                params={"per_page": per_page, "sort": "updated", "type": "owner"},
                timeout=20.0
            )
            if resp.status_code != 200:
                self._handle_error(resp, f"Repositories for '@{username}'")
            self._update_rate_limit(resp)
            return resp.json()

    async def get_user_events(self, username: str, per_page: int = 100) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/users/{username}/events/public",
                    headers=self._get_headers(),
                    params={"per_page": per_page},
                    timeout=12.0
                )
                self._update_rate_limit(resp)
                if resp.status_code == 200:
                    data = resp.json()
                    return data if isinstance(data, list) else []
            except Exception:
                pass
            return []

    async def get_readme(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/repos/{owner}/{repo}/readme",
                    headers=self._get_headers(),
                    timeout=10.0
                )
                self._update_rate_limit(resp)
                if resp.status_code == 200:
                    return resp.json()
            except Exception:
                pass
            return None

    async def get_readme_text(self, owner: str, repo: str) -> Optional[str]:
        data = await self.get_readme(owner, repo)
        if not data:
            return None
        content = data.get("content", "")
        encoding = data.get("encoding", "base64")
        if content and encoding == "base64":
            try:
                return base64.b64decode(content).decode("utf-8", errors="replace")
            except Exception:
                return None
        return None

    async def get_repo_languages(self, owner: str, repo: str) -> Dict[str, int]:
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/repos/{owner}/{repo}/languages",
                    headers=self._get_headers(),
                    timeout=10.0
                )
                self._update_rate_limit(resp)
                if resp.status_code == 200:
                    return resp.json()
            except Exception:
                pass
            return {}

    async def search_repositories(self, query: str, sort: str = "updated", per_page: int = 20) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/search/repositories",
                headers=self._get_headers(),
                params={"q": query, "sort": sort, "per_page": per_page},
                timeout=20.0
            )
            self._update_rate_limit(resp)
            resp.raise_for_status()
            data = resp.json()
            return data.get("items", [])

    async def get_repo_issues(self, owner: str, repo: str, labels: str = "good first issue", state: str = "open", per_page: int = 10) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/issues",
                headers=self._get_headers(),
                params={"labels": labels, "state": state, "per_page": per_page},
                timeout=15.0
            )
            self._update_rate_limit(resp)
            if resp.status_code == 200:
                return resp.json()
            return []

    async def get_issue(self, owner: str, repo: str, issue_number: int) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/issues/{issue_number}",
                headers=self._get_headers(),
                timeout=15.0
            )
            self._update_rate_limit(resp)
            resp.raise_for_status()
            return resp.json()

    async def get_tree(self, owner: str, repo: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/repos/{owner}/{repo}/git/trees/HEAD?recursive=1",
                    headers=self._get_headers(),
                    timeout=12.0
                )
                self._update_rate_limit(resp)
                if resp.status_code == 200:
                    return resp.json()
            except Exception:
                pass
            return {"tree": []}

    async def get_contents(self, owner: str, repo: str, path: str) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/repos/{owner}/{repo}/contents/{path}",
                    headers=self._get_headers(),
                    timeout=12.0
                )
                self._update_rate_limit(resp)
                if resp.status_code == 200:
                    return resp.json()
            except Exception:
                pass
            return None
