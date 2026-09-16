/**
 * Generic Search & Discovery Signal Connector
 * Varanasi Yatra Platform — Prompt 9 & 9.5
 *
 * Implements authorized search API connector contract with:
 * - Strict SSRF validation and Provider Allowlist enforcement
 * - Controlled Varanasi travel-intent queries (Local & Outside)
 * - Credential secrecy (no API keys in logs/errors)
 * - Failure isolation, rate limits, and bounded retries
 */

const { BaseSourceConnector } = require('./baseSourceConnector');
const {
    HUNTER_SOURCE_TYPES,
    HUNTER_CONFIG_STATUSES,
    HUNTER_HEALTH_STATUSES,
    HUNTER_ERROR_CODES
} = require('../hunterConstants');
const {
    validateUrlForOutboundRequest,
    resolveApprovedEndpoint
} = require('../security');

// Controlled Varanasi travel-intent query taxonomy (Prompt 9.5 Section 7)
const CONTROLLED_HUNTER_QUERIES = Object.freeze({
    LOCAL: [
        'Varanasi darshan planning',
        'Varanasi boat booking requirement',
        'Ganga Aarti visit planning',
        'Varanasi pandit requirement',
        'Varanasi local transport requirement',
        'Varanasi family sightseeing'
    ],
    OUTSIDE: [
        'planning Varanasi trip',
        'Varanasi itinerary next month',
        'Varanasi hotel + darshan',
        'Varanasi family trip',
        'Varanasi pilgrimage package',
        'Varanasi travel planning'
    ]
});

class SearchApiConnector extends BaseSourceConnector {
    /**
     * @param {Object} [options]
     */
    constructor(options = {}) {
        super({
            sourceId: options.sourceId || 'SRC_SEARCH_API',
            name: options.name || 'Web Search & Discovery API',
            sourceType: HUNTER_SOURCE_TYPES.SEARCH_API,
            provider: options.provider || 'SERP_API',
            enabled: options.enabled !== undefined ? options.enabled : false,
            maxPerHour: options.maxPerHour || 60,
            maxPerDay: options.maxPerDay || 500,
            timeoutMs: options.timeoutMs || 8000,
            maxRetries: options.maxRetries || 2,
            attribution: options.attribution || {
                partnerId: null,
                partnerName: null,
                defaultSource: 'AI_HUNTER'
            }
        });

        // Resolve endpoint strictly through Provider Allowlist (Prompt 9.5 Section 4)
        const customUrl = options.endpointUrl || process.env.HUNTER_SEARCH_API_URL || null;
        const resolution = resolveApprovedEndpoint(this.provider, customUrl);

        if (resolution.approved) {
            this.endpointUrl = resolution.endpointUrl;
            this.endpointApproved = true;
        } else {
            this.endpointUrl = null;
            this.endpointApproved = false;
            this.endpointRejectionReason = resolution.reason;
        }

        this._checkCredentials();
    }

    /**
     * Check if environment credentials exist (strictly on backend, never leaked)
     */
    _checkCredentials() {
        const apiKey = process.env.HUNTER_SEARCH_API_KEY || process.env.SERP_API_KEY;
        if (apiKey && String(apiKey).trim().length > 0) {
            this.credentialsConfigured = true;
            this.configurationStatus = this.endpointApproved ? HUNTER_CONFIG_STATUSES.READY : HUNTER_CONFIG_STATUSES.ERROR;
            this.healthStatus = this.endpointApproved ? HUNTER_HEALTH_STATUSES.HEALTHY : HUNTER_HEALTH_STATUSES.ERROR;
        } else {
            this.credentialsConfigured = false;
            this.configurationStatus = HUNTER_CONFIG_STATUSES.NOT_CONFIGURED;
            this.healthStatus = HUNTER_HEALTH_STATUSES.NOT_CONFIGURED;
        }
    }

