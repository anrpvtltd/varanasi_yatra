"""
Local Hunter Engine
Varanasi Yatra Platform — Prompt 8

Specializes in identifying in-destination travelers currently in Varanasi
needing immediate or near-term darshan, boat rides, Ganga Aarti, pandit, guide, or transport.
"""

from .base_hunter import BaseHunter
from .deduplication import DeduplicationEngine

class LocalHunter(BaseHunter):
    """Local Hunter: discovers in-destination travelers with immediate needs."""

    def __init__(self, deduplicator: DeduplicationEngine = None):
        super().__init__(mode="AI_LOCAL", deduplicator=deduplicator)
