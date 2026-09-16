"""
Lightweight In-Memory Session Storage
Varanasi Yatra Platform — Prompt 5
"""

import time
from typing import Dict, Any, Optional

class SessionMemory:
    """
    Lightweight, short-lived session memory abstraction.
    Does not persist sensitive customer PII long-term.
    """
    def __init__(self, ttl_seconds: int = 1800):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.ttl_seconds = ttl_seconds

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        entry = self.sessions.get(session_id)
        if not entry:
            return None
        if time.time() - entry["updated_at"] > self.ttl_seconds:
            del self.sessions[session_id]
            return None
        return entry["data"]

    def set_session(self, session_id: str, data: Dict[str, Any]):
        self.sessions[session_id] = {
            "data": data,
            "updated_at": time.time()
        }

    def clear(self):
        self.sessions.clear()

global_session_memory = SessionMemory()
