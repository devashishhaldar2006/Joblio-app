import os
import json
import re
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

# Ensure .env is loaded whenever llm_client is imported or called
load_dotenv(override=True)

def get_groq_model(temperature: float = 0.2):
    load_dotenv(override=True)
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key":
        raise ValueError("GROQ_API_KEY is not set or invalid in environment.")
    
    model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    return ChatGroq(
        model=model_name,
        groq_api_key=api_key,
        temperature=temperature
    )

# Backward-compatible alias for existing agent nodes
def get_gemini_model(temperature: float = 0.2):
    return get_groq_model(temperature=temperature)

def clean_json_text(text: str) -> str:
    """Removes markdown code fences like ```json ... ``` from LLM outputs."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # remove starting ```json or ```
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()

def parse_json_from_llm(text: str):
    cleaned = clean_json_text(text)
    return json.loads(cleaned)
