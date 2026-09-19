import asyncio
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from utils.semantic_scholar_client import SemanticScholarClient
from utils.llm_client import get_gemini_model

async def find_related_papers_node(state: Dict[str, Any]) -> Dict[str, Any]:
    paper_id = state.get("paper_id")
    raw_paper = state.get("raw_paper", {})
    main_title = raw_paper.get("title", "this paper")

    ss_client = SemanticScholarClient()
    recs = []
    if paper_id:
        target_id = f"arXiv:{paper_id}" if not paper_id.startswith("arXiv:") and len(paper_id) < 20 else paper_id
        recs = await ss_client.get_recommendations(target_id, limit=8)

    # Process and filter up to 6 papers
    candidates = recs[:6]
    model = get_gemini_model()

    async def get_relevance(rel_paper: Dict[str, Any]) -> str:
        rel_title = rel_paper.get("title", "")
        prompt = f"""In one crisp sentence, why would someone reading '{main_title}' also want to read '{rel_title}'?"""
        try:
            res = await model.ainvoke([HumanMessage(content=prompt)])
            return res.content.strip().replace('"', '')
        except Exception:
            return f"Provides relevant foundational context and complementary techniques related to {main_title}."

    relevance_reasons = await asyncio.gather(*[get_relevance(p) for p in candidates])

    related_papers = []
    for idx, p in enumerate(candidates):
        authors_raw = p.get("authors", [])
        authors = [a.get("name") for a in authors_raw[:2] if isinstance(a, dict)]
        pdf_info = p.get("openAccessPdf")
        pdf_url = pdf_info.get("url") if isinstance(pdf_info, dict) else None

        related_papers.append({
            "title": p.get("title"),
            "authors": authors,
            "year": p.get("year"),
            "citation_count": p.get("citationCount", 0),
            "url": p.get("url") or f"https://www.semanticscholar.org/search?q={p.get('title')}",
            "pdf_url": pdf_url,
            "relevance_reason": relevance_reasons[idx] if idx < len(relevance_reasons) else "Key comparative baseline."
        })

    authors_list = [a.get("name") if isinstance(a, dict) else a for a in raw_paper.get("authors", [])]
    pdf_info_main = raw_paper.get("openAccessPdf")
    main_pdf_url = pdf_info_main.get("url") if isinstance(pdf_info_main, dict) else (state.get("arxiv_data", {}).get("pdf_url"))

    final_output = {
        "title": raw_paper.get("title"),
        "authors": authors_list,
        "year": raw_paper.get("year"),
        "citation_count": raw_paper.get("citationCount", 0),
        "reference_count": raw_paper.get("referenceCount", 0),
        "url": raw_paper.get("url"),
        "pdf_url": main_pdf_url,
        "fields_of_study": raw_paper.get("fieldsOfStudy", ["Computer Science"]),
        "explanation": state.get("explanation", {}),
        "related_papers": related_papers
    }

    return {
        **state,
        "related_papers": related_papers,
        "final_output": final_output
    }
