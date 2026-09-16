/**
 * AI Gateway & Management Routes
 * Varanasi Yatra Platform — Prompt 5
 */

const { getOrCreateConfig, recordAuditEvent, executeAiTask } = require('./aiService');
const { AI_AUDIT_DECISIONS, AI_RISK_LEVELS } = require('./aiConstants');

function registerAiRoutes(app, {
    AIConfig,
    AIRun,
    AIAuditLog,
    AIOpportunity,
    Enquiry,
    Customer,
    Booking,
    Quote,
    authenticateToken,
    requireRole
}) {
    // -------------------------------------------------------------
    // 1. HEALTH & METRICS ENDPOINT
    // -------------------------------------------------------------
    app.get('/admin/ai/health', async (req, res) => {
        try {
            const config = await getOrCreateConfig(AIConfig);
            return res.status(200).json({
                success: true,
                status: config.emergencyStop ? 'EMERGENCY_STOPPED' : (config.masterEnabled ? 'ONLINE' : 'DISABLED'),
                enabled: config.masterEnabled,
                safeMode: config.safeMode,
                emergencyStop: config.emergencyStop,
                providerConfigured: true,
                version: '1.0.0',
                environment: config.environment
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 2. CONFIGURATION MANAGEMENT (CEO Only)
    // -------------------------------------------------------------
    app.get('/admin/ai/config', authenticateToken, requireRole('CEO', 'MANAGER'), async (req, res) => {
        try {
            const config = await getOrCreateConfig(AIConfig, req.user);
            const isCeo = req.user.role === 'CEO';

            // Safe serialization: Never expose provider secrets
            const sanitized = {
                masterEnabled: config.masterEnabled,
                safeMode: config.safeMode,
                emergencyStop: config.emergencyStop,
                emergencyStoppedAt: config.emergencyStoppedAt,
                environment: config.environment,
                modules: config.modules,
                maxConcurrentRuns: config.maxConcurrentRuns,
                maxToolCallsPerRun: config.maxToolCallsPerRun,
                dailyRunLimit: config.dailyRunLimit,
                provider: isCeo ? config.provider : 'CONFIGURED',
                model: isCeo ? config.model : 'PROTECTED',
                updatedAt: config.updatedAt
            };

            return res.status(200).json({ success: true, config: sanitized });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    app.patch('/admin/ai/config', authenticateToken, requireRole('CEO'), async (req, res) => {
        try {
            const config = await getOrCreateConfig(AIConfig, req.user);
            const {
                masterEnabled,
                safeMode,
                modules,
                maxConcurrentRuns,
                maxToolCallsPerRun,
                dailyRunLimit,
                provider,
                model
            } = req.body;

            if (masterEnabled !== undefined) config.masterEnabled = Boolean(masterEnabled);
            if (safeMode !== undefined) config.safeMode = Boolean(safeMode);
            if (maxConcurrentRuns !== undefined) config.maxConcurrentRuns = Math.max(1, Number(maxConcurrentRuns) || 5);
            if (maxToolCallsPerRun !== undefined) config.maxToolCallsPerRun = Math.max(1, Number(maxToolCallsPerRun) || 10);
            if (dailyRunLimit !== undefined) config.dailyRunLimit = Math.max(1, Number(dailyRunLimit) || 200);
            if (provider) config.provider = String(provider);
            if (model) config.model = String(model);

            // Granular module update (preserving safety: Hunter modules remain controlled)
            if (modules && typeof modules === 'object') {
                if (modules.customerAssistant) Object.assign(config.modules.customerAssistant, modules.customerAssistant);
                if (modules.salesAssistant) Object.assign(config.modules.salesAssistant, modules.salesAssistant);
                if (modules.customerHunter) Object.assign(config.modules.customerHunter, modules.customerHunter);
                if (modules.localHunter) Object.assign(config.modules.localHunter, modules.localHunter);
                if (modules.outsideHunter) Object.assign(config.modules.outsideHunter, modules.outsideHunter);
                if (modules.voiceAi) Object.assign(config.modules.voiceAi, modules.voiceAi);
            }

            config.updatedBy = req.user._id;
            config.updatedAt = new Date();
            await config.save();

            await recordAuditEvent(AIAuditLog, {
                runId: `CFG-${Date.now()}`,
                userId: req.user._id,
                actorRole: req.user.role,
                module: 'SYSTEM_ANALYSIS',
                action: 'update_configuration',
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                reason: 'CEO updated AI system parameters',
                riskLevel: AI_RISK_LEVELS.MEDIUM,
                metadata: { masterEnabled: config.masterEnabled, safeMode: config.safeMode }
            });

            return res.status(200).json({ success: true, message: 'AI configuration updated.', config });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // Emergency Stop Toggle (CEO Only)
    app.post('/admin/ai/config/emergency-stop', authenticateToken, requireRole('CEO'), async (req, res) => {
        try {
            const config = await getOrCreateConfig(AIConfig, req.user);
            const { active } = req.body;
            const willStop = active !== undefined ? Boolean(active) : !config.emergencyStop;

            config.emergencyStop = willStop;
            config.emergencyStoppedAt = willStop ? new Date() : null;
            config.emergencyStoppedBy = willStop ? req.user._id : null;
            config.updatedBy = req.user._id;
            config.updatedAt = new Date();
            await config.save();

            await recordAuditEvent(AIAuditLog, {
                runId: `EMG-${Date.now()}`,
                userId: req.user._id,
                actorRole: req.user.role,
                module: 'SYSTEM_ANALYSIS',
                action: willStop ? 'activate_emergency_stop' : 'clear_emergency_stop',
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                reason: willStop ? 'CEO activated AI Emergency Stop' : 'CEO cleared AI Emergency Stop',
                riskLevel: AI_RISK_LEVELS.CRITICAL
            });

            return res.status(200).json({
                success: true,
                emergencyStop: config.emergencyStop,
                message: willStop ? '🚨 AI Emergency Stop ACTIVATED. All runs blocked.' : 'AI Emergency Stop cleared.'
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // Safe Mode Toggle (CEO Only)
    app.post('/admin/ai/config/safe-mode', authenticateToken, requireRole('CEO'), async (req, res) => {
        try {
            const config = await getOrCreateConfig(AIConfig, req.user);
            const { enabled } = req.body;
            config.safeMode = enabled !== undefined ? Boolean(enabled) : !config.safeMode;
            config.updatedBy = req.user._id;
            config.updatedAt = new Date();
            await config.save();

            await recordAuditEvent(AIAuditLog, {
                runId: `SM-${Date.now()}`,
                userId: req.user._id,
                actorRole: req.user.role,
                module: 'SYSTEM_ANALYSIS',
                action: 'toggle_safe_mode',
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                reason: `CEO set Safe Mode to ${config.safeMode}`,
                riskLevel: AI_RISK_LEVELS.HIGH
            });

            return res.status(200).json({ success: true, safeMode: config.safeMode });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // Master Switch Toggle (CEO Only)
    app.post('/admin/ai/config/master-toggle', authenticateToken, requireRole('CEO'), async (req, res) => {
        try {
            const config = await getOrCreateConfig(AIConfig, req.user);
            const { enabled } = req.body;
            config.masterEnabled = enabled !== undefined ? Boolean(enabled) : !config.masterEnabled;
            config.updatedBy = req.user._id;
            config.updatedAt = new Date();
            await config.save();

            await recordAuditEvent(AIAuditLog, {
                runId: `MST-${Date.now()}`,
                userId: req.user._id,
                actorRole: req.user.role,
                module: 'SYSTEM_ANALYSIS',
                action: 'toggle_master_ai',
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                reason: `CEO set Master AI to ${config.masterEnabled}`,
                riskLevel: AI_RISK_LEVELS.HIGH
            });

            return res.status(200).json({ success: true, masterEnabled: config.masterEnabled });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 3. AI RUN EXECUTION
    // -------------------------------------------------------------
    app.post('/admin/ai/run', authenticateToken, requireRole('CEO', 'MANAGER'), async (req, res) => {
        try {
            const { module: moduleName, taskType, parameters, toolsToCall } = req.body;

            if (!moduleName || !taskType) {
                return res.status(400).json({ success: false, message: 'module and taskType are required' });
            }

            const result = await executeAiTask(
                { AIConfig, AIRun, AIAuditLog, Enquiry, Customer, Booking, Quote },
                {
                    user: req.user,
                    moduleName,
                    taskType,
                    parameters: parameters || {},
                    toolsToCall: toolsToCall || []
                }
            );

            if (!result.success && result.errorCode) {
                return res.status(403).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('AI Execution Error:', error);
            return res.status(500).json({ success: false, message: 'AI execution encountered an unexpected error.' });
        }
    });

    // -------------------------------------------------------------
    // 4. RUN TRACKING & AUDIT LOGS
    // -------------------------------------------------------------
    app.get('/admin/ai/runs', authenticateToken, requireRole('CEO', 'MANAGER'), async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
            const filter = {};

            if (req.query.module) filter.module = req.query.module;
            if (req.query.status) filter.status = req.query.status;

            const [runs, total] = await Promise.all([
                AIRun.find(filter)
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .select('-__v'),
                AIRun.countDocuments(filter)
            ]);

            return res.status(200).json({
                success: true,
                runs,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    app.get('/admin/ai/runs/:id', authenticateToken, requireRole('CEO', 'MANAGER'), async (req, res) => {
        try {
            const run = await AIRun.findOne({ runId: req.params.id }) || await AIRun.findById(req.params.id);
            if (!run) return res.status(404).json({ success: false, message: 'AI run not found' });
            return res.status(200).json({ success: true, run });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    app.get('/admin/ai/audit', authenticateToken, requireRole('CEO', 'MANAGER'), async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
            const filter = {};

            if (req.query.decision) filter.decision = req.query.decision;
            if (req.query.module) filter.module = req.query.module;
            if (req.query.tool) filter.tool = req.query.tool;

            const [logs, total] = await Promise.all([
                AIAuditLog.find(filter)
                    .sort({ timestamp: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                AIAuditLog.countDocuments(filter)
            ]);

            return res.status(200).json({
                success: true,
                logs,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 5. OPPORTUNITY QUEUE (Future Hunter Foundation)
    // -------------------------------------------------------------
    app.get('/admin/ai/opportunities', authenticateToken, requireRole('CEO', 'MANAGER'), async (req, res) => {
        try {
            const filter = {};
            if (req.query.status) filter.status = req.query.status;
            if (req.query.source) filter.source = req.query.source;

            const opportunities = await AIOpportunity.find(filter).sort({ createdAt: -1 }).limit(50);
            return res.status(200).json({
                success: true,
                count: opportunities.length,
                opportunities,
                notice: 'AI Customer Hunter is currently inactive. Opportunities are foundation fixtures or pending review.'
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    app.patch('/admin/ai/opportunities/:id', authenticateToken, requireRole('CEO'), async (req, res) => {
        try {
            const opp = await AIOpportunity.findOne({ opportunityId: req.params.id }) || await AIOpportunity.findById(req.params.id);
            if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found' });

            const { status, verificationStatus, reviewNotes } = req.body;
            if (status) opp.status = status;
            if (verificationStatus) opp.verificationStatus = verificationStatus;
            if (reviewNotes !== undefined) opp.reviewNotes = reviewNotes;

            opp.reviewedBy = req.user._id;
            opp.reviewedAt = new Date();
            await opp.save();

            return res.status(200).json({ success: true, opportunity: opp });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 6. INTERNAL AI TOOL DISPATCH (Service-to-Service Loopback Only)
    // -------------------------------------------------------------
    app.post('/internal/ai/tools/execute', async (req, res) => {
        try {
            const serviceKey = req.headers['x-ai-service-key'];
            const expectedKey = process.env.AI_SERVICE_SECRET || 'varanasi-yatra-internal-ai-key-2026';
            if (!serviceKey || serviceKey !== expectedKey) {
                return res.status(401).json({ success: false, message: 'Unauthorized service-to-service call' });
            }

            const { tool: toolName, input = {}, userContext = {} } = req.body;
            const { getToolDefinition } = require('./aiTools');
            const toolDef = getToolDefinition(toolName);

            if (!toolDef || !toolDef.enabled) {
                return res.status(400).json({ success: false, message: `Tool '${toolName}' is not available or disabled` });
            }

            const result = await toolDef.execute(input, userContext, { Enquiry, Customer, Booking, Quote });
            return res.status(200).json({ success: true, result });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });
}

module.exports = {
    registerAiRoutes
};
