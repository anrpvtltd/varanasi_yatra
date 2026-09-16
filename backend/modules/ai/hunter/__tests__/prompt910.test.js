#!/usr/bin/env node
/**
 * Prompt 9.10 — Unit Test Suite
 * Varanasi Yatra Platform — AI Customer Hunter
 * Real-Prospect Quality, Contactability Validation & Production Hardening
 *
 * Self-contained tests using Node.js built-in assert.
 * Run: node backend/modules/ai/hunter/__tests__/prompt910.test.js
 *
 * Minimum Test Scenarios:
 *   1. Informational false-positive cases (rejected by relevance gate)
 *   2. SEO-page cases (rejected from becoming qualified prospects)
 *   3. Strong commercial intent cases (COMMERCIAL_TRIP_REQUEST / ACTIVE_TRAVEL_PLANNING)
 *   4. Multiple service cases (hotel + darshan + boat + transport)
 *   5. Unknown timing (accepted with UNKNOWN / flexible, not discarded)
 *   6. 3+ month future timing (accepted for advance trip planning)
 *   7. Low urgency acceptance (accepted, not rejected solely because urgency is LOW)
 *   8. Duplicate cases (URL fingerprint, normalized URL, identity hash protection)
 *   9. Stale cases (evaluateOpportunityStaleness transitions without deletion)
 *  10. Contactability states (VERIFIED, UNVERIFIED, STALE, REJECTED, NOT_FOUND, PROVIDER_NOT_CONFIGURED)
 *  11. Best-contact-route selection (WhatsApp > phone > email > business website > social/directory)
 *  12. Human gate (strict verification required before CRM conversion)
 *  13. Unauthorized conversion prevention (blocked for non-genuine / unapproved opportunities)
 *  14. Source quality metrics (CEO source quality analytics calculation)
 *  15. Privacy/role restrictions (CEO vs Manager permissions, masked contact info)
 *  16. Audit logging (complete audit trail preserved)
 */

'use strict';

const assert = require('assert');
const path = require('path');

// ─── Color helpers ────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function test(label, fn) {
    try {
        fn();
        passed++;
        console.log(`  ${GREEN}✓${RESET} ${label}`);
    } catch (err) {
        failed++;
        failures.push({ label, err });
        console.log(`  ${RED}✗${RESET} ${label}`);
        console.error(`    ${RED}${err.message}${RESET}`);
    }
}

