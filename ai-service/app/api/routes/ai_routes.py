"""
AI Service Endpoints
Varanasi Yatra Platform — Prompt 5
"""

from fastapi import APIRouter, Depends
from ...schemas.common import AIHealthResponse
from ...schemas.runs import AIRunRequest, AIRunResponse
from ...services.ai_runtime import run_ai_task
from ...services.configuration import config_service
from ..dependencies.auth import verify_service_auth

router = APIRouter()

@router.get("/ai/health", response_model=AIHealthResponse)
async def get_health():
    status_info = config_service.get_status()
    return AIHealthResponse(
        status="EMERGENCY_STOPPED" if status_info["emergency_stop"] else ("ONLINE" if status_info["master_enabled"] else "DISABLED"),
        safe_mode=status_info["safe_mode"],
        master_enabled=status_info["master_enabled"],
        emergency_stop=status_info["emergency_stop"],
        provider=status_info["provider"]
    )

@router.get("/ai/config", dependencies=[Depends(verify_service_auth)])
async def get_config():
    return config_service.get_status()

@router.post("/ai/run", response_model=AIRunResponse, dependencies=[Depends(verify_service_auth)])
async def execute_run(request: AIRunRequest):
    return await run_ai_task(request)
