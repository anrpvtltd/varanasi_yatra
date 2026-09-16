/**
 * Hunter Source Registry & Orchestrator
 * Varanasi Yatra Platform — Prompt 9
 *
 * Manages provider connectors, lifecycle states, database synchronization,
 * health checks, rate limiting, and isolated execution runs.
 */

const crypto = require('crypto');
const {
    MockConnector,
    SearchApiConnector,
    PublicFeedConnector,
    PartnerFeedConnector,
    FirstPartyConnector
} = require('./connectors');

const {
    HUNTER_CONFIG_STATUSES,
    HUNTER_HEALTH_STATUSES,
    HUNTER_ERROR_CODES,
    HUNTER_RUN_STATUSES,
    HUNTER_OPPORTUNITY_STATUSES,
    HUNTER_SIGNAL_STATUSES
} = require('./hunterConstants');
const { classifySignalRelevance } = require('./security');

class SourceRegistry {
    constructor() {
        /** @type {Map<string, import('./connectors/baseSourceConnector').BaseSourceConnector>} */
        this.connectors = new Map();
        /** @type {Map<string, Object>} */
        this._runCache = new Map();
        this._initDefaultConnectors();
    }

    /**
     * Initializes default platform connectors
     */
    _initDefaultConnectors() {
        const defaultMock = new MockConnector({
            sourceId: 'SRC_MOCK_DEV',
            name: 'Mock Testing Signals',
            enabled: true
        });

        const defaultSearch = new SearchApiConnector({
            sourceId: 'SRC_SEARCH_API',
            name: 'Web Search & Discovery API',
            enabled: false
        });

        const defaultFeed = new PublicFeedConnector({
            sourceId: 'SRC_PUBLIC_FEED',
            name: 'Public Travel & Pilgrimage Feeds',
            enabled: false
        });

        const defaultPartner = new PartnerFeedConnector({
            sourceId: 'SRC_PARTNER_NETWORK',
            name: 'Authorized B2B Partner Feed',
            enabled: false
        });

        const defaultFirstParty = new FirstPartyConnector({
            sourceId: 'SRC_FIRST_PARTY',
            name: 'First-Party Direct Inquiries',
            enabled: false
        });

        this.registerConnector(defaultMock);
        this.registerConnector(defaultSearch);
        this.registerConnector(defaultFeed);
        this.registerConnector(defaultPartner);
        this.registerConnector(defaultFirstParty);
    }

    /**
     * Register a new or custom connector instance
     */
    registerConnector(connector) {
        if (!connector || !connector.sourceId) {
            throw new Error('Invalid connector provided to SourceRegistry');
        }
        this.connectors.set(connector.sourceId, connector);
    }

    /**
     * Get connector by sourceId
     */
    getConnector(sourceId) {
        return this.connectors.get(sourceId) || null;
    }

    /**
     * List all registered connectors
     */
    getAllConnectors() {
        return Array.from(this.connectors.values());
    }

