"""
AI Customer Hunter Module
Varanasi Yatra Platform — Prompt 8

Provides opportunity-discovery engines for Local and Outside traveler intent.
"""

from .source_policy import SourcePolicy, is_source_allowed
from .signal_sources import SignalSource, MockSignalSource, SourceRegistry
from .signal_normalizer import normalize_signal, compute_signal_hash
from .intent_detector import detect_intent
from .qualification import qualify_opportunity
from .confidence import calculate_confidence
from .deduplication import DeduplicationEngine
from .opportunity_builder import build_opportunity
from .local_hunter import LocalHunter
from .outside_hunter import OutsideHunter
from .hunter_scheduler import HunterScheduler

__all__ = [
    "SourcePolicy",
    "is_source_allowed",
    "SignalSource",
    "MockSignalSource",
    "SourceRegistry",
    "normalize_signal",
    "compute_signal_hash",
    "detect_intent",
    "qualify_opportunity",
    "calculate_confidence",
    "DeduplicationEngine",
    "build_opportunity",
    "LocalHunter",
    "OutsideHunter",
    "HunterScheduler"
]
