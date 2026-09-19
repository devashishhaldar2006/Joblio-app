import os
import httpx
from typing import Optional, Dict, Any, List

class GitHubClient:
    def __init__(self, token: Optional[str] = None):
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.base_url = "https://api.github.com"

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "InnovateX-Developer-Platform"
        }
        if self.token and self.token != "your_github_personal_access_token":
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def get_user(self, username: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/users/{username}",
                headers=self._get_headers(),
                timeout=15.0
            )
            resp.raise_for_status()
            return resp.json()

    async def get_user_repos(self, username: str, per_page: int = 100) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/users/{username}/repos",
                headers=self._get_headers(),
                params={"per_page": per_page, "sort": "updated"},
                timeout=20.0
            )
            resp.raise_for_status()
            return resp.json()

    async def get_readme(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/readme",
                headers=self._get_headers(),
                timeout=10.0
            )
            if resp.status_code == 200:
                return resp.json()
            return None

    async def search_repositories(self, query: str, sort: str = "updated", per_page: int = 20) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/search/repositories",
                headers=self._get_headers(),
                params={"q": query, "sort": sort, "per_page": per_page},
                timeout=20.0
            )
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
            resp.raise_for_status()
            return resp.json()

    async def get_tree(self, owner: str, repo: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/git/trees/HEAD?recursive=1",
                headers=self._get_headers(),
                timeout=20.0
            )
            if resp.status_code == 200:
                return resp.json()
            return {"tree": []}

    async def get_contents(self, owner: str, repo: str, path: str) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/contents/{path}",
                headers=self._get_headers(),
                timeout=15.0
            )
            if resp.status_code == 200:
                return resp.json()
            return None