    /**
     * Synchronize connector statuses with MongoDB HunterSource documents
     */
    async syncWithDatabase(HunterSource) {
        if (!HunterSource) return;

        for (const connector of this.connectors.values()) {
            try {
                let doc = await HunterSource.findOne({ sourceId: connector.sourceId });
                if (!doc) {
                    // Create initial database record for connector
                    doc = new HunterSource({
                        sourceId: connector.sourceId,
                        name: connector.sourceName || connector.sourceId,   // name is required by schema
                        sourceName: connector.sourceName,
                        sourceType: connector.sourceType,
                        provider: connector.provider,
                        enabled: connector.enabled,
                        environment: connector.environment,
                        configurationStatus: connector.configurationStatus,
                        healthStatus: connector.healthStatus,
                        credentialsConfigured: connector.credentialsConfigured,
                        maxPerHour: connector.maxPerHour,
                        maxPerDay: connector.maxPerDay,
                        attribution: connector.attribution
                    });
                    await doc.save();
                } else {
                    // Load database configured properties into connector
                    connector.enabled = doc.enabled;
                    connector.sourceName = doc.sourceName || connector.sourceName;
                    connector.name = connector.sourceName;
                    if (doc.rateLimit) {
                        connector.maxPerHour = doc.rateLimit.maxPerHour || connector.maxPerHour;
                        connector.maxPerDay = doc.rateLimit.maxPerDay || connector.maxPerDay;
                    }
                    // Sync historical counts
                    connector.signalsCount = doc.signalsCount || 0;
                    connector.qualifiedCount = doc.qualifiedCount || 0;
                    connector.opportunitiesCount = doc.opportunitiesCount || 0;
                    connector.conversionsCount = doc.conversionsCount || 0;
                    connector.lastSuccessfulRunAt = doc.lastSuccessfulRunAt || connector.lastSuccessfulRunAt;
                    connector.lastErrorAt = doc.lastErrorAt || connector.lastErrorAt;
                    connector.lastErrorMessage = doc.lastErrorMessage || connector.lastErrorMessage;
                }
            } catch (err) {
                console.error(`[HunterSourceRegistry] Failed to sync ${connector.sourceId}:`, err.message);
            }
        }
    }

    /**
     * Return sanitized metadata for all sources (Strictly NO credentials)
     */
    getSourcesList() {
        return this.getAllConnectors().map((connector) => connector.getMetadata());
    }

    /**
     * Return sanitized metadata for a specific source
     */
    getSourceDetails(sourceId) {
        const connector = this.getConnector(sourceId);
        if (!connector) return null;
        return connector.getMetadata();
    }

    /**
     * Test health of a single source (CEO/Manager action)
     */
    async testSourceHealth(sourceId, models = {}, user = null) {
        const connector = this.getConnector(sourceId);
        if (!connector) {
            throw {
                status: 404,
                errorCode: HUNTER_ERROR_CODES.SOURCE_UNAVAILABLE,
                message: `Hunter source ${sourceId} not found.`
            };
        }

        const healthResult = await connector.healthCheck();

        // Update MongoDB if model available
        const { HunterSource, AIAuditLog } = models;
        if (HunterSource) {
            await HunterSource.updateOne(
                { sourceId },
                {
                    $set: {
                        healthStatus: connector.healthStatus,
                        configurationStatus: connector.configurationStatus,
                        credentialsConfigured: connector.credentialsConfigured,
                        lastCheckedAt: connector.lastCheckedAt,
                        lastErrorAt: connector.lastErrorAt,
                        lastErrorMessage: connector.lastErrorMessage,
                        responseTimeMs: connector.responseTimeMs,
                        consecutiveFailures: connector.consecutiveFailures
                    }
                }
            );
        }

        if (AIAuditLog) {
            await new AIAuditLog({
                runId: `TEST-${sourceId}-${Date.now()}`,
                userId: user?.id || user?._id,
                actorRole: user?.role || 'CEO',
                module: 'CUSTOMER_HUNTER',
                action: 'SOURCE_HEALTH_CHECK',
                decision: healthResult.healthy ? 'ALLOWED' : 'ERROR',
                reason: `Health check executed for ${sourceId}: ${healthResult.status}`,
                metadata: {
                    sourceId,
                    healthResult
                }
            }).save();
        }

        return healthResult;
    }

