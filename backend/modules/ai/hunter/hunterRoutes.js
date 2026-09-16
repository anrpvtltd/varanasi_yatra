const {
    HUNTER_ERROR_CODES,
    HUNTER_OPPORTUNITY_STATUSES,
    HUNTER_STATUSES
} = require('./hunterConstants');

const {
    requireCeoHunterAccess,
    requireHunterManagerOrCeo,
    canUserAccessOpportunity,
    sanitizeOpportunityForRole
} = require('./hunterAuthorization');

const {
    getHunterStatus,
    startHunterRun,
    approveOpportunity,
    rejectOpportunity,
    convertOpportunityToLead,
    recordHumanContactOutcome,
    runtimeState,
    getSourceRegistry
} = require('./hunterService');

const { getHunterAnalytics, getExtendedFunnelAnalytics, getSourceQualityAnalytics } = require('./hunterAnalytics');

const {
    discoverContactRoutes,
    addManualContactRoute,
    verifyContactRoute,
    getContactability
} = require('./contactability/contactabilityService');


function registerHunterRoutes(app, models, authenticateAdmin) {
    const {
        HunterSignal,
        HunterSource,
        HunterSourceRun,
        HunterRun,
        AIOpportunity,
        Enquiry,
        Lead,
        Booking,
        AIConfig,
        AIAuditLog
    } = models;

    const LeadModel = Enquiry || Lead;

    // Helper to resolve models bundle
    const getModels = () => ({
        HunterSignal,
        HunterSource,
        HunterSourceRun,
        HunterRun,
        AIOpportunity,
        Enquiry: LeadModel,
        Booking,
        AIConfig,
        AIAuditLog
    });

    const sourceRegistry = getSourceRegistry();
    if (HunterSource) {
        sourceRegistry.syncWithDatabase(HunterSource).catch(err => {
            console.error('[HunterRoutes] Error syncing sources with DB:', err.message);
        });
    }

    // -------------------------------------------------------------
    // 1. GET /admin/ai/hunter/status
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/status', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const statusData = await getHunterStatus(getModels());
            return res.status(200).json({ success: true, data: statusData });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 2. POST /admin/ai/hunter/start (CEO only)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/start', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const { mode = 'ALL', maxSignals = 50 } = req.body || {};
            const result = await startHunterRun({ mode, maxSignals }, getModels(), req.user);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'HUNTER_ERROR',
                message: error.message || 'Failed to start Hunter run.'
            });
        }
    });

    // -------------------------------------------------------------
    // 3. POST /admin/ai/hunter/pause (CEO only)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/pause', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            runtimeState.isPaused = true;
            runtimeState.status = HUNTER_STATUSES.PAUSED;

            if (AIAuditLog) {
                await new AIAuditLog({
                    runId: `PAUSE-${Date.now()}`,
                    userId: req.user?.id || req.user?._id,
                    actorRole: req.user?.role || 'CEO',
                    module: 'CUSTOMER_HUNTER',
                    action: 'HUNTER_PAUSED',
                    decision: 'ALLOWED',
                    reason: 'CEO manually paused Customer Hunter discovery.'
                }).save();
            }

            return res.status(200).json({ success: true, message: 'Customer Hunter paused.' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 4. POST /admin/ai/hunter/resume (CEO only)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/resume', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            runtimeState.isPaused = false;
            runtimeState.status = HUNTER_STATUSES.READY;

            if (AIAuditLog) {
                await new AIAuditLog({
                    runId: `RESUME-${Date.now()}`,
                    userId: req.user?.id || req.user?._id,
                    actorRole: req.user?.role || 'CEO',
                    module: 'CUSTOMER_HUNTER',
                    action: 'HUNTER_RESUMED',
                    decision: 'ALLOWED',
                    reason: 'CEO manually resumed Customer Hunter discovery.'
                }).save();
            }

            return res.status(200).json({ success: true, message: 'Customer Hunter resumed.' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 5. POST /admin/ai/hunter/stop (CEO Emergency Stop)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/stop', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            runtimeState.status = HUNTER_STATUSES.EMERGENCY_STOP;
            runtimeState.isPaused = true;

            // Also flag AIConfig if exists
            if (AIConfig) {
                const config = await AIConfig.findOne().sort({ createdAt: -1 });
                if (config && config.modules?.customerHunter) {
                    config.modules.customerHunter.enabled = false;
                    await config.save();
                }
            }

            if (AIAuditLog) {
                await new AIAuditLog({
                    runId: `STOP-${Date.now()}`,
                    userId: req.user?.id || req.user?._id,
                    actorRole: req.user?.role || 'CEO',
                    module: 'CUSTOMER_HUNTER',
                    action: 'EMERGENCY_STOP',
                    decision: 'ALLOWED',
                    reason: 'CEO triggered immediate emergency stop for all Hunter discovery.'
                }).save();
            }

            return res.status(200).json({ success: true, message: 'Emergency Stop triggered: All Hunter execution stopped.' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 6. GET /admin/ai/hunter/sources
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/sources', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            let sources = [];
            if (HunterSource) {
                sources = await HunterSource.find().lean();
            }
            if (sources.length === 0) {
                sources = [
                    {
                        sourceId: 'MOCK_SOURCE',
                        name: 'Deterministic Test Fixture Source',
                        provider: 'internal_test',
                        sourceType: 'MOCK',
                        enabled: true,
                        authorizationStatus: 'AUTHORIZED',
                        healthStatus: 'READY'
                    },
                    {
                        sourceId: 'SEARCH_API',
                        name: 'Authorized Public Search API',
                        provider: 'external_search',
                        sourceType: 'PUBLIC_SEARCH',
                        enabled: false,
                        authorizationStatus: 'NOT_CONFIGURED',
                        healthStatus: 'NOT_CONFIGURED'
                    },
                    {
                        sourceId: 'PARTNER_FEED',
                        name: 'Authorized Partner Travel Feed',
                        provider: 'partner_network',
                        sourceType: 'PARTNER_REFERRAL',
                        enabled: false,
                        authorizationStatus: 'NOT_CONFIGURED',
                        healthStatus: 'NOT_CONFIGURED'
                    }
                ];
            }
            return res.status(200).json({ success: true, data: sources });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 7. GET /admin/ai/hunter/signals
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/signals', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const { limit = 50, status } = req.query;
            const filter = {};
            if (status) filter.status = status;

            let signals = [];
            if (HunterSignal) {
                signals = await HunterSignal.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).lean();
            }
            return res.status(200).json({ success: true, count: signals.length, data: signals });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 8. GET /admin/ai/hunter/opportunities (Filters: mode, intent, status)
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/opportunities', authenticateAdmin, async (req, res) => {
        try {
            const { mode, status, intentLevel, limit = 50 } = req.query;
            const filter = {};
            if (mode) filter.hunterMode = mode;
            if (status) filter.status = status;
            if (intentLevel) filter.intentLevel = intentLevel;

            if (req.user?.role?.toUpperCase() !== 'CEO') {
                filter.$or = [
                    { status: 'APPROVED' },
                    { verificationStatus: 'HUMAN_VERIFIED' },
                    { humanVerificationStatus: 'CEO_VERIFIED' },
                    { lifecycleState: { $in: ['READY_FOR_MANAGER', 'GENUINE', 'APPROVED', 'CONVERTED'] } }
                ];
            }

            let opps = [];
            if (AIOpportunity) {
                opps = await AIOpportunity.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
            }

            // Filter for role scope
            const authorizedOpps = opps
                .filter(opp => canUserAccessOpportunity(req.user, opp))
                .map(opp => sanitizeOpportunityForRole(opp, req.user?.role));

            return res.status(200).json({ success: true, count: authorizedOpps.length, data: authorizedOpps });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 9. GET /admin/ai/hunter/opportunities/:id
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/opportunities/:id', authenticateAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            if (!AIOpportunity) return res.status(404).json({ success: false, message: 'Opportunity not found.' });

            const opp = await AIOpportunity.findOne({ opportunityId: id });
            if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found.' });

            if (!canUserAccessOpportunity(req.user, opp)) {
                return res.status(403).json({ success: false, errorCode: HUNTER_ERROR_CODES.SCOPE_VIOLATION, message: 'Access denied: Opportunity outside assigned scope.' });
            }

            return res.status(200).json({ success: true, data: sanitizeOpportunityForRole(opp, req.user?.role) });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 10. PATCH /admin/ai/hunter/opportunities/:id (Review notes & assignment)
    // -------------------------------------------------------------
    app.patch('/admin/ai/hunter/opportunities/:id', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const { id } = req.params;
            const { reviewNotes, assignedTo, status } = req.body || {};
            if (!AIOpportunity) return res.status(404).json({ success: false, message: 'Opportunity not found.' });

            const opp = await AIOpportunity.findOne({ opportunityId: id });
            if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found.' });

            if (reviewNotes !== undefined) opp.reviewNotes = String(reviewNotes).trim();
            if (assignedTo !== undefined) opp.assignedTo = assignedTo;
            if (status && Object.values(HUNTER_OPPORTUNITY_STATUSES).includes(status)) {
                opp.status = status;
            }

            await opp.save();
            return res.status(200).json({ success: true, data: sanitizeOpportunityForRole(opp, req.user?.role) });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 11. POST /admin/ai/hunter/opportunities/:id/approve (CEO Human Verification Gate)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/opportunities/:id/approve', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await approveOpportunity(id, getModels(), req.user);
            return res.status(200).json({ success: true, data: sanitizeOpportunityForRole(updated, req.user?.role) });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, errorCode: error.errorCode || 'ERROR', message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 12. POST /admin/ai/hunter/opportunities/:id/reject (CEO Rejection Gate)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/opportunities/:id/reject', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body || {};
            const updated = await rejectOpportunity(id, reason, getModels(), req.user);
            return res.status(200).json({ success: true, data: sanitizeOpportunityForRole(updated, req.user?.role) });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, errorCode: error.errorCode || 'ERROR', message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 13. POST /admin/ai/hunter/opportunities/:id/duplicate (CEO Duplicate Gate)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/opportunities/:id/duplicate', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const { id } = req.params;
            if (!AIOpportunity) return res.status(404).json({ success: false, message: 'Opportunity not found.' });

            const opp = await AIOpportunity.findOne({ opportunityId: id });
            if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found.' });

            opp.status = HUNTER_OPPORTUNITY_STATUSES.DUPLICATE;
            opp.reviewedBy = req.user?.id || req.user?._id;
            opp.reviewedAt = new Date();
            await opp.save();

            return res.status(200).json({ success: true, data: sanitizeOpportunityForRole(opp, req.user?.role) });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 14. POST /admin/ai/hunter/opportunities/:id/convert-to-lead (Controlled CRM Lead Creation)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/opportunities/:id/convert-to-lead', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const { id } = req.params;
            const { name, phone, email } = req.body || {};
            const result = await convertOpportunityToLead(id, { name, phone, email }, getModels(), req.user);

            return res.status(200).json({
                success: true,
                opportunityId: result.opportunity.opportunityId,
                leadId: result.lead._id,
                leadSource: result.lead.leadSource,
                source: result.lead.source
            });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({ success: false, errorCode: error.errorCode || 'ERROR', message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 15. GET /admin/ai/hunter/analytics
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/analytics', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const analytics = await getHunterAnalytics(getModels());
            return res.status(200).json({ success: true, data: analytics });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 16. GET /admin/ai/hunter/config (CEO only)
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/config', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            let config = null;
            if (AIConfig) config = await AIConfig.findOne().sort({ createdAt: -1 });

            const hunterConfig = {
                masterEnabled: config?.masterEnabled ?? false,
                emergencyStop: config?.emergencyStop ?? false,
                customerHunter: config?.modules?.customerHunter || { enabled: false },
                localHunter: config?.modules?.localHunter || { enabled: false },
                outsideHunter: config?.modules?.outsideHunter || { enabled: false },
                runtimeState
            };
            return res.status(200).json({ success: true, data: hunterConfig });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 17. PATCH /admin/ai/hunter/config (CEO only)
    // -------------------------------------------------------------
    app.patch('/admin/ai/hunter/config', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const updates = req.body || {};
            if (!AIConfig) return res.status(200).json({ success: true, message: 'Config updated (in-memory).' });

            let config = await AIConfig.findOne().sort({ createdAt: -1 });
            if (!config) config = new AIConfig();

            if (updates.modules) {
                config.modules = {
                    ...config.modules,
                    ...updates.modules
                };
            }

            await config.save();
            return res.status(200).json({ success: true, data: config });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // =============================================================
    // PROMPT 9: HUNTER SOURCE MANAGEMENT API ROUTES (Sections 17 & 25)
    // =============================================================

    // -------------------------------------------------------------
    // 18. GET /admin/ai/hunter/sources (List all registered sources)
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/sources', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const sources = sourceRegistry.getSourcesList();
            return res.status(200).json({ success: true, data: sources });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 19. GET /admin/ai/hunter/sources/:sourceId (Single source details)
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/sources/:sourceId', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const { sourceId } = req.params;
            const details = sourceRegistry.getSourceDetails(sourceId);
            if (!details) {
                return res.status(404).json({
                    success: false,
                    errorCode: HUNTER_ERROR_CODES.SOURCE_UNAVAILABLE,
                    message: `Source ${sourceId} not found.`
                });
            }
            return res.status(200).json({ success: true, data: details });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 20. POST /admin/ai/hunter/sources/:sourceId/test (CEO test health)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/sources/:sourceId/test', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const { sourceId } = req.params;
            const result = await sourceRegistry.testSourceHealth(sourceId, getModels(), req.user);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'HEALTH_CHECK_FAILED',
                message: error.message || 'Source health check failed'
            });
        }
    });

    // -------------------------------------------------------------
    // 21. POST /admin/ai/hunter/sources/:sourceId/run (CEO run single source)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/sources/:sourceId/run', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const { sourceId } = req.params;
            const queryOptions = req.body || {};
            const result = await sourceRegistry.runSource(sourceId, queryOptions, getModels(), req.user);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'SOURCE_RUN_FAILED',
                message: error.message || 'Source execution failed'
            });
        }
    });

    // -------------------------------------------------------------
    // 22. POST /admin/ai/hunter/sources/run-all (CEO run all enabled sources)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/sources/run-all', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const queryOptions = req.body || {};
            const result = await sourceRegistry.runAllSources(queryOptions, getModels(), req.user);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'RUN_ALL_FAILED',
                message: error.message || 'Failed to run all sources'
            });
        }
    });

    // -------------------------------------------------------------
    // 23. PATCH /admin/ai/hunter/sources/:sourceId (CEO configure source)
    // -------------------------------------------------------------
    app.patch('/admin/ai/hunter/sources/:sourceId', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const { sourceId } = req.params;
            const updates = req.body || {};
            const updated = await sourceRegistry.updateSourceConfig(sourceId, updates, getModels(), req.user);
            return res.status(200).json({ success: true, data: updated });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'CONFIG_UPDATE_FAILED',
                message: error.message || 'Failed to update source configuration'
            });
        }
    });

    // -------------------------------------------------------------
    // 24. GET /admin/ai/hunter/sources/:sourceId/health (Health status)
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/sources/:sourceId/health', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const { sourceId } = req.params;
            const connector = sourceRegistry.getConnector(sourceId);
            if (!connector) {
                return res.status(404).json({
                    success: false,
                    errorCode: HUNTER_ERROR_CODES.SOURCE_UNAVAILABLE,
                    message: `Source ${sourceId} not found.`
                });
            }
            const health = await connector.healthCheck();
            return res.status(200).json({ success: true, data: health });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 25. GET /admin/ai/hunter/sources/:sourceId/stats (Source stats & runs)
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/sources/:sourceId/stats', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const { sourceId } = req.params;
            const stats = await sourceRegistry.getSourceStats(sourceId, getModels());
            return res.status(200).json({ success: true, data: stats });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'STATS_FAILED',
                message: error.message || 'Failed to fetch source statistics'
        });
        }
    });

    // =============================================================
    // PROMPT 9.8: CONTACTABILITY LAYER API ROUTES
    // =============================================================

    // -------------------------------------------------------------
    // 26. GET /admin/ai/hunter/opportunities/:id/contactability
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/opportunities/:id/contactability', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const { id } = req.params;
            const result = await getContactability(id, getModels());
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'CONTACTABILITY_ERROR',
                message: error.message || 'Failed to fetch contactability data.'
            });
        }
    });

    // -------------------------------------------------------------
    // 27. POST /admin/ai/hunter/opportunities/:id/contactability/discover (CEO only)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/opportunities/:id/contactability/discover', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const { id } = req.params;
            const { providerId } = req.body || {};
            const result = await discoverContactRoutes(id, getModels(), req.user, { providerId });
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'CONTACT_DISCOVERY_FAILED',
                message: error.message || 'Contact route discovery failed.'
            });
        }
    });

    // -------------------------------------------------------------
    // 28. POST /admin/ai/hunter/opportunities/:id/contactability/add-route (CEO/Manager)
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/opportunities/:id/contactability/add-route', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const { id } = req.params;
            const routeData = req.body || {};
            const result = await addManualContactRoute(id, routeData, getModels(), req.user);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'ADD_ROUTE_FAILED',
                message: error.message || 'Failed to add manual contact route.'
            });
        }
    });

    // -------------------------------------------------------------
    // 29. PATCH /admin/ai/hunter/opportunities/:id/contactability/routes/:routeIndex/verify
    // -------------------------------------------------------------
    app.patch('/admin/ai/hunter/opportunities/:id/contactability/routes/:routeIndex/verify', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const { id, routeIndex } = req.params;
            const verificationData = req.body || {};
            const result = await verifyContactRoute(id, routeIndex, verificationData, getModels(), req.user);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'VERIFY_ROUTE_FAILED',
                message: error.message || 'Failed to verify contact route.'
            });
        }
    });

    // =============================================================
    // PROMPT 9.9: HUMAN SALES WORKFLOW & ANALYTICS ROUTES
    // =============================================================

    // -------------------------------------------------------------
    // 30. POST /admin/ai/hunter/opportunities/:id/contact-outcome (Manager+)
    // Record what happened when human contacted the prospect.
    // -------------------------------------------------------------
    app.post('/admin/ai/hunter/opportunities/:id/contact-outcome', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const { id } = req.params;
            const { outcome, notes } = req.body || {};
            const result = await recordHumanContactOutcome(id, { outcome, notes }, getModels(), req.user);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                errorCode: error.errorCode || 'OUTCOME_RECORD_FAILED',
                message: error.message || 'Failed to record contact outcome.'
            });
        }
    });

    // -------------------------------------------------------------
    // 31. GET /admin/ai/hunter/analytics/funnel (Manager+)
    // Extended funnel: signals→qualified→actionable→contactable→contacted→CRM→booking
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/analytics/funnel', authenticateAdmin, requireHunterManagerOrCeo, async (req, res) => {
        try {
            const result = await getExtendedFunnelAnalytics(getModels());
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({
                success: false,
                errorCode: 'ANALYTICS_FUNNEL_FAILED',
                message: error.message || 'Failed to fetch funnel analytics.'
            });
        }
    });

    // -------------------------------------------------------------
    // 32. GET /admin/ai/hunter/analytics/sources (CEO only)
    // Per-source quality: signals/qualified/actionable/contactable/converted
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/analytics/sources', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const result = await getSourceQualityAnalytics(getModels());
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({
                success: false,
                errorCode: 'SOURCE_ANALYTICS_FAILED',
                message: error.message || 'Failed to fetch source analytics.'
            });
        }
    });

    // -------------------------------------------------------------
    // 33. GET /admin/ai/hunter/contactability/providers (CEO only)
    // List all registered contact providers and their health.
    // -------------------------------------------------------------
    app.get('/admin/ai/hunter/contactability/providers', authenticateAdmin, requireCeoHunterAccess, async (req, res) => {
        try {
            const { contactProviderRegistry } = require('./contactability/contactabilityService');
            const providerList = contactProviderRegistry.listProviders();

            // Run health checks
            const healthResults = await Promise.allSettled(
                providerList.map(async p => {
                    const connector = contactProviderRegistry.getProvider(p.providerId);
                    if (!connector) return { providerId: p.providerId, health: { healthy: false, error: 'Not found' } };
                    try {
                        const health = await connector.healthCheck();
                        return { providerId: p.providerId, providerInfo: connector.getProviderInfo(), health };
                    } catch (err) {
                        return { providerId: p.providerId, health: { healthy: false, error: err.message } };
                    }
                })
            );

            const providers = healthResults.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message });
            return res.status(200).json({ success: true, data: { providers } });
        } catch (error) {
            return res.status(500).json({
                success: false,
                errorCode: 'PROVIDER_LIST_FAILED',
                message: error.message || 'Failed to list contact providers.'
            });
        }
    });
}

module.exports = {
    registerHunterRoutes
};
