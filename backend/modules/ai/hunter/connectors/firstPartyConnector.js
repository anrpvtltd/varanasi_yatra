/**
 * First-Party Interaction Signal Connector
 * Varanasi Yatra Platform — Prompt 9
 *
 * Ingests first-party signals (e.g. uncompleted website interactions, Area QR traveler assists).
 * Connects directly to internal application state safely.
 */

const { BaseSourceConnector } = require('./baseSourceConnector');
const {
    HUNTER_SOURCE_TYPES,
    HUNTER_CONFIG_STATUSES,
    HUNTER_HEALTH_STATUSES,
    HUNTER_ERROR_CODES
} = require('../hunterConstants');

class FirstPartyConnector extends BaseSourceConnector {
    /**
     * @param {Object} [options]
     */
    constructor(options = {}) {
        super({
            sourceId: options.sourceId || 'SRC_FIRST_PARTY',
            name: options.name || 'First-Party Traveler Inquiries',
            sourceType: HUNTER_SOURCE_TYPES.FIRST_PARTY_SIGNAL,
            provider: 'internal_platform',
            enabled: options.enabled !== undefined ? options.enabled : true,
            maxPerHour: options.maxPerHour || 300,
            maxPerDay: options.maxPerDay || 3000,
            timeoutMs: options.timeoutMs || 2000,
            maxRetries: options.maxRetries || 1,
            attribution: options.attribution || {
                partnerId: null,
                partnerName: null,
                defaultSource: 'WEBSITE'
            }
        });

        // First-party is internal, so always configured unless disabled
        this.credentialsConfigured = true;
        this.configurationStatus = HUNTER_CONFIG_STATUSES.READY;
        this.healthStatus = HUNTER_HEALTH_STATUSES.HEALTHY;
    }

    /**
     * Health check for internal first-party signal pipeline
     */
    async healthCheck() {
        const start = Date.now();
        this.lastCheckedAt = new Date();
        this.healthStatus = this.enabled ? HUNTER_HEALTH_STATUSES.HEALTHY : HUNTER_HEALTH_STATUSES.DISABLED;
        this.responseTimeMs = Date.now() - start;

        return {
            healthy: this.healthStatus === HUNTER_HEALTH_STATUSES.HEALTHY,
            status: this.healthStatus,
            configurationStatus: this.configurationStatus,
            responseTimeMs: this.responseTimeMs,
            lastCheckedAt: this.lastCheckedAt
        };
    }

    /**
     * Fetch unbooked or early-intent first party signals
     */
    async fetchSignals(queryOptions = {}) {
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
            const rawSignals = queryOptions.signals || [];
            const candidateSignals = [];

            for (const item of rawSignals) {
                const extId = item.id || `FP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                candidateSignals.push({
                    externalSignalId: String(extId),
                    sourceId: this.sourceId,
                    sourceUrl: item.pageUrl || 'https://banarasyatra.com/plan',
                    sourceTitle: item.title || 'Inbound Traveler Request',
                    sourceText: String(item.text || item.message || '').trim(),
                    discoveredAt: new Date().toISOString(),
                    publishedAt: item.timestamp || new Date().toISOString(),
                    authorType: 'first_party_traveler',
                    region: item.region || 'Varanasi',
                    inferredLocation: item.location || 'Varanasi',
                    language: item.language || 'en',
                    intentHints: ['FIRST_PARTY', item.intentHint || 'INQUIRY'],
                    metadata: {
                        sessionId: item.sessionId || null,
                        referrer: item.referrer || 'direct'
                    }
                });
            }

            this.lastSuccessfulRunAt = new Date();
            this.healthStatus = HUNTER_HEALTH_STATUSES.HEALTHY;
            this.consecutiveFailures = 0;
            this.responseTimeMs = Date.now() - start;

            return candidateSignals;
        });
    }
}

module.exports = {
    FirstPartyConnector
};
