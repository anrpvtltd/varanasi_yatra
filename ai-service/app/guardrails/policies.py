"""
AI Guardrails & Safe Mode Policies
Varanasi Yatra Platform — Prompt 5
"""

class SafeModePolicy:
    """
    Enforces operational boundaries when AI_SAFE_MODE is ON.
    Disallows high-risk mutations, external messaging, and financial changes.
    """
    DISALLOWED_TOOLS_IN_SAFE_MODE = {
        "crm.createLead",
        "crm.updateLead",
        "crm.sendCustomerMessage",
        "crm.createBooking",
        "crm.modifyFinancialData",
        "hunter.searchPublicSignals",
        "hunter.qualifySignal",
        "hunter.createOpportunity"
    }

    @classmethod
    def is_tool_allowed(cls, tool_name: str, safe_mode: bool = True) -> bool:
        if not safe_mode:
            return True
        return tool_name not in cls.DISALLOWED_TOOLS_IN_SAFE_MODE