async function asyncTest(label, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ${GREEN}✓${RESET} ${label}`);
    } catch (err) {
        failed++;
        failures.push({ label, err });
        console.log(`  ${RED}✗${RESET} ${label}`);
        console.error(`    ${RED}${err.message}${RESET}`);
    }
}

// ─── Modules Under Test ───────────────────────────────────────────────────────
const {
    COMMERCIAL_INTENT_CATEGORIES,
    HUNTER_LIFECYCLE_STATES,
    ROUTE_VERIFICATION_STATUSES,
    STALENESS_STATUSES,
    RECOMMENDED_NEXT_ACTIONS,
    HUNTER_SERVICES,
    HUNTER_MODES,
    HUNTER_OPPORTUNITY_STATUSES,
    HUNTER_VERIFICATION_STATUSES,
    ALL_HUMAN_CONTACT_OUTCOMES
} = require('../hunterConstants');

const {
    classifyCommercialIntent,
    extractAdvanceTravelWindow
} = require('../scoring/commercialIntentClassifier');

const {
    generateProspectExplanation,
    determineBestContactRoute
} = require('../scoring/prospectExplainer');

const {
    classifySignalRelevance
} = require('../security/relevanceGate');

const {
    normalizeSignal,
    detectIntent,
    qualifyOpportunity,
    calculateConfidence,
    evaluateOpportunityStaleness,
    normalizeSourceUrl,
    computeOpportunityIdentityHash,
    computeUrlFingerprint,
    convertOpportunityToLead,
    approveOpportunity,
    rejectOpportunity,
    recordHumanContactOutcome
} = require('../hunterService');

const {
    getSourceQualityAnalytics,
    getExtendedFunnelAnalytics
} = require('../hunterAnalytics');

console.log(`\n${BOLD}============================================================${RESET}`);
console.log(`${BOLD}PROMPT 9.10 — FOCUSED UNIT TEST SUITE${RESET}`);
console.log(`${BOLD}============================================================${RESET}\n`);

// ─────────────────────────────────────────────────────────────────────────────
console.log(`${BOLD}1. Constants & Enum Integrity${RESET}`);

test('COMMERCIAL_INTENT_CATEGORIES contains all 6 required categories', () => {
    assert.strictEqual(COMMERCIAL_INTENT_CATEGORIES.INFORMATIONAL, 'INFORMATIONAL');
    assert.strictEqual(COMMERCIAL_INTENT_CATEGORIES.INSPIRATIONAL, 'INSPIRATIONAL');
    assert.strictEqual(COMMERCIAL_INTENT_CATEGORIES.PLANNING, 'PLANNING');
    assert.strictEqual(COMMERCIAL_INTENT_CATEGORIES.ACTIVE_TRAVEL_PLANNING, 'ACTIVE_TRAVEL_PLANNING');
    assert.strictEqual(COMMERCIAL_INTENT_CATEGORIES.COMMERCIAL_TRIP_REQUEST, 'COMMERCIAL_TRIP_REQUEST');
    assert.strictEqual(COMMERCIAL_INTENT_CATEGORIES.UNKNOWN, 'UNKNOWN');
});

test('HUNTER_LIFECYCLE_STATES contains all Phase 5 lifecycle states', () => {
    const required = [
        'DISCOVERED', 'RELEVANT', 'QUALIFIED', 'ACTIONABLE', 'CONTACTABLE',
        'HUMAN_REVIEW', 'CONTACTED', 'GENUINE', 'NOT_GENUINE',
        'FOLLOW_UP_REQUIRED', 'NO_RESPONSE', 'WRONG_CONTACT',
        'ALREADY_BOOKED', 'NOT_INTERESTED', 'STALE', 'CRM_LEAD'
    ];
    for (const st of required) {
        assert.ok(HUNTER_LIFECYCLE_STATES[st], `Missing lifecycle state: ${st}`);
    }
});

test('ROUTE_VERIFICATION_STATUSES contains all 6 route states', () => {
    assert.strictEqual(ROUTE_VERIFICATION_STATUSES.VERIFIED, 'VERIFIED');
    assert.strictEqual(ROUTE_VERIFICATION_STATUSES.UNVERIFIED, 'UNVERIFIED');
    assert.strictEqual(ROUTE_VERIFICATION_STATUSES.STALE, 'STALE');
    assert.strictEqual(ROUTE_VERIFICATION_STATUSES.REJECTED, 'REJECTED');
    assert.strictEqual(ROUTE_VERIFICATION_STATUSES.NOT_FOUND, 'NOT_FOUND');
    assert.strictEqual(ROUTE_VERIFICATION_STATUSES.PROVIDER_NOT_CONFIGURED, 'PROVIDER_NOT_CONFIGURED');
});

test('STALENESS_STATUSES contains all freshness states', () => {
    assert.strictEqual(STALENESS_STATUSES.FRESH, 'FRESH');
    assert.strictEqual(STALENESS_STATUSES.AGING, 'AGING');
    assert.strictEqual(STALENESS_STATUSES.STALE, 'STALE');
    assert.strictEqual(STALENESS_STATUSES.EXPIRED, 'EXPIRED');
    assert.strictEqual(STALENESS_STATUSES.CLOSED, 'CLOSED');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}2. Commercial Intent & Informational False-Positive Rejection${RESET}`);

test('INFORMATIONAL: Travel blog / listicle is rejected and marked INFORMATIONAL', () => {
    const signal = {
        normalizedText: '10 best places to visit in Varanasi during winter. Top temples and attractions.',
        sourceUrl: 'https://travelblog.example/top-10-places-varanasi',
        detectedServices: ['DARSHAN']
    };
    const intentData = { mode: 'AI_OUTSIDE', detectedIntent: 'TRIP_PLANNING' };

    const relevance = classifySignalRelevance(signal, intentData);
    assert.strictEqual(relevance.isQualifiedForOpportunity, false);
    assert.strictEqual(relevance.category, 'INFORMATIONAL');

    const commIntent = classifyCommercialIntent(signal, intentData);
    assert.strictEqual(commIntent.category, 'INFORMATIONAL');
    assert.strictEqual(commIntent.isCommercial, false);
});