    /**
     * Enable, disable, or update source configuration
     */
    async updateSourceConfig(sourceId, updates = {}, models = {}, user = null) {
        const connector = this.getConnector(sourceId);
        if (!connector) {
            throw {
                status: 404,
                errorCode: HUNTER_ERROR_CODES.SOURCE_UNAVAILABLE,
                message: `Hunter source ${sourceId} not found.`
            };
        }

        const changes = {};

        if (updates.enabled !== undefined) {
            connector.enabled = Boolean(updates.enabled);
            changes.enabled = connector.enabled;
        }
        if (updates.sourceName) {
            connector.sourceName = String(updates.sourceName).trim();
            connector.name = connector.sourceName;
            changes.sourceName = connector.sourceName;
        }
        if (updates.maxPerHour) {
            connector.maxPerHour = Number(updates.maxPerHour);
            changes.maxPerHour = connector.maxPerHour;
        }
        if (updates.maxPerDay) {
            connector.maxPerDay = Number(updates.maxPerDay);
            changes.maxPerDay = connector.maxPerDay;
        }
        if (updates.timeoutMs) {
            connector.timeoutMs = Number(updates.timeoutMs);
            changes.timeoutMs = connector.timeoutMs;
        }

        const { HunterSource, AIAuditLog } = models;
        if (HunterSource) {
            await HunterSource.updateOne(
                { sourceId },
                {
                    $set: {
                        ...changes,
                        updatedBy: user?.id || user?._id || 'CEO',
                        updatedAt: new Date()
                    }
                }
            );
        }

        if (AIAuditLog) {
            await new AIAuditLog({
                runId: `CONFIG-${sourceId}-${Date.now()}`,
                userId: user?.id || user?._id,
                actorRole: user?.role || 'CEO',
                module: 'CUSTOMER_HUNTER',
                action: updates.enabled !== undefined ? (updates.enabled ? 'SOURCE_ENABLED' : 'SOURCE_DISABLED') : 'SOURCE_CONFIG_UPDATED',
                decision: 'ALLOWED',
                reason: `Source configuration updated for ${sourceId}`,
                metadata: { sourceId, changes }
            }).save();
        }

        return connector.getMetadata();
    }

