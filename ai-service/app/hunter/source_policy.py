"""
Source Policy & Security Verification
Varanasi Yatra Platform — Prompt 8

Enforces strict compliance with public and authorized data ingestion rules.
Prohibits private data scraping, authentication bypasses, and account impersonation.
"""

from typing import Dict, Any, Tuple

ALLOWED_SOURCE_TYPES = {
    "PUBLIC_SEARCH",
    "SEARCH_API",
    "PUBLIC_FEED",
    "PARTNER_FEED",
    "PARTNER_REFERRAL",
    "FIRST_PARTY",
    "FIRST_PARTY_SIGNAL",
    "PUBLIC_DATA_API",
    "OTHER_AUTHORIZED_API",
    "AUTHORIZED_API",
    "CONSENTED_INBOUND",
    "MOCK"
}

DISALLOWED_SOURCE_TYPES = {
    "PRIVATE_PROFILE_SCRAPER",
    "LOGIN_PROTECTED_SCRAPER",
    "CAPTCHA_BYPASS",
    "ACCOUNT_IMPERSONATION",
    "RESTRICTED_API"
}

class SourcePolicy:
    """Enforces source authorization and safety constraints."""

    @staticmethod
    def validate_source(source_metadata: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validates whether a source is legally and ethically permitted.
        Returns (is_allowed, reason).
        """
        source_id = source_metadata.get("source_id", "UNKNOWN")
        source_type = source_metadata.get("source_type", "")
        auth_status = source_metadata.get("authorization_status", "NOT_CONFIGURED")
        is_private = source_metadata.get("requires_login", False)
        requires_bypass = source_metadata.get("requires_bypass", False)

        # 1. Reject disallowed or bypass source types
        if source_type in DISALLOWED_SOURCE_TYPES or requires_bypass:
            return False, f"Source '{source_id}' uses prohibited scraping or bypass technique."

        # 2. Reject private or login-protected sources
        if is_private:
            return False, f"Source '{source_id}' requires user credentials or private profile access."

        # 3. Source type must be in allowed list
        if source_type not in ALLOWED_SOURCE_TYPES:
            return False, f"Source type '{source_type}' is not recognized or permitted."

        # 4. Check authorization status
        if auth_status == "REJECTED":
            return False, f"Source '{source_id}' has been rejected by administrative policy."

        if auth_status == "NOT_CONFIGURED":
            # Allowed to exist in registry as inactive/not configured, but cannot fetch live signals
            return False, f"Source '{source_id}' is not configured with verified API credentials."

        if auth_status != "AUTHORIZED":
            return False, f"Source '{source_id}' is pending authorization or inactive."

        return True, "Source is authorized and complies with policy."

def is_source_allowed(source_metadata: Dict[str, Any]) -> bool:
    allowed, _ = SourcePolicy.validate_source(source_metadata)
    return allowed
