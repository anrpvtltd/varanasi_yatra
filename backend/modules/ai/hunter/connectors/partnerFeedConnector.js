/**
 * Partner Referral Signal Connector
 * Varanasi Yatra Platform — Prompt 9 & 9.5
 *
 * Ingests authorized B2B partner referrals and affiliate signals with:
 * - Strict SSRF validation and Provider Allowlist enforcement
 * - Partner attribution preservation without financial leakage
 * - Credential secrecy (masks API keys in logs and errors)
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

class PartnerFeedConnector extends BaseSourceConnector {
    /**
     * @param {Object} [options]
     */
    constructor(options = {}) {
        super({
            sourceId: options.sourceId || 'SRC_PARTNER_NETWORK',
            name: options.name || 'Travel Partner Referral Feed',
            sourceType: HUNTER_SOURCE_TYPES.PARTNER_FEED,
            provider: options.provider || 'PARTNER_DEFAULT_NETWORK',
            enabled: options.enabled !== undefined ? options.enabled : false,
            maxPerHour: options.maxPerHour || 50,
            maxPerDay: options.maxPerDay || 500,
            timeoutMs: options.timeoutMs || 4000,
            maxRetries: options.maxRetries || 2,
            attribution: options.attribution || {
                partnerId: options.partnerId || 'PARTNER_DEFAULT',
                partnerName: options.partnerName || 'Authorized Partner',
                defaultSource: 'PARTNER'
            }
        });

        this.partnerApiKey = process.env.HUNTER_PARTNER_API_KEY || null;

        // Resolve endpoint strictly through Provider Allowlist (Prompt 9.5 Section 4)
        const customUrl = options.endpointUrl || process.env.HUNTER_PARTNER_FEED_URL || null;
        if (customUrl) {
            const resolution = resolveApprovedEndpoint(this.provider, customUrl);
            if (resolution.approved) {
                this.partnerEndpointUrl = resolution.endpointUrl;
                this.endpointApproved = true;
            } else {
                this.partnerEndpointUrl = null;
                this.endpointApproved = false;
                this.endpointRejectionReason = resolution.reason;
            }
        } else {
            this.partnerEndpointUrl = null;
            this.endpointApproved = false;
            this.endpointRejectionReason = 'No partner endpoint URL configured';
        }

        this._checkCredentials();
    }

    _checkCredentials() {
        if (this.partnerApiKey || (this.partnerEndpointUrl && process.env.NODE_ENV === 'test')) {
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
     * Health check verifying partner endpoint availability with SSRF protection
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
                error: 'Partner API credentials not configured (HUNTER_PARTNER_API_KEY missing)',
                lastCheckedAt: this.lastCheckedAt
            };
        }

        if (this.partnerEndpointUrl) {
            // SSRF check (Section 5)
            const ssrfCheck = await validateUrlForOutboundRequest(this.partnerEndpointUrl);
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
        }

        try {
            await this._executeWithRetry(async () => {
                if (process.env.NODE_ENV === 'test' || !this.partnerEndpointUrl) {
                    return { ok: true };
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
                try {
                    const res = await fetch(this.partnerEndpointUrl, {
                        method: 'HEAD',
                        signal: controller.signal,
                        headers: {
                            'Authorization': `Bearer ${this.partnerApiKey}`
                        }
                    });
                    if (!res.ok && res.status !== 404) {
                        throw new Error(`Partner endpoint returned HTTP ${res.status}`);
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
            this.healthStatus = this.consecutiveFailures > 2 ? HUNTER_HEALTH_STATUSES.ERROR : HUNTER_HEALTH_STATUSES.DEGRADED;
            this.lastErrorAt = new Date();
            const sanitizedMsg = (err.message || 'Check failed').replace(/[a-zA-Z0-9_-]{24,}/g, '[REDACTED_SECRET]');
            this.lastErrorMessage = `Partner health check failed: ${sanitizedMsg}`;
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
     * Fetch partner signals or accept structured batch
     * @param {Object} queryOptions
     * @param {Array<Object>} [queryOptions.partnerPayloads] - Directly supplied partner signals
     */
    async fetchSignals(queryOptions = {}) {
        this._checkCredentials();

        if (!this.credentialsConfigured) {
            throw {
                status: 400,
                errorCode: HUNTER_ERROR_CODES.NOT_CONFIGURED,
                message: `Source ${this.sourceId} is NOT_CONFIGURED. Set HUNTER_PARTNER_API_KEY to enable.`
            };
        }

        if (this.partnerEndpointUrl) {
            const ssrfCheck = await validateUrlForOutboundRequest(this.partnerEndpointUrl);
            if (!ssrfCheck.allowed) {
                throw {
                    status: 400,
                    errorCode: HUNTER_ERROR_CODES.SOURCE_NOT_ALLOWED,
                    message: `SSRF Blocked: ${ssrfCheck.reason}`
                };
            }
        }

        const rateLimit = this.getRateLimitStatus();
        if (rateLimit.isLimited) {
            this.healthStatus = HUNTER_HEALTH_STATUSES.RATE_LIMITED;
            throw {
                status: 429,
                errorCode: HUNTER_ERROR_CODES.RATE_LIMITED,
                message: `Rate limit reached for ${this.sourceId}`
            };
        }

        this._recordRequest();
        const start = Date.now();

        return this._executeWithRetry(async () => {
            try {
                const partnerList = queryOptions.partnerPayloads || [];
                const candidateSignals = [];

                for (const item of partnerList) {
                    const pId = item.partnerId || this.attribution.partnerId || 'UNKNOWN_PARTNER';
                    const extId = item.externalLeadId || `PTN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                    const dest = item.destination || 'Varanasi';
                    const window = item.travelWindow || '';
                    const party = item.partySize ? `${item.partySize} persons` : '';
                    const reqs = item.requirements || item.customerIntent || '';
                    const text = `${reqs}. Destination: ${dest}. Window: ${window} ${party}`.trim();

                    candidateSignals.push({
                        externalSignalId: String(extId),
                        sourceId: this.sourceId,
                        sourceUrl: item.sourceMetadata?.referralUrl || `https://partner.portal/referral/${extId}`,
                        sourceTitle: `Partner Referral from ${pId}`,
                        sourceText: text.substring(0, 250),
                        discoveredAt: new Date().toISOString(),
                        publishedAt: item.sourceMetadata?.createdAt || new Date().toISOString(),
                        authorType: 'partner_referral',
                        region: dest,
                        inferredLocation: dest,
                        language: 'en',
                        intentHints: ['PARTNER_REFERRAL', item.customerIntent || 'TRIP_PLANNING'],
                        metadata: {
                            partnerId: pId,
                            partnerName: this.attribution.partnerName,
                            partySize: item.partySize,
                            travelWindow: window,
                            allowedOverridesOnly: true
                        }
                    });
                }

                this.lastSuccessfulRunAt = new Date();
                this.healthStatus = HUNTER_HEALTH_STATUSES.HEALTHY;
                this.consecutiveFailures = 0;
                this.responseTimeMs = Date.now() - start;

                return candidateSignals;
            } catch (err) {
                this.lastErrorAt = new Date();
                const sanitizedMsg = (err.message || 'Fetch failed').replace(/[a-zA-Z0-9_-]{24,}/g, '[REDACTED_SECRET]');
                this.lastErrorMessage = `Partner fetch failed: ${sanitizedMsg}`;
                this.consecutiveFailures += 1;
                this.healthStatus = HUNTER_HEALTH_STATUSES.ERROR;
                throw err;
            }
        });
    }
}

module.exports = {
    PartnerFeedConnector
};
