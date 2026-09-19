"""
MongoDB connection manager for Python ML microservices.
Provides synchronous and asynchronous database handles for collections.
"""

import os
import logging
from typing import Optional
from dotenv import load_dotenv
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

logger = logging.getLogger("market.db")

_sync_client: Optional[MongoClient] = None
_async_client: Optional[AsyncIOMotorClient] = None

def get_mongo_uri() -> str:
    uri = os.getenv("MONGO_URI", "")
    if not uri:
        # Fallback to local default if not set
        uri = "mongodb://127.0.0.1:27017/innovatex"
    return uri

def get_db_name() -> str:
    # Use specified DB name or default to innovatex
    return os.getenv("MONGO_DB_NAME", "innovatex")

def get_sync_db():
    """Get synchronous pymongo database object."""
    global _sync_client
    if _sync_client is None:
        uri = get_mongo_uri()
        _sync_client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    db_name = get_db_name()
    return _sync_client[db_name]

def get_async_db():
    """Get asynchronous motor database object."""
    global _async_client
    if _async_client is None:
        uri = get_mongo_uri()
        _async_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    db_name = get_db_name()
    return _async_client[db_name]
