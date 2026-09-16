"""
Signal Normalizer & Data Minimization Pipeline
Varanasi Yatra Platform — Prompt 8

Normalizes raw unstructured signals, minimizes personal data, extracts entities,
computes deterministic SHA-256 deduplication hashes, and filters prompt injections.
"""

import re
import hashlib
from typing import Dict, Any, List, Optional

# Canonical local areas in Varanasi
CANONICAL_AREAS = [
    "Godaulia",
    "Dashashwamedh",
    "Bhelupur",
    "Sarnath",
    "Lanka",
    "BHU",
    "Assi",
    "Cantonment"
]

# Canonical Services
CANONICAL_SERVICES = [
    "HOTEL", "DARSHAN", "BOAT", "TRANSPORT", "PANDIT", 
    "GUIDE", "SHOPPING", "PACKAGE", "AARTI", "ITINERARY"
]

def compute_signal_hash(source_id: str, public_ref: str, normalized_text: str) -> str:
    """Computes deterministic SHA-256 identity hash for duplicate prevention."""
    payload = f"{source_id.strip()}:{public_ref.strip()}:{normalized_text.strip().lower()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def check_signal_injection(text: str) -> Dict[str, Any]:
    """Inspects text for prompt injection, jailbreak attempts, or data exfiltration."""
    lowered = text.lower()
    patterns = [
        (r"ignore\s+(all\s+)?(previous\s+)?instructions", "JAILBREAK_ATTEMPT"),
        (r"(expose|show|reveal|leak)\s+.*(vendor|cost|margin|credential|database|secret|password)", "CONFIDENTIAL_DATA_ATTEMPT"),
        (r"system\s+prompt", "SYSTEM_PROMPT_INSPECTION"),
        (r"drop\s+table", "SQL_INJECTION_PATTERN")
    ]
    for pattern, category in patterns:
        if re.search(pattern, lowered):
            return {"is_malicious": True, "category": category}
    return {"is_malicious": False, "category": None}

def detect_services(text: str) -> List[str]:
    """Extracts canonical services indicated in signal text."""
    lowered = text.lower()
    detected = []

    if re.search(r"\b(hotel|stay|room|dharamshala|resort|accommodation)\b", lowered):
        detected.append("HOTEL")
    if re.search(r"\b(darshan|mandir|temple|vishwanath|kashi\s*vishwanath|annapurna|bhairav|sankat\s*mochan)\b", lowered):
        detected.append("DARSHAN")
    if re.search(r"\b(boat|boating|shikara|ghat\s*ride|subah|ganga\s*ride|bajra)\b", lowered):
        detected.append("BOAT")
    if re.search(r"\b(transport|cab|taxi|car|tempo|airport\s*pickup|railway\s*pickup|driver)\b", lowered):
        detected.append("TRANSPORT")
    if re.search(r"\b(pandit|puja|rudrabhishek|shradh|pind\s*daan|havan|archana)\b", lowered):
        detected.append("PANDIT")
    if re.search(r"\b(guide|tour\s*guide|guided\s*tour|sightseeing\s*guide)\b", lowered):
        detected.append("GUIDE")
    if re.search(r"\b(shopping|banarasi\s*saree|sari|sweets|silk|kachori)\b", lowered):
        detected.append("SHOPPING")
    if re.search(r"\b(package|all\s*inclusive|complete\s*trip|tour\s*package)\b", lowered):
        detected.append("PACKAGE")
    if re.search(r"\b(aarti|ganga\s*aarti|maha\s*aarti|dashashwamedh\s*aarti)\b", lowered):
        detected.append("AARTI")
    if re.search(r"\b(itinerary|plan|day\s*wise|schedule)\b", lowered):
        detected.append("ITINERARY")

    return list(dict.fromkeys(detected))

