"""
AI Tool Registry
Varanasi Yatra Platform — Prompt 5
"""

from typing import Dict, Any, Optional

ALLOWED_TOOLS: Dict[str, Dict[str, Any]] = {
    "crm.getLead": {
        "module": "CUSTOMER_ASSISTANT",
        "risk_level": "LOW",
        "permission": "LEADS_VIEW",
        "enabled": True
    },
    "crm.getCustomer": {
        "module": "CUSTOMER_ASSISTANT",
        "risk_level": "LOW",
        "permission": "CUSTOMERS_VIEW",
        "enabled": True
    },
    "crm.getBooking": {
        "module": "SALES_ASSISTANT",
        "risk_level": "LOW",
        "permission": "BOOKINGS_VIEW",
        "enabled": True
    },
    "crm.getQuote": {
        "module": "SALES_ASSISTANT",
        "risk_level": "LOW",
        "permission": "QUOTES_VIEW",
        "enabled": True
    },
    "crm.getTrip": {
        "module": "CUSTOMER_ASSISTANT",
        "risk_level": "LOW",
        "permission": "TRIPS_VIEW",
        "enabled": True
    },
    "crm.updateLead": {
        "module": "SALES_ASSISTANT",
        "risk_level": "MEDIUM",
        "permission": "LEADS_EDIT",
        "enabled": True
    },
    "crm.createLead": {
        "module": "CUSTOMER_ASSISTANT",
        "risk_level": "HIGH",
        "permission": "LEADS_CREATE",
        "enabled": True
    },
    "crm.sendCustomerMessage": {
        "module": "CUSTOMER_ASSISTANT",
        "risk_level": "HIGH",
        "permission": "COMMUNICATION_CREATE",
        "enabled": True
    },
    "crm.createBooking": {
        "module": "SALES_ASSISTANT",
        "risk_level": "CRITICAL",
        "permission": "BOOKINGS_CREATE",
        "enabled": True
    },
    "crm.modifyFinancialData": {
        "module": "SYSTEM_ANALYSIS",
        "risk_level": "CRITICAL",
        "permission": "FINANCIALS_MANAGE",
        "enabled": True
    },
    # Hunter tools strictly disabled in Prompt 5
    "hunter.searchPublicSignals": {
        "module": "CUSTOMER_HUNTER",
        "risk_level": "HIGH",
        "permission": "AI_MANAGE",
        "enabled": False
    },
    "hunter.qualifySignal": {
        "module": "CUSTOMER_HUNTER",
        "risk_level": "MEDIUM",
        "permission": "AI_MANAGE",
        "enabled": False
    },
    "hunter.createOpportunity": {
        "module": "CUSTOMER_HUNTER",
        "risk_level": "MEDIUM",
        "permission": "AI_MANAGE",
        "enabled": False
    }
}

def get_tool_meta(tool_name: str) -> Optional[Dict[str, Any]]:
    return ALLOWED_TOOLS.get(tool_name)
