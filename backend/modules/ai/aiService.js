/**
 * AI Runtime Orchestrator & Audit Service
 * Varanasi Yatra Platform — Prompt 5
 */

const crypto = require('crypto');
const { AI_RUN_STATUSES, AI_AUDIT_DECISIONS, AI_RISK_LEVELS, AI_ERROR_CODES } = require('./aiConstants');
const { validateAiExecution } = require('./aiAuthorization');

/**
 * Ensures singleton AI configuration document exists with production-safe defaults
 */
async function getOrCreateConfig(AIConfig, defaultUser = null) {
    let config = await AIConfig.findOne({ singletonKey: 'GLOBAL_AI_CONFIG' });
    if (!config) {
        config = await AIConfig.create({
            singletonKey: 'GLOBAL_AI_CONFIG',
            masterEnabled: true,
            safeMode: true,
            emergencyStop: false,
            environment: process.env.NODE_ENV || 'development',
            modules: {
                customerAssistant: { enabled: process.env.AI_CUSTOMER_ASSISTANT_ENABLED === 'true', safeModeRequired: true, allowedRoles: ['CEO', 'MANAGER'], allowedTools: ['crm.getLead', 'crm.getCustomer', 'crm.getTrip'] },
                salesAssistant: { enabled: process.env.AI_SALES_ASSISTANT_ENABLED === 'true', safeModeRequired: true, allowedRoles: ['CEO', 'MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER'], allowedTools: ['crm.getLead', 'crm.getQuote', 'crm.getSalesLeadContext', 'crm.generateCustomerMessage'] },
                customerHunter: { enabled: false, safeModeRequired: true, allowedRoles: ['CEO'], allowedTools: [] },
                localHunter: { enabled: false, safeModeRequired: true, allowedRoles: ['CEO'], allowedTools: [] },
                outsideHunter: { enabled: false, safeModeRequired: true, allowedRoles: ['CEO'], allowedTools: [] },
                voiceAi: { enabled: false, safeModeRequired: true, allowedRoles: ['CEO'], allowedTools: [] }
            },
            maxConcurrentRuns: 5,
            maxToolCallsPerRun: 10,
            dailyRunLimit: 200,
            provider: 'mock',
            model: 'mock-deterministic-v1',
            updatedBy: defaultUser ? defaultUser._id : null
        });
    }
    return config;
}

/**
 * Creates an immutable AI audit log record
 */
async function recordAuditEvent(AIAuditLog, entry) {
    try {
        return await AIAuditLog.create({
            runId: entry.runId || `RUN-UNKNOWN`,
            userId: entry.userId,
            actorRole: entry.actorRole || 'UNKNOWN',
            module: entry.module || 'SYSTEM_ANALYSIS',
            action: entry.action,
            tool: entry.tool || null,
            targetType: entry.targetType || 'system',
            targetId: entry.targetId ? String(entry.targetId) : null,
            decision: entry.decision,
            reason: entry.reason,
            riskLevel: entry.riskLevel || AI_RISK_LEVELS.LOW,
            metadata: entry.metadata || {},
            timestamp: new Date()
        });
    } catch (err) {
        console.error('❌ Failed to record AI audit log:', err.message);
        return null;
    }
}

/**
 * Executes an AI operation with end-to-end policy checks, tool isolation, and audit logging
 */
