"""
AI Service Configuration Manager
Varanasi Yatra Platform — Prompt 5
"""

class AIConfigurationService:
    def __init__(self):
        self.master_enabled = True
        self.safe_mode = True
        self.emergency_stop = False
        self.environment = "development"
        self.provider = "mock"

    def get_status(self):
        return {
            "master_enabled": self.master_enabled,
            "safe_mode": self.safe_mode,
            "emergency_stop": self.emergency_stop,
            "environment": self.environment,
            "provider": self.provider
        }

config_service = AIConfigurationService()
