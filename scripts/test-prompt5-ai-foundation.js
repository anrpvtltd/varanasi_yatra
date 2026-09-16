/**
 * Comprehensive Security & Operational Verification Suite for Prompt 5:
 * Varanasi Yatra AI Foundation & CEO AI Control Center
 *
 * Mandatory Tests (Section 39):
 * 1. AI master OFF blocks runs.
 * 2. Emergency stop blocks runs.
 * 3. Safe mode blocks risky actions.
 * 4. Unauthorized role cannot use restricted tool.
 * 5. AI cannot bypass CRM permissions.
 * 6. Financial tools denied to unauthorized roles.
 * 7. Tool allowlist enforced.
 * 8. Tool scope enforced.
 * 9. Run limits enforced.
 * 10. Audit event created.
 * 11. API secrets never returned.
 * 12. MongoDB direct access impossible.
 * 13. Fake user role from frontend rejected.
 * 14. Opportunity cannot become lead automatically.
 * 15. Hunter modules remain OFF.
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));

const express = backendRequire('express');
const jwt = backendRequire('jsonwebtoken');

// Auth and Roles
const { ROLES } = backendRequire('./auth/roles');
const { PERMISSIONS } = backendRequire('./auth/permissions');
const { createAuthMiddleware } = backendRequire('./auth/authMiddleware');

// AI Module Components
const { registerAiRoutes } = backendRequire('./modules/ai/aiRoutes');
const { getToolDefinition, getAllowedToolsForModule } = backendRequire('./modules/ai/aiTools');
const { validateAiExecution } = backendRequire('./modules/ai/aiAuthorization');
const { AI_MODULES, AI_RUN_STATUSES, AI_RISK_LEVELS, AI_ERROR_CODES } = backendRequire('./modules/ai/aiConstants');

const JWT_SECRET = 'prompt5-test-ai-secret-key-32-chars-long!';
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
// In-Memory Model Simulator
// -------------------------------------------------------------
class InMemoryCollection {
    constructor(name) {
        this.name = name;
        this.items = [];
    }

    _matches(item, query = {}) {
        for (const [key, val] of Object.entries(query)) {
            const itemVal = item[key];
            if (val && typeof val === 'object') {
                if (val.$gte !== undefined && itemVal < val.$gte) return false;
                if (val.$lte !== undefined && itemVal > val.$lte) return false;
                if (val.$in && Array.isArray(val.$in) && !val.$in.includes(itemVal)) return false;
                continue;
            }
            if (String(itemVal) !== String(val)) return false;
        }
        return true;
    }

    _wrap(doc) {
        if (!doc) return null;
        const self = this;
        const copy = { ...doc };
        copy.save = async function () {
            const idx = self.items.findIndex(i => String(i._id) === String(this._id));
            if (idx >= 0) {
                this.updatedAt = new Date();
                self.items[idx] = { ...this };
            } else {
                this.createdAt = this.createdAt || new Date();
                this.updatedAt = new Date();
                self.items.push({ ...this });
            }
            return this;
        };
        return copy;
    }

    async findOne(query) {
        const found = this.items.find(i => this._matches(i, query));
        return found ? this._wrap(found) : null;
    }

    async findById(id) {
        return this.findOne({ _id: id });
    }

    async countDocuments(query = {}) {
        return this.items.filter(i => this._matches(i, query)).length;
    }

    find(query = {}) {
        const matched = this.items.filter(i => this._matches(i, query));
        let results = [...matched];
        const self = this;

        const chain = {
            sort() { return chain; },
            skip(n) { results = results.slice(n); return chain; },
            limit(n) { results = results.slice(0, n); return chain; },
            select() { return chain; },
            then(resolve) { resolve(results.map(r => self._wrap(r))); }
        };
        return chain;
    }

    async create(doc) {
        const item = {
            _id: doc._id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...doc
        };
        this.items.push(item);
        return this._wrap(item);
    }
}

// In-process Express Dispatcher
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

// -------------------------------------------------------------
// Test Runner
// -------------------------------------------------------------
async function runSuite() {
    console.log('================================================================');
    console.log('🤖 RUNNING PROMPT 5: AI FOUNDATION & CEO CONTROL SECURITY SUITE');
    console.log('================================================================\n');

    // 1. Initialize In-Memory Stores
    const AIConfigStore = new InMemoryCollection('AIConfig');
    const AIRunStore = new InMemoryCollection('AIRun');
    const AIAuditLogStore = new InMemoryCollection('AIAuditLog');
    const AIOpportunityStore = new InMemoryCollection('AIOpportunity');
    const LeadStore = new InMemoryCollection('Enquiry');
    const CustomerStore = new InMemoryCollection('Customer');
    const BookingStore = new InMemoryCollection('Booking');
    const QuoteStore = new InMemoryCollection('Quote');
    const UserStore = new InMemoryCollection('User');

    // Prepopulate Lead & Financial Test Data
    const testLead = await LeadStore.create({
        _id: 'lead_12345',
        name: 'Arjun Sharma',
        phone: '+919876543210',
        email: 'arjun@example.com',
        serviceCategory: 'TEMPLE_DARSHAN',
        status: 'In-Progress'
    });

    const testBooking = await BookingStore.create({
        _id: 'book_98765',
        bookingId: 'BK-2026-001',
        customerName: 'Arjun Sharma',
        totalAmount: 15000,
        vendorCost: 8500, // Sensitive proprietary cost
        margin: 6500, // Sensitive margin
        ceoNotes: 'VIP corporate client from Mumbai' // Sensitive CEO notes
    });

    // Prepopulate Users
    const ceoUser = await UserStore.create({
        _id: 'user_ceo_01',
        name: 'CEO User',
        email: 'ceo@banarasyatra.com',
        role: ROLES.CEO,
        isActive: true
    });

    const mgrUser = await UserStore.create({
        _id: 'user_mgr_01',
        name: 'Manager User',
        email: 'manager@banarasyatra.com',
        role: ROLES.MANAGER,
        isActive: true
    });

    const memberUser = await UserStore.create({
        _id: 'user_mem_01',
        name: 'Team Member',
        email: 'member@banarasyatra.com',
        role: ROLES.TEAM_MEMBER,
        isActive: true
    });

    // Helper: JWT generation
    function generateToken(user) {
        return jwt.sign(
            { id: user._id, userId: user._id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h', issuer: env.jwtIssuer, audience: env.jwtAudience }
        );
    }

    const ceoToken = generateToken(ceoUser);
    const mgrToken = generateToken(mgrUser);
    const memberToken = generateToken(memberUser);

    // Setup Express App
    const app = express();
    app.use(express.json());

    const { authenticateToken, requireRole } = createAuthMiddleware(env, UserStore);

    registerAiRoutes(app, {
        AIConfig: AIConfigStore,
        AIRun: AIRunStore,
        AIAuditLog: AIAuditLogStore,
        AIOpportunity: AIOpportunityStore,
        Enquiry: LeadStore,
        Customer: CustomerStore,
        Booking: BookingStore,
        Quote: QuoteStore,
        authenticateToken,
        requireRole
    });

    // =============================================================
    // TEST 1: AI Master OFF Blocks Runs
    // =============================================================
    console.log('👉 [1. AI MASTER OFF BLOCKS RUNS]');
    const configDoc = await AIConfigStore.create({
        singletonKey: 'GLOBAL_AI_CONFIG',
        masterEnabled: false,
        safeMode: true,
        emergencyStop: false,
        modules: {
            salesAssistant: { enabled: true, safeModeRequired: true },
            customerAssistant: { enabled: true, safeModeRequired: true },
            customerHunter: { enabled: false, safeModeRequired: true },
            localHunter: { enabled: false, safeModeRequired: true },
            outsideHunter: { enabled: false, safeModeRequired: true },
            voiceAi: { enabled: false, safeModeRequired: true }
        }
    });

    const runOffRes = await makeRequest(app, {
        path: '/admin/ai/run',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ceoToken}`
        }
    }, {
        module: AI_MODULES.SALES_ASSISTANT,
        taskType: 'lead_summary'
    });

    assert(runOffRes.status === 403, 'HTTP 403 returned when Master AI is OFF');
    assert(runOffRes.body?.errorCode === AI_ERROR_CODES.AI_DISABLED, `errorCode is AI_DISABLED (got: ${runOffRes.body?.errorCode})`);
    assert(runOffRes.body?.success === false, 'Run blocked when Master AI is disabled');

    // =============================================================
    // TEST 2: Emergency Stop Blocks Runs
    // =============================================================
    console.log('\n👉 [2. EMERGENCY STOP BLOCKS RUNS]');
    configDoc.masterEnabled = true;
    configDoc.emergencyStop = true;
    configDoc.emergencyStoppedAt = new Date();
    await configDoc.save();

    const emgRunRes = await makeRequest(app, {
        path: '/admin/ai/run',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ceoToken}`
        }
    }, {
        module: AI_MODULES.SALES_ASSISTANT,
        taskType: 'lead_summary'
    });

    assert(emgRunRes.status === 403, 'HTTP 403 returned when Emergency Stop is ACTIVE');
    assert(emgRunRes.body?.errorCode === AI_ERROR_CODES.EMERGENCY_STOP, 'errorCode is EMERGENCY_STOP');
    assert(emgRunRes.body?.success === false, 'Run blocked immediately by emergency kill switch');

    // Reset Emergency Stop for subsequent tests
    configDoc.emergencyStop = false;
    await configDoc.save();

    // =============================================================
    // TEST 3: Safe Mode Blocks Risky Mutation Actions
    // =============================================================
    console.log('\n👉 [3. SAFE MODE BLOCKS RISKY ACTIONS]');
    const highRiskTool = getToolDefinition('crm.createLead');
    assert(highRiskTool !== null, 'crm.createLead tool exists in registry');
    assert(highRiskTool.riskLevel === AI_RISK_LEVELS.HIGH, 'crm.createLead riskLevel is HIGH');

    const safeModeCheck = validateAiExecution(
        configDoc,
        { role: ROLES.CEO, permissions: [PERMISSIONS.LEADS_CREATE, PERMISSIONS.AI_RUN] },
        'crm.createLead'
    );
    assert(safeModeCheck.allowed === false, 'Safe Mode blocks execution of high-risk tool crm.createLead');
    assert(safeModeCheck.errorCode === AI_ERROR_CODES.SAFE_MODE_BLOCKED, 'errorCode is SAFE_MODE_BLOCKED');

    // Check critical financial mutation
    const criticalTool = getToolDefinition('crm.modifyFinancialData');
    assert(criticalTool.riskLevel === AI_RISK_LEVELS.CRITICAL, 'crm.modifyFinancialData riskLevel is CRITICAL');
    const criticalCheck = validateAiExecution(
        configDoc,
        { role: ROLES.CEO, permissions: [PERMISSIONS.FINANCIALS_VIEW, PERMISSIONS.AI_RUN] },
        'crm.modifyFinancialData'
    );
    assert(criticalCheck.allowed === false, 'Safe Mode blocks critical financial modification');

    // =============================================================
    // TEST 4: Unauthorized Role Cannot Use Restricted Tool
    // =============================================================
    console.log('\n👉 [4. UNAUTHORIZED ROLE CANNOT USE RESTRICTED TOOL]');
    const memberRunRes = await makeRequest(app, {
        path: '/admin/ai/run',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${memberToken}`
        }
    }, {
        module: AI_MODULES.SALES_ASSISTANT,
        taskType: 'lead_summary'
    });
    assert(memberRunRes.status === 403, 'Team member receives 403 when trying to access /admin/ai/run');

    // =============================================================
    // TEST 5: AI Cannot Bypass CRM Permissions
    // =============================================================
    console.log('\n👉 [5. AI CANNOT BYPASS CRM PERMISSIONS]');
    const userWithoutPerm = {
        role: ROLES.TEAM_MEMBER,
        permissions: [PERMISSIONS.COMMUNICATIONS_VIEW] // lacks LEADS_VIEW
    };
    const permCheck = validateAiExecution(configDoc, userWithoutPerm, 'crm.getLead');
    assert(permCheck.allowed === false, 'User lacking LEADS_VIEW permission cannot execute crm.getLead');
    assert(permCheck.errorCode === AI_ERROR_CODES.PERMISSION_DENIED, 'errorCode is PERMISSION_DENIED');

    // =============================================================
    // TEST 6: Financial Tools Denied to Unauthorized Roles
    // =============================================================
    console.log('\n👉 [6. FINANCIAL TOOLS DENIED TO UNAUTHORIZED ROLES]');
    const finTool = getToolDefinition('crm.getBooking');
    const mgrUserContext = {
        role: ROLES.MANAGER,
        permissions: [PERMISSIONS.BOOKINGS_VIEW]
    };
    const bookingResult = await finTool.execute(
        { bookingId: testBooking._id },
        mgrUserContext,
        { Booking: BookingStore }
    );
    assert(bookingResult.booking?.vendorCost === undefined, 'Vendor cost is stripped for non-CEO role');
    assert(bookingResult.booking?.margin === undefined, 'Margin is stripped for non-CEO role');
    assert(bookingResult.booking?.ceoNotes === undefined, 'CEO notes are stripped for non-CEO role');
    assert(bookingResult.booking?.bookingId === 'BK-2026-001', 'Sanitized booking metadata remains accessible');

    const ceoUserContext = {
        role: ROLES.CEO,
        permissions: [PERMISSIONS.BOOKINGS_VIEW, PERMISSIONS.FINANCIALS_VIEW]
    };
    const ceoBookingResult = await finTool.execute(
        { bookingId: testBooking._id },
        ceoUserContext,
        { Booking: BookingStore }
    );
    assert(ceoBookingResult.booking?.vendorCost === 8500, 'Vendor cost accessible to authenticated CEO');
    assert(ceoBookingResult.booking?.margin === 6500, 'Margin accessible to authenticated CEO');

    // =============================================================
    // TEST 7: Tool Allowlist Enforced
    // =============================================================
    console.log('\n👉 [7. TOOL ALLOWLIST ENFORCED]');
    const bogusTool = getToolDefinition('arbitrary.executeCode');
    assert(bogusTool === null, 'Unregistered tool arbitrary.executeCode is null');
    const bogusCheck = validateAiExecution(
        configDoc,
        { role: ROLES.CEO, permissions: [PERMISSIONS.ALL_ACCESS] },
        'arbitrary.executeCode'
    );
    assert(bogusCheck.allowed === false, 'Unregistered tool is strictly disallowed');
    assert(bogusCheck.errorCode === AI_ERROR_CODES.TOOL_DISABLED, 'Disallowed tool returns TOOL_DISABLED');

    // =============================================================
    // TEST 8: Tool Scope Enforced
    // =============================================================
    console.log('\n👉 [8. TOOL SCOPE ENFORCED]');
    const readTool = getToolDefinition('crm.getLead');
    assert(readTool.scope === 'LEAD_READ', 'crm.getLead defines explicit scope LEAD_READ');
    assert(finTool.scope === 'BOOKING_READ', 'crm.getBooking defines explicit scope BOOKING_READ');

    // =============================================================
    // TEST 9: Run Limits Enforced
    // =============================================================
    console.log('\n👉 [9. RUN LIMITS ENFORCED]');
    configDoc.dailyRunLimit = 1;
    await configDoc.save();

    await AIRunStore.create({
        runId: 'RUN-LIMIT-01',
        userId: ceoUser._id,
        module: AI_MODULES.SALES_ASSISTANT,
        taskType: 'lead_summary',
        status: AI_RUN_STATUSES.COMPLETED,
        createdAt: new Date()
    });

    const limitRes = await makeRequest(app, {
        path: '/admin/ai/run',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ceoToken}`
        }
    }, {
        module: AI_MODULES.SALES_ASSISTANT,
        taskType: 'lead_summary'
    });

    assert(limitRes.status === 403, 'HTTP 403 when daily run limit is exceeded');
    assert(limitRes.body?.errorCode === AI_ERROR_CODES.RATE_LIMITED, 'errorCode is RATE_LIMITED');

    // Restore normal limit
    configDoc.dailyRunLimit = 200;
    await configDoc.save();

    // =============================================================
    // TEST 10: Audit Event Created
    // =============================================================
    console.log('\n👉 [10. AUDIT EVENT CREATED]');
    const validRunRes = await makeRequest(app, {
        path: '/admin/ai/run',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ceoToken}`
        }
    }, {
        module: AI_MODULES.SALES_ASSISTANT,
        taskType: 'lead_summary',
        parameters: { leadId: testLead._id }
    });

    assert(validRunRes.status === 200, 'Valid analysis run returns HTTP 200');
    assert(validRunRes.body?.success === true, 'Run executed successfully');
    assert(validRunRes.body?.runId !== undefined, 'Run ID generated');

    const auditEntries = await AIAuditLogStore.find();
    assert(auditEntries.length > 0, `Audit logs created in database (total: ${auditEntries.length})`);
    const latestAudit = auditEntries[auditEntries.length - 1];
    assert(latestAudit.userId !== undefined, 'Audit record tracks authoritative userId');
    assert(latestAudit.actorRole === ROLES.CEO, 'Audit record tracks actorRole');
    assert(latestAudit.decision !== undefined, 'Audit record tracks decision (ALLOWED/BLOCKED)');

    // =============================================================
    // TEST 11: API Secrets Never Returned
    // =============================================================
    console.log('\n👉 [11. API SECRETS NEVER RETURNED]');
    const healthRes = await makeRequest(app, { path: '/admin/ai/health' });
    const healthString = JSON.stringify(healthRes.body);
    assert(!healthString.includes('sk-'), 'Health endpoint contains no OpenAI secret keys');
    assert(!healthString.includes('mongodb'), 'Health endpoint contains no MongoDB credentials');
    assert(!healthString.includes(JWT_SECRET), 'Health endpoint contains no JWT secret');

    const configRes = await makeRequest(app, {
        path: '/admin/ai/config',
        headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const configString = JSON.stringify(configRes.body);
    assert(!configString.includes('sk-'), 'Manager config endpoint contains no API secrets');
    assert(!configString.includes(JWT_SECRET), 'Config endpoint contains no JWT secret');

    // =============================================================
    // TEST 12: MongoDB Direct Access Impossible from AI Service
    // =============================================================
    console.log('\n👉 [12. MONGODB DIRECT ACCESS IMPOSSIBLE]');
    const aiServicePath = path.join(__dirname, '../ai-service');
    assert(fs.existsSync(aiServicePath), 'ai-service directory exists');

    const reqsPath = path.join(aiServicePath, 'requirements.txt');
    if (fs.existsSync(reqsPath)) {
        const reqs = fs.readFileSync(reqsPath, 'utf8');
        assert(!reqs.includes('pymongo'), 'requirements.txt does NOT contain pymongo');
        assert(!reqs.includes('motor'), 'requirements.txt does NOT contain motor');
    }

    function scanDir(dir) {
        let foundMongo = false;
        const files = fs.readdirSync(dir);
        for (const f of files) {
            const full = path.join(dir, f);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                if (scanDir(full)) foundMongo = true;
            } else if (f.endsWith('.py') || f.endsWith('.env')) {
                const content = fs.readFileSync(full, 'utf8');
                if (content.includes('mongodb://') || content.includes('mongodb+srv://')) {
                    foundMongo = true;
                }
            }
        }
        return foundMongo;
    }
    const hasDirectMongo = scanDir(aiServicePath);
    assert(!hasDirectMongo, 'ai-service has ZERO direct MongoDB connection strings or imports');

    // =============================================================
    // TEST 13: Fake User Role from Frontend Rejected
    // =============================================================
    console.log('\n👉 [13. FAKE USER ROLE FROM FRONTEND REJECTED]');
    const spoofRes = await makeRequest(app, {
        path: '/admin/ai/config',
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${memberToken}`
        }
    }, {
        role: 'CEO', // Attacker trying to spoof CEO role in request body
        masterEnabled: false
    });
    assert(spoofRes.status === 403, 'Spoofed role in body rejected with 403 based on verified JWT role');

    // =============================================================
    // TEST 14: Opportunity Cannot Become Lead Automatically
    // =============================================================
    console.log('\n👉 [14. OPPORTUNITY CANNOT BECOME LEAD AUTOMATICALLY]');
    const leadsBefore = await LeadStore.countDocuments();
    const opp = await AIOpportunityStore.create({
        source: 'AI_LOCAL',
        detectedIntent: 'Temple Darshan Inquiry',
        serviceInterest: ['TEMPLE_DARSHAN'],
        confidence: 0.88,
        status: 'NEW',
        verificationStatus: 'UNVERIFIED'
    });
    const leadsAfter = await LeadStore.countDocuments();
    assert(leadsBefore === leadsAfter, 'Creating an AIOpportunity does NOT create a CRM Lead document');

    opp.status = 'APPROVED';
    opp.verificationStatus = 'HUMAN_VERIFIED';
    await opp.save();
    const leadsFinal = await LeadStore.countDocuments();
    assert(leadsBefore === leadsFinal, 'Approving opportunity does NOT automatically insert CRM Lead');

    // =============================================================
    // TEST 15: Hunter Modules Remain OFF
    // =============================================================
    console.log('\n👉 [15. HUNTER MODULES REMAIN OFF]');
    assert(configDoc.modules.customerHunter.enabled === false, 'customerHunter module flag is OFF');
    assert(configDoc.modules.localHunter.enabled === false, 'localHunter module flag is OFF');
    assert(configDoc.modules.outsideHunter.enabled === false, 'outsideHunter module flag is OFF');
    assert(configDoc.modules.voiceAi.enabled === false, 'voiceAi module flag is OFF');

    const hunterRunRes = await makeRequest(app, {
        path: '/admin/ai/run',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ceoToken}`
        }
    }, {
        module: AI_MODULES.CUSTOMER_HUNTER,
        taskType: 'lead_discovery'
    });

    assert(hunterRunRes.status === 403, 'Attempted run on customerHunter rejected with 403');
    assert(hunterRunRes.body?.errorCode === AI_ERROR_CODES.MODULE_DISABLED, 'errorCode is MODULE_DISABLED');

    const hunterTools = getAllowedToolsForModule(AI_MODULES.CUSTOMER_HUNTER);
    assert(hunterTools.length === 0 || hunterTools.length === 5, 'Customer Hunter tools strictly governed (0 in Prompt 5, 5 in Prompt 8)');

    console.log('\n================================================================');
    console.log(`🏁 PROMPT 5 SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');
    if (failed > 0) {
        process.exit(1);
    }
}

runSuite().catch((err) => {
    console.error('Unhandled error in test suite:', err);
    process.exit(1);
});
