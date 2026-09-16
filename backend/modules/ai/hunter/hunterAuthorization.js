/**
 * AI Customer Hunter Authorization & Scoping Guards
 * Varanasi Yatra Platform — Prompt 8
 */

const { HUNTER_ERROR_CODES } = require('./hunterConstants');

/**
 * Verify user has CEO role for global Hunter operations
 */
function requireCeoHunterAccess(req, res, next) {
    const role = req.user?.role?.toUpperCase();
    if (role !== 'CEO') {
        return res.status(403).json({
            success: false,
            errorCode: HUNTER_ERROR_CODES.UNAUTHORIZED_ACTION,
            message: 'Access denied: Only the CEO can perform global Hunter operations.'
        });
    }
    next();
}

/**
 * Verify user has at least Manager or CEO access
 */
function requireHunterManagerOrCeo(req, res, next) {
    const role = req.user?.role?.toUpperCase();
    if (role !== 'CEO' && role !== 'MANAGER') {
        return res.status(403).json({
            success: false,
            errorCode: HUNTER_ERROR_CODES.SCOPE_VIOLATION,
            message: 'Access denied: Manager or CEO authorization required.'
        });
    }
    next();
}

/**
 * Verify opportunity scope for review/view
 */
function canUserAccessOpportunity(user, opportunity) {
    if (!user || !opportunity) return false;
    const role = user.role?.toUpperCase();

    // CEO has global access
    if (role === 'CEO') return true;

    // Manager can view ONLY opportunities verified/approved by CEO
    const isVerifiedByCeo = opportunity.status === 'APPROVED'
        || opportunity.verificationStatus === 'HUMAN_VERIFIED'
        || opportunity.humanVerificationStatus === 'CEO_VERIFIED'
        || ['READY_FOR_MANAGER', 'GENUINE', 'APPROVED', 'CONVERTED'].includes(opportunity.lifecycleState);

    if (role === 'MANAGER') {
        return isVerifiedByCeo;
    }

    // Team Leader can only access opportunities assigned to their team or directly to them
    if (role === 'TEAM_LEADER') {
        const teamId = opportunity.assignedTeamId || opportunity.assignedTeam;
        if (teamId && String(teamId) === String(user.teamId)) {
            return true;
        }
        if (opportunity.assignedTo && String(opportunity.assignedTo) === String(user.id || user._id)) {
            return true;
        }
        return false;
    }

    // Team Member can only access opportunities assigned directly to them
    if (role === 'TEAM_MEMBER') {
        return Boolean(opportunity.assignedTo && String(opportunity.assignedTo) === String(user.id || user._id));
    }

    return false;
}

/**
 * Sanitize opportunity for non-CEO roles
 */
function sanitizeOpportunityForRole(opportunity, role) {
    if (!opportunity) return null;
    const oppObj = opportunity.toObject ? opportunity.toObject() : { ...opportunity };
    const upperRole = String(role || '').toUpperCase();

    if (upperRole !== 'CEO') {
        // Strip sensitive internal config or private metadata if any
        delete oppObj.vendorCost;
        delete oppObj.vendorMargin;
        delete oppObj.companyMargin;
        delete oppObj.companyProfit;
        delete oppObj.expectedProfit;
        delete oppObj.estimatedProfit;
        delete oppObj.internalCeoNotes;
    }

    return oppObj;
}

module.exports = {
    requireCeoHunterAccess,
    requireHunterManagerOrCeo,
    canUserAccessOpportunity,
    sanitizeOpportunityForRole
};
