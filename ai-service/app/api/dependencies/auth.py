"""
Service-to-Service Authentication Dependency
Varanasi Yatra Platform — Prompt 5
"""

import os
from fastapi import Header, HTTPException, status

AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "varanasi-yatra-internal-ai-key-2026")

async def verify_service_auth(x_ai_service_key: str = Header(None, alias="X-AI-Service-Key")):
    """
    Validates that incoming requests originate from the trusted Node CRM backend.
    Direct browser calls without the shared server-to-server secret are rejected.
    """
    if not x_ai_service_key or x_ai_service_key != AI_SERVICE_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing service authentication credentials."
        )
    return True
