/**
 * Comprehensive Automated Verification Suite for Prompt 3:
 * Team Role Foundation & Centralized Backend Authorization
 * 
 * Tests:
 * A. User Creation & Role Whitelisting (Manager, Team Leader, Team Member; CEO blocked)
 * B. Role Authorization & Canonical Permission Matrix
 * C. Escalation Prevention & Financial Privacy Boundaries
 * D. Scoped Lead Assignment Rules (CEO/Manager broad, TL team-scoped, TM blocked)
 * E. Reporting Hierarchy Validation (Chain of command, self-reporting prevention)
 * F. Account Deactivation, Status Sync & Last-CEO Protection
 * G. Backward Compatibility & Session Revocation
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));

const express = backendRequire('express');
const jwt = backendRequire('jsonwebtoken');
const bcrypt = backendRequire('bcryptjs');

// Import Auth & Modular Route Layers
const { ROLES, normalizeRole, isCEO, isManager, isTeamLeader, isTeamMember } = backendRequire('./auth/roles');
const { PERMISSIONS, ALL_PERMISSIONS, ROLE_CAPABILITIES, getDefaultPermissions } = backendRequire('./auth/permissions');
const { hasPermission, getEffectivePermissions, validateHierarchy, canAssignLead } = backendRequire('./auth/authorization');
const { createAuthMiddleware } = backendRequire('./auth/authMiddleware');
const { registerUserRoutes } = backendRequire('./modules/users/userRoutes');
const { registerTeamRoutes, sanitizeLeadForRole } = backendRequire('./modules/team/teamRoutes');

const JWT_SECRET = 'prompt3-test-jwt-secret-very-secure-32chars!';
const env = {
    jwtSecret: JWT_SECRET,
    jwtIssuer: 'varanasi-yatra-test',
    jwtAudience: 'varanasi-yatra-clients',
    jwtAccessExpiresIn: '1h'
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
        process.exitCode = 1;
    }
}

// -------------------------------------------------------------
// In-Memory Database Simulator for High-Fidelity Test Execution
// -------------------------------------------------------------
class InMemoryCollection {
    constructor(name) {
        this.name = name;
        this.items = [];
    }

    _createQuery(executor) {
        const self = this;
        let isLean = false;
        const queryObj = {
            populate: function () {
                return queryObj;
            },
            select: function () {
                return queryObj;
            },
            sort: function () {
                return queryObj;
            },
            skip: function () {
                return queryObj;
            },
            limit: function () {
                return queryObj;
            },
            lean: function () {
                isLean = true;
                return queryObj;
            },
            then: function (onFulfilled, onRejected) {
                return Promise.resolve()
                    .then(() => executor())
                    .then(res => {
                        if (!res) return null;
                        if (Array.isArray(res)) {
                            return isLean ? res.map(i => ({ ...i })) : res.map(i => self._wrapDoc(i));
                        }
                        return isLean ? { ...res } : self._wrapDoc(res);
                    })
                    .then(onFulfilled, onRejected);
            },
            catch: function (onRejected) {
                return this.then(null, onRejected);
            }
        };
        return queryObj;
    }

    find(query = {}) {
        return this._createQuery(() => {
            return this.items.filter(item => this._matches(item, query));
        });
    }

    findOne(query = {}) {
        return this._createQuery(() => {
            return this.items.find(i => this._matches(i, query)) || null;
        });
    }

    findById(id) {
        return this._createQuery(() => {
            return this.items.find(i => String(i._id) === String(id)) || null;
        });
    }

    async countDocuments(query = {}) {
        return this.items.filter(i => this._matches(i, query)).length;
    }

    async updateMany(query, update) {
        let count = 0;
        for (const item of this.items) {
            if (this._matches(item, query)) {
                if (update.$set) Object.assign(item, update.$set);
                count++;
            }
        }
        return { modifiedCount: count };
    }

    async updateOne(query, update) {
        const item = this.items.find(i => this._matches(i, query));
        if (item && update.$set) {
            Object.assign(item, update.$set);
            return { modifiedCount: 1 };
        }
        return { modifiedCount: 0 };
    }

    async aggregate(_pipeline = []) {
        return [];
    }

    _wrapDoc(raw) {
        const self = this;
        return {
            ...raw,
            save: async function () {
                const idx = self.items.findIndex(i => String(i._id) === String(raw._id));
                if (idx >= 0) {
                    self.items[idx] = { ...this };
                } else {
                    self.items.push({ ...this });
                }
                return this;
            },
            populate: function () {
                return {
                    lean: async () => ({ ...raw })
                };
            }
        };
    }

    _matches(item, query) {
        for (const key of Object.keys(query)) {
            if (key === '$or') {
                const orList = query[key];
                const matched = orList.some(subQuery => this._matches(item, subQuery));
                if (!matched) return false;
                continue;
            }
            if (key === 'role' && query[key]?.$in) {
                if (!query[key].$in.includes(item.role)) return false;
                continue;
            }
            if (query[key] !== undefined && item[key] !== query[key]) {
                return false;
            }
        }
        return true;
    }
}

// User Model constructor simulator
function createUserModel(collection) {
    class UserDocument {
        constructor(data) {
            this._id = data._id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            this.name = data.name;
            this.email = data.email;
            this.passwordHash = data.passwordHash;
            this.role = data.role || 'MANAGER';
            this.reportsTo = data.reportsTo || null;
            this.assignment = data.assignment || { teamName: '', assignedAreas: [], maxActiveLeads: 50 };
            this.permissions = data.permissions || [];
            this.status = data.status || 'ACTIVE';
            this.isActive = data.isActive !== undefined ? data.isActive : true;
            this.passwordChangeRequired = !!data.passwordChangeRequired;
            this.createdAt = data.createdAt || new Date();
            this.lastLoginAt = data.lastLoginAt || null;
        }

        async save() {
            const idx = collection.items.findIndex(i => String(i._id) === String(this._id));
            if (idx >= 0) {
                collection.items[idx] = { ...this };
            } else {
                collection.items.push({ ...this });
            }
            return this;
        }
    }
    UserDocument.find = (q) => collection.find(q);
    UserDocument.findOne = (q) => collection.findOne(q);
    UserDocument.findById = (id) => collection.findById(id);
    UserDocument.countDocuments = (q) => collection.countDocuments(q);
    UserDocument.updateMany = (q, u) => collection.updateMany(q, u);
    return UserDocument;
}

// Helper to generate tokens
function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        algorithm: 'HS256',
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
        expiresIn: '1h'
    });
}

// Helper for making direct in-memory Express requests (Zero socket binding for sandbox safety)
function makeRequest(app, options, body = null) {
    return new Promise((resolve) => {
        const urlObj = new URL(options.path, 'http://localhost');
        const query = {};
        for (const [k, v] of urlObj.searchParams.entries()) {
            query[k] = v;
        }

        const headers = {};
        for (const [k, v] of Object.entries(options.headers || {})) {
            headers[k.toLowerCase()] = v;
        }

        const req = {
            method: (options.method || 'GET').toUpperCase(),
            url: options.path,
            originalUrl: options.path,
            path: urlObj.pathname,
            query,
            headers,
            body: body || {},
            get(name) { return this.headers[name.toLowerCase()]; },
            header(name) { return this.headers[name.toLowerCase()]; },
            ip: '127.0.0.1'
        };

        const res = {
            statusCode: 200,
            headers: {},
            status(code) { this.statusCode = code; return this; },
            setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
            getHeader(k) { return this.headers[k.toLowerCase()]; },
            json(data) {
                resolve({ status: this.statusCode, body: data });
                return this;
            },
            send(data) {
                resolve({ status: this.statusCode, body: data });
                return this;
            },
            end(data) {
                resolve({ status: this.statusCode, body: data });
                return this;
            }
        };

        app.handle(req, res, (err) => {
            if (err) {
                resolve({ status: 500, body: { success: false, message: err.message } });
            } else {
                resolve({ status: 404, body: { success: false, message: 'Not found' } });
            }
        });
    });
}

async function runPrompt3TestSuite() {
    console.log('================================================================');
    console.log('🚀 RUNNING PROMPT 3 — TEAM FOUNDATION & AUTHORIZATION TEST SUITE');
    console.log('================================================================\n');

    // -----------------------------------------------------------------
    // Setup Mock Test Database & Express App
    // -----------------------------------------------------------------
    const usersCol = new InMemoryCollection('users');
    const sessionsCol = new InMemoryCollection('auth_sessions');
    const enquiriesCol = new InMemoryCollection('enquiries');

    const User = createUserModel(usersCol);

    // Seed Initial CEO
    const ceoSalt = bcrypt.genSaltSync(10);
    const ceoUser = new User({
        _id: '65f000000000000000000001',
        name: 'Avaneesh Kumar',
        email: 'ceo@varanasiyatra.com',
        passwordHash: bcrypt.hashSync('CeoSecretPass123!', ceoSalt),
        role: ROLES.CEO,
        status: 'ACTIVE',
        isActive: true
    });
    await ceoUser.save();

    // Seed Initial Manager
    const mgrUser = new User({
        _id: '65f000000000000000000002',
        name: 'Pooja Sharma',
        email: 'pooja.manager@varanasiyatra.com',
        passwordHash: bcrypt.hashSync('ManagerPass123!', ceoSalt),
        role: ROLES.MANAGER,
        reportsTo: ceoUser._id,
        status: 'ACTIVE',
        isActive: true
    });
    await mgrUser.save();

    // Create App & Register Modular Routes
    const app = express();
    app.use(express.json());

    const authSystem = createAuthMiddleware(env, User, sessionsCol);
    const { authenticateToken, requireRole, requirePermission } = authSystem;

    registerUserRoutes(app, {
        User,
        AuthSession: sessionsCol,
        Enquiry: enquiriesCol,
        authenticateToken,
        requireRole,
        _requirePermission: requirePermission
    });

    registerTeamRoutes(app, {
        User,
        Enquiry: enquiriesCol,
        authenticateToken,
        requireRole
    });

    const ceoToken = signToken({ id: ceoUser._id, email: ceoUser.email, role: 'CEO' });
    const mgrToken = signToken({ id: mgrUser._id, email: mgrUser.email, role: 'MANAGER' });

    // -----------------------------------------------------------------
    // SECTION A: USER CREATION & ROLE WHITELISTING
    // -----------------------------------------------------------------
    console.log('👉 [SECTION A: USER CREATION & ROLE WHITELISTING]');

    // A.1 CEO creates a Manager
    const createMgrRes = await makeRequest(app, {
        path: '/admin/users',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        name: 'Vikas Mishra',
        email: 'vikas.mgr@varanasiyatra.com',
        role: 'MANAGER',
        reportsTo: ceoUser._id,
        temporaryPassword: 'TemporaryPass123!'
    });
    assert(createMgrRes.status === 201 && createMgrRes.body.success, 'CEO can create MANAGER account');
    const createdMgrId = createMgrRes.body.user?.id;

    // A.2 CEO creates a Team Leader
    const createTlRes = await makeRequest(app, {
        path: '/admin/users',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        name: 'Suresh Patel',
        email: 'suresh.lead@varanasiyatra.com',
        role: 'TEAM_LEADER',
        reportsTo: mgrUser._id,
        assignment: { teamName: 'Heritage Ghats Team', assignedAreas: ['Assi', 'Dashashwamedh'] },
        temporaryPassword: 'TemporaryPass123!'
    });
    assert(createTlRes.status === 201 && createTlRes.body.success, 'CEO can create TEAM_LEADER account');
    const createdTlId = createTlRes.body.user?.id;

    // A.3 CEO creates a Team Member reporting to Team Leader
    const createTmRes = await makeRequest(app, {
        path: '/admin/users',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        name: 'Rohan Verma',
        email: 'rohan.member@varanasiyatra.com',
        role: 'TEAM_MEMBER',
        reportsTo: createdTlId,
        assignment: { teamName: 'Heritage Ghats Team', assignedAreas: ['Assi'] },
        temporaryPassword: 'TemporaryPass123!'
    });
    assert(createTmRes.status === 201 && createTmRes.body.success, 'CEO can create TEAM_MEMBER account');
    const createdTmId = createTmRes.body.user?.id;

    // A.4 CEO CANNOT create a CEO account through standard endpoint
    const createCeoRes = await makeRequest(app, {
        path: '/admin/users',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        name: 'Rival Executive',
        email: 'rival.ceo@varanasiyatra.com',
        role: 'CEO',
        temporaryPassword: 'TemporaryPass123!'
    });
    assert(createCeoRes.status === 403 && !createCeoRes.body.success, 'CEO creation blocked on standard user creation endpoint (403)');

    // A.5 Non-CEO (Manager) cannot create users
    const mgrCreateRes = await makeRequest(app, {
        path: '/admin/users',
        method: 'POST',
        headers: { Authorization: `Bearer ${mgrToken}` }
    }, {
        name: 'Unauthorized User',
        email: 'unauth@varanasiyatra.com',
        role: 'TEAM_MEMBER',
        temporaryPassword: 'TemporaryPass123!'
    });
    assert(mgrCreateRes.status === 403, 'Manager cannot provision users (403 Forbidden)');

    // -----------------------------------------------------------------
    // SECTION B: CANONICAL ROLE MATRIX & PERMISSIONS
    // -----------------------------------------------------------------
    console.log('\n👉 [SECTION B: ROLE CAPABILITY MATRIX & PERMISSIONS]');

    assert(normalizeRole('ceo') === ROLES.CEO, 'normalizeRole correctly normalizes lowercase role');
    assert(isCEO('CEO') && isCEO('ceo'), 'Role normalization handles case variants for CEO');
    assert(isManager('MANAGER') && isManager('Manager'), 'Role normalization handles case variants for Manager');
    assert(isTeamLeader('TEAM_LEADER') && isTeamLeader('Team_Leader'), 'Role normalization handles case variants for Team Leader');
    assert(isTeamMember('TEAM_MEMBER') && isTeamMember('Team_Member'), 'Role normalization handles case variants for Team Member');

    const ceoPerms = getDefaultPermissions(ROLES.CEO);
    const mgrPerms = getDefaultPermissions(ROLES.MANAGER);
    const tlPerms = getDefaultPermissions(ROLES.TEAM_LEADER);
    const tmPerms = getDefaultPermissions(ROLES.TEAM_MEMBER);

    assert(ceoPerms.length === ALL_PERMISSIONS.length, 'CEO has all 25 canonical permissions');
    assert(!mgrPerms.includes(PERMISSIONS.SYSTEM_MANAGE), 'Manager does NOT hold SYSTEM_MANAGE');
    assert(!mgrPerms.includes(PERMISSIONS.FINANCIALS_MANAGE), 'Manager does NOT hold FINANCIALS_MANAGE');
    assert(tlPerms.includes(PERMISSIONS.LEADS_ASSIGN), 'Team Leader holds LEADS_ASSIGN permission');
    assert(!tlPerms.includes(PERMISSIONS.QUOTES_CREATE), 'Team Leader does NOT hold QUOTES_CREATE permission');
    assert(!tlPerms.includes(PERMISSIONS.FINANCIALS_VIEW), 'Team Leader does NOT hold FINANCIALS_VIEW permission');
    assert(!tmPerms.includes(PERMISSIONS.LEADS_ASSIGN), 'Team Member does NOT hold LEADS_ASSIGN permission');
    assert(hasPermission({ role: 'CEO' }, PERMISSIONS.FINANCIALS_MANAGE) === true, 'CEO has FINANCIALS_MANAGE via hasPermission helper');
    assert(hasPermission({ role: 'TEAM_MEMBER' }, PERMISSIONS.FINANCIALS_MANAGE) === false, 'Team Member does not have FINANCIALS_MANAGE via hasPermission helper');
    assert(typeof ROLE_CAPABILITIES === 'object' && ROLE_CAPABILITIES[ROLES.CEO] !== undefined, 'ROLE_CAPABILITIES matrix exists');
    assert(Array.isArray(getEffectivePermissions({ role: 'MANAGER' })), 'getEffectivePermissions returns array of permissions');

    // -----------------------------------------------------------------
    // SECTION C: ESCALATION PREVENTION & PRIVACY AUDIT
    // -----------------------------------------------------------------
    console.log('\n👉 [SECTION C: ESCALATION PREVENTION & SENSITIVE DATA PRIVACY]');

    const tlToken = signToken({ id: createdTlId, email: 'suresh.lead@varanasiyatra.com', role: 'TEAM_LEADER' });
    const tmToken = signToken({ id: createdTmId, email: 'rohan.member@varanasiyatra.com', role: 'TEAM_MEMBER' });

    // C.1 Team Member attempts to access user directory
    const tmDirRes = await makeRequest(app, {
        path: '/admin/users',
        headers: { Authorization: `Bearer ${tmToken}` }
    });
    assert(tmDirRes.status === 403, 'Team Member blocked from accessing /admin/users (403)');

    // C.2 Team Leader attempts to access user directory
    const tlDirRes = await makeRequest(app, {
        path: '/admin/users',
        headers: { Authorization: `Bearer ${tlToken}` }
    });
    assert(tlDirRes.status === 403, 'Team Leader blocked from accessing /admin/users (403)');

    // C.3 Team Member attempts self-promotion via PATCH
    const tmPromoRes = await makeRequest(app, {
        path: `/admin/users/${createdTmId}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tmToken}` }
    }, { role: 'CEO' });
    assert(tmPromoRes.status === 403, 'Team Member blocked from self-promotion via PATCH (403)');

    // C.4 Sanitization of internal financial data for Team Leader & Member
    const rawLead = {
        _id: 'lead_test_01',
        name: 'Vipul Singhania',
        destination: 'Varanasi Heritage Tour',
        sellingPrice: 45000,
        vendorCosts: 28000,
        totalVendorCost: 28000,
        companyMargin: 17000,
        expectedProfit: 17000,
        marginPercentage: 37.7,
        ceoNotes: 'High net worth client, give premium boat',
        internalNotes: 'Vendor negotiated down from 32k'
    };

    const tlSanitized = sanitizeLeadForRole(rawLead, 'TEAM_LEADER');
    assert(tlSanitized.sellingPrice === 45000, 'Team Leader can view customer selling price');
    assert(tlSanitized.vendorCosts === undefined, 'Team Leader cannot view vendorCosts (strictly stripped)');
    assert(tlSanitized.companyMargin === undefined, 'Team Leader cannot view companyMargin (strictly stripped)');
    assert(tlSanitized.expectedProfit === undefined, 'Team Leader cannot view expectedProfit (strictly stripped)');
    assert(tlSanitized.ceoNotes === undefined, 'Team Leader cannot view ceoNotes (strictly stripped)');

    const tmSanitized = sanitizeLeadForRole(rawLead, 'TEAM_MEMBER');
    assert(tmSanitized.vendorCosts === undefined, 'Team Member cannot view vendorCosts (strictly stripped)');
    assert(tmSanitized.expectedProfit === undefined, 'Team Member cannot view expectedProfit (strictly stripped)');
    assert(tmSanitized.internalNotes === undefined, 'Team Member cannot view internalNotes (strictly stripped)');

    // -----------------------------------------------------------------
    // SECTION D: SCOPED LEAD ASSIGNMENT
    // -----------------------------------------------------------------
    console.log('\n👉 [SECTION D: SCOPED LEAD ASSIGNMENT]');

    const actorCEO = { id: ceoUser._id, role: 'CEO' };
    const actorManager = { id: mgrUser._id, role: 'MANAGER' };
    const actorTL = {
        id: createdTlId,
        role: 'TEAM_LEADER',
        assignment: { teamName: 'Heritage Ghats Team' }
    };
    const actorTM = { id: createdTmId, role: 'TEAM_MEMBER' };

    const targetSameTeamTM = {
        id: createdTmId,
        role: 'TEAM_MEMBER',
        reportsTo: createdTlId,
        assignment: { teamName: 'Heritage Ghats Team' }
    };

    const targetOtherTeamTM = {
        id: 'usr_other_999',
        role: 'TEAM_MEMBER',
        reportsTo: 'usr_other_leader',
        assignment: { teamName: 'Ayodhya Tour Team' }
    };

    assert(canAssignLead(actorCEO, targetSameTeamTM), 'CEO can assign lead to any team member');
    assert(canAssignLead(actorManager, targetOtherTeamTM), 'Manager can assign lead across teams');
    assert(canAssignLead(actorTL, targetSameTeamTM), 'Team Leader can assign lead to team member in their team');
    assert(!canAssignLead(actorTL, targetOtherTeamTM), 'Team Leader CANNOT assign lead to member in another team');
    assert(!canAssignLead(actorTM, targetSameTeamTM), 'Team Member CANNOT assign leads to colleagues');

    // -----------------------------------------------------------------
    // SECTION E: REPORTING HIERARCHY VALIDATION
    // -----------------------------------------------------------------
    console.log('\n👉 [SECTION E: REPORTING HIERARCHY VALIDATION]');

    // E.1 Self reporting rejection
    const selfCheck = validateHierarchy(ROLES.MANAGER, { _id: 'usr_abc' }, 'usr_abc');
    assert(!selfCheck.valid && selfCheck.error.includes('themselves'), 'Self-reporting rejected');

    // E.2 CEO reporting rejection
    const ceoParentCheck = validateHierarchy(ROLES.CEO, { _id: 'usr_mgr', role: 'MANAGER' });
    assert(!ceoParentCheck.valid && ceoParentCheck.error.includes('CEO cannot report'), 'CEO reporting to another user rejected');

    // E.3 Manager must report to CEO
    const mgrParentValid = validateHierarchy(ROLES.MANAGER, { _id: 'usr_ceo', role: 'CEO' });
    assert(mgrParentValid.valid, 'Manager reporting to CEO accepted');

    const mgrParentInvalid = validateHierarchy(ROLES.MANAGER, { _id: 'usr_tl', role: 'TEAM_LEADER' });
    assert(!mgrParentInvalid.valid, 'Manager reporting to Team Leader rejected');

    // E.4 Team Leader can report to Manager or CEO
    const tlToMgr = validateHierarchy(ROLES.TEAM_LEADER, { _id: 'usr_mgr', role: 'MANAGER' });
    assert(tlToMgr.valid, 'Team Leader reporting to Manager accepted');

    const tlToCeo = validateHierarchy(ROLES.TEAM_LEADER, { _id: 'usr_ceo', role: 'CEO' });
    assert(tlToCeo.valid, 'Team Leader reporting to CEO accepted');

    // E.5 Team Member must report to Team Leader or Manager
    const tmToTl = validateHierarchy(ROLES.TEAM_MEMBER, { _id: 'usr_tl', role: 'TEAM_LEADER' });
    assert(tmToTl.valid, 'Team Member reporting to Team Leader accepted');

    const tmToTm = validateHierarchy(ROLES.TEAM_MEMBER, { _id: 'usr_tm2', role: 'TEAM_MEMBER' });
    assert(!tmToTm.valid, 'Team Member reporting to another Team Member rejected');

    // -----------------------------------------------------------------
    // SECTION F: DEACTIVATION & LAST-ACTIVE-CEO PROTECTION
    // -----------------------------------------------------------------
    console.log('\n👉 [SECTION F: DEACTIVATION & LAST-ACTIVE-CEO PROTECTION]');

    // F.1 Attempt to deactivate only remaining active CEO
    const deactCeoRes = await makeRequest(app, {
        path: `/admin/users/${ceoUser._id}/deactivate`,
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert(deactCeoRes.status === 400, 'Deactivation of only active CEO account blocked (400)');

    // F.2 Successfully deactivate a team member
    const deactTmRes = await makeRequest(app, {
        path: `/admin/users/${createdTmId}/deactivate`,
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert(deactTmRes.status === 200 && deactTmRes.body.user?.status === 'INACTIVE', 'Deactivation of team member succeeded');

    // F.3 Deactivated member token blocked on authenticateToken
    const deactivatedMemberToken = signToken({ id: createdTmId, email: 'rohan.member@varanasiyatra.com', role: 'TEAM_MEMBER' });
    const blockedRes = await makeRequest(app, {
        path: '/admin/team/leads',
        headers: { Authorization: `Bearer ${deactivatedMemberToken}` }
    });
    assert(blockedRes.status === 403, 'Deactivated/inactive user blocked from accessing API routes (403)');

    // F.4 Reactivate member
    const reactivateRes = await makeRequest(app, {
        path: `/admin/users/${createdTmId}/activate`,
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert(reactivateRes.status === 200 && reactivateRes.body.user?.status === 'ACTIVE', 'Reactivation of team member succeeded');

    // -----------------------------------------------------------------
    // SECTION G: BACKWARD COMPATIBILITY & LEGACY ENDPOINTS
    // -----------------------------------------------------------------
    console.log('\n👉 [SECTION G: BACKWARD COMPATIBILITY]');

    // G.1 Legacy status endpoint continues to work
    const legacyStatusRes = await makeRequest(app, {
        path: `/admin/users/${createdMgrId}/status`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, { isActive: false });
    assert(legacyStatusRes.status === 200 && legacyStatusRes.body.user?.status === 'INACTIVE', 'Legacy PATCH /admin/users/:id/status functions properly');

    // G.2 Temporary password reset
    const resetRes = await makeRequest(app, {
        path: `/admin/users/${createdMgrId}/reset-password`,
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, { temporaryPassword: 'NewTemporaryPass123!' });
    assert(resetRes.status === 200 && resetRes.body.user?.passwordChangeRequired === true, 'POST /admin/users/:id/reset-password sets passwordChangeRequired: true');

    console.log('\n================================================================');
    console.log(`📊 PROMPT 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runPrompt3TestSuite().catch(err => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
});
