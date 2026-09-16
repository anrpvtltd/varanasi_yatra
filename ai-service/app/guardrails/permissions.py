"""
Role & Permission Guardrails
Varanasi Yatra Platform — Prompt 5
"""

from typing import List

class PermissionGuardrail:
    """
    Validates user role and permissions against tool specifications.
    """
    TOOL_PERMISSIONS = {
        "crm.getLead": "LEADS_VIEW",
        "crm.getCustomer": "CUSTOMERS_VIEW",
        "crm.getBooking": "BOOKINGS_VIEW",
        "crm.getQuote": "QUOTES_VIEW",
        "crm.getTrip": "TRIPS_VIEW",
        "crm.updateLead": "LEADS_EDIT",
        "crm.createLead": "LEADS_CREATE",
        "crm.sendCustomerMessage": "COMMUNICATION_CREATE",
        "crm.createBooking": "BOOKINGS_CREATE",
        "crm.modifyFinancialData": "FINANCIALS_MANAGE"
    }

    @classmethod
    def can_execute(cls, tool_name: str, role: str, permissions: List[str]) -> bool:
        role_upper = (role or "").upper()
        if role_upper == "CEO":
            return True
        
        required_perm = cls.TOOL_PERMISSIONS.get(tool_name)
        if not required_perm:
            return False
        
        # Financial operations are strictly restricted to CEO
        if required_perm in {"FINANCIALS_MANAGE", "FINANCIALS_VIEW"}:
            return False

        return required_perm in permissions
