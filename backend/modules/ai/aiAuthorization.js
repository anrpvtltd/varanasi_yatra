/**
 * AI Tool Authorization & Guardrail Policies
 * Varanasi Yatra Platform — Prompt 5
 */

const { AI_ERROR_CODES } = require('./aiConstants');
const { getToolDefinition } = require('./aiTools');

/**
 * Validates whether an AI execution or tool call is permitted
 * under current system configuration, user role, and safety policies.
 * 
 * Hierarchy:
 * 1. Master Switch (Must be ON)
 * 2. Emergency Stop (Must be OFF)
 * 3. Module Authorization (Module must be enabled unless system task)
 * 4. Safe Mode Policy (Restricts High/Critical write tools)
 * 5. Tool Allowlist Check (Tool must exist and be enabled)
 * 6. User CRM Permission Check (User must hold required permission)
 * 7. Financial Shielding Guard (Redacts proprietary costs from non-CEO)
 */
function validateAiExecution(config, userContext, toolName, moduleName = null) {
    // 1. Master Switch
    if (!config.masterEnabled) {
        return {
            allowed: false,
            decision: 'BLOCKED',
            reason: 'Master AI switch is turned OFF by CEO',
            errorCode: AI_ERROR_CODES.AI_DISABLED
        };
    }

    // 2. Emergency Stop
    if (config.emergencyStop) {
        return {
            allowed: false,
            decision: 'BLOCKED',
            reason: 'AI Emergency Stop is currently ACTIVE',
            errorCode: AI_ERROR_CODES.EMERGENCY_STOP
        };
    }

    // 3. Resolve Tool Definition
    const tool = getToolDefinition(toolName);
    if (!tool) {
        return {
            allowed: false,
            decision: 'BLOCKED',
            reason: `Tool '${toolName}' is not in the approved AI tool registry`,
            errorCode: AI_ERROR_CODES.TOOL_DISABLED
        };
    }

    if (!tool.enabled) {
        return {
            allowed: false,
            decision: 'BLOCKED',
            reason: `Tool '${toolName}' is currently disabled in this deployment phase`,
            errorCode: AI_ERROR_CODES.TOOL_DISABLED
        };
    }

    // 4. Safe Mode Policy
    if (config.safeMode && !tool.safeModeAllowed) {
        return {
            allowed: false,
            decision: 'BLOCKED',
            reason: `Tool '${toolName}' requires write/mutation access which is prohibited while Safe Mode is ON`,
            errorCode: AI_ERROR_CODES.SAFE_MODE_BLOCKED
        };
    }

    // 5. Module Authorization Check
    const targetModule = moduleName || tool.module;
    if (targetModule && config.modules) {
        let moduleConfig = null;
        if (targetModule === 'CUSTOMER_ASSISTANT') moduleConfig = config.modules.customerAssistant;
        else if (targetModule === 'SALES_ASSISTANT') moduleConfig = config.modules.salesAssistant;
        else if (targetModule === 'CUSTOMER_HUNTER') moduleConfig = config.modules.customerHunter;
        else if (targetModule === 'LOCAL_HUNTER') moduleConfig = config.modules.localHunter;
        else if (targetModule === 'OUTSIDE_HUNTER') moduleConfig = config.modules.outsideHunter;
        else if (targetModule === 'VOICE_AI') moduleConfig = config.modules.voiceAi;

        if (moduleConfig && !moduleConfig.enabled) {
            return {
                allowed: false,
                decision: 'BLOCKED',
                reason: `AI Module '${targetModule}' is disabled in configuration`,
                errorCode: AI_ERROR_CODES.TOOL_DISABLED
            };
        }
    }

    // 6. User CRM Role & Permission Enforcement
    const role = (userContext.role || '').toUpperCase();
    const permissions = Array.isArray(userContext.permissions) ? userContext.permissions : [];

    // CEO holds universal authorization
    if (role !== 'CEO') {
        // Must possess the specific permission associated with the tool
        if (tool.permission && !permissions.includes(tool.permission)) {
            return {
                allowed: false,
                decision: 'BLOCKED',
                reason: `User role '${role}' lacks required permission '${tool.permission}' to execute '${toolName}'`,
                errorCode: AI_ERROR_CODES.PERMISSION_DENIED
            };
        }

        // Strict Financial Privacy Boundary
        if (tool.permission === 'FINANCIALS_MANAGE' || tool.permission === 'FINANCIALS_VIEW') {
            return {
                allowed: false,
                decision: 'BLOCKED',
                reason: `Financial accounting operations are strictly restricted to executive CEO authority`,
                errorCode: AI_ERROR_CODES.PERMISSION_DENIED
            };
        }
    }

    return {
        allowed: true,
        decision: 'ALLOWED',
        reason: 'Authorized by role, module policy, and safe mode rules',
        tool
    };
}

module.exports = {
    validateAiExecution
};