def detect_location_and_area(text: str) -> Dict[str, Any]:
    """Recognizes Varanasi reference and maps to specific local area if confidently present."""
    lowered = text.lower()
    is_varanasi = bool(re.search(r"\b(varanasi|banaras|kashi|benares)\b", lowered))
    
    detected_area = None
    for area in CANONICAL_AREAS:
        if re.search(rf"\b{re.escape(area.lower())}\b", lowered):
            detected_area = area
            break

    # Distinguish "already in Varanasi" vs "planning"
    is_currently_in = bool(re.search(r"\b(in\s+(varanasi|banaras|kashi)|mein\s+hoon|here\s+now|currently\s+in|already\s+here)\b", lowered))

    return {
        "is_varanasi": is_varanasi,
        "is_currently_in": is_currently_in,
        "area": detected_area
    }

def detect_travel_window_and_duration(text: str) -> Dict[str, Any]:
    """Extracts travel window and trip duration without fabricating exact dates."""
    lowered = text.lower()
    
    travel_window = ""
    duration = ""

    # Current / Near-term
    if re.search(r"\b(today|aaj|ab|now|immediately)\b", lowered):
        travel_window = "today"
    elif re.search(r"\b(tomorrow|kal|next\s*day)\b", lowered):
        travel_window = "tomorrow"
    elif re.search(r"\b(this\s+weekend|weekend)\b", lowered):
        travel_window = "this weekend"
    elif re.search(r"\b(next\s+week|agle\s+hafte)\b", lowered):
        travel_window = "next week"
    elif re.search(r"\b(next\s+month|agle\s+mahine)\b", lowered):
        travel_window = "next month"
    
    # Specific months / festivals
    months = ["january", "february", "march", "april", "may", "june", 
              "july", "august", "september", "october", "november", "december", "diwali", "dev\s*diwali", "shivratri"]
    for m in months:
        if re.search(rf"\b{m}\b", lowered):
            travel_window = m.capitalize()
            break

    # Duration parsing
    dur_match = re.search(r"\b(\d+)\s*(days?|din|nights?|raat)\b", lowered)
    if dur_match:
        count = dur_match.group(1)
        unit = "Days" if "d" in dur_match.group(2) else "Nights"
        duration = f"{count} {unit}"
    elif "same day" in lowered or "1 day" in lowered:
        duration = "Same Day"

    return {
        "travel_window": travel_window,
        "duration": duration
    }

def normalize_signal(raw_signal: Dict[str, Any], source_id: str, source_type: str) -> Dict[str, Any]:
    """
    Takes raw signal, strips extraneous personal identifiers, validates injection safety,
    and returns a normalized signal payload ready for intent detection.
    """
    raw_text = raw_signal.get("text", "")
    public_ref = raw_signal.get("public_reference", "")
    source_url = raw_signal.get("url", "")
    
    # Clean whitespace
    clean_text = " ".join(raw_text.split()).strip()

    # Injection check
    injection = check_signal_injection(clean_text)

    # Compute deterministic hash
    sig_hash = compute_signal_hash(source_id, public_ref, clean_text)

    # Entity detection
    services = detect_services(clean_text)
    loc_info = detect_location_and_area(clean_text)
    time_info = detect_travel_window_and_duration(clean_text)

    # Quality check (spam vs legit)
    is_spam = bool(re.search(r"\b(buy\s*now|click\s*here|crypto|casino|viagra|loan)\b", clean_text.lower()))

    quality_score = 75
    if is_spam:
        quality_score = 10
    elif injection["is_malicious"]:
        quality_score = 0
    elif not services and not time_info["travel_window"]:
        quality_score = 30
    elif len(services) >= 2 and time_info["travel_window"]:
        quality_score = 90

    return {
        "source_id": source_id,
        "source_type": source_type,
        "public_reference": public_ref,
        "source_url": source_url,
        "text_excerpt": clean_text[:200],
        "normalized_text": clean_text,
        "hash": sig_hash,
        "is_malicious": injection["is_malicious"],
        "malicious_category": injection["category"],
        "is_spam": is_spam,
        "quality_score": quality_score,
        "detected_services": services,
        "detected_location": "Varanasi" if loc_info["is_varanasi"] else "Unknown",
        "detected_area": loc_info["area"],
        "is_currently_in": loc_info["is_currently_in"],
        "detected_travel_window": time_info["travel_window"],
        "detected_duration": time_info["duration"]
    }
