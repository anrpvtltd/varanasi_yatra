"""
Run and Execution Schemas for AI Gateway
Varanasi Yatra Platform — Prompt 5
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from .common import AIModule, AIRunStatus, UserContext

class ToolExecutionRequest(BaseModel):
    tool: str
    input: Dict[str, Any] = Field(default_factory=dict)

class ToolExecutionResult(BaseModel):
    tool: str
    decision: str
    output: Dict[str, Any] = Field(default_factory=dict)
    risk_level: str = "LOW"

class AIRunRequest(BaseModel):
    module: AIModule
    task_type: str
    user_context: UserContext
    parameters: Dict[str, Any] = Field(default_factory=dict)
    tools_to_call: List[ToolExecutionRequest] = Field(default_factory=list)

class AIRunResponse(BaseModel):
    success: bool
    run_id: str
    status: AIRunStatus
    summary: str
    recommendations: List[str] = Field(default_factory=list)
    requires_approval: bool = False
    blocked_actions: List[Dict[str, Any]] = Field(default_factory=list)
    tool_calls: List[ToolExecutionResult] = Field(default_factory=list)
    error_code: Optional[str] = None
    message: Optional[str] = None
