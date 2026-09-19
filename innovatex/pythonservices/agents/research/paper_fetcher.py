import asyncio
from typing import Dict, Any
from utils.arxiv_client import ArxivClient
from utils.semantic_scholar_client import SemanticScholarClient

async def fetch_paper_node(state: Dict[str, Any]) -> Dict[str, Any]:
    user_input = state["input"].strip()
    arxiv_client = ArxivClient()
    ss_client = SemanticScholarClient()

    arxiv_id = arxiv_client.extract_arxiv_id(user_input)
    arxiv_data = None

    if arxiv_id:
        arxiv_data = await arxiv_client.get_by_id(arxiv_id)
    else:
        # Search by title on Arxiv
        arxiv_data = await arxiv_client.search_by_title(user_input)
        if arxiv_data and arxiv_data.get("arxiv_id"):
            arxiv_id = arxiv_data["arxiv_id"]

    raw_paper = None
    if arxiv_id:
        raw_paper = await ss_client.get_paper(f"arXiv:{arxiv_id}")

    # Fallback if paper not in Semantic Scholar under arXiv prefix
    if not raw_paper and arxiv_data:
        raw_paper = {
            "title": arxiv_data.get("title"),
            "abstract": arxiv_data.get("abstract"),
            "year": arxiv_data.get("published", "")[:4] if arxiv_data.get("published") else None,
            "authors": [{"name": a} for a in arxiv_data.get("authors", [])],
            "citationCount": 0,
            "referenceCount": 0,
            "fieldsOfStudy": ["Computer Science"],
            "tldr": None,
            "url": f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else "",
            "openAccessPdf": {"url": arxiv_data.get("pdf_url")}
        }
    elif not raw_paper:
        raise ValueError(f"Could not locate paper for input: '{user_input}'. Please check the arXiv link or title.")

    return {
        **state,
        "paper_id": arxiv_id or (raw_paper.get("paperId") if raw_paper else ""),
        "arxiv_data": arxiv_data or {},
        "raw_paper": raw_paper
    }
