/**
 * Mongoose Schemas & Model Factory for AI Foundation
 * Varanasi Yatra Platform — Prompt 5
 */

const {
    ALL_AI_MODULES,
    AI_RUN_STATUSES,
    ALL_AI_RUN_STATUSES,
    AI_AUDIT_DECISIONS,
    ALL_AI_AUDIT_DECISIONS,
    AI_RISK_LEVELS,
    ALL_AI_RISK_LEVELS,
    AI_OPPORTUNITY_STATUSES,
    ALL_AI_OPPORTUNITY_STATUSES,
    AI_VERIFICATION_STATUSES,
    ALL_AI_VERIFICATION_STATUSES,
    AI_PROVIDERS,
    AI_ASSISTANT_STATES,
    ALL_AI_ASSISTANT_STATES,
    ALL_AI_SERVICE_INTENTS,
    ALL_AI_NEXT_ACTIONS,
    ALL_AI_FOLLOWUP_TIMINGS,
    ALL_AI_RECOMMENDATION_STATUSES
} = require('./aiConstants');
const { initHunterModels } = require('./hunter/hunterModels');

function createAiModels(mongoose) {
    const Schema = mongoose.Schema;

    // 1. AI Configuration Schema (Singleton Document)
    const AIConfigSchema = new Schema({
        singletonKey: { type: String, default: 'GLOBAL_AI_CONFIG', unique: true },
        masterEnabled: { type: Boolean, default: true },
        safeMode: { type: Boolean, default: true },
        emergencyStop: { type: Boolean, default: false },
        emergencyStoppedAt: { type: Date, default: null },
        emergencyStoppedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        environment: { type: String, default: 'development' },
        
        // Granular Feature Flags per Module (Hunter modules defaulted strictly to enabled: false)
        modules: {
            customerAssistant: {
                enabled: { type: Boolean, default: false },
                safeModeRequired: { type: Boolean, default: true },
                allowedRoles: { type: [String], default: ['CEO', 'MANAGER'] },
                allowedTools: { type: [String], default: ['crm.getLead', 'crm.getCustomer', 'crm.getTrip'] }
            },
            salesAssistant: {
                enabled: { type: Boolean, default: false },
                safeModeRequired: { type: Boolean, default: true },
                allowedRoles: { type: [String], default: ['CEO', 'MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER'] },
                allowedTools: { type: [String], default: ['crm.getLead', 'crm.getQuote', 'crm.getSalesLeadContext', 'crm.generateCustomerMessage'] },
                autoQualification: { type: Boolean, default: true },
                followUpSuggestions: { type: Boolean, default: true },
                objectionSuggestions: { type: Boolean, default: true },
                quotePreparation: { type: Boolean, default: true },
                maxDailyRuns: { type: Number, default: 200 }
            },
            customerHunter: {
                enabled: { type: Boolean, default: false }, // STRICTLY INACTIVE INITIALLY
                safeModeRequired: { type: Boolean, default: true },
                allowedRoles: { type: [String], default: ['CEO', 'MANAGER'] },
                allowedTools: { type: [String], default: ['hunter.fetchSignals', 'hunter.detectIntent', 'hunter.qualifySignal', 'hunter.createOpportunity', 'hunter.approveOpportunity'] },
                schedule: { type: String, default: 'MANUAL' },
                maxSignalsPerRun: { type: Number, default: 100 },
                maxOpportunitiesPerRun: { type: Number, default: 20 },
                maxDailySignals: { type: Number, default: 500 },
                maxDailyOpportunities: { type: Number, default: 100 }
            },
            localHunter: {
                enabled: { type: Boolean, default: false }, // STRICTLY INACTIVE INITIALLY
                safeModeRequired: { type: Boolean, default: true },
                allowedRoles: { type: [String], default: ['CEO', 'MANAGER'] },
                allowedTools: { type: [String], default: [] }
            },
            outsideHunter: {
                enabled: { type: Boolean, default: false }, // STRICTLY INACTIVE INITIALLY
                safeModeRequired: { type: Boolean, default: true },
                allowedRoles: { type: [String], default: ['CEO', 'MANAGER'] },
                allowedTools: { type: [String], default: [] }
            },
            voiceAi: {
                enabled: { type: Boolean, default: false }, // STRICTLY INACTIVE IN PROMPT 5
                safeModeRequired: { type: Boolean, default: true },
                allowedRoles: { type: [String], default: ['CEO'] },
                allowedTools: { type: [String], default: [] }
            }
        },

        // Safety Throttles
        maxConcurrentRuns: { type: Number, default: 5 },
        maxToolCallsPerRun: { type: Number, default: 10 },
        dailyRunLimit: { type: Number, default: 200 },

        // Provider configuration (server-side only, NO secrets in schema)
        provider: { type: String, default: AI_PROVIDERS.MOCK },
        model: { type: String, default: 'mock-deterministic-v1' },

        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        updatedAt: { type: Date, default: Date.now }
    }, {
        timestamps: true
    });

    // 2. AI Run Tracking Schema
    const AIRunSchema = new Schema({
        runId: { type: String, required: true, unique: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        userRole: { type: String, required: true },
        module: { type: String, enum: ALL_AI_MODULES, required: true, index: true },
        taskType: { type: String, required: true },
        status: { type: String, enum: ALL_AI_RUN_STATUSES, default: AI_RUN_STATUSES.QUEUED, index: true },
        safeMode: { type: Boolean, default: true },
        
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date, default: null },
        latencyMs: { type: Number, default: 0 },
        
        toolCallCount: { type: Number, default: 0 },
        toolCalls: [{
            tool: { type: String, required: true },
            input: { type: Schema.Types.Mixed, default: {} },
            output: { type: Schema.Types.Mixed, default: {} },
            riskLevel: { type: String, enum: ALL_AI_RISK_LEVELS, default: AI_RISK_LEVELS.LOW },
            decision: { type: String, enum: ALL_AI_AUDIT_DECISIONS, default: AI_AUDIT_DECISIONS.ALLOWED },
            executedAt: { type: Date, default: Date.now }
        }],

        tokenUsage: {
            promptTokens: { type: Number, default: 0 },
            completionTokens: { type: Number, default: 0 },
            totalTokens: { type: Number, default: 0 }
        },

        result: { type: Schema.Types.Mixed, default: null },
        requiresApproval: { type: Boolean, default: false },
        approvalDetails: { type: Schema.Types.Mixed, default: null },

        errorCode: { type: String, default: null },
        errorMessage: { type: String, default: null },
        metadata: { type: Schema.Types.Mixed, default: {} }
    }, {
        timestamps: true
    });

    AIRunSchema.index({ createdAt: -1 });
    AIRunSchema.index({ userId: 1, createdAt: -1 });
    AIRunSchema.index({ module: 1, status: 1 });

    // 3. AI Audit Log Schema (Immutable Audit Records)
    const AIAuditLogSchema = new Schema({
        runId: { type: String, required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        actorRole: { type: String, required: true },
        module: { type: String, required: true, index: true },
        action: { type: String, required: true },
        tool: { type: String, default: null },
        targetType: { type: String, default: 'system' }, // lead, customer, quote, booking, system, config
        targetId: { type: String, default: null },
        decision: { type: String, enum: ALL_AI_AUDIT_DECISIONS, required: true, index: true },
        reason: { type: String, required: true },
        riskLevel: { type: String, enum: ALL_AI_RISK_LEVELS, default: AI_RISK_LEVELS.LOW },
        metadata: { type: Schema.Types.Mixed, default: {} },
        timestamp: { type: Date, default: Date.now, index: true }
    }, {
        timestamps: false // strictly preserve single immutable timestamp
    });

    AIAuditLogSchema.index({ timestamp: -1 });
    AIAuditLogSchema.index({ decision: 1, timestamp: -1 });

    // 4. AI Opportunity Schema (Prompt 8 Customer Hunter)
    const AIOpportunitySchema = new Schema({
        opportunityId: { type: String, required: true, unique: true, index: true },
        hunterMode: { type: String, default: 'AI_OUTSIDE', index: true },
        source: { type: String, default: 'AI_OUTSIDE', index: true },
        sourceType: { type: String, default: 'MOCK' },
        sourceUrl: { type: String, default: '' },
        publicReference: { type: String, default: '' },
        signalId: { type: String, default: null, index: true },
        detectedIntent: { type: String, required: true },
        serviceInterest: [{ type: String }],
        location: { type: String, default: 'Varanasi' },
        area: { type: String, default: null },
        travelWindow: { type: String, default: '' },
        duration: { type: String, default: '' },
        guestHints: { type: String, default: '' },
        intentLevel: { type: String, default: 'MEDIUM' },
        qualificationScore: { type: Number, default: 50 },
        qualificationReasons: [{ type: String }],
        confidence: { type: Number, min: 0, max: 1, default: 0.5 },
        confidenceBreakdown: { type: Schema.Types.Mixed, default: {} },
        reasoningSummary: { type: String, default: '' },
        evidenceSummary: { type: String, default: '' },

        status: { type: String, enum: ALL_AI_OPPORTUNITY_STATUSES, default: AI_OPPORTUNITY_STATUSES.NEW, index: true },
        verificationStatus: { type: String, enum: ALL_AI_VERIFICATION_STATUSES, default: AI_VERIFICATION_STATUSES.UNVERIFIED },
        
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        convertedLeadId: { type: Schema.Types.ObjectId, ref: 'Enquiry', default: null },
        convertedAt: { type: Date, default: null },
        
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        reviewNotes: { type: String, default: '' },
        expiresAt: { type: Date, default: null }
    }, {
        timestamps: true
    });

    AIOpportunitySchema.index({ status: 1, source: 1, createdAt: -1 });
    AIOpportunitySchema.index({ hunterMode: 1, status: 1 });

    // 5. AI Assistant Session Schema (Prompt 6 Customer Assistant)
    const AIAssistantSessionSchema = new Schema({
        sessionId: { type: String, required: true, unique: true, index: true },
        conversationId: { type: String, required: true, index: true },
        status: { 
            type: String, 
            enum: ALL_AI_ASSISTANT_STATES, 
            default: AI_ASSISTANT_STATES.NEW, 
            index: true 
        },

        // Attribution preservation (QR / Area / Hotel / Website)
        attribution: {
            source: { type: String, default: 'WEBSITE' },
            qrId: { type: String, default: null },
            areaId: { type: String, default: null },
            partnerId: { type: String, default: null },
            qrType: { type: String, default: null },
            rawQuery: { type: Schema.Types.Mixed, default: {} }
        },

        // Structured Requirement State
        requirementState: {
            tripIntent: { type: String, default: '' },
            destination: { type: String, default: 'Varanasi' },
            origin: { type: String, default: '' },
            travelStartDate: { type: String, default: '' },
            travelEndDate: { type: String, default: '' },
            travelWindow: { type: String, default: '' },
            duration: { type: String, default: '' },
            durationDays: { type: Number, default: null },
            durationNights: { type: Number, default: null },
            adults: { type: Number, default: null },
            children: { type: Number, default: null },
            totalGuests: { type: Number, default: null },

            hotelRequired: { type: Boolean, default: false },
            darshanRequired: { type: Boolean, default: false },
            boatRequired: { type: Boolean, default: false },
            transportRequired: { type: Boolean, default: false },
            panditRequired: { type: Boolean, default: false },
            guideRequired: { type: Boolean, default: false },
            shoppingRequired: { type: Boolean, default: false },
            packageRequired: { type: Boolean, default: false },

            pickupRequired: { type: Boolean, default: false },
            dropRequired: { type: Boolean, default: false },

            budget: { type: String, default: '' },
            accommodationPreference: { type: String, default: '' },
            specialRequirements: { type: String, default: '' },

            customerName: { type: String, default: '' },
            phone: { type: String, default: '' },
            email: { type: String, default: '' },

            confidence: { type: Number, default: 0.5 },
            missingFields: [{ type: String }]
        },

        serviceInterests: [{ type: String, enum: ALL_AI_SERVICE_INTENTS }],
        
        // Bounded conversation history
        messages: [{
            role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            quickReplies: [{ type: String }],
            metadata: { type: Schema.Types.Mixed, default: {} }
        }],

        missingFields: [{ type: String }],
        nextQuestion: { type: String, default: '' },
        readyForConfirmation: { type: Boolean, default: false },
        confirmedAt: { type: Date, default: null },

        consentGiven: { type: Boolean, default: false },
        consentTimestamp: { type: Date, default: null },

        humanHandoffRequired: { type: Boolean, default: false },
        escalationReason: { type: String, default: null },

        leadId: { type: Schema.Types.ObjectId, ref: 'Enquiry', default: null },
        submittedAt: { type: Date, default: null },

        ipAddress: { type: String, default: null },
        userAgent: { type: String, default: null },
        messageCount: { type: Number, default: 0 },
        lastMessageAt: { type: Date, default: Date.now }
    }, {
        timestamps: true
    });

    AIAssistantSessionSchema.index({ conversationId: 1, createdAt: -1 });
    AIAssistantSessionSchema.index({ status: 1, createdAt: -1 });

    // 6. AI Sales Session Schema (Prompt 7 Section 46)
    const AISalesSessionSchema = new Schema({
        sessionId: { type: String, required: true, unique: true, index: true },
        leadId: { type: Schema.Types.ObjectId, ref: 'Enquiry', required: true, index: true },
        customerId: { type: String, default: null },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        userRole: { type: String, default: 'MANAGER' },
        startedAt: { type: Date, default: Date.now },
        endedAt: { type: Date, default: null },
        actions: [{
            action: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            details: { type: Schema.Types.Mixed, default: {} }
        }],
        recommendations: [{ type: Schema.Types.ObjectId, ref: 'AISalesRecommendation' }],
        handoffRequired: { type: Boolean, default: false },
        status: { type: String, default: 'ACTIVE' },
        metadata: { type: Schema.Types.Mixed, default: {} }
    }, {
        timestamps: true
    });

    AISalesSessionSchema.index({ leadId: 1, createdAt: -1 });

    // 7. AI Sales Recommendation Model (Prompt 7 Section 47)
    const AISalesRecommendationSchema = new Schema({
        recommendationId: { type: String, required: true, unique: true, index: true },
        leadId: { type: Schema.Types.ObjectId, ref: 'Enquiry', required: true, index: true },
        type: { type: String, enum: ALL_AI_NEXT_ACTIONS, required: true },
        priority: { type: String, enum: ALL_AI_FOLLOWUP_TIMINGS, default: 'SOON' },
        reason: { type: String, required: true },
        confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' },
        status: { type: String, enum: ALL_AI_RECOMMENDATION_STATUSES, default: 'NEW', index: true },
        qualificationSnapshot: { type: Schema.Types.Mixed, default: null },
        suggestedDraft: { type: Schema.Types.Mixed, default: null },
        quotePreparation: { type: Schema.Types.Mixed, default: null },
        objectionAnalysis: { type: Schema.Types.Mixed, default: null },
        createdByAI: { type: Boolean, default: true },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        reviewNotes: { type: String, default: '' }
    }, {
        timestamps: true
    });

    AISalesRecommendationSchema.index({ leadId: 1, status: 1 });

    // 8. AI Follow-Up Suggestion Model (Prompt 7 Section 48)
    const AIFollowUpSuggestionSchema = new Schema({
        suggestionId: { type: String, required: true, unique: true, index: true },
        leadId: { type: Schema.Types.ObjectId, ref: 'Enquiry', required: true, index: true },
        suggestedAction: { type: String, required: true },
        timing: { type: String, enum: ALL_AI_FOLLOWUP_TIMINGS, default: 'SOON' },
        reason: { type: String, required: true },
        priority: { type: String, default: 'MEDIUM' },
        status: { type: String, enum: ['PENDING', 'APPROVED', 'DISMISSED', 'COMPLETED'], default: 'PENDING', index: true },
        draftMessage: { type: Schema.Types.Mixed, default: null },
        isStalled: { type: Boolean, default: false },
        stalledReason: { type: String, default: '' },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        approvedAt: { type: Date, default: null }
    }, {
        timestamps: true
    });

    AIFollowUpSuggestionSchema.index({ leadId: 1, status: 1 });

    const AIConfig = mongoose.models.AIConfig || mongoose.model('AIConfig', AIConfigSchema);
    const AIRun = mongoose.models.AIRun || mongoose.model('AIRun', AIRunSchema);
    const AIAuditLog = mongoose.models.AIAuditLog || mongoose.model('AIAuditLog', AIAuditLogSchema);
    const AIOpportunity = mongoose.models.AIOpportunity || mongoose.model('AIOpportunity', AIOpportunitySchema);
    const AIAssistantSession = mongoose.models.AIAssistantSession || mongoose.model('AIAssistantSession', AIAssistantSessionSchema);
    const AISalesSession = mongoose.models.AISalesSession || mongoose.model('AISalesSession', AISalesSessionSchema);
    const AISalesRecommendation = mongoose.models.AISalesRecommendation || mongoose.model('AISalesRecommendation', AISalesRecommendationSchema);
    const AIFollowUpSuggestion = mongoose.models.AIFollowUpSuggestion || mongoose.model('AIFollowUpSuggestion', AIFollowUpSuggestionSchema);

    // Initialize Prompt 8 Hunter Models
    const hunterModels = initHunterModels(mongoose);

    return {
        AIConfig,
        AIRun,
        AIAuditLog,
        AIOpportunity: hunterModels.AIOpportunity || AIOpportunity,
        AIAssistantSession,
        AISalesSession,
        AISalesRecommendation,
        AIFollowUpSuggestion,
        HunterSignal: hunterModels.HunterSignal,
        HunterSource: hunterModels.HunterSource,
        HunterSourceRun: hunterModels.HunterSourceRun,
        HunterRun: hunterModels.HunterRun
    };
}

module.exports = {
    createAiModels
};
