/**
 * Base Signal Source Connector Interface
 * Varanasi Yatra Platform — Prompt 9
 *
 * Implements common interface contract, rate limiting, timeout handling,
 * and retry with exponential backoff for all Hunter data connectors.
 */

const {
    HUNTER_SOURCE_TYPES,
    HUNTER_CONFIG_STATUSES,
    HUNTER_HEALTH_STATUSES,
    HUNTER_ERROR_CODES
} = require('../hunterConstants');

class BaseSourceConnector {
    /**
     * @param {Object} options
     * @param {string} options.sourceId - Unique source identifier
     * @param {string} options.name - Human-readable connector name
     * @param {string} options.sourceType - Canonical source type (e.g. SEARCH_API, PUBLIC_FEED)
     * @param {string} [options.provider] - Provider name/vendor
     * @param {boolean} [options.enabled] - Whether connector is active
     * @param {number} [options.maxPerHour] - Rate limit per hour
     * @param {number} [options.maxPerDay] - Rate limit per day
     * @param {number} [options.timeoutMs] - Request timeout in milliseconds
     * @param {number} [options.maxRetries] - Maximum retry attempts on failure
     */
    constructor(options = {}) {
        if (!options.sourceId) throw new Error('sourceId is required for BaseSourceConnector');
        if (!options.sourceType) throw new Error('sourceType is required for BaseSourceConnector');

        this.sourceId = options.sourceId;
        this.name = options.name || options.sourceId;
        this.sourceName = this.name;
        this.sourceType = options.sourceType;
        this.provider = options.provider || 'internal';
        this.enabled = Boolean(options.enabled);
        this.environment = process.env.NODE_ENV || 'development';

        // Rate limiting parameters (Section 19)
        this.maxPerHour = options.maxPerHour || 100;
        this.maxPerDay = options.maxPerDay || 1000;
        this.timeoutMs = options.timeoutMs || 5000;
        this.maxRetries = Math.min(options.maxRetries !== undefined ? options.maxRetries : 2, 2);

        // Rate limit sliding windows
        this._hourWindowStart = Date.now();
        this._dayWindowStart = Date.now();
        this._requestsThisHour = 0;
        this._requestsToday = 0;

        // Health and Status Tracking (Section 2 & 18)
        this.configurationStatus = HUNTER_CONFIG_STATUSES.NOT_CONFIGURED;
        this.healthStatus = HUNTER_HEALTH_STATUSES.NOT_CONFIGURED;
        this.credentialsConfigured = false;
        this.lastCheckedAt = null;
        this.lastSuccessfulRunAt = null;
        this.lastErrorAt = null;
        this.lastErrorMessage = '';
        this.consecutiveFailures = 0;
        this.responseTimeMs = 0;
        this.signalsCount = 0;
        this.qualifiedCount = 0;
        this.opportunitiesCount = 0;
        this.conversionsCount = 0;

        // Attribution
        this.attribution = options.attribution || {
            partnerId: null,
            partnerName: null,
            defaultSource: 'AI_HUNTER'
        };
    }

    /**
     * Resets rate limit window counters when elapsed
     */
    _refreshRateLimitWindows() {
        const now = Date.now();
        if (now - this._hourWindowStart >= 3600000) {
            this._hourWindowStart = now;
            this._requestsThisHour = 0;
        }
        if (now - this._dayWindowStart >= 86400000) {
            this._dayWindowStart = now;
            this._requestsToday = 0;
        }
    }

    /**
     * Checks if a request is allowed by current rate limits
     */
    getRateLimitStatus() {
        this._refreshRateLimitWindows();
        const hourlyRemaining = Math.max(0, this.maxPerHour - this._requestsThisHour);
        const dailyRemaining = Math.max(0, this.maxPerDay - this._requestsToday);
        const isLimited = hourlyRemaining <= 0 || dailyRemaining <= 0;

        return {
            isLimited,
            requestsThisHour: this._requestsThisHour,
            maxPerHour: this.maxPerHour,
            hourlyRemaining,
            requestsToday: this._requestsToday,
            maxPerDay: this.maxPerDay,
            dailyRemaining
        };
    }

    /**
     * Increments request counters
     */
    _recordRequest() {
        this._refreshRateLimitWindows();
        this._requestsThisHour += 1;
        this._requestsToday += 1;
    }

