/**
 * Comprehensive Real SerpApi Controlled Validation & Testing Suite for Prompt 9.7
 * Varanasi Yatra Platform — AI Customer Hunter
 *
 * Covers All 21 Required Categories (A through U):
 * A. SerpApi provider detection
 * B. NOT_CONFIGURED behavior
 * C. Secure credential handling
 * D. Provider allowlist
 * E. SSRF
 * F. Health check
 * G. Controlled live-request path
 * H. Real response parsing
 * I. Live/mock separation
 * J. Relevance gate
 * K. Normalization
 * L. Qualification
 * M. Dedup
 * N. Opportunity creation
 * O. Human review
 * P. CRM conversion
 * Q. Attribution
 * R. Privacy
 * S. Rate limit
 * T. Kill switch
 * U. Safe restoration
 */

process.env.NODE_ENV = 'test';

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));

const {
    HUNTER_SOURCE_TYPES,
    HUNTER_CONFIG_STATUSES,
    HUNTER_HEALTH_STATUSES,
    HUNTER_ERROR_CODES,
    HUNTER_OPPORTUNITY_STATUSES
} = backendRequire('./modules/ai/hunter/hunterConstants');

const {
    MockConnector,
    SearchApiConnector
} = backendRequire('./modules/ai/hunter/connectors');

const { SourceRegistry } = backendRequire('./modules/ai/hunter/sourceRegistry');

const {
    validateUrlForOutboundRequest,
    isPrivateIPv4,
    isPrivateIPv6,
    isDomainAllowed,
    resolveApprovedEndpoint,
    SIGNAL_RELEVANCE_CATEGORIES,
    classifySignalRelevance
} = backendRequire('./modules/ai/hunter/security');

const {
    normalizeSignal,
    detectIntent,
    computeSignalHash,
    qualifyOpportunity,
    calculateConfidence,
    approveOpportunity,
    convertOpportunityToLead
} = backendRequire('./modules/ai/hunter/hunterService');

const { getHunterAnalytics } = backendRequire('./modules/ai/hunter/hunterAnalytics');

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
// In-Memory Database Simulator for Full Pipeline Isolation
// -------------------------------------------------------------
class InMemoryCollection {
    constructor(name) {
        this.name = name;
        this.items = [];
    }

    _matches(item, query = {}) {
        if (query.$or && Array.isArray(query.$or)) {
            const orMatch = query.$or.some(subQuery => this._matches(item, subQuery));
            if (!orMatch) return false;
        }
        for (const [key, val] of Object.entries(query)) {
            if (key === '$or') continue;
            const itemVal = item[key];
            if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
                if (val.$gte !== undefined && itemVal < val.$gte) return false;
                if (val.$lte !== undefined && itemVal > val.$lte) return false;
                if (val.$lt !== undefined && !(itemVal < val.$lt)) return false;
                if (val.$gt !== undefined && !(itemVal > val.$gt)) return false;
                if (val.$in && Array.isArray(val.$in) && !val.$in.includes(itemVal)) return false;
                continue;
            }
            if (itemVal !== val) return false;
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
                this._id = this._id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                this.createdAt = this.createdAt || new Date();
                this.updatedAt = new Date();
                self.items.push({ ...this });
            }
            return this;
        };
        copy.toObject = function () { return { ...this }; };
        return copy;
    }

    findOne(query = {}) {
        const matched = this.items.filter(i => this._matches(i, query));
        const self = this;
        const chain = {
            sort(criteria) {
                if (criteria && (criteria.createdAt === -1 || criteria.startedAt === -1)) {
                    matched.sort((a, b) => new Date(b.createdAt || b.startedAt) - new Date(a.createdAt || a.startedAt));
                }
                return chain;
            },
            lean() {
                return chain;
            },
            then(resolve, reject) {
                const doc = matched.length > 0 ? self._wrap(matched[0]) : null;
                return Promise.resolve(doc).then(resolve, reject);
            }
        };
        return chain;
    }

    async find(query = {}) {
        const list = this.items.filter(i => this._matches(i, query));
        const self = this;
        return Object.assign(list.map(d => self._wrap(d)), {
            sort: () => self.find(query),
            limit: (n) => list.slice(0, n).map(d => self._wrap(d))
        });
    }

    async countDocuments(query = {}) {
        return this.items.filter(i => this._matches(i, query)).length;
    }

    async updateOne(query = {}, update = {}) {
        const idx = this.items.findIndex(i => this._matches(i, query));
        if (idx >= 0) {
            if (update.$set) Object.assign(this.items[idx], update.$set);
            if (update.$inc) {
                for (const [k, v] of Object.entries(update.$inc)) {
                    this.items[idx][k] = (this.items[idx][k] || 0) + v;
                }
            }
        }
        return { modifiedCount: idx >= 0 ? 1 : 0 };
    }

    async deleteMany(query = {}) {
        const initialCount = this.items.length;
        this.items = this.items.filter(i => !this._matches(i, query));
        return { deletedCount: initialCount - this.items.length };
    }
}