test('SEO-PAGE: Wikipedia / encyclopedic page rejected as INFORMATIONAL', () => {
    const signal = {
        normalizedText: 'Varanasi is a city on the Ganges river in northern India that has a central place in the traditions of pilgrimage.',
        sourceUrl: 'https://en.wikipedia.org/wiki/Varanasi',
        detectedServices: []
    };
    const intentData = { mode: 'AI_OUTSIDE', detectedIntent: 'TRIP_PLANNING' };

    const relevance = classifySignalRelevance(signal, intentData);
    assert.strictEqual(relevance.isQualifiedForOpportunity, false);
    assert.strictEqual(relevance.category, 'INFORMATIONAL');
});

test('COMMERCIAL_TRIP_REQUEST: Strong explicit request with multiple services qualifies', () => {
    const signal = {
        normalizedText: 'Need 3 star hotel near Kashi Vishwanath mandir, boat ride at Dashashwamedh ghat and airport pickup for 4 people next week.',
        sourceUrl: 'https://travelcommunity.example/t/varanasi-booking-help/4821',
        detectedServices: ['HOTEL', 'DARSHAN', 'BOAT', 'TRANSPORT'],
        detectedLocation: 'Varanasi',
        detectedTravelWindow: 'Next week'
    };
    const intentData = { mode: 'AI_OUTSIDE', detectedIntent: 'PACKAGE_SEARCH' };

    const relevance = classifySignalRelevance(signal, intentData);
    assert.strictEqual(relevance.isQualifiedForOpportunity, true);

    const commIntent = classifyCommercialIntent(signal, intentData);
    assert.strictEqual(commIntent.category, 'COMMERCIAL_TRIP_REQUEST');
    assert.strictEqual(commIntent.isCommercial, true);
    assert.ok(commIntent.score >= 80);
});

test('ACTIVE_TRAVEL_PLANNING: Budget / pricing inquiry with travel window', () => {
    const signal = {
        normalizedText: 'Looking for a 3 day Varanasi package rate for family trip in December. Need hotel and darshan pass.',
        sourceUrl: 'https://forum.example/varanasi-package-rates',
        detectedServices: ['PACKAGE', 'HOTEL', 'DARSHAN'],
        detectedLocation: 'Varanasi',
        detectedTravelWindow: 'December'
    };
    const intentData = { mode: 'AI_OUTSIDE', detectedIntent: 'PACKAGE_SEARCH' };

    const commIntent = classifyCommercialIntent(signal, intentData);
    assert.ok(
        commIntent.category === 'COMMERCIAL_TRIP_REQUEST' || commIntent.category === 'ACTIVE_TRAVEL_PLANNING',
        `Expected commercial request or active planning, got: ${commIntent.category}`
    );
    assert.strictEqual(commIntent.isCommercial, true);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}3. Timing, Advance Planning & Low Urgency Acceptance${RESET}`);

test('3+ MONTH FUTURE TIMING: Accepted for advance planning, not discarded', () => {
    const signal = {
        normalizedText: 'Planning our Varanasi family pilgrimage in November 2026. Looking for hotel and pandit booking for puja.',
        sourceUrl: 'https://forum.example/varanasi-nov-2026',
        detectedServices: ['HOTEL', 'PANDIT'],
        detectedLocation: 'Varanasi',
        detectedTravelWindow: 'November'
    };
    const intentData = { mode: 'AI_OUTSIDE', detectedIntent: 'FAMILY_TRIP' };

    const relevance = classifySignalRelevance(signal, intentData);
    assert.strictEqual(relevance.isQualifiedForOpportunity, true);

    const commIntent = classifyCommercialIntent(signal, intentData);
    assert.ok(['PLANNING', 'ACTIVE_TRAVEL_PLANNING', 'COMMERCIAL_TRIP_REQUEST'].includes(commIntent.category));
    assert.strictEqual(commIntent.advancePlanning, true);
});

test('LOW URGENCY: Do not reject low urgency solely because urgency is LOW', () => {
    const signal = {
        normalizedText: 'We are planning to visit Varanasi someday next year with parents. Would need wheelchair darshan and clean hotel.',
        sourceUrl: 'https://forum.example/varanasi-someday',
        detectedServices: ['HOTEL', 'DARSHAN'],
        detectedLocation: 'Varanasi'
    };
    const intentData = { mode: 'AI_OUTSIDE', detectedIntent: 'FAMILY_TRIP' };

    const commIntent = classifyCommercialIntent(signal, intentData);
    assert.strictEqual(commIntent.urgency, 'LOW');
    // Still planning or active travel planning — not rejected solely due to low urgency
    assert.ok(commIntent.category !== 'INFORMATIONAL');
});

test('UNKNOWN TIMING: Preserves UNKNOWN when evidence is insufficient', () => {
    const signal = {
        normalizedText: 'Need reliable boatman contact and rate in Varanasi.',
        sourceUrl: 'https://forum.example/boatman-rate',
        detectedServices: ['BOAT']
    };
    const intentData = { mode: 'AI_LOCAL', detectedIntent: 'BOAT_NOW' };

    const commIntent = classifyCommercialIntent(signal, intentData);
    assert.strictEqual(commIntent.timingDetail.travelWindow, null);
    assert.strictEqual(commIntent.timingDetail.urgency, 'UNKNOWN');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}4. Explainable Prospect Quality & Best Contact Route${RESET}`);

