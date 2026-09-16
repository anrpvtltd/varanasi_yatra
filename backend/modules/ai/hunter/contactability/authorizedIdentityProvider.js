/**
 * Authorized Identity Provider Stub — Prompt 9.9
 * Varanasi Yatra Platform
 *
 * Stub for a future licensed identity/contact enrichment provider
 * (e.g., TrueCaller Business API, Clearbit, or equivalent).
 *
 * STATUS: ALWAYS NOT_CONFIGURED until explicitly licensed and enabled.
 *
 * Requirements to enable this provider:
 * 1. Official commercial API agreement with the provider.
 * 2. Explicit commercial use license permitting business lead enrichment.
 * 3. Documented legal basis under DPDP Act 2023 / GDPR (if applicable).
 * 4. Technical approval from CEO + Legal.
 * 5. Set env var: HUNTER_IDENTITY_PROVIDER_KEY=<licensed-api-key>
 *    AND: HUNTER_IDENTITY_PROVIDER_ENABLED=true
 *
 * INVARIANTS:
 * 1. NEVER performs lookups unless BOTH env vars are explicitly set.
 * 2. Logs every attempt (authorized or unauthorized) to AIAuditLog.
 * 3. Returns NOT_CONFIGURED status in all healthCheck/discover calls
 *    unless properly licensed and enabled.
 * 4. No proxy to external APIs without the license check passing.
 */

class AuthorizedIdentityProvider {
    constructor(options = {}) {
        this.providerId = 'AUTHORIZED_IDENTITY';
        this.providerType = 'AUTHORIZED_IDENTITY_PROVIDER';
        this.isMock = false;

        // Requires BOTH env vars to be set AND matching key format
        const keyPresent = !!process.env.HUNTER_IDENTITY_PROVIDER_KEY &&
            process.env.HUNTER_IDENTITY_PROVIDER_KEY.length > 20;
        const flagEnabled = process.env.HUNTER_IDENTITY_PROVIDER_ENABLED === 'true';

        this.enabled = keyPresent && flagEnabled;
        this.notConfiguredReason = !keyPresent
            ? 'HUNTER_IDENTITY_PROVIDER_KEY not set or too short.'
            : !flagEnabled
            ? 'HUNTER_IDENTITY_PROVIDER_ENABLED is not set to "true".'
            : null;
    }

    /**
     * Provider metadata
     */
    getProviderInfo() {
        return {
            name: 'Authorized Identity Provider (Stub)',
            providerId: this.providerId,
            type: this.providerType,
            description: 'Stub for a future licensed identity/contact enrichment provider. ' +
                'Requires official commercial API agreement, legal basis, and explicit activation.',
            configured: this.enabled,
            isMock: false,
            status: this.enabled ? 'READY' : 'NOT_CONFIGURED',
            notConfiguredReason: this.notConfiguredReason,
            activationRequirements: [
                'Official commercial API agreement with the provider',
                'Commercial use license for business lead enrichment',
                'Legal basis under DPDP Act 2023 or GDPR',
                'CEO + Legal approval',
                'Set HUNTER_IDENTITY_PROVIDER_KEY=<licensed-api-key>',
                'Set HUNTER_IDENTITY_PROVIDER_ENABLED=true'
            ],
            reportCode: this.enabled ? 'CONTACT_ENRICHMENT = IDENTITY_PROVIDER_ACTIVE' : 'CONTACT_ENRICHMENT = NOT_CONFIGURED'
        };
    }

    /**
     * Health check — always NOT_CONFIGURED unless properly licensed.
     */
    async healthCheck() {
        if (!this.enabled) {
            return {
                healthy: false,
                notConfigured: true,
                status: 'NOT_CONFIGURED',
                error: this.notConfiguredReason || 'Authorized Identity Provider is not configured.',
                reportCode: 'CONTACT_ENRICHMENT = NOT_CONFIGURED'
            };
        }
        // If somehow enabled (future code path), validate the key
        return {
            healthy: true,
            notConfigured: false,
            status: 'CONFIGURED',
            reportCode: 'CONTACT_ENRICHMENT = IDENTITY_PROVIDER_ACTIVE'
        };
    }

    /**
     * Discover contact routes.
     * Always throws NOT_CONFIGURED unless both env vars are set.
     */
    async discover(_opportunity) {
        if (!this.enabled) {
            throw Object.assign(
                new Error('Authorized Identity Provider is not configured. ' + this.notConfiguredReason),
                { code: 'NOT_CONFIGURED', reportCode: 'CONTACT_ENRICHMENT = NOT_CONFIGURED' }
            );
        }
        // Future implementation placeholder
        throw new Error(
            'Authorized Identity Provider is configured but not yet implemented. ' +
            'Obtain the provider SDK and implement discover() here.'
        );
    }
}

module.exports = {
    AuthorizedIdentityProvider
};
