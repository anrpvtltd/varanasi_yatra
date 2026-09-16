/**
 * Contact Provider Registry — Prompt 9.8
 * Varanasi Yatra Platform
 * 
 * Provider abstraction for contact route discovery.
 * Integrates with existing SSRF protection and provider allowlist.
 * 
 * INVARIANTS:
 * 1. Only authorized public data sources — NEVER private PII, leaked datasets, or restricted data.
 * 2. Provider truthfulness — reports NOT_CONFIGURED when credentials are absent.
 * 3. All discovery is human-triggered, never autonomous.
 */

const {
    CONTACT_STATUSES
} = require('../hunterConstants');

class ContactProviderRegistry {
    constructor() {
        this.providers = new Map();
        this.defaultProviderId = null;
    }

    /**
     * Register a contact enrichment provider
     */
    registerProvider(providerId, provider) {
        if (!providerId || !provider) {
            throw new Error('providerId and provider instance are required');
        }
        if (typeof provider.discover !== 'function') {
            throw new Error(`Provider ${providerId} must implement discover(opportunity)`);
        }
        if (typeof provider.healthCheck !== 'function') {
            throw new Error(`Provider ${providerId} must implement healthCheck()`);
        }
        if (typeof provider.getProviderInfo !== 'function') {
            throw new Error(`Provider ${providerId} must implement getProviderInfo()`);
        }

        this.providers.set(providerId, provider);

        // First registered provider becomes default
        if (!this.defaultProviderId) {
            this.defaultProviderId = providerId;
        }
    }

    /**
     * Get a registered provider
     */
    getProvider(providerId) {
        return this.providers.get(providerId) || null;
    }

    /**
     * Get the default provider
     */
    getDefaultProvider() {
        if (!this.defaultProviderId) return null;
        return this.providers.get(this.defaultProviderId) || null;
    }

    /**
     * List all registered providers with their info
     */
    listProviders() {
        const result = [];
        for (const [id, provider] of this.providers) {
            try {
                const info = provider.getProviderInfo();
                result.push({
                    providerId: id,
                    ...info,
                    isDefault: id === this.defaultProviderId
                });
            } catch {
                result.push({
                    providerId: id,
                    name: id,
                    status: 'ERROR',
                    isDefault: id === this.defaultProviderId
                });
            }
        }
        return result;
    }

    /**
     * Run contact discovery using the specified or default provider
     */
    async discoverRoutes(opportunity, providerId = null) {
        const resolvedId = providerId || this.defaultProviderId;
        if (!resolvedId) {
            return {
                status: CONTACT_STATUSES.PROVIDER_NOT_CONFIGURED,
                provider: null,
                routes: [],
                error: 'No contact enrichment provider is registered.'
            };
        }

        const provider = this.providers.get(resolvedId);
        if (!provider) {
            return {
                status: CONTACT_STATUSES.PROVIDER_NOT_CONFIGURED,
                provider: resolvedId,
                routes: [],
                error: `Provider ${resolvedId} not found in registry.`
            };
        }

        try {
            // Check provider health first
            const health = await provider.healthCheck();
            if (!health.healthy) {
                return {
                    status: health.notConfigured
                        ? CONTACT_STATUSES.PROVIDER_NOT_CONFIGURED
                        : CONTACT_STATUSES.FAILED,
                    provider: resolvedId,
                    providerStatus: health.status || 'UNHEALTHY',
                    routes: [],
                    error: health.error || 'Provider health check failed.'
                };
            }

            // Execute discovery
            const result = await provider.discover(opportunity);
            return {
                status: (result.routes && result.routes.length > 0)
                    ? CONTACT_STATUSES.ROUTES_FOUND
                    : CONTACT_STATUSES.NO_ROUTES_FOUND,
                provider: resolvedId,
                providerStatus: 'HEALTHY',
                routes: result.routes || [],
                metadata: result.metadata || {}
            };
        } catch (err) {
            return {
                status: CONTACT_STATUSES.FAILED,
                provider: resolvedId,
                routes: [],
                error: err.message || 'Contact discovery failed.'
            };
        }
    }

    /**
     * Health check a specific provider
     */
    async checkProviderHealth(providerId) {
        const provider = this.providers.get(providerId);
        if (!provider) {
            return { healthy: false, notConfigured: true, error: `Provider ${providerId} not found.` };
        }
        return provider.healthCheck();
    }
}

// Singleton instance
const contactProviderRegistry = new ContactProviderRegistry();

module.exports = {
    ContactProviderRegistry,
    contactProviderRegistry
};