    /**
     * Run signal ingestion for a specific source
     */
    async runSource(sourceId, queryOptions = {}, models = {}, user = null) {
        const connector = this.getConnector(sourceId);
        if (!connector) {
            throw {
                status: 404,
                errorCode: HUNTER_ERROR_CODES.SOURCE_UNAVAILABLE,
                message: `Hunter source ${sourceId} not found.`
            };
        }

        if (!connector.enabled) {
            throw {
                status: 400,
                errorCode: HUNTER_ERROR_CODES.SOURCE_DISABLED,
                message: `Source ${sourceId} is currently DISABLED.`
            };
        }

        if (connector.configurationStatus === HUNTER_CONFIG_STATUSES.NOT_CONFIGURED) {
            throw {
                status: 400,
                errorCode: HUNTER_ERROR_CODES.NOT_CONFIGURED,
                message: `Source ${sourceId} is NOT_CONFIGURED. Provide required backend credentials first.`
            };
        }

        const {
            HunterSignal,
            HunterSource,
            HunterSourceRun,
            AIOpportunity,
            AIConfig,
            AIAuditLog
        } = models;

        // Verify Global Safe Mode / Kill Switch
        if (AIConfig) {
            const config = await AIConfig.findOne().sort({ createdAt: -1 });
            if (config?.emergencyStop) {
                throw {
                    status: 403,
                    errorCode: HUNTER_ERROR_CODES.EMERGENCY_STOP,
                    message: 'Hunter execution blocked: Emergency Stop is active.'
                };
            }
        }

        // Check idempotency window (5 minutes) - Prompt 9.5 Section 10
        const idempotencyWindowMs = 5 * 60 * 1000;
        const currentWindowIndex = Math.floor(Date.now() / idempotencyWindowMs);
        const queryHash = crypto.createHash('md5').update(JSON.stringify(queryOptions || {})).digest('hex');
        const idempotencyKey = `${sourceId}:${queryHash}:${currentWindowIndex}`;

        if (!queryOptions.forceFresh && this._runCache && this._runCache.has(idempotencyKey)) {
            const cachedRun = this._runCache.get(idempotencyKey);
            return {
                ...cachedRun,
                isIdempotentReplay: true,
                replayedFromRunId: cachedRun.runId
            };
        }

        const runId = `RUN-SRC-${sourceId}-${Date.now()}`;
        const startedAt = new Date();

        let sourceRunDoc = null;
        if (HunterSourceRun) {
            sourceRunDoc = new HunterSourceRun({
                runId,
                sourceId,
                sourceName: connector.sourceName,
                status: HUNTER_RUN_STATUSES.RUNNING,
                startedAt,
                triggeredBy: user?.id || user?._id || null,
                triggerRole: user?.role || 'CEO'
            });
            await sourceRunDoc.save();
        }

        const startTimestamp = Date.now();
        let signalsFetched = 0;
        let signalsNormalized = 0;
        let signalsQualified = 0;
        let opportunitiesCreated = 0;
        let duplicatesFound = 0;
        let rejectedSignals = 0;

        try {
            // 1. Fetch raw candidate signals from connector
            const rawCandidates = await connector.fetchSignals(queryOptions);
            signalsFetched = rawCandidates.length;

            // Import core qualification & pipeline services dynamically to avoid circular dependencies
            const {
                normalizeSignal,
                detectIntent,
                qualifyOpportunity,
                calculateConfidence
            } = require('./hunterService');

            for (const raw of rawCandidates) {
                // 2. Canonical Normalization
                const norm = normalizeSignal(raw, connector.sourceId, connector.sourceType);
                signalsNormalized += 1;

                const signalId = `SIG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

                // 3. Deduplication check (Section 11)
                let existingSig = null;
                if (HunterSignal) {
                    existingSig = await HunterSignal.findOne({
                        $or: [
                            { hash: norm.hash },
                            { externalSignalId: raw.externalSignalId, sourceId: connector.sourceId },
                            { sourceUrl: norm.sourceUrl, sourceId: connector.sourceId }
                        ]
                    });
                }

                if (existingSig) {
                    duplicatesFound += 1;
                    continue;
                }

                // 4. Security / Injection Defense
                if (norm.isMalicious) {
                    rejectedSignals += 1;
                    if (HunterSignal) {
                        await new HunterSignal({
                            signalId,
                            sourceId: connector.sourceId,
                            sourceType: connector.sourceType,
                            publicReference: norm.publicReference || raw.externalSignalId,
                            sourceUrl: norm.sourceUrl,
                            textExcerpt: norm.textExcerpt,
                            normalizedText: norm.normalizedText,
                            hash: norm.hash,
                            status: HUNTER_SIGNAL_STATUSES.REJECTED,
                            rejectionReason: `Security: ${norm.maliciousCategory}`
                        }).save();
                    }
                    continue;
                }

                // 5. Spam Defense
                if (norm.isSpam) {
                    rejectedSignals += 1;
                    if (HunterSignal) {
                        await new HunterSignal({
                            signalId,
                            sourceId: connector.sourceId,
                            sourceType: connector.sourceType,
                            publicReference: norm.publicReference || raw.externalSignalId,
                            sourceUrl: norm.sourceUrl,
                            textExcerpt: norm.textExcerpt,
                            normalizedText: norm.normalizedText,
                            hash: norm.hash,
                            status: HUNTER_SIGNAL_STATUSES.REJECTED,
                            rejectionReason: 'Spam pattern detected'
                        }).save();
                    }
                    continue;
                }

                // 6. Intent Detection & Classification (Local vs Outside)
                const intentData = detectIntent(norm);

                // 6.5 Relevance Gate (Prompt 9.5 Section 8)
                const relevance = classifySignalRelevance(norm, intentData);
                if (!relevance.isQualifiedForOpportunity) {
                    rejectedSignals += 1;
                    if (HunterSignal) {
                        await new HunterSignal({
                            signalId,
                            sourceId: connector.sourceId,
                            sourceType: connector.sourceType,
                            publicReference: norm.publicReference || raw.externalSignalId,
                            sourceUrl: norm.sourceUrl,
                            textExcerpt: norm.textExcerpt,
                            normalizedText: norm.normalizedText,
                            hash: norm.hash,
                            status: HUNTER_SIGNAL_STATUSES.REJECTED,
                            rejectionReason: `RelevanceGate [${relevance.category}]: ${relevance.reason}`
                        }).save();
                    }
                    continue;
                }

                // 7. Qualification
                const qual = qualifyOpportunity(norm, intentData);

                if (qual.qualificationScore < 50) {
                    rejectedSignals += 1;
                    if (HunterSignal) {
                        await new HunterSignal({
                            signalId,
                            sourceId: connector.sourceId,
                            sourceType: connector.sourceType,
                            publicReference: norm.publicReference || raw.externalSignalId,
                            sourceUrl: norm.sourceUrl,
                            textExcerpt: norm.textExcerpt,
                            normalizedText: norm.normalizedText,
                            hash: norm.hash,
                            status: HUNTER_SIGNAL_STATUSES.REJECTED,
                            rejectionReason: 'Qualification below threshold'
                        }).save();
                    }
                    continue;
                }

                signalsQualified += 1;

                // 8. Confidence Score
                const confidence = calculateConfidence(norm, intentData);

                // 9. Persist Signal as Qualified
                if (HunterSignal) {
                    await new HunterSignal({
                        signalId,
                        sourceId: connector.sourceId,
                        sourceType: connector.sourceType,
                        publicReference: norm.publicReference || raw.externalSignalId,
                        sourceUrl: norm.sourceUrl,
                        textExcerpt: norm.textExcerpt,
                        normalizedText: norm.normalizedText,
                        hash: norm.hash,
                        status: HUNTER_SIGNAL_STATUSES.QUALIFIED,
                        qualityScore: norm.qualityScore
                    }).save();
                }

                // 10. Generate Opportunity (Under Mandatory Human Review)
                const opportunityId = `OPP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
                const servicesStr = norm.detectedServices.join(' + ') || 'General inquiry';
                const travelStr = norm.detectedTravelWindow ? ` for ${norm.detectedTravelWindow}` : '';

                const reasoningSummary = intentData.mode === 'AI_LOCAL'
                    ? `In-destination customer signal detected in Varanasi requesting ${servicesStr} with immediate/near-term timing.`
                    : `Future trip planning signal detected requesting ${servicesStr}${travelStr}.`;

                const oppDoc = AIOpportunity ? new AIOpportunity({
                    opportunityId,
                    signalId,
                    source: connector.sourceId,
                    sourceId: connector.sourceId,
                    sourceType: connector.sourceType,
                    hunterMode: intentData.mode,
                    detectedIntent: intentData.detectedIntent,
                    intentLevel: intentData.intentLevel,
                    confidence: confidence.overallConfidence,
                    confidenceBreakdown: confidence,
                    location: norm.detectedLocation,
                    area: norm.detectedArea,
                    travelWindow: norm.detectedTravelWindow,
                    duration: norm.detectedDuration,
                    requestedServices: norm.detectedServices,
                    publicReference: norm.publicReference || raw.externalSignalId,
                    evidenceExcerpt: norm.textExcerpt,
                    evidenceSummary: norm.textExcerpt.substring(0, 150),
                    sourceUrl: norm.sourceUrl,
                    qualificationScore: qual.qualificationScore,
                    qualificationReasons: qual.qualificationReasons,
                    status: HUNTER_OPPORTUNITY_STATUSES.NEW,
                    verificationStatus: 'UNVERIFIED',
                    humanVerified: false,
                    assignedTo: null,
                    reasoningSummary,
                    nextBestAction: intentData.mode === 'AI_LOCAL' ? 'Verify immediate boat/darshan availability' : 'Review hotel & itinerary requirements',
                    attribution: connector.attribution
                }) : null;

                if (oppDoc) {
                    await oppDoc.save();
                    opportunitiesCreated += 1;
                }
            }

            // Update in-memory connector metrics
            connector.signalsCount += signalsNormalized;
            connector.qualifiedCount += signalsQualified;
            connector.opportunitiesCount += opportunitiesCreated;
            connector.lastSuccessfulRunAt = new Date();
            connector.consecutiveFailures = 0;
            connector.healthStatus = HUNTER_HEALTH_STATUSES.HEALTHY;

            const durationMs = Date.now() - startTimestamp;

            // Update DB source record
            if (HunterSource) {
                await HunterSource.updateOne(
                    { sourceId },
                    {
                        $inc: {
                            signalsCount: signalsNormalized,
                            qualifiedCount: signalsQualified,
                            opportunitiesCount: opportunitiesCreated,
                            requestsToday: 1,
                            requestsThisHour: 1
                        },
                        $set: {
                            lastSuccessfulRunAt: connector.lastSuccessfulRunAt,
                            healthStatus: connector.healthStatus,
                            consecutiveFailures: 0
                        }
                    }
                );
            }

            // Update SourceRun record
            if (sourceRunDoc) {
                sourceRunDoc.status = HUNTER_RUN_STATUSES.COMPLETED;
                sourceRunDoc.completedAt = new Date();
                sourceRunDoc.durationMs = durationMs;
                sourceRunDoc.signalsFetched = signalsFetched;
                sourceRunDoc.signalsNormalized = signalsNormalized;
                sourceRunDoc.signalsQualified = signalsQualified;
                sourceRunDoc.opportunitiesCreated = opportunitiesCreated;
                sourceRunDoc.duplicatesFound = duplicatesFound;
                sourceRunDoc.rejectedSignals = rejectedSignals;
                await sourceRunDoc.save();
            }

            if (AIAuditLog) {
                await new AIAuditLog({
                    runId,
                    userId: user?.id || user?._id,
                    actorRole: user?.role || 'CEO',
                    module: 'CUSTOMER_HUNTER',
                    action: 'SOURCE_RUN',
                    decision: 'COMPLETED',
                    reason: `Source ${sourceId} run finished: ${signalsNormalized} normalized, ${opportunitiesCreated} opportunities created.`,
                    metadata: { sourceId, signalsFetched, signalsNormalized, opportunitiesCreated }
                }).save();
            }

            const runSummary = {
                runId,
                sourceId,
                status: HUNTER_RUN_STATUSES.COMPLETED,
                signalsFetched,
                signalsNormalized,
                signalsQualified,
                duplicatesFound,
                rejectedSignals,
                opportunitiesCreated,
                durationMs
            };

            // Cache for run idempotency (Prompt 9.5 Section 10)
            if (this._runCache) {
                this._runCache.set(idempotencyKey, runSummary);
                if (this._runCache.size > 100) {
                    const oldestKey = this._runCache.keys().next().value;
                    this._runCache.delete(oldestKey);
                }
            }

            return runSummary;
        } catch (err) {
            connector.lastErrorAt = new Date();
            connector.lastErrorMessage = err.message || 'Run failed';
            connector.consecutiveFailures += 1;
            connector.healthStatus = HUNTER_HEALTH_STATUSES.ERROR;

            if (HunterSource) {
                await HunterSource.updateOne(
                    { sourceId },
                    {
                        $set: {
                            healthStatus: connector.healthStatus,
                            lastErrorAt: connector.lastErrorAt,
                            lastErrorMessage: connector.lastErrorMessage
                        },
                        $inc: { consecutiveFailures: 1 }
                    }
                );
            }

            if (sourceRunDoc) {
                sourceRunDoc.status = HUNTER_RUN_STATUSES.FAILED;
                sourceRunDoc.completedAt = new Date();
                sourceRunDoc.durationMs = Date.now() - startTimestamp;
                sourceRunDoc.errorMessage = err.message || 'Run failed';
                await sourceRunDoc.save();
            }

            if (AIAuditLog) {
                await new AIAuditLog({
                    runId,
                    userId: user?.id || user?._id,
                    actorRole: user?.role || 'CEO',
                    module: 'CUSTOMER_HUNTER',
                    action: 'SOURCE_FAILED',
                    decision: 'ERROR',
                    reason: `Source ${sourceId} run failed: ${connector.lastErrorMessage}`,
                    metadata: { sourceId, error: connector.lastErrorMessage }
                }).save();
            }

            throw err;
        }
    }

