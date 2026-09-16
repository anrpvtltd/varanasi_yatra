"""
Opportunity Builder
Varanasi Yatra Platform — Prompt 8

Assembles structured AIOpportunity records from normalized signals, intent detections,
and qualification scores. Enforces concise business evidence without hidden chain-of-thought.
"""

import uuid
from typing import Dict, Any

def build_opportunity(
    normalized_signal: Dict[str, Any],
    intent_data: Dict[str, Any],
    qualification_data: Dict[str, Any],
    confidence_data: Dict[str, Any],
    signal_id: str
) -> Dict[str, Any]:
    """
    Constructs a complete AIOpportunity payload.
    Status initializes as 'NEW' and verificationStatus as 'UNVERIFIED'.
    """
    mode = intent_data.get("mode", "AI_OUTSIDE")
    intent = intent_data.get("detected_intent", "TRIP_PLANNING")
    services = normalized_signal.get("detected_services", [])
    travel_window = normalized_signal.get("detected_travel_window", "")
    duration = normalized_signal.get("detected_duration", "")
    location = normalized_signal.get("detected_location", "Varanasi")
    area = normalized_signal.get("detected_area", None)

    # Concise business evidence and factual reasoning (Section 55 & 56)
    services_str = " + ".join(services) if services else "General inquiry"
    travel_str = f" for '{travel_window}'" if travel_window else ""
    duration_str = f" ({duration})" if duration else ""

    if mode == "AI_LOCAL":
        reasoning = f"In-destination customer signal detected in Varanasi requesting {services_str}{duration_str} with immediate/near-term timing."
    else:
        reasoning = f"Future trip planning signal detected requesting {services_str}{travel_str}{duration_str}."

    # Evidence: Short factual excerpt from original text (no sensitive identifiers)
    raw_excerpt = normalized_signal.get("text_excerpt", "")
    evidence = raw_excerpt[:150] + ("..." if len(raw_excerpt) > 150 else "")

    opp_id = f"OPP-{uuid.uuid4().hex[:10].upper()}"

    return {
        "opportunity_id": opp_id,
        "hunter_mode": mode,
        "source": normalized_signal.get("source_id", "UNKNOWN"),
        "source_type": normalized_signal.get("source_type", "MOCK"),
        "public_reference": normalized_signal.get("public_reference", ""),
        "source_url": normalized_signal.get("source_url", ""),
        "signal_id": signal_id,

        "detected_intent": intent,
        "service_interest": services,
        "location": location,
        "area": area,
        "travel_window": travel_window,
        "duration": duration,
        "guest_hints": "",

        "intent_level": intent_data.get("intent_level", "MEDIUM"),
        "qualification_score": qualification_data.get("qualification_score", 50),
        "qualification_reasons": qualification_data.get("qualification_reasons", []),

        "confidence": confidence_data.get("overall_confidence", 0.5),
        "confidence_breakdown": confidence_data,

        "reasoning_summary": reasoning,
        "evidence_summary": evidence,

        "status": "NEW",
        "verification_status": "UNVERIFIED"
    }
