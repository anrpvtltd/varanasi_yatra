"""
Hunter Scheduler & Quota Enforcer
Varanasi Yatra Platform — Prompt 8

Manages run scheduling, frequency controls, and safety rate limits.
Defaults strictly to MANUAL mode with initial state OFFLINE.
"""

from typing import Dict, Any
from datetime import datetime

class HunterScheduler:
    """Manages execution state, frequency limits, and daily quotas."""

    def __init__(
        self,
        schedule: str = "MANUAL",
        max_signals_per_run: int = 100,
        max_opportunities_per_run: int = 20,
        max_daily_signals: int = 500,
        max_daily_opportunities: int = 100
    ):
        self.schedule = schedule  # MANUAL, HOURLY, EVERY_3_HOURS, DAILY
        self.max_signals_per_run = max_signals_per_run
        self.max_opportunities_per_run = max_opportunities_per_run
        self.max_daily_signals = max_daily_signals
        self.max_daily_opportunities = max_daily_opportunities

        self.status = "OFFLINE"
        self.is_paused = False
        self.daily_signals_processed = 0
        self.daily_opportunities_created = 0
        self.last_run_at: datetime = None

    def get_state(self) -> Dict[str, Any]:
        return {
            "schedule": self.schedule,
            "status": self.status,
            "is_paused": self.is_paused,
            "max_signals_per_run": self.max_signals_per_run,
            "max_opportunities_per_run": self.max_opportunities_per_run,
            "max_daily_signals": self.max_daily_signals,
            "max_daily_opportunities": self.max_daily_opportunities,
            "daily_signals_processed": self.daily_signals_processed,
            "daily_opportunities_created": self.daily_opportunities_created,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None
        }

    def can_execute_run(self) -> tuple[bool, str]:
        """Checks if a run can be initiated under current safety limits."""
        if self.status == "EMERGENCY_STOP":
            return False, "Hunter is halted under EMERGENCY_STOP."
        if self.is_paused:
            return False, "Hunter is currently PAUSED."
        if self.daily_signals_processed >= self.max_daily_signals:
            return False, f"Daily signal quota exceeded ({self.daily_signals_processed}/{self.max_daily_signals})."
        if self.daily_opportunities_created >= self.max_daily_opportunities:
            return False, f"Daily opportunity quota exceeded ({self.daily_opportunities_created}/{self.max_daily_opportunities})."
        return True, "Ready"

    def record_run_usage(self, signals_count: int, opportunities_count: int) -> None:
        """Updates internal run and daily counters."""
        self.daily_signals_processed += signals_count
        self.daily_opportunities_created += opportunities_count
        self.last_run_at = datetime.utcnow()

    def pause(self) -> None:
        self.is_paused = True
        self.status = "PAUSED"

    def resume(self) -> None:
        self.is_paused = False
        self.status = "READY"

    def emergency_stop(self) -> None:
        self.status = "EMERGENCY_STOP"
        self.is_paused = True
