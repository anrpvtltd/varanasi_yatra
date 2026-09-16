/**
 * Provider Allowlist & Approved Endpoint Resolver
 * Varanasi Yatra Platform — Prompt 9.5
 *
 * Enforces that outbound external requests only resolve to explicitly approved
 * domains and endpoints. Strictly prevents arbitrary URLs from directing
 * outbound traffic from the backend server.
 */

const APPROVED_PROVIDERS = Object.freeze({
    // Search Providers
    SERP_API: {
        providerKey: 'SERP_API',
        sourceType: 'SEARCH_API',
        defaultEndpoint: 'https://serpapi.com/search',
        allowedDomains: ['serpapi.com', 'api.serpapi.com']
    },
    GOOGLE_CUSTOM_SEARCH: {
        providerKey: 'GOOGLE_CUSTOM_SEARCH',
        sourceType: 'SEARCH_API',
        defaultEndpoint: 'https://customsearch.googleapis.com/customsearch/v1',
        allowedDomains: ['customsearch.googleapis.com', 'www.googleapis.com']
    },
    BING_SEARCH: {
        providerKey: 'BING_SEARCH',
        sourceType: 'SEARCH_API',
        defaultEndpoint: 'https://api.bing.microsoft.com/v7.0/search',
        allowedDomains: ['api.bing.microsoft.com']
    },

    // Public Feed Providers
    UP_TOURISM_FEED: {
        providerKey: 'UP_TOURISM_FEED',
        sourceType: 'PUBLIC_FEED',
        defaultEndpoint: 'https://uptourism.gov.in/feed/rss',
        allowedDomains: ['uptourism.gov.in', 'www.uptourism.gov.in']
    },
    VARANASI_DISTRICT_FEED: {
        providerKey: 'VARANASI_DISTRICT_FEED',
        sourceType: 'PUBLIC_FEED',
        defaultEndpoint: 'https://varanasi.nic.in/feed',
        allowedDomains: ['varanasi.nic.in']
    },
    FEEDBURNER_UP_TOURISM: {
        providerKey: 'FEEDBURNER_UP_TOURISM',
        sourceType: 'PUBLIC_FEED',
        defaultEndpoint: 'https://feeds.feedburner.com/uptourism_updates',
        allowedDomains: ['feeds.feedburner.com']
    },

    // Partner Referral Network
    PARTNER_DEFAULT_NETWORK: {
        providerKey: 'PARTNER_DEFAULT_NETWORK',
        sourceType: 'PARTNER_FEED',
        defaultEndpoint: 'https://api.partner-network.varanasiyatra.in/v1/leads',
        allowedDomains: ['api.partner-network.varanasiyatra.in', 'hotels.varanasiyatra.in']
    },

    // Test Providers (authorized in test environment)
    TEST_APPROVED_PROVIDER: {
        providerKey: 'TEST_APPROVED_PROVIDER',
        sourceType: 'SEARCH_API',
        defaultEndpoint: 'https://test.approved-provider.com/search',
        allowedDomains: ['test.approved-provider.com', 'approved-partner.varanasiyatra.in', 'travel-community.mock']
    }
});

// Flat list of all approved domains for quick lookup
const ALL_APPROVED_DOMAINS = new Set();
for (const provider of Object.values(APPROVED_PROVIDERS)) {
    for (const d of provider.allowedDomains) {
        ALL_APPROVED_DOMAINS.add(d.toLowerCase());
    }
}

/**
 * Check if a hostname belongs to an approved provider domain
 */
function isDomainAllowed(hostname) {
    if (!hostname || typeof hostname !== 'string') return false;
    const lower = hostname.toLowerCase().trim();

    if (ALL_APPROVED_DOMAINS.has(lower)) return true;

    // Check subdomain matches of approved domains
    for (const approved of ALL_APPROVED_DOMAINS) {
        if (lower.endsWith(`.${approved}`)) {
            return true;
        }
    }

    return false;
}

/**
 * Resolves an approved endpoint for a connector.
 * If an override URL is supplied (e.g. from environment config), it is strictly
 * verified against approved domains. Arbitrary URLs are rejected.
 *
 * @param {string} providerKey - Canonical provider key
 * @param {string} [customEndpoint] - Optional endpoint override
 * @returns {{ approved: boolean, endpointUrl?: string, reason?: string }}
 */
function resolveApprovedEndpoint(providerKey, customEndpoint = null) {
    const providerConfig = APPROVED_PROVIDERS[providerKey];

    // If custom endpoint is provided, validate domain against allowlist
    if (customEndpoint) {
        try {
            const parsed = new URL(customEndpoint);
            const host = parsed.hostname.toLowerCase();

            if (!isDomainAllowed(host)) {
                return {
                    approved: false,
                    reason: `Destination host '${host}' is not in the approved provider allowlist. Arbitrary external URLs are blocked.`
                };
            }

            return {
                approved: true,
                endpointUrl: customEndpoint,
                providerKey: providerKey || 'CUSTOM_APPROVED'
            };
        } catch {
            return {
                approved: false,
                reason: `Invalid custom endpoint URL: ${customEndpoint}`
            };
        }
    }

    if (!providerConfig) {
        return {
            approved: false,
            reason: `Unknown or unauthorized provider key '${providerKey}'.`
        };
    }

    return {
        approved: true,
        endpointUrl: providerConfig.defaultEndpoint,
        providerKey: providerConfig.providerKey
    };
}

module.exports = {
    APPROVED_PROVIDERS,
    ALL_APPROVED_DOMAINS,
    isDomainAllowed,
    resolveApprovedEndpoint
};