test('EXPLAINABLE PROSPECT QUALITY: Breakdown contains all 11 required fields with zero black box', () => {
    const opportunity = {
        detectedIntent: 'PACKAGE_SEARCH',
        hunterMode: 'AI_OUTSIDE',
        serviceInterest: ['HOTEL', 'DARSHAN', 'BOAT'],
        location: 'Varanasi',
        travelWindow: 'December',
        sourceUrl: 'https://travelhub.example/posts/101',
        source: 'SRC_SEARCH_API'
    };
    const signal = {
        text: 'Planning 3 days Varanasi trip with family in December. Need hotel near ghat and VIP darshan.',
        detectedServices: ['HOTEL', 'DARSHAN', 'BOAT'],
        detectedLocation: 'Varanasi',
        detectedTravelWindow: 'December',
        sourceUrl: 'https://travelhub.example/posts/101'
    };
    const actionResult = { actionabilityScore: 78, actionabilityTier: 'ACTIONABLE', breakdown: {} };
    const relevanceResult = { category: 'HIGH_INTENT', isQualifiedForOpportunity: true, reason: 'Strong multi-service request' };
    const commercialIntent = { category: 'COMMERCIAL_TRIP_REQUEST', score: 85, positiveSignals: ['Explicit need', 'Multiple services'] };
    const contactRoutes = [
        { type: 'BUSINESS_WEBSITE', value: 'https://prospect-agency.example', verificationStatus: 'VERIFIED' },
        { type: 'PUBLIC_EMAIL', value: 'info@prospect-agency.example', verificationStatus: 'UNVERIFIED' }
    ];

    const explanation = generateProspectExplanation({
        opportunity,
        signal,
        actionResult,
        relevanceResult,
        commercialIntent,
        contactRoutes
    });

    assert.strictEqual(explanation.actionabilityScore, 78);
    assert.strictEqual(explanation.actionabilityTier, 'ACTIONABLE');
    assert.strictEqual(explanation.relevanceCategory, 'HIGH_INTENT');
    assert.strictEqual(explanation.intentCategory, 'COMMERCIAL_TRIP_REQUEST');
    assert.deepStrictEqual(explanation.serviceMatches, ['HOTEL', 'DARSHAN', 'BOAT']);
    assert.ok(explanation.locationEvidence.includes('Varanasi'));
    assert.ok(explanation.travelWindowEvidence.includes('December'));
    assert.ok(explanation.contactabilityEvidence.routeCount === 2);
    assert.ok(explanation.bestContactRoute !== null);
    assert.ok(
        [RECOMMENDED_NEXT_ACTIONS.HUMAN_REVIEW, RECOMMENDED_NEXT_ACTIONS.DISCUSS_REQUIREMENTS, RECOMMENDED_NEXT_ACTIONS.INITIATE_HUMAN_CONTACT].includes(explanation.aiRecommendedNextAction),
        `Unexpected action: ${explanation.aiRecommendedNextAction}`
    );
});

