import httpx
from typing import Optional, Dict, Any, List

class SemanticScholarClient:
    def __init__(self):
        self.base_url = "https://api.semanticscholar.org/graph/v1"

    async def get_paper(self, paper_id: str) -> Optional[Dict[str, Any]]:
        fields = "title,authors,abstract,year,citationCount,referenceCount,fieldsOfStudy,tldr,url,openAccessPdf"
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/paper/{paper_id}",
                params={"fields": fields},
                headers={"User-Agent": "InnovateX-Research-Agent"},
                timeout=20.0
            )
            if resp.status_code == 200:
                return resp.json()
            return None

    async def get_recommendations(self, paper_id: str, limit: int = 8) -> List[Dict[str, Any]]:
        fields = "title,authors,year,citationCount,url,openAccessPdf"
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/paper/{paper_id}/recommendations",
                params={"fields": fields, "limit": limit},
                headers={"User-Agent": "InnovateX-Research-Agent"},
                timeout=20.0
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("recommendedPapers", [])
            return []
