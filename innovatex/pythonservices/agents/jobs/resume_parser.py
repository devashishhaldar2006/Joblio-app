from typing import Dict, Any
from langchain_core.messages import HumanMessage
from utils.llm_client import get_gemini_model, parse_json_from_llm

async def parse_resume_node(state: Dict[str, Any]) -> Dict[str, Any]:
    resume_text = state.get("resume_text", "")
    if not resume_text:
        raise ValueError("No resume text extracted from document.")

    prompt = f"""Extract structured JSON from this resume.
Return ONLY valid JSON, no markdown, no surrounding comments:
{{
  "name": "Candidate Full Name",
  "email": "Email Address",
  "phone": "Phone Number",
  "location": "City, Country",
  "current_role": "Current or Recent Title",
  "experience_years": 3,
  "education": "Degree and University",
  "skills": ["Python", "React", "Docker", "Node.js"],
  "preferred_roles": ["Full Stack Engineer", "Backend Engineer"],
  "preferred_locations": ["Remote", "Bangalore", "San Francisco"],
  "summary": "2 sentences high impact professional overview."
}}

Resume Content:
{resume_text[:4000]}
"""
    model = get_gemini_model()
    res = await model.ainvoke([HumanMessage(content=prompt)])
    parsed_profile = parse_json_from_llm(res.content)

    return {
        **state,
        "parsed_profile": parsed_profile
    }