async function executeAiTask(models, { user, moduleName, taskType, parameters = {}, toolsToCall = [] }) {
    const { AIConfig, AIRun, AIAuditLog, Enquiry, Customer, Booking, Quote } = models;
    const startTime = Date.now();
    const runId = `RUN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const config = await getOrCreateConfig(AIConfig, user);

    // Context from authoritative server session (never from client request body)
    const userContext = {
        userId: user._id,
        role: user.role,
        permissions: user.permissions || [],
        teamName: user.assignment?.teamName || '',
        assignedAreas: user.assignment?.assignedAreas || []
    };

    // 1. Pre-Execution Policy Check
    if (!config.masterEnabled) {
        await recordAuditEvent(AIAuditLog, {
            runId,
            userId: user._id,
            actorRole: user.role,
            module: moduleName,
            action: taskType,
            decision: AI_AUDIT_DECISIONS.BLOCKED,
            reason: 'Master AI switch is OFF',
            riskLevel: AI_RISK_LEVELS.LOW
        });

        return {
            success: false,
            runId,
            status: AI_RUN_STATUSES.BLOCKED,
            errorCode: AI_ERROR_CODES.AI_DISABLED,
            message: 'AI runtime is disabled by the CEO.'
        };
    }

    if (config.emergencyStop) {
        await recordAuditEvent(AIAuditLog, {
            runId,
            userId: user._id,
            actorRole: user.role,
            module: moduleName,
            action: taskType,
            decision: AI_AUDIT_DECISIONS.BLOCKED,
            reason: 'AI Emergency Stop is ACTIVE',
            riskLevel: AI_RISK_LEVELS.CRITICAL
        });

        return {
            success: false,
            runId,
            status: AI_RUN_STATUSES.BLOCKED,
            errorCode: AI_ERROR_CODES.EMERGENCY_STOP,
            message: 'AI Emergency Stop is currently ACTIVE.'
        };
    }

    // 2. Module Authorization Check
    const moduleKeyMap = {
        CUSTOMER_ASSISTANT: 'customerAssistant',
        SALES_ASSISTANT: 'salesAssistant',
        CUSTOMER_HUNTER: 'customerHunter',
        LOCAL_HUNTER: 'localHunter',
        OUTSIDE_HUNTER: 'outsideHunter',
        VOICE_AI: 'voiceAi'
    };
    const configKey = moduleKeyMap[moduleName];
    if (configKey && config.modules && config.modules[configKey] && !config.modules[configKey].enabled) {
        await recordAuditEvent(AIAuditLog, {
            runId,
            userId: user._id,
            actorRole: user.role,
            module: moduleName,
            action: taskType,
            decision: AI_AUDIT_DECISIONS.BLOCKED,
            reason: `AI Module '${moduleName}' is disabled in configuration`,
            riskLevel: AI_RISK_LEVELS.MEDIUM
        });

        return {
            success: false,
            runId,
            status: AI_RUN_STATUSES.BLOCKED,
            errorCode: AI_ERROR_CODES.MODULE_DISABLED,
            message: `AI Module '${moduleName}' is currently disabled.`
        };
    }

    // 2. Throttle / Limit Check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyCount = await AIRun.countDocuments({ createdAt: { $gte: today } });
    if (dailyCount >= (config.dailyRunLimit || 200)) {
        await recordAuditEvent(AIAuditLog, {
            runId,
            userId: user._id,
            actorRole: user.role,
            module: moduleName,
            action: taskType,
            decision: AI_AUDIT_DECISIONS.BLOCKED,
            reason: `Daily run limit of ${config.dailyRunLimit} exceeded`,
            riskLevel: AI_RISK_LEVELS.MEDIUM
        });

        return {
            success: false,
            runId,
            status: AI_RUN_STATUSES.BLOCKED,
            errorCode: AI_ERROR_CODES.RATE_LIMITED,
            message: 'Daily AI operation limit reached.'
        };
    }

    // 3. Create AIRun Record in RUNNING State
    const runDoc = await AIRun.create({
        runId,
        userId: user._id,
        userRole: user.role,
        module: moduleName,
        taskType,
        status: AI_RUN_STATUSES.RUNNING,
        safeMode: config.safeMode,
        startedAt: new Date(),
        toolCallCount: 0,
        toolCalls: [],
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        metadata: { parameters }
    });

    const toolCallsExecuted = [];
    const blockedActions = [];
    let requiresApproval = false;
    let approvalDetails = null;

    // 4. Tool Execution Loop with Granular Guardrails
    for (const toolReq of toolsToCall) {
        const { tool: toolName, input = {} } = toolReq;
        const validation = validateAiExecution(config, userContext, toolName, moduleName);

        if (!validation.allowed) {
            blockedActions.push({ tool: toolName, reason: validation.reason, errorCode: validation.errorCode });
            
            toolCallsExecuted.push({
                tool: toolName,
                input,
                output: { error: validation.reason },
                riskLevel: validation.tool?.riskLevel || AI_RISK_LEVELS.HIGH,
                decision: AI_AUDIT_DECISIONS.BLOCKED,
                executedAt: new Date()
            });

            await recordAuditEvent(AIAuditLog, {
                runId,
                userId: user._id,
                actorRole: user.role,
                module: moduleName,
                action: `tool_execution:${toolName}`,
                tool: toolName,
                decision: AI_AUDIT_DECISIONS.BLOCKED,
                reason: validation.reason,
                riskLevel: validation.tool?.riskLevel || AI_RISK_LEVELS.HIGH
            });
            continue;
        }

        const toolDef = validation.tool;

        // Check if tool requires human approval in this workflow
        if (toolDef.riskLevel === AI_RISK_LEVELS.HIGH || toolDef.riskLevel === AI_RISK_LEVELS.CRITICAL) {
            requiresApproval = true;
            approvalDetails = {
                tool: toolName,
                input,
                riskLevel: toolDef.riskLevel,
                reason: 'High-risk action requires human approval'
            };

            toolCallsExecuted.push({
                tool: toolName,
                input,
                output: { pendingApproval: true },
                riskLevel: toolDef.riskLevel,
                decision: AI_AUDIT_DECISIONS.APPROVAL_REQUIRED,
                executedAt: new Date()
            });

            await recordAuditEvent(AIAuditLog, {
                runId,
                userId: user._id,
                actorRole: user.role,
                module: moduleName,
                action: `tool_execution:${toolName}`,
                tool: toolName,
                decision: AI_AUDIT_DECISIONS.APPROVAL_REQUIRED,
                reason: 'Action routed to human approval queue',
                riskLevel: toolDef.riskLevel
            });
            continue;
        }

        // Execute Approved Read-Only Tool
        try {
            const toolResult = await toolDef.execute(input, userContext, { Enquiry, Customer, Booking, Quote });
            
            toolCallsExecuted.push({
                tool: toolName,
                input,
                output: toolResult,
                riskLevel: toolDef.riskLevel,
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                executedAt: new Date()
            });

            await recordAuditEvent(AIAuditLog, {
                runId,
                userId: user._id,
                actorRole: user.role,
                module: moduleName,
                action: `tool_execution:${toolName}`,
                tool: toolName,
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                reason: 'Tool executed successfully within permitted scope',
                riskLevel: toolDef.riskLevel
            });
        } catch (err) {
            toolCallsExecuted.push({
                tool: toolName,
                input,
                output: { error: err.message },
                riskLevel: toolDef.riskLevel,
                decision: AI_AUDIT_DECISIONS.FAILED,
                executedAt: new Date()
            });

            await recordAuditEvent(AIAuditLog, {
                runId,
                userId: user._id,
                actorRole: user.role,
                module: moduleName,
                action: `tool_execution:${toolName}`,
                tool: toolName,
                decision: AI_AUDIT_DECISIONS.FAILED,
                reason: err.message,
                riskLevel: toolDef.riskLevel
            });
        }
    }

    // 5. Synthesize Deterministic Intelligence / Analysis Output
    const latencyMs = Date.now() - startTime;
    let summary = `AI Analysis completed for ${taskType}.`;
    const recommendations = [];

    if (taskType === 'lead_summary') {
        const leadData = toolCallsExecuted.find(t => t.tool === 'crm.getLead')?.output?.lead;
        if (leadData) {
            summary = `Lead analysis for ${leadData.name || 'guest'}: Interested in ${leadData.requirement || 'Varanasi pilgrimage'}. Location: ${leadData.city || 'Not specified'}.`;
            recommendations.push('Suggest Kashi Vishwanath VIP Darshan and Subah-e-Banaras Boat Tour.');
            recommendations.push('Check travel dates and offer customized hotel options.');
        } else {
            summary = 'Lead summary generated. No specific lead profile linked.';
        }
    } else if (taskType === 'itinerary_suggestion') {
        summary = 'Generated 3-day spiritual Varanasi itinerary template with morning Ganga Aarti, Sarnath excursion, and temple darshans.';
        recommendations.push('Day 1: Dashashwamedh Ghat Ganga Aarti & Godaulia Bazaar');
        recommendations.push('Day 2: Kashi Vishwanath, Annapurna, and Manikarnika Heritage Walk');
        recommendations.push('Day 3: Sarnath Dhamek Stupa and Deer Park Tour');
    } else {
        summary = `Task '${taskType}' processed in Safe Mode. Output contains authorized guidance only.`;
        recommendations.push('All recommended packages follow standard Kashi-Vashi rate rules.');
    }

    const resultPayload = {
        summary,
        recommendations,
        contextExamined: toolCallsExecuted.length,
        safeModeEnforced: config.safeMode,
        blockedActions
    };

    // 6. Complete AIRun Document
    runDoc.status = AI_RUN_STATUSES.COMPLETED;
    runDoc.completedAt = new Date();
    runDoc.latencyMs = latencyMs;
    runDoc.toolCallCount = toolCallsExecuted.length;
    runDoc.toolCalls = toolCallsExecuted;
    runDoc.tokenUsage = { promptTokens: 120, completionTokens: 85, totalTokens: 205 };
    runDoc.result = resultPayload;
    runDoc.requiresApproval = requiresApproval;
    runDoc.approvalDetails = approvalDetails;
    await runDoc.save();

    // 7. Audit Event for Run Completion
    await recordAuditEvent(AIAuditLog, {
        runId,
        userId: user._id,
        actorRole: user.role,
        module: moduleName,
        action: `run_completed:${taskType}`,
        decision: AI_AUDIT_DECISIONS.ALLOWED,
        reason: `Run completed in ${latencyMs}ms with ${toolCallsExecuted.length} tool calls`,
        riskLevel: AI_RISK_LEVELS.LOW,
        metadata: { latencyMs, toolCallCount: toolCallsExecuted.length }
    });

    return {
        success: true,
        runId,
        status: AI_RUN_STATUSES.COMPLETED,
        type: taskType,
        summary,
        recommendations,
        requiresApproval,
        approvalDetails,
        blockedActions,
        latencyMs,
        tokenUsage: runDoc.tokenUsage
    };
}

module.exports = {
    getOrCreateConfig,
    recordAuditEvent,
    executeAiTask
};
