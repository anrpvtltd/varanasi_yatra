"""
Opportunity Qualification Engine
Varanasi Yatra Platform — Prompt 8

Evaluates opportunity clarity, purchase signals, and source quality to produce
a 0–100 qualification score accompanied by transparent business reasons.
"""

from typing import Dict, Any, List

def qualify_opportunity(
    normalized_signal: Dict[str, Any],
    intent_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes structured qualification score (0–100) and rationale.
    """
    reasons: List[str] = []
    score = 0

    services = normalized_signal.get("detected_services", [])
    travel_window = normalized_signal.get("detected_travel_window", "")
    duration = normalized_signal.get("detected_duration", "")
    location = normalized_signal.get("detected_location", "")
    source_type = normalized_signal.get("source_type", "")
    intent_level = intent_data.get("intent_level", "MEDIUM")

    # 1. Intent Level (up to 30 pts)
    if intent_level == "HIGH":
        score += 30
        reasons.append("High direct travel/booking intent detected.")
    elif intent_level == "MEDIUM":
        score += 18
        reasons.append("Moderate inquiry intent observed.")
    else:
        score += 5
        reasons.append("Low/passive curiosity intent.")

    # 2. Service Clarity (up to 25 pts)
    if len(services) >= 2:
        score += 25
        reasons.append(f"Multiple specific services requested ({', '.join(services)}).")
    elif len(services) == 1:
        score += 15
        reasons.append(f"Single specific service requested ({services[0]}).")
    else:
        score += 0
        reasons.append("No specific travel services identified.")

    # 3. Time Clarity (up to 20 pts)
    if travel_window:
        score += 15
        reasons.append(f"Clear travel window indicated: '{travel_window}'.")
        if duration:
            score += 5
            reasons.append(f"Duration specified: '{duration}'.")
    else:
        score += 0
        reasons.append("Travel timing or window unspecified.")

    # 4. Location Clarity (up to 15 pts)
    if location == "Varanasi":
        score += 15
        area = normalized_signal.get("detected_area")
        if area:
            reasons.append(f"Explicit destination and specific area ({area}) detected.")
        else:
            reasons.append("Explicit Varanasi destination identified.")
    else:
        score += 0
        reasons.append("Ambiguous or unspecified destination.")

    # 5. Source Quality & Authenticity (up to 10 pts)
    quality_score = normalized_signal.get("quality_score", 50)
    if quality_score >= 80:
        score += 10
        reasons.append("Verified high-quality source signal.")
    elif quality_score >= 50:
        score += 5
        reasons.append("Standard public source quality.")
    else:
        reasons.append("Low source quality or potential noisy channel.")

    # Clamp 0 to 100
    final_score = max(0, min(100, score))

    return {
        "qualification_score": final_score,
        "qualification_reasons": reasons,
        "service_clarity": "HIGH" if len(services) >= 2 else ("MEDIUM" if len(services) == 1 else "LOW"),
        "time_clarity": "CLEAR" if travel_window else "UNSPECIFIED",
        "location_clarity": "HIGH" if location == "Varanasi" else "LOW"
    }
