from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from agents.github.profile_fetcher import fetch_profile_node
from agents.github.repo_analyzer import analyze_repos_node
from agents.github.score_calculator import calculate_score_node
from agents.github.improvement_agent import generate_improvements_node

class GithubGraphState(TypedDict, total=False):
    username: str
    raw_profile: Dict[str, Any]
    raw_repos: List[Dict[str, Any]]
    raw_events: List[Dict[str, Any]]
    rate_limit: Dict[str, Any]
    fetched_at: str
    repo_analysis: Dict[str, Any]
    profile_score: Dict[str, Any]
    improvements: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    final_report: Dict[str, Any]

def build_github_graph():
    workflow = StateGraph(GithubGraphState)

    workflow.add_node("profile_fetcher", fetch_profile_node)
    workflow.add_node("repo_analyzer", analyze_repos_node)
    workflow.add_node("score_calculator", calculate_score_node)
    workflow.add_node("improvement_agent", generate_improvements_node)

    workflow.set_entry_point("profile_fetcher")
    workflow.add_edge("profile_fetcher", "repo_analyzer")
    workflow.add_edge("repo_analyzer", "score_calculator")
    workflow.add_edge("score_calculator", "improvement_agent")
    workflow.add_edge("improvement_agent", END)

    return workflow.compile()

github_graph = build_github_graph()
