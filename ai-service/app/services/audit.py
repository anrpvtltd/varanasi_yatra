"""
AI Audit Logging Service
Varanasi Yatra Platform — Prompt 5
"""

import time
from typing import Dict, Any, List

class AIAuditService:
    def __init__(self):
        self.in_memory_logs: List[Dict[str, Any]] = []

    def record(self, entry: Dict[str, Any]):
        log_entry = {
            **entry,
            "timestamp": time.time()
        }
        self.in_memory_logs.append(log_entry)
        return log_entry

audit_service = AIAuditService()
