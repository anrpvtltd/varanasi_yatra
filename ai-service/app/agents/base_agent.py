"""
Base Agent Architecture
Varanasi Yatra Platform — Prompt 5
"""

from typing import Dict, Any, List
from ..providers.base import BaseAIProvider, DeterministicMockProvider

class BaseAgent:
    def __init__(self, provider: BaseAIProvider = None):
        self.provider = provider or DeterministicMockProvider()

    async def execute_task(self, task_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a targeted AI task with structured output.
        """
        return await self.provider.structured_output(task_type, context)
