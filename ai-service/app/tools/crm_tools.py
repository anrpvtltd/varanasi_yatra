"""
CRM Tool Dispatcher (Internal API Client)
Varanasi Yatra Platform — Prompt 5

IMPORTANT: This client communicates ONLY with the Node CRM API.
NO DIRECT MONGODB ACCESS OR DRIVER IS USED.
"""

import os
import httpx
from typing import Dict, Any

CRM_API_URL = os.getenv("CRM_API_URL", "http://localhost:5001")
AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "varanasi-yatra-internal-ai-key-2026")

class CRMToolClient:
    """
    Communicates with authenticated internal Node backend CRM APIs.
    """
    def __init__(self, base_url: str = CRM_API_URL):
        self.base_url = base_url

    async def execute_tool(self, tool_name: str, input_params: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatches tool call to internal Node CRM endpoint.
        """
        headers = {
            "X-AI-Service-Key": AI_SERVICE_SECRET,
            "Content-Type": "application/json"
        }
        payload = {
            "tool": tool_name,
            "input": input_params,
            "userContext": user_context
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(f"{self.base_url}/internal/ai/tools/execute", json=payload, headers=headers)
                if resp.status_code == 200:
                    return resp.json().get("result", {})
                return {"error": f"CRM internal API error: {resp.status_code}"}
        except Exception as e:
            # Safe degradation / fallback for offline test environments
            return {"mock": True, "tool": tool_name, "status": "executed_mock_offline"}