    /**
     * Test source health with SSRF and allowlist guards
     */
    async healthCheck() {
        this._checkCredentials();
        const start = Date.now();
        this.lastCheckedAt = new Date();

        if (!this.credentialsConfigured) {
            this.healthStatus = HUNTER_HEALTH_STATUSES.NOT_CONFIGURED;
            return {
                healthy: false,
                status: this.healthStatus,
                configurationStatus: this.configurationStatus,
                responseTimeMs: 0,
                error: 'Credentials not configured on server (HUNTER_SEARCH_API_KEY missing)',
                lastCheckedAt: this.lastCheckedAt
            };
        }

        if (!this.endpointApproved || !this.endpointUrl) {
            this.healthStatus = HUNTER_HEALTH_STATUSES.ERROR;
            return {
                healthy: false,
                status: this.healthStatus,
                configurationStatus: HUNTER_CONFIG_STATUSES.ERROR,
                responseTimeMs: 0,
                error: this.endpointRejectionReason || 'Destination endpoint is not on the approved provider allowlist.',
                lastCheckedAt: this.lastCheckedAt
            };
        }

        // SSRF Pre-flight check (Prompt 9.5 Section 5)
        const ssrfCheck = await validateUrlForOutboundRequest(this.endpointUrl);
        if (!ssrfCheck.allowed) {
            this.healthStatus = HUNTER_HEALTH_STATUSES.ERROR;
            return {
                healthy: false,
                status: this.healthStatus,
                configurationStatus: HUNTER_CONFIG_STATUSES.ERROR,
                responseTimeMs: 0,
                error: `SSRF Blocked: ${ssrfCheck.reason}`,
                lastCheckedAt: this.lastCheckedAt
            };
        }

        try {
            await this._executeWithRetry(async () => {
                if (process.env.NODE_ENV === 'test' || !this.endpointUrl) {
                    return { ok: true };
                }

                const apiKey = process.env.HUNTER_SEARCH_API_KEY || process.env.SERP_API_KEY;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
                try {
                    let probeUrl = this.endpointUrl;
                    let probeOptions = {
                        method: 'HEAD',
                        signal: controller.signal
                    };

                    if (this.provider === 'SERP_API') {
                        const urlObj = new URL(this.endpointUrl);
                        urlObj.searchParams.set('engine', 'google');
                        urlObj.searchParams.set('q', 'Varanasi');
                        if (apiKey) urlObj.searchParams.set('api_key', apiKey);
                        urlObj.searchParams.set('num', '1');
                        probeUrl = urlObj.toString();
                        probeOptions = {
                            method: 'GET',
                            headers: { 'Accept': 'application/json' },
                            signal: controller.signal
                        };
                    }

                    const res = await fetch(probeUrl, probeOptions);
                    if (!res.ok) {
                        if (res.status === 401 || res.status === 403) {
                            this.configurationStatus = HUNTER_CONFIG_STATUSES.AUTH_FAILED;
                            throw new Error(`Authentication failed (HTTP ${res.status})`);
                        }
                        if (res.status !== 404) {
                            throw new Error(`HTTP ${res.status}`);
                        }
                    }

                    if (this.provider === 'SERP_API') {
                        try {
                            const data = await res.json();
                            if (data && data.error) {
                                const errStr = String(data.error).toLowerCase();
                                if (errStr.includes('api key') || errStr.includes('invalid') || errStr.includes('unauthorized')) {
                                    this.configurationStatus = HUNTER_CONFIG_STATUSES.AUTH_FAILED;
                                }
                                throw new Error(this.maskSensitiveData(String(data.error)));
                            }
                        } catch (parseErr) {
                            if (parseErr.message && !parseErr.message.includes('Unexpected token')) {
                                throw parseErr;
                            }
                        }
                    }
                } finally {
                    clearTimeout(timeoutId);
                }
            });

            this.healthStatus = HUNTER_HEALTH_STATUSES.HEALTHY;
            this.consecutiveFailures = 0;
            this.responseTimeMs = Date.now() - start;

            return {
                healthy: true,
                status: this.healthStatus,
                configurationStatus: this.configurationStatus,
                responseTimeMs: this.responseTimeMs,
                lastCheckedAt: this.lastCheckedAt
            };
        } catch (err) {
            this.consecutiveFailures += 1;
            this.healthStatus = this.consecutiveFailures > 3 ? HUNTER_HEALTH_STATUSES.ERROR : HUNTER_HEALTH_STATUSES.DEGRADED;
            this.lastErrorAt = new Date();
            // Ensure zero credential leakage in error text
            const sanitizedError = this.maskSensitiveData(err.message || 'Network error');
            this.lastErrorMessage = `Endpoint probe failed: ${sanitizedError}`;
            this.responseTimeMs = Date.now() - start;

            return {
                healthy: false,
                status: this.healthStatus,
                configurationStatus: this.configurationStatus,
                responseTimeMs: this.responseTimeMs,
                error: this.lastErrorMessage,
                lastCheckedAt: this.lastCheckedAt
            };
        }
    }

