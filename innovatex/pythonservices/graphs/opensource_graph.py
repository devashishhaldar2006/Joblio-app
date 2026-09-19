from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from agents.opensource.repo_finder import repo_finder_node
from agents.opensource.issue_explainer import issue_explainer_node
from agents.opensource.skill_gap_mapper import skill_gap_mapper_node

class OpenSourceGraphState(TypedDict):
    skills: List[str]
    experience_level: str
    preferred_language: str
    raw_repos: List[Dict[str, Any]]
    filtered_repos: List[Dict[str, Any]]
    issues_per_repo: Dict[str, Any]
    explained_issues: List[Dict[str, Any]]
    repo_recommendations: List[Dict[str, Any]]

def build_opensource_graph():
    workflow = StateGraph(OpenSourceGraphState)

    workflow.add_node("repo_finder", repo_finder_node)
    workflow.add_node("issue_explainer", issue_explainer_node)
    workflow.add_node("skill_gap_mapper", skill_gap_mapper_node)

    workflow.set_entry_point("repo_finder")
    workflow.add_edge("repo_finder", "issue_explainer")
    workflow.add_edge("issue_explainer", "skill_gap_mapper")
    workflow.add_edge("skill_gap_mapper", END)

    return workflow.compile()

opensource_graph = build_opensource_graph()
