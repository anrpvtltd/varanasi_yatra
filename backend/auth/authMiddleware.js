/**
 * Centralized Authentication & Authorization Middleware
 * Varanasi Yatra Platform
 */

const jwt = require('jsonwebtoken');
const { normalizeRole, isCEO } = require('./roles');
const { hasPermission, getEffectivePermissions } = require('./authorization');

function createAuthMiddleware(env, User = null, _AuthSession = null) {
    /**
     * Authenticates JWT token from Authorization header or query parameter
     */
    const authenticateToken = async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "Access token missing. Please log in." });
        }

        jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'], issuer: env.jwtIssuer, audience: env.jwtAudience }, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ success: false, message: "Session expired or invalid. Please log in again." });
            }

            try {
                let userDoc = null;
                const lookupId = decoded.id || decoded.userId;
                if (User) {
                    if (lookupId && typeof lookupId === 'string' && lookupId.match(/^[0-9a-fA-F]{24}$/)) {
                        const q = User.findById(lookupId);
                        userDoc = (q && typeof q.lean === 'function') ? await q.lean() : await q;
                    }
                    if (!userDoc && decoded.email) {
                        const q = User.findOne({ email: decoded.email.toLowerCase().trim() });
                        userDoc = (q && typeof q.lean === 'function') ? await q.lean() : await q;
                    }
                }

                if (userDoc) {
                    if (userDoc.isActive === false || userDoc.status === 'INACTIVE' || userDoc.status === 'SUSPENDED') {
                        return res.status(403).json({ success: false, message: "Account is inactive or suspended. Please contact administrator." });
                    }

                    const canonicalRole = normalizeRole(userDoc.role);
                    req.user = {
                        id: String(userDoc._id),
                        _id: String(userDoc._id),
                        userId: String(userDoc._id),
                        email: userDoc.email,
                        name: userDoc.name,
                        role: canonicalRole,
                        permissions: getEffectivePermissions({ ...userDoc, role: canonicalRole }),
                        reportsTo: userDoc.reportsTo || null,
                        assignment: userDoc.assignment || { teamName: '', assignedAreas: [], maxActiveLeads: 50 },
                        status: userDoc.status || (userDoc.isActive ? 'ACTIVE' : 'INACTIVE'),
                        isActive: userDoc.isActive !== false
                    };
                } else {
                    // Fallback to token claims for test tokens / legacy sessions
                    const canonicalRole = normalizeRole(decoded.role);
                    req.user = {
                        ...decoded,
                        id: decoded.id || decoded.userId || 'system-user',
                        _id: decoded.id || decoded.userId || 'system-user',
                        userId: decoded.userId || decoded.id || 'system-user',
                        role: canonicalRole,
                        permissions: getEffectivePermissions({ ...decoded, role: canonicalRole }),
                        reportsTo: decoded.reportsTo || null,
                        assignment: decoded.assignment || { teamName: '', assignedAreas: [], maxActiveLeads: 50 },
                        isActive: decoded.isActive !== false,
                        status: decoded.status || 'ACTIVE'
                    };
                }
                next();
            } catch (loadErr) {
                console.error("Auth context load error:", loadErr);
                return res.status(500).json({ success: false, message: "Authentication service error." });
            }
        });
    };

    /**
     * Enforces required role(s) server-side
     * Accepts either an array of roles, a single role string, or multiple role arguments
     * e.g., requireRole(['CEO', 'MANAGER']) or requireRole('CEO', 'MANAGER') or requireRole('CEO')
     * @param {...(string|string[])} roles
     */
    const requireRole = (...roles) => {
        const flatRoles = roles.flat(Infinity);
        const allowedRoles = flatRoles.map(normalizeRole);
        return (req, res, next) => {
            if (!req.user || !req.user.role) {
                return res.status(401).json({ success: false, message: "Unauthorized: Missing authentication token." });
            }
            const userRole = normalizeRole(req.user.role);
            if (isCEO(userRole) || allowedRoles.includes(userRole)) {
                return next();
            }
            return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions." });
        };
    };

    /**
     * Enforces specific canonical permission
     * @param {string} permission
     */
    const requirePermission = (permission) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ success: false, message: "Unauthorized: Missing authentication token." });
            }
            if (hasPermission(req.user, permission)) {
                return next();
            }
            return res.status(403).json({ success: false, message: `Forbidden: Missing required permission [${permission}].` });
        };
    };

    return {
        authenticateToken,
        requireRole,
        requirePermission
    };
}

module.exports = {
    createAuthMiddleware
};
