"""
Confidence Rating Engine
Varanasi Yatra Platform — Prompt 8

Computes multi-dimensional internal confidence ratings across signal quality,
intent strength, location grounding, travel window, and requested services.
"""

from typing import Dict, Any

def calculate_confidence(
    normalized_signal: Dict[str, Any],
    intent_data: Dict[str, Any],
    qualification_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes individual confidence dimensions and composite overallConfidence (0.00 to 1.00).
    """
    # 1. Signal Confidence based on text quality and injection safety
    quality = normalized_signal.get("quality_score", 50)
    signal_confidence = round(quality / 100.0, 2)
    if normalized_signal.get("is_malicious", False) or normalized_signal.get("is_spam", False):
        signal_confidence = 0.05

    # 2. Intent Confidence
    intent_confidence = round(intent_data.get("intent_confidence", 0.5), 2)

    # 3. Location Confidence
    location = normalized_signal.get("detected_location", "")
    area = normalized_signal.get("detected_area", None)
    if location == "Varanasi" and area:
        location_confidence = 0.95
    elif location == "Varanasi":
        location_confidence = 0.85
    else:
        location_confidence = 0.30

    # 4. Travel Window Confidence
    travel_window = normalized_signal.get("detected_travel_window", "")
    if travel_window in ["today", "tomorrow", "this weekend"]:
        travel_window_confidence = 0.90
    elif travel_window:
        travel_window_confidence = 0.75
    else:
        travel_window_confidence = 0.30

    # 5. Service Confidence
    services = normalized_signal.get("detected_services", [])
    if len(services) >= 2:
        service_confidence = 0.90
    elif len(services) == 1:
        service_confidence = 0.75
    else:
        service_confidence = 0.25

    # Composite Overall Confidence (weighted sum)
    # Weights: intent (0.35), service (0.25), location (0.20), window (0.10), signal (0.10)
    overall = (
        (intent_confidence * 0.35) +
        (service_confidence * 0.25) +
        (location_confidence * 0.20) +
        (travel_window_confidence * 0.10) +
        (signal_confidence * 0.10)
    )
    overall_confidence = round(max(0.0, min(1.0, overall)), 2)

    return {
        "signal_confidence": signal_confidence,
        "intent_confidence": intent_confidence,
        "location_confidence": location_confidence,
        "travel_window_confidence": travel_window_confidence,
        "service_confidence": service_confidence,
        "overall_confidence": overall_confidence
    }
