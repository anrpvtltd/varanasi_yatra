"""
Outside Hunter Engine
Varanasi Yatra Platform — Prompt 8

Specializes in identifying prospective pilgrims outside Varanasi planning
future visits needing hotels, temple darshan, itineraries, and full tour packages.
"""

from .base_hunter import BaseHunter
from .deduplication import DeduplicationEngine

class OutsideHunter(BaseHunter):
    """Outside Hunter: discovers prospective pilgrims planning upcoming Varanasi trips."""

    def __init__(self, deduplicator: DeduplicationEngine = None):
        super().__init__(mode="AI_OUTSIDE", deduplicator=deduplicator)
