"""
Base Hunter Pipeline Orchestrator
Varanasi Yatra Platform — Prompt 8

Provides the foundation discovery loop: ingestion -> normalization -> intent ->
qualification -> confidence -> deduplication -> opportunity packaging.
"""

from abc import ABC
import uuid
from typing import List, Dict, Any
from datetime import datetime

from .signal_sources import SignalSource
from .signal_normalizer import normalize_signal
from .intent_detector import detect_intent
from .qualification import qualify_opportunity
from .confidence import calculate_confidence
from .deduplication import DeduplicationEngine
from .opportunity_builder import build_opportunity

class BaseHunter(ABC):
    """Abstract orchestrator for Customer Discovery."""

    def __init__(self, mode: str, deduplicator: DeduplicationEngine = None):
        self.mode = mode
        self.deduplicator = deduplicator or DeduplicationEngine()

    def process_raw_signals(
        self,
        raw_signals: List[Dict[str, Any]],
        source_id: str,
        source_type: str,
        existing_opportunities: List[Dict[str, Any]] = None,
        max_opportunities: int = 20,
        min_qualification_score: int = 50
    ) -> Dict[str, Any]:
        """
        Executes bounded discovery pipeline over provided batch of raw signals.
        Returns processed metrics and generated opportunities.
        """
        existing_opps = existing_opportunities or []
        created_opportunities: List[Dict[str, Any]] = []
        normalized_signals: List[Dict[str, Any]] = []

        metrics = {
            "signals_processed": 0,
            "signals_qualified": 0,
            "opportunities_created": 0,
            "duplicates_removed": 0,
            "rejected_spam": 0,
            "rejected_malicious": 0,
            "rejected_low_intent": 0,
            "rejected_mode_mismatch": 0
        }

        for raw in raw_signals:
            if len(created_opportunities) >= max_opportunities:
                break

            metrics["signals_processed"] += 1

            # 1. Normalize and extract entities
            norm = normalize_signal(raw, source_id, source_type)
            signal_id = f"SIG-{uuid.uuid4().hex[:10].upper()}"
            norm["signal_id"] = signal_id

            # 2. Guardrails: Filter Malicious or Injections (Section 57 & 58)
            if norm.get("is_malicious", False):
                norm["status"] = "REJECTED"
                norm["rejection_reason"] = f"Security: {norm.get('malicious_category')}"
                metrics["rejected_malicious"] += 1
                normalized_signals.append(norm)
                continue

            # 3. Guardrails: Filter Spam (Section 20)
            if norm.get("is_spam", False):
                norm["status"] = "REJECTED"
                norm["rejection_reason"] = "Spam / Promotional pattern detected"
                metrics["rejected_spam"] += 1
                normalized_signals.append(norm)
                continue

            # 4. Deduplication Check (Section 8 & 33)
            if self.deduplicator.is_signal_duplicate(norm["hash"], source_id, norm["public_reference"]):
                norm["status"] = "DUPLICATE"
                metrics["duplicates_removed"] += 1
                normalized_signals.append(norm)
                continue

            # Register as seen
            self.deduplicator.register_seen(norm["hash"], source_id, norm["public_reference"])

            # 5. Intent Detection (Section 13)
            intent_data = detect_intent(norm)

            # Check mode alignment
            if self.mode != "ALL" and intent_data["mode"] != self.mode:
                norm["status"] = "REJECTED"
                norm["rejection_reason"] = f"Mode mismatch (Signal is {intent_data['mode']}, Hunter is {self.mode})"
                metrics["rejected_mode_mismatch"] += 1
                normalized_signals.append(norm)
                continue

            # Check minimum intent level
            if intent_data["intent_level"] == "LOW" and not norm.get("detected_services"):
                norm["status"] = "REJECTED"
                norm["rejection_reason"] = "Informational query with low commercial intent"
                metrics["rejected_low_intent"] += 1
                normalized_signals.append(norm)
                continue

            # 6. Opportunity Qualification (Section 18)
            qual = qualify_opportunity(norm, intent_data)
            if qual["qualification_score"] < min_qualification_score:
                norm["status"] = "REJECTED"
                norm["rejection_reason"] = f"Qualification score ({qual['qualification_score']}) below threshold"
                metrics["rejected_low_intent"] += 1
                normalized_signals.append(norm)
                continue

            # 7. Confidence Calculation (Section 19)
            conf = calculate_confidence(norm, intent_data, qual)

            # 8. Assemble Opportunity
            opp = build_opportunity(norm, intent_data, qual, conf, signal_id)

            # Check duplicate against existing opportunities
            if self.deduplicator.is_opportunity_duplicate(opp, existing_opps + created_opportunities):
                norm["status"] = "DUPLICATE"
                metrics["duplicates_removed"] += 1
                normalized_signals.append(norm)
                continue

            norm["status"] = "QUALIFIED"
            metrics["signals_qualified"] += 1
            metrics["opportunities_created"] += 1

            normalized_signals.append(norm)
            created_opportunities.append(opp)

        return {
            "mode": self.mode,
            "metrics": metrics,
            "signals": normalized_signals,
            "opportunities": created_opportunities
        }
