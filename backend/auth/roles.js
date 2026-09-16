/**
 * Canonical Role Definitions & Normalization Helpers
 * Varanasi Yatra Platform
 */

const ROLES = Object.freeze({
    CEO: 'CEO',
    MANAGER: 'MANAGER',
    TEAM_LEADER: 'TEAM_LEADER',
    TEAM_MEMBER: 'TEAM_MEMBER'
});

const ALL_ROLES = Object.values(ROLES);

/**
 * Normalizes any legacy or case-variant role string into a canonical role
 * @param {string} role
 * @returns {string} Normalized canonical role
 */
function normalizeRole(role) {
    if (!role) return ROLES.MANAGER;
    const clean = String(role).toUpperCase().trim();
    if (clean === 'CEO') return ROLES.CEO;
    if (clean === 'MANAGER' || clean === 'OPERATION' || clean === 'OPERATIONS') return ROLES.MANAGER;
    if (clean === 'TEAM_LEADER' || clean === 'TEAMLEADER' || clean === 'LEAD') return ROLES.TEAM_LEADER;
    if (clean === 'TEAM_MEMBER' || clean === 'TEAMMEMBER' || clean === 'MEMBER' || clean === 'STAFF') return ROLES.TEAM_MEMBER;
    return clean;
}

function isCEO(role) {
    return normalizeRole(role) === ROLES.CEO;
}

function isManager(role) {
    return normalizeRole(role) === ROLES.MANAGER;
}

function isTeamLeader(role) {
    return normalizeRole(role) === ROLES.TEAM_LEADER;
}

function isTeamMember(role) {
    return normalizeRole(role) === ROLES.TEAM_MEMBER;
}

function isManagerOrAbove(role) {
    const norm = normalizeRole(role);
    return norm === ROLES.CEO || norm === ROLES.MANAGER;
}

function isTeamLeaderOrAbove(role) {
    const norm = normalizeRole(role);
    return norm === ROLES.CEO || norm === ROLES.MANAGER || norm === ROLES.TEAM_LEADER;
}

module.exports = {
    ROLES,
    ALL_ROLES,
    normalizeRole,
    isCEO,
    isManager,
    isTeamLeader,
    isTeamMember,
    isManagerOrAbove,
    isTeamLeaderOrAbove
};