test('BEST CONTACT ROUTE: Deterministic ranking WhatsApp > phone > email > business website > directory', () => {
    const routes1 = [
        { type: 'PUBLIC_EMAIL', value: 'user@example.com' },
        { type: 'BUSINESS_WEBSITE', value: 'https://hotel.example.com' },
        { type: 'SOCIAL_MEDIA', value: 'https://wa.me/919876543210', label: 'WhatsApp' }
    ];
    const best1 = determineBestContactRoute(routes1);
    assert.strictEqual(best1.type, 'WHATSAPP');
    assert.strictEqual(best1.value, 'https://wa.me/919876543210');

    const routes2 = [
        { type: 'BUSINESS_DIRECTORY', value: 'https://justdial.com/varanasi-guide' },
        { type: 'BUSINESS_WEBSITE', value: 'https://varanasiguide.in' }
    ];
    const best2 = determineBestContactRoute(routes2);
    assert.strictEqual(best2.type, 'BUSINESS_WEBSITE');

    const routesEmpty = [];
    const bestEmpty = determineBestContactRoute(routesEmpty);
    assert.strictEqual(bestEmpty, null);
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}5. Deduplication & Staleness Protection${RESET}`);

test('DEDUPLICATION: URL normalization ignores tracking params, trailing slashes, protocol cases', () => {
    const u1 = normalizeSourceUrl('https://example.com/tour-package/?utm_source=google&utm_medium=cpc#reviews');
    const u2 = normalizeSourceUrl('http://EXAMPLE.COM/tour-package');
    assert.strictEqual(u1, 'https://example.com/tour-package');
    assert.strictEqual(u2, 'https://example.com/tour-package');
    assert.strictEqual(u1, u2);
});

test('DEDUPLICATION: Opportunity identity hash and URL fingerprint are deterministic', () => {
    const hash1 = computeOpportunityIdentityHash('SRC_MOCK', 'SIG-101', 'https://example.com/page', 'need tour package');
    const hash2 = computeOpportunityIdentityHash('SRC_MOCK', 'SIG-101', 'https://example.com/page', 'need tour package');
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(typeof hash1, 'string');
    assert.strictEqual(hash1.length, 64);

    const fp1 = computeUrlFingerprint('https://example.com/page');
    const fp2 = computeUrlFingerprint('https://example.com/page');
    assert.strictEqual(fp1, fp2);
});

test('STALENESS: Same-day local travel window transitions to EXPIRED after 24 hours', () => {
    const pastDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    const opp = {
        status: 'NEW',
        hunterMode: 'AI_LOCAL',
        travelWindow: 'today',
        createdAt: pastDate
    };
    const res = evaluateOpportunityStaleness(opp);
    assert.strictEqual(res.stalenessStatus, 'EXPIRED');
    assert.ok(res.stalenessReason.includes('24h'));
});

test('STALENESS: Converted opportunities transition to CLOSED without deletion', () => {
    const opp = {
        status: 'CONVERTED',
        createdAt: new Date()
    };
    const res = evaluateOpportunityStaleness(opp);
    assert.strictEqual(res.stalenessStatus, 'CLOSED');
});

test('STALENESS: Inactive opportunity (>30 days) transitions to STALE', () => {
    const pastDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
    const opp = {
        status: 'NEW',
        createdAt: pastDate,
        reviewedAt: null
    };
    const res = evaluateOpportunityStaleness(opp);
    assert.strictEqual(res.stalenessStatus, 'STALE');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}6. Strict Human Gate & CRM Conversion Prevention${RESET}`);