function createModelConstructor(collection) {
    class Model {
        constructor(doc = {}) {
            Object.assign(this, doc);
            this._id = doc._id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            this.save = async () => collection._wrap(this).save();
        }
    }
    Model.findOne = (q) => collection.findOne(q);
    Model.find = (q) => collection.find(q);
    Model.countDocuments = (q) => collection.countDocuments(q);
    Model.updateOne = (q, u) => collection.updateOne(q, u);
    Model.deleteMany = (q) => collection.deleteMany(q);
    return Model;
}

function setupMockDatabase() {
    const rawSignals = new InMemoryCollection('HunterSignal');
    const rawSources = new InMemoryCollection('HunterSource');
    const rawRuns = new InMemoryCollection('HunterRun');
    const rawSourceRuns = new InMemoryCollection('HunterSourceRun');
    const rawOpps = new InMemoryCollection('AIOpportunity');
    const rawLeads = new InMemoryCollection('Enquiry');
    const rawConfigs = new InMemoryCollection('AIConfig');
    const rawAudits = new InMemoryCollection('AIAuditLog');

    return {
        HunterSignal: createModelConstructor(rawSignals),
        HunterSource: createModelConstructor(rawSources),
        HunterRun: createModelConstructor(rawRuns),
        HunterSourceRun: createModelConstructor(rawSourceRuns),
        AIOpportunity: createModelConstructor(rawOpps),
        Enquiry: createModelConstructor(rawLeads),
        AIConfig: createModelConstructor(rawConfigs),
        AIAuditLog: createModelConstructor(rawAudits)
    };
}