    /**
     * Run all enabled & configured sources with failure isolation (Section 18)
     */
    async runAllSources(queryOptions = {}, models = {}, user = null) {
        const enabledSources = this.getAllConnectors().filter(
            (c) => c.enabled && c.configurationStatus !== HUNTER_CONFIG_STATUSES.NOT_CONFIGURED
        );

        const results = [];
        let totalSignalsFetched = 0;
        let totalNormalized = 0;
        let totalOpportunities = 0;
        let failuresCount = 0;

        for (const connector of enabledSources) {
            try {
                const runRes = await this.runSource(connector.sourceId, queryOptions, models, user);
                results.push({
                    sourceId: connector.sourceId,
                    status: 'SUCCESS',
                    details: runRes
                });
                totalSignalsFetched += runRes.signalsFetched || 0;
                totalNormalized += runRes.signalsNormalized || 0;
                totalOpportunities += runRes.opportunitiesCreated || 0;
            } catch (err) {
                failuresCount += 1;
                results.push({
                    sourceId: connector.sourceId,
                    status: 'FAILED',
                    error: err.message || 'Failed execution'
                });
            }
        }

        const overallStatus = failuresCount === 0 ? 'COMPLETED' : (failuresCount === enabledSources.length ? 'FAILED' : 'PARTIAL');

        return {
            status: overallStatus,
            totalSourcesRun: enabledSources.length,
            successfulSources: enabledSources.length - failuresCount,
            failedSources: failuresCount,
            totalSignalsFetched,
            totalNormalized,
            totalOpportunities,
            results
        };
    }

