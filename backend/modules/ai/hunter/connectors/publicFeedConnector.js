/**
 * Public Feed & Syndication Signal Connector
 * Varanasi Yatra Platform — Prompt 9 & 9.5
 *
 * Ingests authorized public travel RSS, Atom, and JSON syndication feeds with:
 * - Strict SSRF validation and Provider Allowlist enforcement
 * - Resilient XML/JSON parsing (never crashes on malformed feeds)
 * - Evidence minimization (caps excerpts at 250 characters, zero HTML blobs stored)
 * - Sliding rate limits, timeout protection, and bounded backoff
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

class PublicFeedConnector extends BaseSourceConnector {
    /**
     * @param {Object} [options]
     */
    constructor(options = {}) {
        super({
            sourceId: options.sourceId || 'SRC_PUBLIC_FEED',
            name: options.name || 'Public Travel & Pilgrimage Feeds',
            sourceType: HUNTER_SOURCE_TYPES.PUBLIC_FEED,
            provider: options.provider || 'UP_TOURISM_FEED',
            enabled: options.enabled !== undefined ? options.enabled : false,
            maxPerHour: options.maxPerHour || 30,
            maxPerDay: options.maxPerDay || 300,
            timeoutMs: options.timeoutMs || 5000,
            maxRetries: options.maxRetries || 2,
            attribution: options.attribution || {
                partnerId: null,
                partnerName: null,
                defaultSource: 'AI_HUNTER'
            }
        });

        // Resolve endpoint strictly through Provider Allowlist (Prompt 9.5 Section 4)
        const customUrl = options.feedUrl || process.env.HUNTER_PUBLIC_FEED_URL || null;
        if (customUrl) {
            const resolution = resolveApprovedEndpoint(this.provider, customUrl);
            if (resolution.approved) {
                this.feedUrl = resolution.endpointUrl;
                this.endpointApproved = true;
            } else {
                this.feedUrl = null;
                this.endpointApproved = false;
                this.endpointRejectionReason = resolution.reason;
            }
        } else {
            this.feedUrl = null;
            this.endpointApproved = false;
            this.endpointRejectionReason = 'No feed URL configured';
        }

        this._checkConfiguration();
    }

    _checkConfiguration() {
        if (this.feedUrl && String(this.feedUrl).trim().length > 0 && this.endpointApproved) {
            this.credentialsConfigured = true; // URL configured and approved
            this.configurationStatus = HUNTER_CONFIG_STATUSES.READY;
            this.healthStatus = HUNTER_HEALTH_STATUSES.HEALTHY;
        } else {
            this.credentialsConfigured = false;
            this.configurationStatus = this.endpointRejectionReason?.includes('allowlist')
                ? HUNTER_CONFIG_STATUSES.ERROR
                : HUNTER_CONFIG_STATUSES.NOT_CONFIGURED;
            this.healthStatus = this.configurationStatus === HUNTER_CONFIG_STATUSES.ERROR
                ? HUNTER_HEALTH_STATUSES.ERROR
                : HUNTER_HEALTH_STATUSES.NOT_CONFIGURED;
        }
    }

    /**
     * Health check verifying feed accessibility with SSRF defense
     */
    async healthCheck() {
        this._checkConfiguration();
        const start = Date.now();
        this.lastCheckedAt = new Date();

        if (!this.credentialsConfigured || !this.feedUrl) {
            this.healthStatus = this.configurationStatus === HUNTER_CONFIG_STATUSES.ERROR
                ? HUNTER_HEALTH_STATUSES.ERROR
                : HUNTER_HEALTH_STATUSES.NOT_CONFIGURED;
            return {
                healthy: false,
                status: this.healthStatus,
                configurationStatus: this.configurationStatus,
                responseTimeMs: 0,
                error: this.endpointRejectionReason || 'Public feed URL not configured (HUNTER_PUBLIC_FEED_URL missing)',
                lastCheckedAt: this.lastCheckedAt
            };
        }

        // SSRF Pre-flight check (Prompt 9.5 Section 5)
        const ssrfCheck = await validateUrlForOutboundRequest(this.feedUrl);
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
                if (process.env.NODE_ENV === 'test' && !this.feedUrl.startsWith('http')) {
                    return { ok: true };
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
                try {
                    const res = await fetch(this.feedUrl, {
                        method: 'HEAD',
                        signal: controller.signal
                    });
                    if (!res.ok && res.status !== 405) {
                        throw new Error(`Feed server returned HTTP ${res.status}`);
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
            const sanitizedMsg = (err.message || 'Probe failed').replace(/[a-zA-Z0-9_-]{24,}/g, '[REDACTED_SECRET]');
            this.lastErrorMessage = `Feed probe failed: ${sanitizedMsg}`;
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
     * Resilient parser handling JSON, RSS 2.0 XML, or Atom feeds without crashing.
     * Enforces evidence minimization (Section 9): caps excerpt to 250 chars, strips HTML.
     */
    _parseFeedContent(rawContent) {
        if (!rawContent || typeof rawContent !== 'string') return [];

        const items = [];
        const seenUrls = new Set();

        const cleanTag = (str) => String(str || '')
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 250);

        // 1. Try JSON parsing
        if (rawContent.trim().startsWith('{') || rawContent.trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(rawContent);
                const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || parsed.articles || parsed.data || []);

                for (const item of rawItems) {
                    const id = item.id || item.guid || item.url || item.link;
                    const link = item.url || item.link || this.feedUrl;
                    if (!id || seenUrls.has(link)) continue;
                    seenUrls.add(link);

                    items.push({
                        id: String(id),
                        title: cleanTag(item.title || item.headline || 'Travel Signal'),
                        content: cleanTag(item.content || item.summary || item.description || item.text || item.title),
                        link: String(link),
                        publishedAt: item.publishedAt || item.published_at || item.date || new Date().toISOString()
                    });
                }
                return items;
            } catch {
                // If JSON parse failed, fall through to XML regex parsing
            }
        }

        // 2. XML / RSS / Atom parsing using resilient regex extraction
        const itemMatches = rawContent.match(/<item[\s\S]*?<\/item>/gi) || [];
        for (const itemXml of itemMatches) {
            try {
                const titleMatch = itemXml.match(/<title(?:[^>]*)>([\s\S]*?)<\/title>/i);
                const linkMatch = itemXml.match(/<link(?:[^>]*)>([\s\S]*?)<\/link>/i);
                const descMatch = itemXml.match(/<description(?:[^>]*)>([\s\S]*?)<\/description>/i) ||
                                  itemXml.match(/<content:encoded(?:[^>]*)>([\s\S]*?)<\/content:encoded>/i);
                const dateMatch = itemXml.match(/<pubDate(?:[^>]*)>([\s\S]*?)<\/pubDate>/i);
                const guidMatch = itemXml.match(/<guid(?:[^>]*)>([\s\S]*?)<\/guid>/i);

                const title = cleanTag(titleMatch?.[1]);
                const link = cleanTag(linkMatch?.[1]);
                const content = cleanTag(descMatch?.[1]);
                const date = dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
                const guid = cleanTag(guidMatch?.[1]) || link || title;

                if (!guid || seenUrls.has(guid)) continue;
                seenUrls.add(guid);

                items.push({
                    id: guid,
                    title,
                    content: content || title,
                    link: link || this.feedUrl,
                    publishedAt: date
                });
            } catch {
                // Skip individually corrupt item without crashing
            }
        }

        // Atom <entry> tags if no RSS items found
        if (items.length === 0) {
            const entryMatches = rawContent.match(/<entry[\s\S]*?<\/entry>/gi) || [];
            for (const entryXml of entryMatches) {
                try {
                    const titleMatch = entryXml.match(/<title(?:[^>]*)>([\s\S]*?)<\/title>/i);
                    const linkMatch = entryXml.match(/<link[^>]+href=["']([^"']+)["']/i);
                    const sumMatch = entryXml.match(/<summary(?:[^>]*)>([\s\S]*?)<\/summary>/i) ||
                                     entryXml.match(/<content(?:[^>]*)>([\s\S]*?)<\/content>/i);
                    const updateMatch = entryXml.match(/<updated(?:[^>]*)>([\s\S]*?)<\/updated>/i);
                    const idMatch = entryXml.match(/<id(?:[^>]*)>([\s\S]*?)<\/id>/i);

                    const title = cleanTag(titleMatch?.[1]);
                    const link = cleanTag(linkMatch?.[1]);
                    const content = cleanTag(sumMatch?.[1]);
                    const guid = cleanTag(idMatch?.[1]) || link || title;

                    if (!guid || seenUrls.has(guid)) continue;
                    seenUrls.add(guid);

                    items.push({
                        id: guid,
                        title,
                        content: content || title,
                        link: link || this.feedUrl,
                        publishedAt: updateMatch?.[1] ? new Date(updateMatch[1]).toISOString() : new Date().toISOString()
                    });
                } catch {
                    // Skip corrupt entry
                }
            }
        }

        return items;
    }

    /**
     * Fetch feed content and convert to raw candidate signals
     */
    async fetchSignals(queryOptions = {}) {
        this._checkConfiguration();

        if (!this.credentialsConfigured || !this.feedUrl) {
            throw {
                status: 400,
                errorCode: HUNTER_ERROR_CODES.NOT_CONFIGURED,
                message: `Source ${this.sourceId} is NOT_CONFIGURED. Set feed URL on server.`
            };
        }

        if (!this.endpointApproved) {
            throw {
                status: 400,
                errorCode: HUNTER_ERROR_CODES.SOURCE_NOT_ALLOWED,
                message: `Feed endpoint is not authorized: ${this.endpointRejectionReason || 'Not in allowlist'}`
            };
        }

        // SSRF validation before outbound call
        const ssrfCheck = await validateUrlForOutboundRequest(this.feedUrl);
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
                message: `Rate limit reached for ${this.sourceId}`
            };
        }

        this._recordRequest();
        const start = Date.now();

        return this._executeWithRetry(async () => {
            try {
                let feedText = '';

                if (queryOptions._rawContent) {
                    feedText = queryOptions._rawContent;
                } else if (process.env.NODE_ENV === 'test' && !this.feedUrl.startsWith('http')) {
                    feedText = `<rss><channel><item><title>Varanasi Tour</title><link>http://example.com/1</link><description>Planning boat ride</description></item></channel></rss>`;
                } else {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
                    try {
                        const res = await fetch(this.feedUrl, {
                            signal: controller.signal,
                            headers: {
                                'User-Agent': 'VaranasiYatraHunter/1.0 (+https://banarasyatra.com/bot; public-syndication-reader)'
                            }
                        });
                        if (!res.ok) {
                            throw new Error(`Feed fetch returned HTTP ${res.status}`);
                        }
                        feedText = await res.text();
                    } finally {
                        clearTimeout(timeoutId);
                    }
                }

                const parsedItems = this._parseFeedContent(feedText);
                const candidateSignals = [];

                for (const item of parsedItems) {
                    // Minimal evidence preservation (Section 9)
                    candidateSignals.push({
                        externalSignalId: String(item.id),
                        sourceId: this.sourceId,
                        sourceUrl: item.link,
                        sourceTitle: item.title,
                        sourceText: `${item.title}. ${item.content}`.trim().substring(0, 250),
                        discoveredAt: new Date().toISOString(),
                        publishedAt: item.publishedAt,
                        authorType: 'public_feed_author',
                        region: 'Varanasi',
                        inferredLocation: 'Varanasi',
                        language: 'en',
                        intentHints: ['PUBLIC_FEED'],
                        metadata: {
                            feedUrl: this.feedUrl,
                            provider: this.provider
                        }
                    });
                }

                this.lastSuccessfulRunAt = new Date();
                this.healthStatus = HUNTER_HEALTH_STATUSES.HEALTHY;
                this.consecutiveFailures = 0;
                this.responseTimeMs = Date.now() - start;

                const limit = queryOptions.limit || candidateSignals.length;
                return candidateSignals.slice(0, limit);
            } catch (err) {
                this.lastErrorAt = new Date();
                const sanitizedMsg = (err.message || 'Processing failed').replace(/[a-zA-Z0-9_-]{24,}/g, '[REDACTED_SECRET]');
                this.lastErrorMessage = `Feed processing error: ${sanitizedMsg}`;
                this.consecutiveFailures += 1;
                this.healthStatus = HUNTER_HEALTH_STATUSES.DEGRADED;
                throw err;
            }
        });
    }
}

module.exports = {
    PublicFeedConnector
};