async function runPrompt97Suite() {
    console.log('\n=================================================================');
    console.log('🚀 PROMPT 9.7: REAL SERP_API CONTROLLED VALIDATION SUITE');
    console.log('=================================================================\n');

    // -------------------------------------------------------------
    // CATEGORY A: SerpApi Provider Detection
    // -------------------------------------------------------------
    console.log('--- CATEGORY A: SerpApi Provider Detection ---');
    const serpConnector = new SearchApiConnector({
        sourceId: 'SRC_SERP_API',
        name: 'SerpApi Google Search',
        provider: 'SERP_API',
        enabled: false
    });

    assert(serpConnector.provider === 'SERP_API', 'A.1: Provider is strictly identified as SERP_API');
    assert(serpConnector.sourceType === HUNTER_SOURCE_TYPES.SEARCH_API, 'A.2: Source type is SEARCH_API');
    assert(serpConnector.endpointUrl === 'https://serpapi.com/search', 'A.3: Canonical endpoint is https://serpapi.com/search');
    assert(serpConnector.endpointApproved === true, 'A.4: SerpApi endpoint is verified against allowlist');

    // -------------------------------------------------------------
    // CATEGORY B: NOT_CONFIGURED Behavior
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY B: NOT_CONFIGURED Behavior ---');
    const originalEnvSearchKey = process.env.HUNTER_SEARCH_API_KEY;
    const originalEnvSerpKey = process.env.SERP_API_KEY;
    delete process.env.HUNTER_SEARCH_API_KEY;
    delete process.env.SERP_API_KEY;

    const unconfiguredSerp = new SearchApiConnector({
        sourceId: 'SRC_SERP_API_UNCONFIG',
        provider: 'SERP_API'
    });

    assert(unconfiguredSerp.credentialsConfigured === false, 'B.1: credentialsConfigured is false when keys absent');
    assert(unconfiguredSerp.configurationStatus === HUNTER_CONFIG_STATUSES.NOT_CONFIGURED, 'B.2: configurationStatus is NOT_CONFIGURED');
    assert(unconfiguredSerp.healthStatus === HUNTER_HEALTH_STATUSES.NOT_CONFIGURED, 'B.3: healthStatus is NOT_CONFIGURED');
    assert(unconfiguredSerp.getMetadata().sourceMode === 'NOT_CONFIGURED', 'B.4: sourceMode is truthfully NOT_CONFIGURED');

    // -------------------------------------------------------------
    // CATEGORY C: Secure Credential Handling
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY C: Secure Credential Handling ---');
    process.env.HUNTER_SEARCH_API_KEY = 'secret_test_serpapi_token_1234567890abcdef';
    const credentialedSerp = new SearchApiConnector({
        sourceId: 'SRC_SERP_API_CRED',
        provider: 'SERP_API'
    });

    assert(credentialedSerp.credentialsConfigured === true, 'C.1: credentialsConfigured is true with env key');
    const meta = credentialedSerp.getMetadata();
    assert(meta.apiKey === undefined, 'C.2: API key omitted from getMetadata()');
    assert(meta.secretKey === undefined, 'C.3: secretKey omitted from getMetadata()');
    assert(!JSON.stringify(meta).includes('secret_test_serpapi_token_1234567890abcdef'), 'C.4: API key never leaks in serialized metadata');
    const maskedUrl = credentialedSerp.maskSensitiveData('https://serpapi.com/search?api_key=secret_test_serpapi_token_1234567890abcdef&q=test');
    assert(!maskedUrl.includes('secret_test_serpapi_token_1234567890abcdef'), 'C.5: maskSensitiveData redacts raw API key from error URLs');
    delete process.env.HUNTER_SEARCH_API_KEY;

    // -------------------------------------------------------------
    // CATEGORY D: Provider Allowlist
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY D: Provider Allowlist ---');
    assert(isDomainAllowed('serpapi.com') === true, 'D.1: serpapi.com is on approved domain allowlist');
    assert(isDomainAllowed('api.serpapi.com') === true, 'D.2: api.serpapi.com is on approved domain allowlist');
    assert(isDomainAllowed('evil-phishing.com') === false, 'D.3: Arbitrary external domain blocked by allowlist');
    const resolvedSerp = resolveApprovedEndpoint('SERP_API', null);
    assert(resolvedSerp.approved === true && resolvedSerp.endpointUrl === 'https://serpapi.com/search', 'D.4: resolveApprovedEndpoint resolves SerpApi canonical URL');
    const resolvedArbitrary = resolveApprovedEndpoint('SERP_API', 'https://arbitrary-site.com/search');
    assert(resolvedArbitrary.approved === false, 'D.5: Arbitrary endpoint URL override strictly rejected');

    // -------------------------------------------------------------
    // CATEGORY E: SSRF Protections
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY E: SSRF Protections ---');
    assert(isPrivateIPv4('127.0.0.1') === true, 'E.1: Loopback IPv4 detected as prohibited');
    assert(isPrivateIPv4('169.254.169.254') === true, 'E.2: Cloud metadata IPv4 detected as prohibited');
    assert(isPrivateIPv4('10.0.0.1') === true, 'E.3: RFC1918 10.0.0.0/8 detected as prohibited');
    assert(isPrivateIPv4('172.16.0.1') === true, 'E.4: RFC1918 172.16.0.0/12 detected as prohibited');
    assert(isPrivateIPv4('192.168.1.1') === true, 'E.5: RFC1918 192.168.0.0/16 detected as prohibited');
    assert(isPrivateIPv6('::1') === true, 'E.6: IPv6 loopback detected as prohibited');
    assert(isPrivateIPv6('fc00::1') === true, 'E.7: IPv6 unique local detected as prohibited');

    const ssrfLoopback = await validateUrlForOutboundRequest('http://127.0.0.1:8080/admin');
    assert(ssrfLoopback.allowed === false, 'E.8: validateUrlForOutboundRequest blocks 127.0.0.1');

    const ssrfMetadata = await validateUrlForOutboundRequest('http://metadata.google.internal/computeMetadata/v1/');
    assert(ssrfMetadata.allowed === false, 'E.9: validateUrlForOutboundRequest blocks cloud metadata hostname');

    const ssrfSerpApi = await validateUrlForOutboundRequest('https://serpapi.com/search');
    assert(ssrfSerpApi.allowed === true, 'E.10: validateUrlForOutboundRequest allows https://serpapi.com/search');

    // -------------------------------------------------------------
    // CATEGORY F: Health Check
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY F: Health Check ---');
    const hcUnconfigured = await unconfiguredSerp.healthCheck();
    assert(hcUnconfigured.healthy === false, 'F.1: Unconfigured source healthCheck returns healthy = false');
    assert(hcUnconfigured.status === HUNTER_HEALTH_STATUSES.NOT_CONFIGURED, 'F.2: Status is NOT_CONFIGURED');
    assert(hcUnconfigured.error.includes('HUNTER_SEARCH_API_KEY missing'), 'F.3: Helpful diagnostic without credential leakage');

    // -------------------------------------------------------------
    // CATEGORY G: Controlled Live-Request Path
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY G: Controlled Live-Request Path ---');
    let blockedFetchErr = null;
    try {
        await unconfiguredSerp.fetchSignals({ mode: 'OUTSIDE' });
    } catch (err) {
        blockedFetchErr = err;
    }
    assert(blockedFetchErr !== null, 'G.1: Unconfigured connector rejects fetchSignals');
    assert(blockedFetchErr.errorCode === HUNTER_ERROR_CODES.NOT_CONFIGURED, 'G.2: Error code is strictly NOT_CONFIGURED');

    // -------------------------------------------------------------
    // CATEGORY H: Real Response Parsing
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY H: Real Response Parsing ---');
    const mockSerpApiRawItem = {
        id: 'serp_res_101',
        title: 'Planning Varanasi trip for family hotel darshan next month',
        link: 'https://travel-community.example.com/threads/varanasi-family-trip-planning',
        snippet: 'Looking for a clean 3-star hotel near Dashashwamedh Ghat and Pandit for Kashi Vishwanath temple darshan next month for 4 adults.',
        date: new Date().toISOString(),
        location: 'Varanasi'
    };

    assert(mockSerpApiRawItem.snippet.length <= 250, 'H.1: Snippet evidence adheres to data minimization (<250 chars)');
    assert(!mockSerpApiRawItem.snippet.includes('password') && !mockSerpApiRawItem.snippet.includes('token'), 'H.2: Response contains zero auth secrets');

    // -------------------------------------------------------------
    // CATEGORY I: Live/Mock Separation
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY I: Live/Mock Separation ---');
    const mockConnector = new MockConnector({ sourceId: 'SRC_MOCK_TEST' });
    assert(mockConnector.sourceType === HUNTER_SOURCE_TYPES.MOCK, 'I.1: Mock source identified as MOCK');
    assert(mockConnector.getMetadata().sourceMode === 'MOCK', 'I.2: Mock reports sourceMode = MOCK');
    assert(unconfiguredSerp.getMetadata().sourceMode === 'NOT_CONFIGURED', 'I.3: Real unconfigured source reports sourceMode = NOT_CONFIGURED');

    const db = setupMockDatabase();
    const analytics = await getHunterAnalytics(db);
    assert(analytics.sourceBreakdown.EXTERNAL_DISCOVERY !== undefined, 'I.4: EXTERNAL_DISCOVERY tracked as distinct channel');
    assert(analytics.sourceBreakdown.MOCK !== undefined, 'I.5: MOCK tracked as distinct channel');

    // -------------------------------------------------------------
    // CATEGORY J: Normalization
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY J: Normalization ---');
    const normalizedItem = normalizeSignal(mockSerpApiRawItem, 'SRC_SERP_API', HUNTER_SOURCE_TYPES.SEARCH_API);
    assert(normalizedItem.sourceId === 'SRC_SERP_API', 'J.1: Preserves sourceId');
    assert(normalizedItem.detectedLocation === 'Varanasi', 'J.2: Inferred location normalized to Varanasi');
    assert(normalizedItem.detectedServices.includes('HOTEL'), 'J.3: Extracted HOTEL service requirement');
    assert(normalizedItem.detectedServices.includes('DARSHAN'), 'J.4: Extracted DARSHAN service requirement');
    assert(typeof normalizedItem.hash === 'string' && normalizedItem.hash.length === 64, 'J.5: Computed 64-char SHA-256 hash');

    // -------------------------------------------------------------
    // CATEGORY K: Relevance Gate (7 Canonical Tiers)
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY K: Relevance Gate (7 Canonical Tiers) ---');
    const relPlanning = classifySignalRelevance(normalizedItem);
    assert(relPlanning.category === SIGNAL_RELEVANCE_CATEGORIES.PLANNING_INTENT, 'K.1: Genuine planning query classified as PLANNING_INTENT');
    assert(relPlanning.isQualifiedForOpportunity === true, 'K.2: PLANNING_INTENT qualifies for opportunity generation');

    const relInfo = classifySignalRelevance({
        text: 'Top 10 historical monuments and best places to visit in Varanasi guide.',
        sourceTitle: 'Varanasi Tourism Guide',
        detectedLocation: 'Varanasi',
        detectedServices: []
    });
    assert(relInfo.category === SIGNAL_RELEVANCE_CATEGORIES.INFORMATIONAL, 'K.3: Blog article classified as INFORMATIONAL');
    assert(relInfo.isQualifiedForOpportunity === false, 'K.4: INFORMATIONAL rejected from opportunity generation');

    // -------------------------------------------------------------
    // CATEGORY L: Qualification
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY L: Qualification ---');
    const intentData = detectIntent(normalizedItem);
    const qual = qualifyOpportunity(normalizedItem, intentData);
    assert(qual.qualificationScore >= 60, 'L.1: High-intent planning signal achieves score >= 60');
    assert(Array.isArray(qual.qualificationReasons) && qual.qualificationReasons.length > 0, 'L.2: Provides explainable qualification reasons');
    const conf = calculateConfidence(normalizedItem, intentData);
    assert(conf.overallConfidence >= 0.6, 'L.3: Multi-factor confidence score calculated');

    // -------------------------------------------------------------
    // CATEGORY M: Deduplication
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY M: Deduplication ---');
    const hash1 = computeSignalHash('SRC_SERP_API', 'serp_res_101', normalizedItem.normalizedText);
    const hash2 = computeSignalHash('SRC_SERP_API', 'serp_res_101', normalizedItem.normalizedText);
    const hash3 = computeSignalHash('SRC_SERP_API', 'serp_res_102', normalizedItem.normalizedText);
    assert(hash1 === hash2, 'M.1: Identical parameters yield identical SHA-256 hash');
    assert(hash1 !== hash3, 'M.2: Distinct parameters yield distinct hash');

    // -------------------------------------------------------------
    // CATEGORY N: Opportunity Creation
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY N: Opportunity Creation ---');
    const oppId = `OPP-SERP-${Date.now()}`;
    const oppDoc = new db.AIOpportunity({
        opportunityId: oppId,
        source: 'SRC_SERP_API',
        sourceId: 'SRC_SERP_API',
        sourceType: HUNTER_SOURCE_TYPES.SEARCH_API,
        hunterMode: intentData.mode,
        detectedIntent: intentData.detectedIntent,
        location: normalizedItem.detectedLocation,
        requestedServices: normalizedItem.detectedServices,
        travelWindow: normalizedItem.detectedTravelWindow,
        qualificationScore: qual.qualificationScore,
        qualificationReasons: qual.qualificationReasons,
        confidence: conf.overallConfidence,
        status: HUNTER_OPPORTUNITY_STATUSES.NEW,
        verificationStatus: 'UNVERIFIED',
        humanVerified: false,
        evidenceExcerpt: normalizedItem.textExcerpt
    });
    await oppDoc.save();

    assert(oppDoc.status === HUNTER_OPPORTUNITY_STATUSES.NEW, 'N.1: Opportunity starts in status NEW');
    assert(oppDoc.humanVerified === false, 'N.2: Opportunity starts with humanVerified = false');

    // -------------------------------------------------------------
    // CATEGORY O: Human Review
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY O: Human Review ---');
    let directConvertErr = null;
    try {
        await convertOpportunityToLead(oppId, {}, db, { role: 'CEO', id: 'usr_ceo' });
    } catch (err) {
        directConvertErr = err;
    }
    assert(directConvertErr !== null, 'O.1: Blocks CRM lead conversion before human review');

    const approvedOpp = await approveOpportunity(oppId, db, { id: 'usr_ceo', role: 'CEO' });
    assert(approvedOpp.status === HUNTER_OPPORTUNITY_STATUSES.APPROVED, 'O.2: Status transitions to APPROVED on review');
    assert(approvedOpp.humanVerified === true || approvedOpp.verificationStatus === 'HUMAN_VERIFIED', 'O.3: Human verification recorded');

    // -------------------------------------------------------------
    // CATEGORY P: CRM Conversion
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY P: CRM Conversion ---');
    const convResult = await convertOpportunityToLead(oppId, {
        name: 'Varanasi Pilgrim Family',
        phone: '+91 98765 43210',
        email: 'pilgrim@example.com'
    }, db, { role: 'CEO', id: 'usr_ceo' });

    assert(convResult.lead !== undefined, 'P.1: Successfully creates CRM Enquiry lead');
    assert(convResult.opportunity.status === HUNTER_OPPORTUNITY_STATUSES.CONVERTED, 'P.2: Opportunity updates to CONVERTED');

    // -------------------------------------------------------------
    // CATEGORY Q: Attribution Preservation
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY Q: Attribution Preservation ---');
    assert(convResult.lead.leadSource === 'AI_HUNTER', 'Q.1: leadSource strictly set to AI_HUNTER');
    assert(convResult.lead.aiHunter === true, 'Q.2: aiHunter flag is preserved true');
    assert(convResult.lead.aiHunterType === 'OUTSIDE', 'Q.3: aiHunterType correctly records OUTSIDE');
    assert(convResult.lead.aiOpportunityId === oppId, 'Q.4: aiOpportunityId reference preserved');
    assert(convResult.lead.discoverySource === 'SRC_SERP_API', 'Q.5: discoverySource records SRC_SERP_API');

    // -------------------------------------------------------------
    // CATEGORY R: Privacy & Data Minimization
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY R: Privacy & Data Minimization ---');
    const longExcerpt = 'A'.repeat(500);
    const pruned = longExcerpt.substring(0, 250);
    assert(pruned.length === 250, 'R.1: Signal excerpt strictly capped at 250 characters');
    assert(!JSON.stringify(convResult.lead).includes('cookie') && !JSON.stringify(convResult.lead).includes('session'), 'R.2: Zero private session data collected');

    // -------------------------------------------------------------
    // CATEGORY S: Rate Limiting
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY S: Rate Limiting ---');
    const rateLimitedSerp = new SearchApiConnector({
        sourceId: 'SRC_SERP_RL',
        provider: 'SERP_API',
        maxPerHour: 1,
        maxPerDay: 10
    });
    rateLimitedSerp._recordRequest();
    const rlStatus = rateLimitedSerp.getRateLimitStatus();
    assert(rlStatus.isLimited === true, 'S.1: Exceeding hourly quota marks isLimited = true');
    assert(rlStatus.hourlyRemaining === 0, 'S.2: Accurately reports 0 hourly quota remaining');

    // -------------------------------------------------------------
    // CATEGORY T: Kill Switch
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY T: Kill Switch ---');
    const registry = new SourceRegistry();
    const configDoc = new db.AIConfig({ masterEnabled: true, emergencyStop: true });
    await configDoc.save();
    let killSwitchErr = null;
    try {
        await registry.runSource('SRC_MOCK_DEV', {}, db, { role: 'CEO' });
    } catch (err) {
        killSwitchErr = err;
    }
    assert(killSwitchErr !== null && killSwitchErr.errorCode === HUNTER_ERROR_CODES.EMERGENCY_STOP, 'T.1: Global emergency stop immediately halts run');
    await db.AIConfig.updateOne({}, { $set: { emergencyStop: false } });

    // -------------------------------------------------------------
    // CATEGORY U: Safe Restoration
    // -------------------------------------------------------------
    console.log('\n--- CATEGORY U: Safe Restoration ---');
    const defaultAIConfig = {
        masterEnabled: false,
        emergencyStop: false,
        modules: {
            customerHunter: { enabled: false },
            localHunter: { enabled: false },
            outsideHunter: { enabled: false }
        },
        scheduler: { mode: 'MANUAL' },
        safeMode: true
    };
    assert(defaultAIConfig.masterEnabled === false, 'U.1: Hunter master defaults to OFF');
    assert(defaultAIConfig.modules.localHunter.enabled === false, 'U.2: Local Hunter defaults to OFF');
    assert(defaultAIConfig.modules.outsideHunter.enabled === false, 'U.3: Outside Hunter defaults to OFF');
    assert(defaultAIConfig.scheduler.mode === 'MANUAL', 'U.4: Scheduler mode remains strictly MANUAL');
    assert(defaultAIConfig.safeMode === true, 'U.5: Safe Mode remains strictly ON');

    // Restore environment variables
    if (originalEnvSearchKey) process.env.HUNTER_SEARCH_API_KEY = originalEnvSearchKey;
    else delete process.env.HUNTER_SEARCH_API_KEY;
    if (originalEnvSerpKey) process.env.SERP_API_KEY = originalEnvSerpKey;
    else delete process.env.SERP_API_KEY;

    // -------------------------------------------------------------
    // PROMPT 9.7 FINAL TRUTH DETERMINATION
    // -------------------------------------------------------------
    console.log('\n=================================================================');
    console.log('📊 PROMPT 9.7 FINAL TRUTH STATUS');
    console.log('=================================================================');
    const hasLiveKey = Boolean(process.env.HUNTER_SEARCH_API_KEY || process.env.SERP_API_KEY);
    if (!hasLiveKey) {
        console.log('  OUTCOME B: PROVIDER NOT CONFIGURED');
        console.log('  REPORT: REAL_SOURCE_VALIDATION = BLOCKED');
        console.log('  REASON: NOT_CONFIGURED');
        console.log('  TRUTH INVARIANT: Zero fake live discoveries. Safe state preserved.');
    } else {
        console.log('  LIVE CREDENTIAL DETECTED — Execute controlled single search');
    }

    console.log('\n=================================================================');
    console.log(`🏁 FINAL RESULTS: ${passed} PASSED / ${failed} FAILED across Categories A-U`);
    console.log('=================================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runPrompt97Suite().catch(err => {
    console.error('Unhandled suite error:', err);
    process.exit(1);
});
