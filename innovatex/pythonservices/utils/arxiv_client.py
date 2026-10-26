import re
import httpx
import xml.etree.ElementTree as ET
from typing import Optional, Dict, Any

class ArxivClient:
    def __init__(self):
        self.base_url = "https://export.arxiv.org/api/query"

    def extract_arxiv_id(self, input_str: str) -> Optional[str]:
        # Examples: https://arxiv.org/abs/2303.08774, 2303.08774v1, arxiv:2303.08774
        pattern = r"(?:arxiv\.org\/(?:abs|pdf)\/|arxiv:)?([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?)"
        match = re.search(pattern, input_str.strip(), re.IGNORECASE)
        if match:
            # Strip version like v1, v2 if needed, but arxiv API works well with clean base ID
            clean_id = re.sub(r"v[0-9]+$", "", match.group(1))
            return clean_id
        return None

    async def get_by_id(self, arxiv_id: str) -> Optional[Dict[str, Any]]:
        headers = {"User-Agent": "Joblio-Research-Agent/1.0 (academic; mailto:support@joblio.app)"}
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    self.base_url,
                    params={"id_list": arxiv_id},
                    headers=headers,
                    timeout=25.0
                )
                if resp.status_code == 200:
                    return self._parse_feed(resp.text)
        except Exception as e:
            print(f"[ArxivClient] Error fetching arxiv_id {arxiv_id}: {e}")
        return None

    async def search_by_title(self, title: str) -> Optional[Dict[str, Any]]:
        clean_title = re.sub(r'[\'"]', '', title.strip())
        headers = {"User-Agent": "Joblio-Research-Agent/1.0 (academic; mailto:support@joblio.app)"}
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    self.base_url,
                    params={"search_query": f"ti:{clean_title}", "max_results": 1},
                    headers=headers,
                    timeout=25.0
                )
                if resp.status_code == 200:
                    return self._parse_feed(resp.text)
        except Exception as e:
            print(f"[ArxivClient] Error searching title '{clean_title}': {e}")
        return None

    def _parse_feed(self, xml_text: str) -> Optional[Dict[str, Any]]:
        try:
            root = ET.fromstring(xml_text)
            # Atom XML namespace
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            entry = root.find("atom:entry", ns)
            if entry is None:
                return None

            title_elem = entry.find("atom:title", ns)
            summary_elem = entry.find("atom:summary", ns)
            published_elem = entry.find("atom:published", ns)
            id_elem = entry.find("atom:id", ns)

            authors = []
            for author in entry.findall("atom:author", ns):
                name = author.find("atom:name", ns)
                if name is not None and name.text:
                    authors.append(name.text.strip())

            pdf_url = None
            for link in entry.findall("atom:link", ns):
                if link.get("title") == "pdf" or link.get("type") == "application/pdf":
                    pdf_url = link.get("href")

            raw_id = id_elem.text.strip() if id_elem is not None and id_elem.text else ""
            extracted_id = self.extract_arxiv_id(raw_id) or raw_id.split("/")[-1]

            return {
                "arxiv_id": extracted_id,
                "title": title_elem.text.strip().replace("\n", " ") if title_elem is not None and title_elem.text else "",
                "abstract": summary_elem.text.strip().replace("\n", " ") if summary_elem is not None and summary_elem.text else "",
                "published": published_elem.text.strip() if published_elem is not None and published_elem.text else "",
                "authors": authors,
                "pdf_url": pdf_url or f"https://arxiv.org/pdf/{extracted_id}.pdf"
            }
        except Exception:
            return None
