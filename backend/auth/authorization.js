/**
 * Centralized Authorization Logic & Hierarchy Validation
 * Varanasi Yatra Platform
 */

const { ROLES, normalizeRole, isCEO } = require('./roles');
const { PERMISSIONS, ROLE_CAPABILITIES } = require('./permissions');

/**
 * Calculates effective permissions for a user
 * @param {object} user
 * @returns {string[]}
 */
function getEffectivePermissions(user) {
    if (!user || !user.role) return [];
    const role = normalizeRole(user.role);
    if (role === ROLES.CEO) {
        return Object.values(PERMISSIONS);
    }
    const base = ROLE_CAPABILITIES[role] || [];
    const custom = Array.isArray(user.permissions) ? user.permissions : [];
    return Array.from(new Set([...base, ...custom]));
}

/**
 * Checks whether a user holds a specific permission
 * @param {object} user
 * @param {string} permission
 * @returns {boolean}
 */
function hasPermission(user, permission) {
    if (!user || !user.role) return false;
    if (isCEO(user.role)) return true;
    const perms = getEffectivePermissions(user);
    return perms.includes(permission);
}

/**
 * Validates reporting hierarchy relationships
 * @param {string} role Target user role
 * @param {object|null} reportsToUser The User document being reported to
 * @param {string|null} currentUserId ID of user being edited (to prevent self-reporting)
 * @returns {{ valid: boolean, error?: string }}
 */
function validateHierarchy(role, reportsToUser, currentUserId = null) {
    const targetRole = normalizeRole(role);

    // 1. Cannot report to self
    if (reportsToUser && currentUserId && String(reportsToUser._id || reportsToUser.id) === String(currentUserId)) {
        return { valid: false, error: "A user cannot report to themselves." };
    }

    // 2. CEO cannot report to anyone
    if (targetRole === ROLES.CEO && reportsToUser) {
        return { valid: false, error: "CEO cannot report to another user." };
    }

    if (!reportsToUser) {
        // CEO and Manager can have null reportsTo
        if (targetRole === ROLES.TEAM_MEMBER) {
            return { valid: false, error: "Team Member must report to a Team Leader or Manager." };
        }
        return { valid: true };
    }

    const parentRole = normalizeRole(reportsToUser.role);

    // 3. Manager can report to CEO
    if (targetRole === ROLES.MANAGER) {
        if (parentRole !== ROLES.CEO) {
            return { valid: false, error: "A Manager can only report directly to the CEO." };
        }
    }

    // 4. Team Leader should report to Manager or CEO
    if (targetRole === ROLES.TEAM_LEADER) {
        if (parentRole !== ROLES.MANAGER && parentRole !== ROLES.CEO) {
            return { valid: false, error: "A Team Leader must report to a Manager or CEO." };
        }
    }

    // 5. Team Member should report to Team Leader or Manager
    if (targetRole === ROLES.TEAM_MEMBER) {
        if (parentRole !== ROLES.TEAM_LEADER && parentRole !== ROLES.MANAGER) {
            return { valid: false, error: "A Team Member must report to a Team Leader or Manager." };
        }
    }

    return { valid: true };
}

/**
 * Validates whether an actor can assign a lead to a target assignee
 * @param {object} actor Current authenticated user
 * @param {object} targetUser The user being assigned the lead
 * @returns {boolean}
 */
function canAssignLead(actor, targetUser) {
    if (!actor || !targetUser) return false;
    const actorRole = normalizeRole(actor.role);

    // CEO and Manager can assign to anyone
    if (actorRole === ROLES.CEO || actorRole === ROLES.MANAGER) {
        return true;
    }

    // Team Leader can assign to themselves or Team Members reporting to them or in their team
    if (actorRole === ROLES.TEAM_LEADER) {
        const actorId = String(actor.id || actor._id);
        const targetId = String(targetUser.id || targetUser._id);
        if (actorId === targetId) return true;

        const reportsToId = targetUser.reportsTo ? String(targetUser.reportsTo._id || targetUser.reportsTo) : null;
        if (reportsToId === actorId) return true;

        const actorTeam = actor.assignment?.teamName;
        const targetTeam = targetUser.assignment?.teamName;
        if (actorTeam && targetTeam && actorTeam === targetTeam) return true;
    }

    // Team Members cannot assign leads
    return false;
}

module.exports = {
    getEffectivePermissions,
    hasPermission,
    validateHierarchy,
    canAssignLead
};
