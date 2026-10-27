"""
Redis caching utility for Joblio Python microservice.
Supports Upstash Serverless REST API (httpx) AND standard Redis protocol (REDIS_URL).
Works across serverless environments without persistent socket connections.
Gracefully falls back to no-op if cache is unconfigured or unreachable.
"""

import os
import json
import hashlib
import logging
from typing import Optional, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("joblio.redis")

_UPSTASH_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL", "")
_UPSTASH_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

_redis_client: Optional[Any] = None
_redis_initialized = False

def get_redis_client():
    """Lazily initializes standard TCP Redis client if REDIS_URL is present."""
    global _redis_client, _redis_initialized
    if _redis_initialized:
        return _redis_client

    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        _redis_initialized = True
        return None

    try:
        import redis
        _redis_client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5,
            retry_on_timeout=True
        )
        _redis_client.ping()
        logger.info("[Redis] Connected via TCP Redis URL.")
    except Exception as e:
        logger.warning(f"[Redis] TCP connect warning: {e}. Falling back to REST/bypass.")
        _redis_client = None

    _redis_initialized = True
    return _redis_client

def generate_cache_key(prefix: str, data: Any) -> str:
    """Creates a deterministic SHA-256 hash key for caching."""
    if isinstance(data, str):
        payload = data.strip().lower()
    else:
        payload = json.dumps(data, sort_keys=True)
    hash_digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]
    return f"joblio:{prefix}:{hash_digest}"

def get_cached_json(key: str) -> Optional[Any]:
    """Retrieves cached JSON payload via Upstash REST API or TCP Redis."""
    # 1. Try Upstash REST API first (Serverless friendly, no socket teardown)
    rest_url = os.getenv("UPSTASH_REDIS_REST_URL", _UPSTASH_REST_URL)
    rest_token = os.getenv("UPSTASH_REDIS_REST_TOKEN", _UPSTASH_REST_TOKEN)

    if rest_url and rest_token:
        try:
            import httpx
            endpoint = f"{rest_url.rstrip('/')}/get/{key}"
            headers = {"Authorization": f"Bearer {rest_token}"}
            resp = httpx.get(endpoint, headers=headers, timeout=3.0)
            if resp.status_code == 200:
                result = resp.json().get("result")
                if result:
                    return json.loads(result)
        except Exception as e:
            logger.debug(f"[Upstash REST] Get error for key {key}: {e}")

    # 2. Fallback to standard TCP Redis client
    try:
        client = get_redis_client()
        if client:
            cached = client.get(key)
            if cached:
                return json.loads(cached)
    except Exception as e:
        logger.debug(f"[Redis TCP] Get error for key {key}: {e}")

    return None

def set_cached_json(key: str, data: Any, ttl_seconds: int = 86400) -> bool:
    """Caches a JSON-serializable object with an expiration TTL (default: 24h)."""
    payload = json.dumps(data)

    # 1. Try Upstash REST API first
    rest_url = os.getenv("UPSTASH_REDIS_REST_URL", _UPSTASH_REST_URL)
    rest_token = os.getenv("UPSTASH_REDIS_REST_TOKEN", _UPSTASH_REST_TOKEN)

    if rest_url and rest_token:
        try:
            import httpx
            endpoint = f"{rest_url.rstrip('/')}/setex/{key}/{ttl_seconds}"
            headers = {
                "Authorization": f"Bearer {rest_token}",
                "Content-Type": "application/json"
            }
            resp = httpx.post(endpoint, headers=headers, content=payload, timeout=3.0)
            if resp.status_code == 200:
                return True
        except Exception as e:
            logger.debug(f"[Upstash REST] Set error for key {key}: {e}")

    # 2. Fallback to standard TCP Redis client
    try:
        client = get_redis_client()
        if client:
            client.setex(key, ttl_seconds, payload)
            return True
    except Exception as e:
        logger.debug(f"[Redis TCP] Set error for key {key}: {e}")

    return False