    /**
     * Get historical run statistics for a source
     */
    async getSourceStats(sourceId, models = {}) {
        const connector = this.getConnector(sourceId);
        if (!connector) {
            throw {
                status: 404,
                errorCode: HUNTER_ERROR_CODES.SOURCE_UNAVAILABLE,
                message: `Source ${sourceId} not found.`
            };
        }

        const { HunterSourceRun, AIOpportunity } = models;
        let runs = [];
        if (HunterSourceRun) {
            runs = await HunterSourceRun.find({ sourceId }).sort({ startedAt: -1 }).limit(10);
        }

        let conversions = 0;
        if (AIOpportunity) {
            conversions = await AIOpportunity.countDocuments({
                sourceId,
                status: HUNTER_OPPORTUNITY_STATUSES.CONVERTED
            });
        }

        return {
            sourceId,
            metadata: connector.getMetadata(),
            recentRuns: runs,
            conversionsCount: conversions
        };
    }

    /**
     * Minimal evidence retention cleanup (Prompt 9.5 Section 9)
     * Expires/deletes stale rejected or duplicate signals older than retention threshold.
     */
    async cleanupStaleSignals(models = {}, retentionDays = 30) {
        const { HunterSignal } = models;
        if (!HunterSignal) return { cleanedCount: 0 };

        const cutoff = new Date(Date.now() - retentionDays * 86400000);
        const res = await HunterSignal.deleteMany({
            createdAt: { $lt: cutoff },
            status: { $in: ['REJECTED', 'DUPLICATE', 'EXPIRED'] }
        });

        return {
            cleanedCount: res.deletedCount || 0,
            cutoffDate: cutoff
        };
    }
}

// Singleton instance
const sourceRegistry = new SourceRegistry();

module.exports = {
    SourceRegistry,
    sourceRegistry
};
