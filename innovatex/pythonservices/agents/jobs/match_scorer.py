from typing import Dict, Any, List

def match_scorer_node(state: Dict[str, Any]) -> Dict[str, Any]:
    analyzed_jobs: List[Dict[str, Any]] = state.get("analyzed_jobs", [])

    # Filter out low match scores (< 30)
    filtered = [j for j in analyzed_jobs if j.get("match_score", 0) >= 30]

    # Sort descending by match_score
    filtered.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    # Assign rank
    for idx, j in enumerate(filtered):
        j["rank"] = idx + 1

    return {
        **state,
        "scored_jobs": filtered
    }
