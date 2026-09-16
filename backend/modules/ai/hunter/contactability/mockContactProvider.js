/**
 * Mock Contact Provider — Prompt 9.8
 * Varanasi Yatra Platform
 * 
 * Deterministic mock provider for testing the contactability pipeline.
 * Returns synthetic but structurally valid contact routes.
 * 
 * INVARIANTS:
 * 1. All routes are clearly marked provenance: 'MOCK_PROVIDER'.
 * 2. Never returns real personal data or PII.
 * 3. Reports NOT_CONFIGURED when env flag is not set.
 */

const {
    CONTACT_ROUTE_TYPES,
    CONTACT_PROVIDER_TYPES,
    CONTACT_VERIFICATION_STATUSES
} = require('../hunterConstants');

class MockContactProvider {
    constructor(options = {}) {
        this.providerId = 'MOCK_CONTACT';
        this.providerType = CONTACT_PROVIDER_TYPES.MOCK;
        this.enabled = options.enabled !== false; // enabled by default in test
    }

    /**
     * Provider metadata
     */
    getProviderInfo() {
        return {
            name: 'Mock Contact Provider',
            type: this.providerType,
            description: 'Deterministic test fixture for contact route discovery. Returns synthetic public contact routes.',
            configured: this.enabled,
            dataScope: 'MOCK — No real data accessed'
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        if (!this.enabled) {
            return {
                healthy: false,
                notConfigured: true,
                status: 'DISABLED',
                error: 'Mock contact provider is disabled.'
            };
        }
        return {
            healthy: true,
            notConfigured: false,
            status: 'HEALTHY',
            responseTimeMs: 1
        };
    }

    /**
     * Discover contact routes for an opportunity.
     * Returns deterministic mock routes based on opportunity data.
     */
    async discover(opportunity) {
        if (!this.enabled) {
            throw new Error('Mock contact provider is disabled.');
        }

        if (!opportunity || !opportunity.opportunityId) {
            throw new Error('Valid opportunity with opportunityId is required.');
        }

        const routes = [];
        const services = opportunity.serviceInterest || [];
        const intent = String(opportunity.detectedIntent || '').toLowerCase();
        const now = new Date();

        // Route 1: Business website (always generated for mock)
        routes.push({
            type: CONTACT_ROUTE_TYPES.BUSINESS_WEBSITE,
            value: `https://example-varanasi-travel.com/contact?ref=${opportunity.opportunityId.slice(-8)}`,
            label: 'Varanasi Travel Services — Public Website Contact',
            confidence: 0.85,
            provenance: 'MOCK_PROVIDER',
            verificationStatus: CONTACT_VERIFICATION_STATUSES.UNVERIFIED,
            verifiedByHuman: false,
            verifiedAt: null,
            addedAt: now
        });

        // Route 2: Google Business listing if hotel/darshan involved
        if (services.includes('HOTEL') || services.includes('DARSHAN') || intent.includes('hotel') || intent.includes('darshan')) {
            routes.push({
                type: CONTACT_ROUTE_TYPES.GOOGLE_BUSINESS,
                value: 'https://maps.google.com/maps?q=Mock+Varanasi+Travel+Agency',
                label: 'Google Business — Mock Varanasi Travel Agency',
                confidence: 0.78,
                provenance: 'MOCK_PROVIDER',
                verificationStatus: CONTACT_VERIFICATION_STATUSES.UNVERIFIED,
                verifiedByHuman: false,
                verifiedAt: null,
                addedAt: now
            });
        }

        // Route 3: Social media if package/itinerary
        if (services.includes('PACKAGE') || services.includes('ITINERARY') || intent.includes('trip') || intent.includes('planning')) {
            routes.push({
                type: CONTACT_ROUTE_TYPES.SOCIAL_MEDIA,
                value: 'https://instagram.com/mock_varanasi_travel',
                label: 'Instagram — @mock_varanasi_travel',
                confidence: 0.65,
                provenance: 'MOCK_PROVIDER',
                verificationStatus: CONTACT_VERIFICATION_STATUSES.UNVERIFIED,
                verifiedByHuman: false,
                verifiedAt: null,
                addedAt: now
            });
        }

        // Route 4: Tourism portal for outside hunter prospects
        if (opportunity.hunterMode === 'AI_OUTSIDE') {
            routes.push({
                type: CONTACT_ROUTE_TYPES.TOURISM_PORTAL,
                value: 'https://varanasi-tourism.mock.gov.in/travel-agencies',
                label: 'UP Tourism Portal — Registered Travel Agents',
                confidence: 0.60,
                provenance: 'MOCK_PROVIDER',
                verificationStatus: CONTACT_VERIFICATION_STATUSES.UNVERIFIED,
                verifiedByHuman: false,
                verifiedAt: null,
                addedAt: now
            });
        }

        return {
            routes,
            metadata: {
                provider: this.providerId,
                providerType: this.providerType,
                queriedAt: now.toISOString(),
                isMock: true,
                routesReturned: routes.length,
                dataScope: 'MOCK — No real data accessed'
            }
        };
    }
}

module.exports = {
    MockContactProvider
};
