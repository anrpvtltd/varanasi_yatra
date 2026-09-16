"""
AI Runtime Engine
Varanasi Yatra Platform — Prompt 5
"""

import time
import uuid
from typing import Dict, Any, List
from ..schemas.runs import AIRunRequest, AIRunResponse, ToolExecutionResult
from ..schemas.common import AIRunStatus
from ..guardrails.policies import SafeModePolicy
from ..guardrails.permissions import PermissionGuardrail
from ..tools.registry import get_tool_meta
from ..tools.crm_tools import CRMToolClient
from ..agents.base_agent import BaseAgent
from .configuration import config_service
from .audit import audit_service

crm_client = CRMToolClient()
default_agent = BaseAgent()

async def run_ai_task(request: AIRunRequest) -> AIRunResponse:
    """
    Coordinates policy checks, tool execution, and agent synthesis.
    """
    run_id = f"RUN-PY-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"

    # 1. Master & Emergency Stop Guards
    if not config_service.master_enabled:
        return AIRunResponse(
            success=False,
            run_id=run_id,
            status=AIRunStatus.BLOCKED,
            summary="AI Runtime is turned OFF by CEO.",
            error_code="AI_DISABLED"
        )

    if config_service.emergency_stop:
        return AIRunResponse(
            success=False,
            run_id=run_id,
            status=AIRunStatus.BLOCKED,
            summary="Emergency Stop is currently ACTIVE.",
            error_code="EMERGENCY_STOP"
        )

    user_ctx = request.user_context.dict()
    tool_results: List[ToolExecutionResult] = []
    blocked_actions = []

    # 2. Tool Execution Loop with Guardrails
    for tool_req in request.tools_to_call:
        tool_name = tool_req.tool
        meta = get_tool_meta(tool_name)

        if not meta or not meta.get("enabled"):
            blocked_actions.append({"tool": tool_name, "reason": "Tool is not enabled in registry."})
            continue

        # Safe Mode Guard
        if not SafeModePolicy.is_tool_allowed(tool_name, config_service.safe_mode):
            blocked_actions.append({"tool": tool_name, "reason": "Safe Mode disallows mutation tool."})
            continue

        # Permission Guard
        if not PermissionGuardrail.can_execute(tool_name, request.user_context.role, request.user_context.permissions):
            blocked_actions.append({"tool": tool_name, "reason": "User role lacks required CRM permission."})
            continue

        # Execute Tool via Internal Node CRM API
        out = await crm_client.execute_tool(tool_name, tool_req.input, user_ctx)
        tool_results.append(ToolExecutionResult(
            tool=tool_name,
            decision="ALLOWED",
            output=out,
            risk_level=meta.get("risk_level", "LOW")
        ))

    # 3. Agent Synthesizes Structured Output
    agent_output = await default_agent.execute_task(request.task_type, {
        "parameters": request.parameters,
        "tool_results": [t.dict() for t in tool_results]
    })

    audit_service.record({
        "run_id": run_id,
        "user_id": request.user_context.user_id,
        "action": request.task_type,
        "decision": "ALLOWED",
        "tool_count": len(tool_results)
    })

    return AIRunResponse(
        success=True,
        run_id=run_id,
        status=AIRunStatus.COMPLETED,
        summary=agent_output.get("summary", "Analysis completed."),
        recommendations=agent_output.get("recommendations", []),
        requires_approval=False,
        blocked_actions=blocked_actions,
        tool_calls=tool_results
    )
