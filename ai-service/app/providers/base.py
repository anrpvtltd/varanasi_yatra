"""
Provider Abstraction Layer
Varanasi Yatra Platform — Prompt 5
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        pass

    @abstractmethod
    async def structured_output(self, task_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        pass

class DeterministicMockProvider(BaseAIProvider):
    """
    Deterministic Mock Provider for zero-cost, fully reproducible testing and execution.
    """
    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        return f"Deterministic response for: {prompt[:50]}..."

    async def structured_output(self, task_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        if task_type == "lead_summary":
            return {
                "summary": "Guest interested in spiritual Varanasi pilgrimage and family boat tour.",
                "recommendations": [
                    "VIP Darshan package at Kashi Vishwanath Temple",
                    "Early morning private Subah-e-Banaras boat ride"
                ]
            }
        elif task_type == "itinerary_suggestion":
            return {
                "summary": "3-day spiritual circuit covering major ghats and Sarnath.",
                "recommendations": [
                    "Day 1: Ganga Aarti at Dashashwamedh",
                    "Day 2: Temple darshans & heritage walk",
                    "Day 3: Sarnath excursion"
                ]
            }
        return {
            "summary": f"Processed {task_type} safely under Prompt 5 rules.",
            "recommendations": ["Follow standard rate rules."]
        }
