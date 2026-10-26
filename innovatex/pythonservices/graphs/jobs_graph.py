from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from agents.jobs.resume_parser import parse_resume_node
from agents.jobs.query_builder import build_queries_node
from agents.jobs.job_searcher import search_jobs_node
from agents.jobs.jd_analyzer import analyze_jd_node
from agents.jobs.match_scorer import match_scorer_node
from agents.jobs.formatter import formatter_node

class JobsGraphState(TypedDict, total=False):
    resume_text: str
    query_override: Optional[str]
    location_override: Optional[str]
    work_type: Optional[str]      # 'all' | 'remote' | 'onsite' | 'hybrid'
    job_type: Optional[str]       # 'both' | 'job' | 'internship'
    country: Optional[str]        # 'all' | 'india'
    source: Optional[str]         # 'all' | 'linkedin' | 'ycombinator' | 'internshala' | etc.
    parsed_profile: Dict[str, Any]
    search_queries: List[str]
    raw_jobs: List[Dict[str, Any]]
    analyzed_jobs: List[Dict[str, Any]]
    scored_jobs: List[Dict[str, Any]]
    final_results: List[Dict[str, Any]]
    platform_links: List[Dict[str, str]]
    error: Optional[str]

def build_jobs_graph():
    workflow = StateGraph(JobsGraphState)

    workflow.add_node("resume_parser", parse_resume_node)
    workflow.add_node("query_builder", build_queries_node)
    workflow.add_node("job_searcher", search_jobs_node)
    workflow.add_node("jd_analyzer", analyze_jd_node)
    workflow.add_node("match_scorer", match_scorer_node)
    workflow.add_node("formatter", formatter_node)

    workflow.set_entry_point("resume_parser")
    workflow.add_edge("resume_parser", "query_builder")
    workflow.add_edge("query_builder", "job_searcher")
    workflow.add_edge("job_searcher", "jd_analyzer")
    workflow.add_edge("jd_analyzer", "match_scorer")
    workflow.add_edge("match_scorer", "formatter")
    workflow.add_edge("formatter", END)

    return workflow.compile()

jobs_graph = build_jobs_graph()
