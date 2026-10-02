"""
Tiered LLM Configuration for InnovateX AI Engine.

llm_fast  → Groq (openai/gpt-oss-120b) — lightweight agents (GitHub, OS Finder, Contests)
llm_smart → Gemini 3.6 Flash           — heavy-context agents (Research, Job Search)
"""
# Updated: 2026-09-23 — Groq free tier + Gemini Flash

import os
from dotenv import load_dotenv

load_dotenv(override=True)

# ---------------------------------------------------------------------------
# Groq — fast free-tier inference for lightweight agents
# ---------------------------------------------------------------------------
_groq_instance = None

def get_llm_fast(temperature: float = 0.2):
    """Returns a Groq ChatModel (openai/gpt-oss-120b) for lightweight agents."""
    global _groq_instance
    if _groq_instance is None:
        from langchain_groq import ChatGroq

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in environment.")

        _groq_instance = ChatGroq(
            model="openai/gpt-oss-120b",
            groq_api_key=api_key,
            temperature=temperature,
            max_retries=2,
            request_timeout=25.0,
        )
    return _groq_instance

# ---------------------------------------------------------------------------
# Gemini Flash — high-context for heavy agents
# ---------------------------------------------------------------------------
from langchain_google_genai import ChatGoogleGenerativeAI

class NormalizedChatGoogleGenerativeAI(ChatGoogleGenerativeAI):
    """Wraps ChatGoogleGenerativeAI to normalize response.content to str."""
    def invoke(self, *args, **kwargs):
        res = super().invoke(*args, **kwargs)
        if isinstance(res.content, list):
            res.content = "".join(
                item.get("text", "") if isinstance(item, dict) else str(item)
                for item in res.content
            )
        return res

    async def ainvoke(self, *args, **kwargs):
        res = await super().ainvoke(*args, **kwargs)
        if isinstance(res.content, list):
            res.content = "".join(
                item.get("text", "") if isinstance(item, dict) else str(item)
                for item in res.content
            )
        return res

_gemini_instance = None

def get_llm_smart(temperature: float = 0.2):
    """Returns a Gemini 3.6 Flash ChatModel for heavy-context agents."""
    global _gemini_instance
    if _gemini_instance is None:
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set in environment.")

        _gemini_instance = NormalizedChatGoogleGenerativeAI(
            model="gemini-3.6-flash",
            google_api_key=api_key,
            temperature=temperature,
        )
    return _gemini_instance