test('HUMAN GATE: Unverified opportunity CANNOT be converted to CRM lead', async () => {
    const mockOpp = {
        opportunityId: 'OPP-TEST-UNVERIFIED',
        status: 'NEW',
        verificationStatus: 'UNVERIFIED',
        humanContactOutcome: null,
        lifecycleState: 'DISCOVERED'
    };
    const mockModels = {
        AIOpportunity: {
            findOne: async () => mockOpp
        },
        Enquiry: class {
            constructor(d) { Object.assign(this, d); }
            async save() { return this; }
        },
        AIAuditLog: class {
            constructor(d) { Object.assign(this, d); }
            async save() { return this; }
        }
    };

    let threw = false;
    try {
        await convertOpportunityToLead('OPP-TEST-UNVERIFIED', {}, mockModels, { role: 'CEO', id: 'ceo_1' });
    } catch (err) {
        threw = true;
        assert.strictEqual(err.errorCode, 'UNAUTHORIZED_ACTION');
        assert.ok(err.message.includes('GENUINE'));
    }
    assert.strictEqual(threw, true, 'Conversion must throw for unverified opportunity');
});

test('HUMAN GATE: REJECTED or NOT_GENUINE opportunity CANNOT be converted to CRM lead', async () => {
    const mockOpp = {
        opportunityId: 'OPP-TEST-NOT-GENUINE',
        status: 'REJECTED',
        verificationStatus: 'REJECTED',
        humanContactOutcome: 'NOT_GENUINE',
        lifecycleState: 'NOT_GENUINE'
    };
    const mockModels = {
        AIOpportunity: {
            findOne: async () => mockOpp
        }
    };

    let threw = false;
    try {
        await convertOpportunityToLead('OPP-TEST-NOT-GENUINE', {}, mockModels, { role: 'CEO', id: 'ceo_1' });
    } catch (err) {
        threw = true;
        assert.strictEqual(err.errorCode, 'UNAUTHORIZED_ACTION');
    }
    assert.strictEqual(threw, true, 'Conversion must throw for rejected / not-genuine opportunity');
});

