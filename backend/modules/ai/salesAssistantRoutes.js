/**
 * AI Sales Assistant API Endpoints
 * Varanasi Yatra Platform — Prompt 7
 * 
 * Invariants:
 * 1. Requires authenticated CRM user (authenticateToken).
 * 2. Scoped lead access enforced: Team Member & Team Leader cannot access leads outside scope.
 * 3. Module activation controlled by CEO (config.modules.salesAssistant.enabled).
 * 4. Zero autonomous price/booking/sending actions; all drafts require human approval.
 * 5. Proprietary costs/margins strictly redacted for non-CEO roles.
 */

const {
    checkSalesPromptInjection,
    sanitizeLeadForRole,
    calculateLeadQualification,
    detectRequirementGaps,
    recommendSalesStage,
    evaluateFollowUp,
    determineNextBestAction,
    analyzeObjection,
    generateFollowUpDraft,
    prepareQuoteInputs
} = require('./salesAssistantService');

const { getOrCreateConfig } = require('./aiService');
const {
    AI_MODULES,
    AI_ERROR_CODES,
    AI_AUDIT_DECISIONS,
    AI_RISK_LEVELS,
    ALL_AI_RECOMMENDATION_STATUSES
} = require('./aiConstants');

function registerSalesAssistantRoutes(app, {
    AIConfig,
    AIAuditLog,
    AISalesSession,
    AISalesRecommendation,
    AIFollowUpSuggestion,
    Enquiry,
    Lead,
    Quote,
    authenticateToken,
    requireRole
} = {}) {
    const auth = typeof authenticateToken === 'function' ? authenticateToken : ((req, res, next) => next());
    const roleAuth = (...roles) => {
        if (typeof requireRole === 'function') {
            return requireRole(...roles);
        }
        return (req, res, next) => {
            const userRole = req.user?.role;
            if (!userRole || !roles.includes(userRole)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Insufficient role permissions' });
            }
            next();
        };
    };
    const LeadModel = Enquiry || Lead;
    // Helper to log sales AI audit events
    async function logSalesAudit({
        user,
        leadId = null,
        action,
        tool = 'crm.getSalesLeadContext',
        decision = AI_AUDIT_DECISIONS.ALLOWED,
        riskLevel = AI_RISK_LEVELS.LOW,
        reason = '',
        metadata = {}
    }) {
        const auditReason = reason || `Sales assistant audit action: ${action}`;
        try {
            if (AIAuditLog) {
                await AIAuditLog.create({
                    runId: `run_sales_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    userId: user?._id || user?.id || null,
                    actorRole: (user?.role || 'MANAGER').toUpperCase(),
                    module: AI_MODULES.SALES_ASSISTANT,
                    action,
                    tool,
                    decision,
                    riskLevel,
                    reason: auditReason,
                    metadata: {
                        leadId,
                        ...metadata
                    }
                });
            }
        } catch (err) {
            console.error('Failed to record sales AI audit log:', err);
        }
    }

    // Guard to verify module enabled and safe mode
    async function verifySalesAssistantActive(req) {
        const config = await getOrCreateConfig(AIConfig);
        const role = (req.user?.role || '').toUpperCase();

        if (!config.masterEnabled) {
            return {
                allowed: false,
                status: 403,
                body: { success: false, errorCode: AI_ERROR_CODES.AI_DISABLED, code: AI_ERROR_CODES.AI_DISABLED, message: 'Master AI is turned OFF by CEO' }
            };
        }

        if (config.emergencyStop) {
            return {
                allowed: false,
                status: 403,
                body: { success: false, errorCode: AI_ERROR_CODES.EMERGENCY_STOP, code: AI_ERROR_CODES.EMERGENCY_STOP, message: 'AI Emergency Stop is active' }
            };
        }

        const moduleConf = config.modules?.salesAssistant;
        if (!moduleConf || !moduleConf.enabled) {
            return {
                allowed: false,
                status: 403,
                body: { success: false, errorCode: AI_ERROR_CODES.MODULE_DISABLED, code: AI_ERROR_CODES.MODULE_DISABLED, message: 'AI Sales Assistant is currently disabled in system configuration' }
            };
        }

        const allowedRoles = moduleConf.allowedRoles || ['CEO', 'MANAGER'];
        if (!allowedRoles.includes(role)) {
            return {
                allowed: false,
                status: 403,
                body: { success: false, errorCode: AI_ERROR_CODES.PERMISSION_DENIED, code: AI_ERROR_CODES.PERMISSION_DENIED, message: `Role '${role}' is not authorized to use AI Sales Assistant` }
            };
        }

        if (moduleConf.maxDailyRuns && AISalesSession) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const todayRuns = await AISalesSession.countDocuments({
                createdAt: { $gte: startOfDay }
            });
            if (todayRuns >= moduleConf.maxDailyRuns) {
                return {
                    allowed: false,
                    status: 429,
                    body: {
                        success: false,
                        errorCode: 'RATE_LIMIT_EXCEEDED',
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: `Daily run limit of ${moduleConf.maxDailyRuns} exceeded for AI Sales Assistant`
                    }
                };
            }
        }

        return { allowed: true, config };
    }

    // Guard to verify lead access scope
    function verifyLeadScope(lead, user) {
        const role = (user?.role || '').toUpperCase();
        const userId = String(user?._id || user?.id || '');

        if (role === 'CEO' || role === 'MANAGER') {
            return { inScope: true };
        }

        if (role === 'TEAM_MEMBER') {
            if (lead.assignedTo && String(lead.assignedTo) !== userId) {
                return { inScope: false, reason: 'Lead is not assigned to requesting team member' };
            }
            return { inScope: true };
        }

        if (role === 'TEAM_LEADER') {
            const matchesTL = lead.teamLeaderId && String(lead.teamLeaderId) === userId;
            const matchesAssignee = lead.assignedTo && String(lead.assignedTo) === userId;
            if (!matchesTL && !matchesAssignee) {
                return { inScope: false, reason: 'Lead is outside team leader scope' };
            }
            return { inScope: true };
        }

        return { inScope: false, reason: 'Unauthorized role scope' };
    }

    // -----------------------------------------------------------------
    // 1. ANALYZE LEAD (Qualification, Intent, Next Best Action)
    // -----------------------------------------------------------------
    app.post('/admin/ai/sales/analyze-lead', auth, async (req, res) => {
        try {
            const check = await verifySalesAssistantActive(req, res);
            if (!check.allowed) return res.status(check.status).json(check.body);

            const { leadId, additionalNotes = '' } = req.body;
            if (!leadId) {
                return res.status(400).json({ success: false, message: 'leadId is required' });
            }

            // Prompt Injection check
            const injectionCheck = checkSalesPromptInjection(additionalNotes);
            if (injectionCheck.detected) {
                await logSalesAudit({
                    user: req.user,
                    leadId,
                    action: 'ANALYZE_LEAD',
                    decision: AI_AUDIT_DECISIONS.BLOCKED,
                    riskLevel: AI_RISK_LEVELS.HIGH,
                    reason: injectionCheck.reason
                });
                return res.status(400).json({
                    success: false,
                    errorCode: 'PROMPT_INJECTION_DETECTED',
                    message: injectionCheck.reason
                });
            }

            const lead = await LeadModel.findById(leadId);
            if (!lead) {
                return res.status(404).json({ success: false, message: 'Lead not found' });
            }

            // Enforce role-based lead scope
            const scopeCheck = verifyLeadScope(lead, req.user);
            if (!scopeCheck.inScope) {
                await logSalesAudit({
                    user: req.user,
                    leadId,
                    action: 'ANALYZE_LEAD',
                    decision: AI_AUDIT_DECISIONS.BLOCKED,
                    riskLevel: AI_RISK_LEVELS.HIGH,
                    reason: scopeCheck.reason
                });
                return res.status(403).json({ success: false, errorCode: 'SCOPE_VIOLATION', code: 'SCOPE_VIOLATION', message: scopeCheck.reason });
            }

            // Run Core Engines
            const qualification = calculateLeadQualification(lead, lead.activityHistory || []);
            const gaps = detectRequirementGaps(lead);

            let quotes = [];
            if (Quote) {
                quotes = await Quote.find({ leadId: lead._id });
            }

            const followUp = evaluateFollowUp(lead, qualification, quotes);
            const salesStage = recommendSalesStage(lead, qualification, gaps, quotes);
            const nextAction = determineNextBestAction(lead, qualification, gaps, followUp, quotes);
            const quotePrep = prepareQuoteInputs(lead);

            // Additive metadata updates to CRM lead
            lead.aiRecommendedStage = salesStage;
            lead.aiQualification = qualification;
            lead.aiLastAnalyzedAt = new Date();
            lead.aiLastActionRecommended = nextAction.type;
            lead.aiFollowUpRecommended = followUp.followUpRecommended;
            lead.aiFollowUpTiming = followUp.recommendedTiming;
            await lead.save();

            // Store recommendation record
            let recommendation = null;
            if (AISalesRecommendation) {
                const recId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                recommendation = await AISalesRecommendation.create({
                    recommendationId: recId,
                    leadId: lead._id,
                    type: nextAction.type,
                    priority: nextAction.priority,
                    reason: nextAction.reason,
                    confidence: nextAction.confidence,
                    status: 'NEW',
                    qualificationSnapshot: qualification,
                    quotePreparation: quotePrep,
                    createdByAI: true
                });
            }

            // Record session trace
            if (AISalesSession) {
                const sessId = `sales_sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                await AISalesSession.create({
                    sessionId: sessId,
                    leadId: lead._id,
                    userId: req.user._id || req.user.id,
                    userRole: req.user.role,
                    actions: [{
                        action: 'ANALYZE_LEAD',
                        timestamp: new Date(),
                        details: { score: qualification.score, nextAction: nextAction.type }
                    }],
                    recommendations: recommendation ? [recommendation._id] : []
                });
            }

            // Audit
            await logSalesAudit({
                user: req.user,
                leadId: lead._id,
                action: 'ANALYZE_LEAD',
                tool: 'crm.getSalesLeadContext',
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                metadata: { score: qualification.score, intent: qualification.intentLevel }
            });

            return res.status(200).json({
                success: true,
                runId: recommendation ? recommendation.recommendationId : `run_${Date.now()}`,
                leadId: lead._id,
                qualification,
                gaps,
                salesStage,
                recommendation: nextAction,
                followUp,
                quotePreparation: quotePrep,
                humanApprovalRequired: true,
                sanitizedLead: sanitizeLeadForRole(lead, req.user.role)
            });
        } catch (error) {
            console.error('Error in analyze-lead:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -----------------------------------------------------------------
    // 2. GENERATE FOLLOW-UP SUGGESTION & DRAFT
    // -----------------------------------------------------------------
    app.post('/admin/ai/sales/generate-followup', auth, async (req, res) => {
        try {
            const check = await verifySalesAssistantActive(req, res);
            if (!check.allowed) return res.status(check.status).json(check.body);

            const { leadId, channel = 'WHATSAPP', actionType } = req.body;
            if (!leadId) return res.status(400).json({ success: false, message: 'leadId is required' });

            const lead = await LeadModel.findById(leadId);
            if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

            const scopeCheck = verifyLeadScope(lead, req.user);
            if (!scopeCheck.inScope) {
                return res.status(403).json({ success: false, errorCode: 'SCOPE_VIOLATION', code: 'SCOPE_VIOLATION', message: scopeCheck.reason });
            }

            const qualification = calculateLeadQualification(lead);
            let quotes = [];
            if (Quote) quotes = await Quote.find({ leadId: lead._id });
            const followUp = evaluateFollowUp(lead, qualification, quotes);

            const draftAction = { type: actionType || lead.aiLastActionRecommended || 'FOLLOW_UP' };
            const draft = generateFollowUpDraft(lead, draftAction, { channel });

            let suggestion = null;
            if (AIFollowUpSuggestion) {
                const sugId = `sug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                suggestion = await AIFollowUpSuggestion.create({
                    suggestionId: sugId,
                    leadId: lead._id,
                    suggestedAction: draftAction.type,
                    timing: followUp.recommendedTiming,
                    reason: followUp.reason,
                    priority: followUp.priority,
                    status: 'PENDING',
                    draftMessage: draft,
                    isStalled: followUp.isStalled,
                    stalledReason: followUp.stalledReason
                });
            }

            await logSalesAudit({
                user: req.user,
                leadId: lead._id,
                action: 'GENERATE_FOLLOWUP',
                tool: 'crm.generateCustomerMessage',
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                metadata: { channel, actionType: draftAction.type }
            });

            return res.status(200).json({
                success: true,
                leadId: lead._id,
                suggestionId: suggestion ? suggestion.suggestionId : null,
                followUp,
                draft,
                requiresHumanApproval: true,
                humanApprovalRequired: true
            });
        } catch (error) {
            console.error('Error in generate-followup:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -----------------------------------------------------------------
    // 3. ANALYZE OBJECTION
    // -----------------------------------------------------------------
    app.post('/admin/ai/sales/analyze-objection', auth, async (req, res) => {
        try {
            const check = await verifySalesAssistantActive(req, res);
            if (!check.allowed) return res.status(check.status).json(check.body);

            const { leadId, customerText = '' } = req.body;
            if (!customerText) return res.status(400).json({ success: false, message: 'customerText is required' });

            const injectionCheck = checkSalesPromptInjection(customerText);
            if (injectionCheck.detected) {
                await logSalesAudit({
                    user: req.user,
                    leadId,
                    action: 'ANALYZE_OBJECTION',
                    decision: AI_AUDIT_DECISIONS.BLOCKED,
                    riskLevel: AI_RISK_LEVELS.HIGH,
                    reason: injectionCheck.reason
                });
                return res.status(400).json({
                    success: false,
                    errorCode: 'PROMPT_INJECTION_DETECTED',
                    message: injectionCheck.reason
                });
            }

            let lead = {};
            if (leadId) {
                lead = await LeadModel.findById(leadId) || {};
                if (lead._id) {
                    const scopeCheck = verifyLeadScope(lead, req.user);
                    if (!scopeCheck.inScope) {
                        return res.status(403).json({ success: false, errorCode: 'SCOPE_VIOLATION', code: 'SCOPE_VIOLATION', message: scopeCheck.reason });
                    }
                }
            }

            const analysis = analyzeObjection(customerText, lead);

            await logSalesAudit({
                user: req.user,
                leadId: lead._id || null,
                action: 'ANALYZE_OBJECTION',
                tool: 'crm.getSalesLeadContext',
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                metadata: { objectionType: analysis.type, sentiment: analysis.sentiment }
            });

            return res.status(200).json({
                success: true,
                objection: analysis,
                humanApprovalRequired: true
            });
        } catch (error) {
            console.error('Error in analyze-objection:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -----------------------------------------------------------------
    // 4. PREPARE QUOTE INPUTS
    // -----------------------------------------------------------------
    app.post('/admin/ai/sales/prepare-quote-inputs', auth, async (req, res) => {
        try {
            const check = await verifySalesAssistantActive(req, res);
            if (!check.allowed) return res.status(check.status).json(check.body);

            const { leadId } = req.body;
            if (!leadId) return res.status(400).json({ success: false, message: 'leadId is required' });

            const lead = await LeadModel.findById(leadId);
            if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

            const scopeCheck = verifyLeadScope(lead, req.user);
            if (!scopeCheck.inScope) {
                return res.status(403).json({ success: false, errorCode: 'SCOPE_VIOLATION', code: 'SCOPE_VIOLATION', message: scopeCheck.reason });
            }

            const quotePrep = prepareQuoteInputs(lead);

            await logSalesAudit({
                user: req.user,
                leadId: lead._id,
                action: 'PREPARE_QUOTE_INPUTS',
                tool: 'crm.getSalesLeadContext',
                decision: AI_AUDIT_DECISIONS.ALLOWED
            });

            return res.status(200).json({
                success: true,
                leadId: lead._id,
                quotePreparation: quotePrep,
                requiresHumanExecution: true
            });
        } catch (error) {
            console.error('Error in prepare-quote-inputs:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -----------------------------------------------------------------
    // 5. SALES SNAPSHOT SUMMARY FOR A LEAD
    // -----------------------------------------------------------------
    app.get('/admin/ai/sales/summary/:leadId', auth, async (req, res) => {
        try {
            const check = await verifySalesAssistantActive(req, res);
            if (!check.allowed) return res.status(check.status).json(check.body);

            const { leadId } = req.params;
            const lead = await LeadModel.findById(leadId);
            if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

            const scopeCheck = verifyLeadScope(lead, req.user);
            if (!scopeCheck.inScope) {
                return res.status(403).json({ success: false, errorCode: 'SCOPE_VIOLATION', code: 'SCOPE_VIOLATION', message: scopeCheck.reason });
            }

            const qualification = calculateLeadQualification(lead, lead.activityHistory || []);
            const gaps = detectRequirementGaps(lead);

            let quotes = [];
            if (Quote) quotes = await Quote.find({ leadId: lead._id });
            const followUp = evaluateFollowUp(lead, qualification, quotes);
            const salesStage = recommendSalesStage(lead, qualification, gaps, quotes);
            const nextAction = determineNextBestAction(lead, qualification, gaps, followUp, quotes);

            let recommendations = [];
            if (AISalesRecommendation) {
                recommendations = await AISalesRecommendation.find({ leadId: lead._id }).sort({ createdAt: -1 }).limit(10);
            }

            return res.status(200).json({
                success: true,
                leadId: lead._id,
                qualification,
                gaps,
                salesStage,
                recommendation: nextAction,
                followUp,
                recentRecommendations: recommendations,
                lead: sanitizeLeadForRole(lead, req.user.role),
                sanitizedLead: sanitizeLeadForRole(lead, req.user.role)
            });
        } catch (error) {
            console.error('Error in sales summary:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -----------------------------------------------------------------
    // 6. RECOMMENDATIONS LIST & UPDATE (Human Approval Lifecycle)
    // -----------------------------------------------------------------
    app.get('/admin/ai/sales/recommendations', auth, async (req, res) => {
        try {
            const check = await verifySalesAssistantActive(req, res);
            if (!check.allowed) return res.status(check.status).json(check.body);

            const { leadId, status, priority, limit = 50 } = req.query;
            const query = {};
            if (leadId) query.leadId = leadId;
            if (status) query.status = status;
            if (priority) query.priority = priority;

            if (!AISalesRecommendation) {
                return res.status(200).json({ success: true, recommendations: [] });
            }

            const recs = await AISalesRecommendation.find(query).sort({ createdAt: -1 }).limit(Number(limit) || 50);
            return res.status(200).json({ success: true, count: recs.length, recommendations: recs });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    app.patch('/admin/ai/sales/recommendations/:id', auth, async (req, res) => {
        try {
            const check = await verifySalesAssistantActive(req, res);
            if (!check.allowed) return res.status(check.status).json(check.body);

            const { id } = req.params;
            const { status, reviewNotes } = req.body;

            if (status && !ALL_AI_RECOMMENDATION_STATUSES.includes(status)) {
                return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ALL_AI_RECOMMENDATION_STATUSES.join(', ')}` });
            }

            const rec = await AISalesRecommendation.findOne({ $or: [{ _id: id }, { recommendationId: id }] });
            if (!rec) return res.status(404).json({ success: false, message: 'Recommendation not found' });

            if (status) rec.status = status;
            if (reviewNotes) rec.reviewNotes = reviewNotes;
            rec.reviewedBy = req.user._id || req.user.id;
            rec.reviewedAt = new Date();
            await rec.save();

            await logSalesAudit({
                user: req.user,
                leadId: rec.leadId,
                action: 'UPDATE_RECOMMENDATION',
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                metadata: { recommendationId: rec.recommendationId, newStatus: status }
            });

            return res.status(200).json({ success: true, recommendation: rec });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -----------------------------------------------------------------
    // 7. CEO / MANAGER SALES METRICS
    // -----------------------------------------------------------------
    app.get('/admin/ai/sales/metrics', auth, roleAuth('CEO', 'MANAGER'), async (req, res) => {
        try {
            const config = await getOrCreateConfig(AIConfig);
            const isEnabled = Boolean(config.modules?.salesAssistant?.enabled);

            let leadsAnalyzed = 0;
            let recommendationsCount = 0;
            let humanApprovals = 0;
            let followUpsDrafted = 0;
            let objectionsAnalyzed = 0;
            let quotePreparationsCount = 0;
            let blockedActions = 0;

            if (LeadModel) {
                leadsAnalyzed = await LeadModel.countDocuments({ aiQualification: { $exists: true, $ne: null } });
            }

            if (AISalesRecommendation) {
                recommendationsCount = await AISalesRecommendation.countDocuments();
                humanApprovals = await AISalesRecommendation.countDocuments({ status: { $in: ['ACCEPTED', 'EDITED'] } });
            }

            if (AIFollowUpSuggestion) {
                followUpsDrafted = await AIFollowUpSuggestion.countDocuments();
            }

            if (AIAuditLog) {
                objectionsAnalyzed = await AIAuditLog.countDocuments({ module: AI_MODULES.SALES_ASSISTANT, action: 'ANALYZE_OBJECTION' });
                quotePreparationsCount = await AIAuditLog.countDocuments({ module: AI_MODULES.SALES_ASSISTANT, action: 'PREPARE_QUOTE_INPUTS' });
                blockedActions = await AIAuditLog.countDocuments({ module: AI_MODULES.SALES_ASSISTANT, decision: AI_AUDIT_DECISIONS.BLOCKED });
            }

            const approvalRate = recommendationsCount > 0
                ? Math.round((humanApprovals / recommendationsCount) * 100)
                : 0;

            return res.status(200).json({
                success: true,
                enabled: isEnabled,
                safeMode: config.safeMode,
                metrics: {
                    leadsAnalyzed,
                    recommendationsCount,
                    recommendationsGenerated: recommendationsCount,
                    followUpsDrafted,
                    followupsDrafted: followUpsDrafted,
                    objectionsAnalyzed,
                    quotePreparationsCount,
                    quotePreparationSuggestions: quotePreparationsCount,
                    humanApprovals,
                    blockedActions,
                    approvalRate
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });
}

module.exports = {
    registerSalesAssistantRoutes
};
