"""
RAG Knowledge Sources
Varanasi Yatra Platform — Prompt 6
Provides structured and verified source documents for retrieval.
"""

from typing import List, Dict, Any

STATIC_SOURCES: List[Dict[str, Any]] = [
    {
        "id": "varanasi-dest-info",
        "title": "Varanasi Destination Overview",
        "category": "destination",
        "content": "Varanasi is an ancient spiritual city on the sacred Ganga. Ideal duration: 3 Days / 2 Nights.",
        "verified": True
    },
    {
        "id": "kashi-vishwanath-guide",
        "title": "Kashi Vishwanath Darshan Info",
        "category": "darshan",
        "content": "Kashi Vishwanath Jyotirlinga corridor connects to Lalita Ghat. Early morning or Sugam Darshan assistance available through official temple trust procedures.",
        "verified": True
    },
    {
        "id": "boat-rides-guide",
        "title": "Ganga Boat Experiences",
        "category": "boat",
        "content": "Sunrise Subah-e-Banaras boat rides and evening Dashashwamedh Ganga Aarti boat rides with life jackets.",
        "verified": True
    },
    {
        "id": "transport-services",
        "title": "Transport & Transfers",
        "category": "transport",
        "content": "Airport (VNS Babatpur) and railway Cantt/Banaras transfers, local sightseeing in AC Sedan, Innova, and Tempo Travellers.",
        "verified": True
    }
]

def get_all_sources() -> List[Dict[str, Any]]:
    """Returns static verified knowledge sources."""
    return STATIC_SOURCES
