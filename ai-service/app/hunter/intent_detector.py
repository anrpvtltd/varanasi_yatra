"""
Intent Detection Engine
Varanasi Yatra Platform — Prompt 8

Classifies traveler intent into Local vs Outside modes and maps to canonical intent categories.
"""

import re
from typing import Dict, Any, List

def detect_intent(normalized_signal: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes normalized signal text and entities to determine Hunter mode (LOCAL vs OUTSIDE),
    canonical intent category, and intent strength level.
    """
    text = normalized_signal.get("normalized_text", "").lower()
    services: List[str] = normalized_signal.get("detected_services", [])
    is_currently_in = normalized_signal.get("is_currently_in", False)
    travel_window = normalized_signal.get("detected_travel_window", "").lower()
    
    # 1. Determine Mode: Local vs Outside
    # Local = currently in Varanasi OR travel window is today/tomorrow/now
    is_near_term = travel_window in ["today", "tomorrow", "now", "immediately"]
    is_local = is_currently_in or is_near_term or ("in varanasi" in text and not re.search(r"planning|going\s+to", text))
    
    mode = "AI_LOCAL" if is_local else "AI_OUTSIDE"

    # 2. Classify Specific Intent Category
    detected_intent = "TRIP_PLANNING"
    if mode == "AI_LOCAL":
        if "BOAT" in services and ("AARTI" in services or "evening" in text):
            detected_intent = "BOAT_NOW"
        elif "AARTI" in services:
            detected_intent = "AARTI_NOW"
        elif "DARSHAN" in services:
            detected_intent = "DARSHAN_NOW"
        elif "TRANSPORT" in services:
            detected_intent = "TRANSPORT_NOW"
        elif "PANDIT" in services:
            detected_intent = "PANDIT_NOW"
        elif "GUIDE" in services:
            detected_intent = "GUIDE_NOW"
        elif "SHOPPING" in services:
            detected_intent = "SHOPPING_NOW"
        elif len(services) >= 2:
            detected_intent = "LOCAL_PACKAGE"
        elif travel_window == "tomorrow":
            detected_intent = "NEXT_DAY_TRIP"
        elif travel_window == "today":
            detected_intent = "SAME_DAY_TRIP"
        else:
            detected_intent = "SHORT_STAY"
    else:
        # Outside Hunter
        if "PACKAGE" in services or ("hotel" in text and "darshan" in text and "boat" in text):
            detected_intent = "PACKAGE_SEARCH"
        elif "HOTEL" in services and len(services) == 1:
            detected_intent = "HOTEL_SEARCH"
        elif "DARSHAN" in services and len(services) == 1:
            detected_intent = "DARSHAN_PLANNING"
        elif "TRANSPORT" in services and len(services) == 1:
            detected_intent = "TRANSPORT_PLANNING"
        elif "ITINERARY" in services or "itinerary" in text or "how many days" in text:
            detected_intent = "ITINERARY_RESEARCH"
        elif re.search(r"\b(family|parents|bacche|family\s+trip)\b", text):
            detected_intent = "FAMILY_TRIP"
        elif re.search(r"\b(couple|husband|wife|honeymoon)\b", text):
            detected_intent = "COUPLE_TRIP"
        elif re.search(r"\b(group|friends|dost|colleagues)\b", text):
            detected_intent = "GROUP_TRIP"
        else:
            detected_intent = "TRIP_PLANNING"

    # 3. Intent Strength (LOW, MEDIUM, HIGH)
    # High: Explicit request, ready to book, immediate need
    high_signals = [
        r"\b(need|chahiye|looking\s+for|want|require|book|booking|arrange)\b",
        r"\b(aaj|kal|today|tomorrow)\b",
        r"\b(rate|cost|package\s+chahiye)\b"
    ]
    low_signals = [
        r"\b(just\s+curious|tell\s+me\s+about|information|history|kya\s+hai)\b"
    ]

    is_high = any(re.search(pat, text) for pat in high_signals) and len(services) > 0
    is_low = any(re.search(pat, text) for pat in low_signals) and len(services) == 0

    if is_high:
        intent_level = "HIGH"
        intent_confidence = 0.88
    elif is_low:
        intent_level = "LOW"
        intent_confidence = 0.35
    else:
        intent_level = "MEDIUM"
        intent_confidence = 0.65

    return {
        "mode": mode,
        "detected_intent": detected_intent,
        "intent_level": intent_level,
        "intent_confidence": intent_confidence
    }
