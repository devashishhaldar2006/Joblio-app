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
# Gemini Flash with Automatic Groq Failover when Quota is Exhausted
# ---------------------------------------------------------------------------
import logging
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger("llm_config")

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

class ResilientSmartChatModel:
    """
    Intelligent dual-tier model:
    Primary: Gemini 3.6 Flash
    Automatic Failover: Groq (openai/gpt-oss-120b) whenever Gemini quota is exhausted (429 / RESOURCE_EXHAUSTED).
    """
    def __init__(self, gemini_model, temperature: float = 0.2):
        self.gemini = gemini_model
        self.temperature = temperature
        self._gemini_exhausted = False

    def _get_groq(self):
        return get_llm_fast(temperature=self.temperature)

    def invoke(self, *args, **kwargs):
        if not self._gemini_exhausted and self.gemini:
            try:
                return self.gemini.invoke(*args, **kwargs)
            except Exception as e:
                err_str = str(e)
                if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str or "quota" in err_str.lower():
                    logger.warning("[LLM Failover] Gemini quota exhausted. Automatically routing to Groq (openai/gpt-oss-120b).")
                    self._gemini_exhausted = True
                else:
                    logger.warning(f"[LLM Warning] Gemini call failed ({e}). Falling back to Groq.")
        return self._get_groq().invoke(*args, **kwargs)

    async def ainvoke(self, *args, **kwargs):
        if not self._gemini_exhausted and self.gemini:
            try:
                return await self.gemini.ainvoke(*args, **kwargs)
            except Exception as e:
                err_str = str(e)
                if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str or "quota" in err_str.lower():
                    logger.warning("[LLM Failover] Gemini quota exhausted. Automatically routing to Groq (openai/gpt-oss-120b).")
                    self._gemini_exhausted = True
                else:
                    logger.warning(f"[LLM Warning] Gemini call failed ({e}). Falling back to Groq.")
        return await self._get_groq().ainvoke(*args, **kwargs)

_smart_instance = None

def get_llm_smart(temperature: float = 0.2):
    """Returns a resilient ChatModel with Gemini 3.6 Flash as primary and Groq as automatic quota failover."""
    global _smart_instance
    if _smart_instance is None:
        gemini_model = None
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if api_key:
            try:
                gemini_model = NormalizedChatGoogleGenerativeAI(
                    model="gemini-3.6-flash",
                    google_api_key=api_key,
                    temperature=temperature,
                )
            except Exception as e:
                logger.warning(f"Could not initialize Gemini model: {e}")

        _smart_instance = ResilientSmartChatModel(gemini_model, temperature=temperature)
    return _smart_instance
