"""
Opportunity Schemas for Future Hunter Foundation
Varanasi Yatra Platform — Prompt 5
"""

from typing import Optional, List
from pydantic import BaseModel, Field

class AIOpportunitySchema(BaseModel):
    opportunity_id: str
    source: str  # AI_LOCAL or AI_OUTSIDE
    public_reference: Optional[str] = None
    detected_intent: str
    service_interest: List[str] = Field(default_factory=list)
    location: str = "Varanasi"
    travel_window: Optional[str] = None
    duration: Optional[str] = None
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    reasoning_summary: Optional[str] = None
    status: str = "NEW"
    verification_status: str = "UNVERIFIED"
    assigned_to: Optional[str] = None
    converted_lead_id: Optional[str] = None