    /**
     * Executes async operation with timeout and bounded exponential backoff
     */
    async _executeWithRetry(operationFn) {
        let lastError = null;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            if (attempt > 0) {
                const backoffMs = Math.min(100 * Math.pow(2, attempt), 1000);
                await new Promise((res) => setTimeout(res, backoffMs));
            }

            try {
                const timeoutPromise = new Promise((_, reject) => {
                    const timer = setTimeout(() => {
                        const timeoutErr = new Error(`Operation timed out after ${this.timeoutMs}ms`);
                        timeoutErr.errorCode = HUNTER_ERROR_CODES.TIMEOUT;
                        reject(timeoutErr);
                    }, this.timeoutMs);
                    if (timer && timer.unref) timer.unref();
                });
                return await Promise.race([operationFn(), timeoutPromise]);
            } catch (err) {
                lastError = err;
                if (err.status === 401 || err.status === 403 || err.errorCode === 'SSRF_BLOCKED' || err.errorCode === HUNTER_ERROR_CODES.TIMEOUT) {
                    this.healthStatus = HUNTER_HEALTH_STATUSES.ERROR;
                    break;
                }
            }
        }
        throw lastError;
    }

    /**
     * Sanitizes strings (e.g. error messages, URLs) to redact secrets, tokens, API keys
     */
    maskSensitiveData(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .replace(/(api_key|apikey|key|secret|token|password)=([^&\s]+)/gi, '$1=***')
            .replace(/[a-zA-Z0-9_-]{24,}/g, '[REDACTED_SECRET]');
    }

    _maskSensitiveString(str) {
        return this.maskSensitiveData(str);
    }

    /**
     * Returns sanitized connector metadata (Strictly NO credentials)
     */
    getMetadata() {
        const rateLimits = this.getRateLimitStatus();
        let sourceMode = 'NOT_CONFIGURED';
        if (this.sourceType === HUNTER_SOURCE_TYPES.MOCK) {
            sourceMode = 'MOCK';
        } else if (
            this.credentialsConfigured &&
            this.configurationStatus === HUNTER_CONFIG_STATUSES.READY &&
            this.healthStatus === HUNTER_HEALTH_STATUSES.HEALTHY &&
            Boolean(this.lastSuccessfulRunAt)
        ) {
            sourceMode = 'REAL';
        } else {
            sourceMode = 'NOT_CONFIGURED';
        }

        return {
            sourceId: this.sourceId,
            name: this.name,
            sourceName: this.name,
            provider: this.provider,
            sourceType: this.sourceType,
            sourceMode,
            enabled: this.enabled,
            environment: this.environment,
            configurationStatus: this.configurationStatus,
            healthStatus: this.healthStatus,
            credentialsConfigured: this.credentialsConfigured,
            lastCheckedAt: this.lastCheckedAt,
            lastSuccessfulRunAt: this.lastSuccessfulRunAt,
            lastErrorAt: this.lastErrorAt,
            lastErrorMessage: this.lastErrorMessage,
            consecutiveFailures: this.consecutiveFailures,
            responseTimeMs: this.responseTimeMs,
            requestsToday: this._requestsToday,
            requestsThisHour: this._requestsThisHour,
            rateLimit: {
                maxPerHour: this.maxPerHour,
                maxPerDay: this.maxPerDay,
                currentWindowRequests: this._requestsThisHour,
                hourlyRemaining: rateLimits.hourlyRemaining,
                dailyRemaining: rateLimits.dailyRemaining
            },
            attribution: this.attribution,
            signalsCount: this.signalsCount,
            qualifiedCount: this.qualifiedCount,
            opportunitiesCount: this.opportunitiesCount,
            conversionsCount: this.conversionsCount
        };
    }

    /**
     * Returns configuration readiness status
     */
    getConfigurationStatus() {
        return this.configurationStatus;
    }

    /**
     * Healthcheck method to be implemented by child classes
     */
    async healthCheck() {
        return {
            healthy: this.healthStatus === HUNTER_HEALTH_STATUSES.HEALTHY,
            status: this.healthStatus,
            configurationStatus: this.configurationStatus,
            responseTimeMs: this.responseTimeMs,
            lastCheckedAt: new Date()
        };
    }

    /**
     * Fetch raw signals method to be implemented by child classes
     * @param {Object} [queryOptions]
     * @returns {Promise<Array<Object>>}
     */
    async fetchSignals(_queryOptions = {}) {
        throw new Error(`fetchSignals() not implemented in ${this.constructor.name}`);
    }

    /**
     * Canonical signal normalization
     */
    normalizeSignal(rawSignal) {
        const { normalizeSignal } = require('../hunterService');
        return normalizeSignal(rawSignal, this.sourceId, this.sourceType);
    }
}

module.exports = {
    BaseSourceConnector
};
