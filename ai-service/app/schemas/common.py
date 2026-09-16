"""
Common Pydantic Schemas for AI Gateway & Service
Varanasi Yatra Platform — Prompt 5
"""

from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class AIModule(str, Enum):
    CUSTOMER_ASSISTANT = "CUSTOMER_ASSISTANT"
    SALES_ASSISTANT = "SALES_ASSISTANT"
    CUSTOMER_HUNTER = "CUSTOMER_HUNTER"
    LOCAL_HUNTER = "LOCAL_HUNTER"
    OUTSIDE_HUNTER = "OUTSIDE_HUNTER"
    VOICE_AI = "VOICE_AI"
    SYSTEM_ANALYSIS = "SYSTEM_ANALYSIS"

class AIRunStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    BLOCKED = "BLOCKED"

class AIAuditDecision(str, Enum):
    ALLOWED = "ALLOWED"
    BLOCKED = "BLOCKED"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    FAILED = "FAILED"

class AIRiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class UserContext(BaseModel):
    user_id: str
    role: str
    permissions: List[str] = Field(default_factory=list)
    team_name: Optional[str] = None
    assigned_areas: List[str] = Field(default_factory=list)

class AIHealthResponse(BaseModel):
    status: str = "ONLINE"
    service: str = "varanasi-yatra-ai-service"
    version: str = "1.0.0"
    safe_mode: bool = True
    master_enabled: bool = True
    emergency_stop: bool = False
    provider: str = "mock"