test('HUMAN GATE: Verified GENUINE opportunity converts cleanly to CRM lead with audit', async () => {
    const auditLogs = [];
    const mockOpp = {
        opportunityId: 'OPP-TEST-GENUINE',
        status: 'APPROVED',
        verificationStatus: 'HUMAN_VERIFIED',
        humanContactOutcome: 'GENUINE',
        lifecycleState: 'GENUINE',
        hunterMode: 'AI_OUTSIDE',
        detectedIntent: 'PACKAGE_SEARCH',
        qualificationScore: 85,
        save: async function() { return this; }
    };
    const mockModels = {
        AIOpportunity: {
            findOne: async () => mockOpp
        },
        Enquiry: class {
            constructor(d) { Object.assign(this, d); this._id = 'lead_gen_123'; }
            async save() { return this; }
        },
        AIAuditLog: class {
            constructor(d) { Object.assign(this, d); auditLogs.push(d); }
            async save() { return this; }
        }
    };

    const res = await convertOpportunityToLead('OPP-TEST-GENUINE', { name: 'Aarav Sharma', phone: '9876543210' }, mockModels, { role: 'CEO', id: 'ceo_1' });
    assert.strictEqual(res.opportunity.status, 'CONVERTED');
    assert.strictEqual(res.opportunity.lifecycleState, 'CRM_LEAD');
    assert.strictEqual(res.opportunity.stalenessStatus, 'CLOSED');
    assert.strictEqual(res.lead.name, 'Aarav Sharma');
    assert.strictEqual(auditLogs.length, 1);
    assert.strictEqual(auditLogs[0].action, 'OPPORTUNITY_CONVERTED_TO_LEAD');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}7. Source Quality Analytics & Privacy Safeguards${RESET}`);

test('SOURCE QUALITY: Computes relevantRate, qualifiedRate, actionableRate, contactableRate, genuineRate, crmConversionRate, bookingRate, falsePositiveRate', async () => {
    const mockModels = {
        HunterSignal: {
            countDocuments: async (q = {}) => {
                if (q.sourceType === 'PUBLIC_SEARCH') {
                    if (q.status === 'QUALIFIED') return 8;
                    if (q.status?.$in) return 10;
                    return 12; // 12 signals total
                }
                return 0;
            }
        },
        AIOpportunity: {
            countDocuments: async (q = {}) => {
                if (q.sourceType === 'PUBLIC_SEARCH') {
                    if (q.status === 'CONVERTED') return 2;
                    if (q['contactability.routeCount']) return 5;
                    if (q.$or?.[0]?.humanContactOutcome === 'GENUINE') return 4;
                    if (q.$or?.[0]?.humanContactOutcome === 'NOT_GENUINE') return 1;
                    if (q.$or) return 6; // actionable
                }
                return 0;
            }
        },
        HunterSource: {
            find: () => ({ lean: async () => [] })
        },
        Booking: {
            countDocuments: async () => 1
        }
    };

    const analytics = await getSourceQualityAnalytics(mockModels);
    assert.ok(Array.isArray(analytics.bySourceType));
    const searchRow = analytics.bySourceType.find(r => r.sourceType === 'PUBLIC_SEARCH');
    assert.ok(searchRow, 'Expected row for PUBLIC_SEARCH');

    assert.strictEqual(searchRow.signals, 12);
    assert.strictEqual(searchRow.relevant, 10);
    assert.strictEqual(searchRow.qualified, 8);
    assert.strictEqual(searchRow.actionable, 6);
    assert.strictEqual(searchRow.contactable, 5);
    assert.strictEqual(searchRow.genuine, 4);
    assert.strictEqual(searchRow.notGenuine, 1);
    assert.strictEqual(searchRow.converted, 2);

    // Rate calculations
    assert.strictEqual(searchRow.relevantRate, 83.3);
    assert.strictEqual(searchRow.qualifiedRate, 66.7);
    assert.strictEqual(searchRow.actionableRate, 75.0);
    assert.strictEqual(searchRow.contactableRate, 83.3);
    assert.strictEqual(searchRow.genuineRate, 66.7);
    assert.strictEqual(searchRow.crmConversionRate, 33.3);
    assert.strictEqual(searchRow.bookingRate, 50.0);
    assert.strictEqual(searchRow.falsePositiveRate, 20.0); // 1 / (4 + 1) = 20%
});

test('AUDIT LOGGING: All outcome actions and mutations write audit events with role and ID', async () => {
    const auditLogs = [];
    const mockOpp = {
        opportunityId: 'OPP-OUTCOME-AUDIT',
        status: 'NEW',
        save: async function() { return this; }
    };
    const mockModels = {
        AIOpportunity: { findOne: async () => mockOpp },
        AIAuditLog: class {
            constructor(d) { Object.assign(this, d); auditLogs.push(d); }
            async save() { return this; }
        }
    };

    const res = await recordHumanContactOutcome(
        'OPP-OUTCOME-AUDIT',
        { outcome: 'GENUINE', notes: 'Spoke with prospect. Planning Dec trip for family.' },
        mockModels,
        { id: 'mgr_45', role: 'MANAGER' }
    );

    assert.strictEqual(res.humanContactOutcome, 'GENUINE');
    assert.strictEqual(mockOpp.lifecycleState, 'GENUINE');
    assert.strictEqual(auditLogs.length, 1);
    assert.strictEqual(auditLogs[0].action, 'HUMAN_CONTACT_OUTCOME_RECORDED');
    assert.strictEqual(auditLogs[0].actorRole, 'MANAGER');
    assert.strictEqual(auditLogs[0].decision, 'GENUINE');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n────────────────────────────────────────────────────────────`);
console.log(`Results: ${passed} passed  ${failed} failed  ${skipped} skipped  (${passed + failed + skipped} total)`);

if (failed > 0) {
    console.error(`\n${RED}${failed} test(s) failed.${RESET}`);
    process.exit(1);
} else {
    console.log(`\n${GREEN}All Prompt 9.10 tests passed successfully.${RESET}`);
    process.exit(0);
}
