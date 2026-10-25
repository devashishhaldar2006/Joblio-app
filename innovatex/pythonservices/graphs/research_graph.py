from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from agents.research.paper_fetcher import fetch_paper_node
from agents.research.paper_explainer import explain_paper_node
from agents.research.related_finder import find_related_papers_node

class ResearchGraphState(TypedDict, total=False):
    input: str
    paper_id: str
    raw_paper: Dict[str, Any]
    arxiv_data: Dict[str, Any]
    explanation: Dict[str, Any]
    related_papers: List[Dict[str, Any]]
    final_output: Dict[str, Any]

def build_research_graph():
    workflow = StateGraph(ResearchGraphState)

    workflow.add_node("paper_fetcher", fetch_paper_node)
    workflow.add_node("paper_explainer", explain_paper_node)
    workflow.add_node("related_finder", find_related_papers_node)

    workflow.set_entry_point("paper_fetcher")
    workflow.add_edge("paper_fetcher", "paper_explainer")
    workflow.add_edge("paper_explainer", "related_finder")
    workflow.add_edge("related_finder", END)

    return workflow.compile()

research_graph = build_research_graph()