    /**
     * Fetch signals matching controlled query parameters
     * @param {Object} queryOptions
     * @returns {Promise<Array<Object>>}
     */
    async fetchSignals(queryOptions = {}) {
        this._checkCredentials();

        if (!this.credentialsConfigured) {
            throw {
                status: 400,
                errorCode: HUNTER_ERROR_CODES.NOT_CONFIGURED,
                message: `Source ${this.sourceId} is NOT_CONFIGURED. Set HUNTER_SEARCH_API_KEY on server to enable.`
            };
        }

        if (!this.endpointApproved || !this.endpointUrl) {
            throw {
                status: 400,
                errorCode: HUNTER_ERROR_CODES.SOURCE_NOT_ALLOWED,
                message: `Provider endpoint is not authorized: ${this.endpointRejectionReason || 'Not in allowlist'}`
            };
        }

        // SSRF validation before outbound call
        const ssrfCheck = await validateUrlForOutboundRequest(this.endpointUrl);
        if (!ssrfCheck.allowed) {
            throw {
                status: 400,
                errorCode: HUNTER_ERROR_CODES.SOURCE_NOT_ALLOWED,
                message: `SSRF Blocked: ${ssrfCheck.reason}`
            };
        }

        const rateLimit = this.getRateLimitStatus();
        if (rateLimit.isLimited) {
            this.healthStatus = HUNTER_HEALTH_STATUSES.RATE_LIMITED;
            throw {
                status: 429,
                errorCode: HUNTER_ERROR_CODES.RATE_LIMITED,
                message: `Rate limit reached for ${this.sourceId}. Hourly remaining: ${rateLimit.hourlyRemaining}`
            };
        }

        this._recordRequest();
        const start = Date.now();

        return this._executeWithRetry(async () => {
            try {
                const rawSignals = [];

                // Use controlled query design (Section 7)
                const mode = queryOptions.mode || 'ALL';
                let controlledKeywords = queryOptions.keywords;
                if (!controlledKeywords || !Array.isArray(controlledKeywords) || controlledKeywords.length === 0) {
                    if (mode === 'LOCAL') {
                        controlledKeywords = CONTROLLED_HUNTER_QUERIES.LOCAL.slice(0, 3);
                    } else if (mode === 'OUTSIDE') {
                        controlledKeywords = CONTROLLED_HUNTER_QUERIES.OUTSIDE.slice(0, 3);
                    } else {
                        controlledKeywords = [
                            CONTROLLED_HUNTER_QUERIES.LOCAL[0],
                            CONTROLLED_HUNTER_QUERIES.OUTSIDE[0],
                            CONTROLLED_HUNTER_QUERIES.OUTSIDE[2]
                        ];
                    }
                }

                const region = queryOptions.region || 'Varanasi';

                if (process.env.NODE_ENV === 'test' && queryOptions._testSignals) {
                    return queryOptions._testSignals;
                }

                // If live API endpoint configured and credentials exist
                const apiKey = process.env.HUNTER_SEARCH_API_KEY || process.env.SERP_API_KEY;
                if (this.endpointUrl && apiKey) {
                    let searchUrl = this.endpointUrl;
                    let fetchOptions = {};

                    if (this.provider === 'SERP_API') {
                        const urlObj = new URL(this.endpointUrl);
                        urlObj.searchParams.set('engine', 'google');
                        urlObj.searchParams.set('q', controlledKeywords.join(' OR '));
                        urlObj.searchParams.set('api_key', apiKey);
                        urlObj.searchParams.set('num', String(queryOptions.limit || 10));
                        urlObj.searchParams.set('hl', queryOptions.language || 'en');
                        urlObj.searchParams.set('gl', 'in');
                        searchUrl = urlObj.toString();
                        fetchOptions = {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json'
                            }
                        };
                    } else {
                        fetchOptions = {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${apiKey}`
                            },
                            body: JSON.stringify({
                                q: controlledKeywords.join(' OR '),
                                location: region,
                                limit: queryOptions.limit || 10
                            })
                        };
                    }

                    const searchRes = await fetch(searchUrl, fetchOptions);

                    if (!searchRes.ok) {
                        if (searchRes.status === 401 || searchRes.status === 403) {
                            this.configurationStatus = HUNTER_CONFIG_STATUSES.AUTH_FAILED;
                            this.healthStatus = HUNTER_HEALTH_STATUSES.ERROR;
                            throw {
                                status: 401,
                                errorCode: HUNTER_ERROR_CODES.AUTH_FAILED,
                                message: 'Search API authentication failed'
                            };
                        }
                        if (searchRes.status === 429) {
                            this.healthStatus = HUNTER_HEALTH_STATUSES.RATE_LIMITED;
                            throw {
                                status: 429,
                                errorCode: HUNTER_ERROR_CODES.RATE_LIMITED,
                                message: 'External Search API provider rate limit reached'
                            };
                        }
                        throw new Error(`Search provider returned HTTP ${searchRes.status}`);
                    }

                    const data = await searchRes.json();
                    if (data && data.error) {
                        const errStr = String(data.error).toLowerCase();
                        if (errStr.includes('api key') || errStr.includes('invalid') || errStr.includes('unauthorized')) {
                            this.configurationStatus = HUNTER_CONFIG_STATUSES.AUTH_FAILED;
                            this.healthStatus = HUNTER_HEALTH_STATUSES.ERROR;
                            throw {
                                status: 401,
                                errorCode: HUNTER_ERROR_CODES.AUTH_FAILED,
                                message: 'Search API authentication failed: invalid API key'
                            };
                        }
                        throw new Error(this.maskSensitiveData(String(data.error)));
                    }

                    const items = data.items || data.organic_results || [];

                    for (const item of items) {
                        rawSignals.push({
                            externalSignalId: String(item.id || item.link || item.title),
                            sourceId: this.sourceId,
                            sourceUrl: item.link || item.url || '',
                            sourceTitle: item.title || '',
                            sourceText: (item.snippet || item.description || item.title || '').substring(0, 250),
                            discoveredAt: new Date().toISOString(),
                            publishedAt: item.date || new Date().toISOString(),
                            authorType: 'public_search_user',
                            region,
                            inferredLocation: item.location || 'Varanasi',
                            language: queryOptions.language || 'en',
                            intentHints: [queryOptions.intentType || 'DISCOVERY'],
                            metadata: {
                                provider: this.provider,
                                rank: item.position || 0
                            }
                        });
                    }
                }

                this.lastSuccessfulRunAt = new Date();
                this.healthStatus = HUNTER_HEALTH_STATUSES.HEALTHY;
                this.consecutiveFailures = 0;
                this.responseTimeMs = Date.now() - start;

                return rawSignals;
            } catch (err) {
                this.lastErrorAt = new Date();
                const sanitizedMsg = this.maskSensitiveData(err.message || 'Run failed');
                this.lastErrorMessage = `Search execution error: ${sanitizedMsg}`;
                this.consecutiveFailures += 1;
                throw err;
            }
        });
    }
}

module.exports = {
    SearchApiConnector,
    CONTROLLED_HUNTER_QUERIES
};
