/**
 * AI Customer Hunter Models & Schemas
 * Varanasi Yatra Platform — Prompt 8
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const {
    ALL_HUNTER_MODES,
    HUNTER_MODES,
    ALL_HUNTER_RUN_STATUSES,
    HUNTER_RUN_STATUSES,
    ALL_HUNTER_SIGNAL_STATUSES,
    HUNTER_SIGNAL_STATUSES,
    ALL_HUNTER_OPPORTUNITY_STATUSES,
    HUNTER_OPPORTUNITY_STATUSES,
    ALL_HUNTER_VERIFICATION_STATUSES,
    HUNTER_VERIFICATION_STATUSES,
    ALL_HUNTER_SOURCE_TYPES,
    HUNTER_SOURCE_TYPES,
    ALL_HUNTER_AUTH_STATUSES,
    HUNTER_AUTH_STATUSES,
    ALL_HUNTER_CONFIG_STATUSES,
    HUNTER_CONFIG_STATUSES,
    ALL_HUNTER_HEALTH_STATUSES,
    HUNTER_HEALTH_STATUSES,
    ALL_HUNTER_INTENT_LEVELS,
    HUNTER_INTENT_LEVELS,
    ALL_CONTACT_ROUTE_TYPES,
    ALL_CONTACT_STATUSES,
    CONTACT_STATUSES,
    ALL_CONTACT_VERIFICATION_STATUSES,
    CONTACT_VERIFICATION_STATUSES
} = require('./hunterConstants');

function initHunterModels(connection = mongoose) {
    // 1. Hunter Signal Schema (Section 7)
    const HunterSignalSchema = new Schema({
        signalId: { type: String, required: true, unique: true, index: true },
        sourceId: { type: String, required: true, index: true },
        sourceType: { type: String, enum: ALL_HUNTER_SOURCE_TYPES, required: true },
        publicReference: { type: String, default: '' },
        sourceUrl: { type: String, default: '' },
        capturedAt: { type: Date, default: Date.now },

        textExcerpt: { type: String, default: '' },
        normalizedText: { type: String, required: true },

        detectedLocation: { type: String, default: 'Varanasi' },
        detectedArea: { type: String, default: null },
        detectedTravelWindow: { type: String, default: '' },
        detectedDuration: { type: String, default: '' },
        detectedServices: [{ type: String }],

        signalType: { type: String, default: 'PUBLIC_TEXT' },
        language: { type: String, default: 'hinglish' },
        hash: { type: String, required: true, index: true },

        intentConfidence: { type: Number, min: 0, max: 1, default: 0.5 },
        qualityScore: { type: Number, min: 0, max: 100, default: 50 },

        status: { 
            type: String, 
            enum: ALL_HUNTER_SIGNAL_STATUSES, 
            default: HUNTER_SIGNAL_STATUSES.NEW,
            index: true 
        },
        rejectionReason: { type: String, default: null }
    }, {
        timestamps: true
    });

    HunterSignalSchema.index({ hash: 1, sourceId: 1 });
    HunterSignalSchema.index({ status: 1, createdAt: -1 });

    // 2. Signal Source Configuration & Health Schema (Section 2 & 18)
    const HunterSourceSchema = new Schema({
        sourceId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        sourceName: { type: String, default: function() { return this.name; } },
        provider: { type: String, default: 'internal' },
        sourceType: { type: String, enum: ALL_HUNTER_SOURCE_TYPES, required: true },
        enabled: { type: Boolean, default: false },
        environment: { type: String, default: 'development' },
        authorizationStatus: { 
            type: String, 
            enum: ALL_HUNTER_AUTH_STATUSES, 
            default: HUNTER_AUTH_STATUSES.NOT_CONFIGURED 
        },
        configurationStatus: {
            type: String,
            enum: ALL_HUNTER_CONFIG_STATUSES,
            default: HUNTER_CONFIG_STATUSES.NOT_CONFIGURED,
            index: true
        },
        healthStatus: { 
            type: String, 
            enum: ALL_HUNTER_HEALTH_STATUSES, 
            default: HUNTER_HEALTH_STATUSES.NOT_CONFIGURED,
            index: true 
        },
        credentialsConfigured: { type: Boolean, default: false },
        endpointUrl: { type: String, default: '' },
        lastCheckedAt: { type: Date, default: null },
        lastSuccessfulRunAt: { type: Date, default: null },
        lastErrorAt: { type: Date, default: null },
        lastErrorMessage: { type: String, default: '' },
        consecutiveFailures: { type: Number, default: 0 },
        responseTimeMs: { type: Number, default: 0 },
        requestsToday: { type: Number, default: 0 },
        requestsThisHour: { type: Number, default: 0 },
        rateLimit: {
            maxPerHour: { type: Number, default: 100 },
            maxPerDay: { type: Number, default: 1000 },
            currentWindowRequests: { type: Number, default: 0 }
        },
        attribution: {
            partnerId: { type: String, default: null },
            partnerName: { type: String, default: null },
            defaultSource: { type: String, default: 'AI_HUNTER' }
        },
        signalsCount: { type: Number, default: 0 },
        qualifiedCount: { type: Number, default: 0 },
        opportunitiesCount: { type: Number, default: 0 },
        conversionsCount: { type: Number, default: 0 },
        errorCount: { type: Number, default: 0 },
        lastError: { type: String, default: '' },
        config: { type: Schema.Types.Mixed, default: {} },
        createdBy: { type: String, default: 'system' },
        updatedBy: { type: String, default: 'system' }
    }, {
        timestamps: true
    });

    // 2b. Individual Source Run Tracking Schema (Prompt 9 Section 26)
    const HunterSourceRunSchema = new Schema({
        runId: { type: String, required: true, unique: true, index: true },
        sourceId: { type: String, required: true, index: true },
        status: {
            type: String,
            enum: ['RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'RATE_LIMITED'],
            default: 'RUNNING',
            index: true
        },
        signalsFetched: { type: Number, default: 0 },
        signalsNormalized: { type: Number, default: 0 },
        opportunitiesCreated: { type: Number, default: 0 },
        duplicatesFound: { type: Number, default: 0 },
        durationMs: { type: Number, default: 0 },
        errorMessage: { type: String, default: null },
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date, default: null },
        triggeredBy: { type: String, default: 'system' }
    }, {
        timestamps: true
    });

    HunterSourceRunSchema.index({ sourceId: 1, createdAt: -1 });

    // 3. Hunter Run Tracking Schema (Section 67)
    const HunterRunSchema = new Schema({
        runId: { type: String, required: true, unique: true },
        mode: { type: String, enum: ['AI_LOCAL', 'AI_OUTSIDE', 'ALL'], required: true },
        status: { 
            type: String, 
            enum: ALL_HUNTER_RUN_STATUSES, 
            default: HUNTER_RUN_STATUSES.QUEUED,
            index: true 
        },
        sourceCount: { type: Number, default: 0 },
        signalsProcessed: { type: Number, default: 0 },
        signalsQualified: { type: Number, default: 0 },
        opportunitiesCreated: { type: Number, default: 0 },
        duplicatesRemoved: { type: Number, default: 0 },
        errors: [{
            sourceId: String,
            error: String,
            timestamp: { type: Date, default: Date.now }
        }],
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date, default: null },
        triggeredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        triggerRole: { type: String, default: 'CEO' }
    }, {
        timestamps: true,
        suppressReservedKeysWarning: true
    });

    HunterRunSchema.index({ status: 1, createdAt: -1 });

    // 4. Contact Route Sub-Schema (Prompt 9.8 + 9.10)
    const ContactRouteSchema = new Schema({
        type: { type: String, enum: ALL_CONTACT_ROUTE_TYPES, required: true },
        value: { type: String, required: true },
        label: { type: String, default: '' },
        confidence: { type: Number, min: 0, max: 1, default: 0.5 },
        provider: { type: String, default: 'UNKNOWN' },
        provenance: { type: String, default: 'UNKNOWN' },
        discoveredAt: { type: Date, default: Date.now },
        freshnessStatus: { type: String, default: 'FRESH' },
        verificationStatus: {
            type: String,
            default: 'UNVERIFIED'
        },
        verifiedByHuman: { type: Boolean, default: false },
        verifiedAt: { type: Date, default: null },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        addedAt: { type: Date, default: Date.now }
    }, { _id: false });

    // 5. Extended AIOpportunity Schema (Section 21) + Contactability (Prompt 9.8) + Prompt 9.9 + 9.10
    const ContactFieldSchema = new Schema({
        value: { type: String, default: '' },       // masked in logs/public APIs
        availability: {
            type: String,
            enum: ['AVAILABLE', 'NOT_AVAILABLE', 'UNVERIFIED'],
            default: 'NOT_AVAILABLE'
        },
        sourceType: { type: String, default: null },  // e.g. PUBLIC_BUSINESS_DATA
        sourceId: { type: String, default: null },
        confidence: { type: Number, min: 0, max: 1, default: 0 },
        verificationStatus: {
            type: String,
            enum: ALL_CONTACT_VERIFICATION_STATUSES,
            default: CONTACT_VERIFICATION_STATUSES.UNVERIFIED
        }
    }, { _id: false });

    const AIOpportunityExtendedSchema = new Schema({
        opportunityId: { type: String, required: true, unique: true, index: true },
        hunterMode: { 
            type: String, 
            enum: ALL_HUNTER_MODES, 
            default: HUNTER_MODES.AI_OUTSIDE,
            index: true 
        },
        source: { type: String, required: true, index: true },
        sourceType: { type: String, enum: ALL_HUNTER_SOURCE_TYPES, default: HUNTER_SOURCE_TYPES.MOCK },
        publicReference: { type: String, default: '' },
        sourceUrl: { type: String, default: '' },
        signalId: { type: String, default: null, index: true },

        detectedIntent: { type: String, required: true },
        serviceInterest: [{ type: String }],
        location: { type: String, default: 'Varanasi' },
        area: { type: String, default: null },
        travelWindow: { type: String, default: '' },
        duration: { type: String, default: '' },
        guestHints: { type: String, default: '' },

        intentLevel: { 
            type: String, 
            enum: ALL_HUNTER_INTENT_LEVELS, 
            default: HUNTER_INTENT_LEVELS.MEDIUM 
        },
        qualificationScore: { type: Number, min: 0, max: 100, default: 50 },
        qualificationReasons: [{ type: String }],

        // Prompt 9.9: Actionability
        actionabilityScore: { type: Number, min: 0, max: 100, default: 0 },
        actionabilityTier: { type: String, default: 'LOW' },
        actionabilityBreakdown: { type: Schema.Types.Mixed, default: {} },

        // Prompt 9.9: Relevance classification
        relevanceCategory: { type: String, default: 'UNKNOWN' },

        confidence: { type: Number, min: 0, max: 1, default: 0.5 },
        confidenceBreakdown: {
            signalConfidence: { type: Number, default: 0.5 },
            intentConfidence: { type: Number, default: 0.5 },
            locationConfidence: { type: Number, default: 0.5 },
            travelWindowConfidence: { type: Number, default: 0.5 },
            serviceConfidence: { type: Number, default: 0.5 },
            overallConfidence: { type: Number, default: 0.5 }
        },

        reasoningSummary: { type: String, default: '' }, // Concise factual explanation (no hidden CoT)
        evidenceSummary: { type: String, default: '' },   // Short factual excerpt

        status: { 
            type: String, 
            enum: ALL_HUNTER_OPPORTUNITY_STATUSES, 
            default: HUNTER_OPPORTUNITY_STATUSES.NEW, 
            index: true 
        },
        verificationStatus: { 
            type: String, 
            enum: ALL_HUNTER_VERIFICATION_STATUSES, 
            default: HUNTER_VERIFICATION_STATUSES.UNVERIFIED 
        },

        assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        reviewNotes: { type: String, default: '' },

        convertedLeadId: { type: Schema.Types.ObjectId, ref: 'Enquiry', default: null },
        convertedAt: { type: Date, default: null },

        // Prompt 9.9: Human sales contact outcome
        contactSource: { type: String, default: null }, // separate from discoverySource
        humanContactOutcome: { type: String, default: null },
        contactOutcomeAt: { type: Date, default: null },
        contactOutcomeBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        contactOutcomeNotes: { type: String, default: '' },

        // Prompt 9.8: Contactability Layer + Prompt 9.9 extensions
        contactability: {
            status: {
                type: String,
                enum: ALL_CONTACT_STATUSES,
                default: CONTACT_STATUSES.NOT_ATTEMPTED
            },
            attemptedAt: { type: Date, default: null },
            completedAt: { type: Date, default: null },
            lastCheckedAt: { type: Date, default: null },
            lastVerifiedAt: { type: Date, default: null },
            contactFreshness: { type: String, default: 'UNKNOWN' },
            provider: { type: String, default: null },
            enrichmentProvider: { type: String, default: null }, // alias
            providerStatus: { type: String, default: null },
            // Enriched phone/email fields (Prompt 9.9)
            phone: { type: ContactFieldSchema, default: () => ({}) },
            email: { type: ContactFieldSchema, default: () => ({}) },
            // Public contact routes (Prompt 9.8 + 9.9)
            routes: [ContactRouteSchema],
            manualRoutes: [ContactRouteSchema],
            routeCount: { type: Number, default: 0 },
            contactabilityScore: { type: Number, min: 0, max: 100, default: 0 },
            lastEnrichmentRunId: { type: String, default: null },
            enrichmentRunId: { type: String, default: null }, // alias
            discoveredAt: { type: Date, default: null }, // alias for attemptedAt
            notes: { type: String, default: '' }
        },

        // Prompt 9.10: Real-prospect quality & lifecycle
        commercialIntentCategory: { type: String, default: 'UNKNOWN' },
        lifecycleState: { type: String, default: 'DISCOVERED' },
        stalenessStatus: { type: String, default: 'FRESH' },
        stalenessReason: { type: String, default: '' },
        prospectExplanation: { type: Schema.Types.Mixed, default: {} },
        identityHash: { type: String, default: '', index: true },
        urlFingerprint: { type: String, default: '', index: true },

        expiresAt: { type: Date, default: null }
    }, {
        timestamps: true
    });


    AIOpportunityExtendedSchema.index({ status: 1, hunterMode: 1, createdAt: -1 });
    AIOpportunityExtendedSchema.index({ signalId: 1 });
    AIOpportunityExtendedSchema.index({ identityHash: 1 });
    AIOpportunityExtendedSchema.index({ urlFingerprint: 1 });

    const HunterSignal = connection.models.HunterSignal || connection.model('HunterSignal', HunterSignalSchema);
    const HunterSource = connection.models.HunterSource || connection.model('HunterSource', HunterSourceSchema);
    const HunterSourceRun = connection.models.HunterSourceRun || connection.model('HunterSourceRun', HunterSourceRunSchema);
    const HunterRun = connection.models.HunterRun || connection.model('HunterRun', HunterRunSchema);
    const AIOpportunity = connection.models.AIOpportunity || connection.model('AIOpportunity', AIOpportunityExtendedSchema);

    return {
        HunterSignal,
        HunterSource,
        HunterSourceRun,
        HunterRun,
        AIOpportunity,
        HunterSignalSchema,
        HunterSourceSchema,
        HunterSourceRunSchema,
        HunterRunSchema,
        AIOpportunityExtendedSchema
    };
}

module.exports = {
    initHunterModels
};
