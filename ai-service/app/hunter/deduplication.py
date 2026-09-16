"""
Multi-Level Deduplication Engine
Varanasi Yatra Platform — Prompt 8

Prevents duplicate signal ingestion and redundant opportunity generation using:
1. Exact deterministic SHA-256 hash match
2. Source + public reference match
3. Normalized signal similarity & temporal window overlap
"""

from typing import List, Dict, Any, Set

class DeduplicationEngine:
    """Manages multi-tier deduplication for signals and discovered opportunities."""

    def __init__(self):
        self._seen_hashes: Set[str] = set()
        self._seen_public_refs: Set[str] = set()

    def register_seen(self, sig_hash: str, source_id: str, public_ref: str) -> None:
        """Records a processed signal into the in-memory deduplication index."""
        if sig_hash:
            self._seen_hashes.add(sig_hash)
        if public_ref:
            self._seen_public_refs.add(f"{source_id}:{public_ref}")

    def is_signal_duplicate(self, sig_hash: str, source_id: str, public_ref: str) -> bool:
        """
        Level 1 & Level 2 check:
        - Exact hash collision
        - Exact source + public reference collision
        """
        if sig_hash in self._seen_hashes:
            return True
        if public_ref and f"{source_id}:{public_ref}" in self._seen_public_refs:
            return True
        return False

    def is_opportunity_duplicate(
        self,
        candidate: Dict[str, Any],
        existing_opportunities: List[Dict[str, Any]]
    ) -> bool:
        """
        Level 3 conservative match check:
        Checks if candidate matches an existing opportunity in the same source with
        identical public reference, services, and travel timing.
        """
        cand_source = candidate.get("source", "")
        cand_ref = candidate.get("public_reference", "")
        cand_services = set(candidate.get("service_interest", []))
        cand_window = candidate.get("travel_window", "")

        for opp in existing_opportunities:
            # Check source and public ref
            if cand_ref and opp.get("public_reference") == cand_ref and opp.get("source") == cand_source:
                return True

            # Conservative overlap: same source, identical services, and identical travel window
            opp_services = set(opp.get("service_interest", []))
            opp_window = opp.get("travel_window", "")
            if (
                opp.get("source") == cand_source and
                cand_services and cand_services == opp_services and
                cand_window and cand_window == opp_window and
                opp.get("status") in ["NEW", "UNDER_REVIEW", "APPROVED"]
            ):
                return True

        return False
