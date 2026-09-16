/**
 * Prompt 9.10 Phase 12 — Controlled Real-Source SerpApi Validation
 * Varanasi Yatra Platform — AI Customer Hunter
 *
 * Runs exactly ONE controlled real-source query via configured SerpApi.
 * Zero autonomous messaging, calling, pricing, discounting, or booking.
 * Evaluates real prospects against Prompt 9.10 commercial intent qualification,
 * relevance gate, actionability scoring, contactability discovery, and human gate.
 * Writes a sanitized audit artifact without exposing secrets.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');
const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));

// Load environment variables from backend/.env
try {
    backendRequire('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
} catch {
    // manual fallback if needed
    if (fs.existsSync(path.join(__dirname, '../backend/.env'))) {
        const lines = fs.readFileSync(path.join(__dirname, '../backend/.env'), 'utf8').split('\n');
        for (const line of lines) {
            const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)?\s*$/);
            if (m && !process.env[m[1]]) {
                process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
            }
        }
    }
}

const {
    HUNTER_SOURCE_TYPES,
    HUNTER_MODES,
    HUNTER_SERVICES
} = require('../backend/modules/ai/hunter/hunterConstants');

const { SearchApiConnector } = require('../backend/modules/ai/hunter/connectors/searchApiConnector');
const { classifySignalRelevance } = require('../backend/modules/ai/hunter/security/relevanceGate');
const { classifyCommercialIntent } = require('../backend/modules/ai/hunter/scoring/commercialIntentClassifier');
const { calculateActionabilityScore } = require('../backend/modules/ai/hunter/scoring/actionabilityScorer');
const { generateProspectExplanation, determineBestContactRoute } = require('../backend/modules/ai/hunter/scoring/prospectExplainer');
const {
    normalizeSignal,
    detectIntent,
    qualifyOpportunity,
    calculateConfidence,
    evaluateOpportunityStaleness
} = require('../backend/modules/ai/hunter/hunterService');

const { publicPageContactProvider } = require('../backend/modules/ai/hunter/contactability/publicPageContactProvider');

async function runControlledValidation() {
    console.log('============================================================');
    console.log('PROMPT 9.10 — PHASE 12: CONTROLLED REAL-SOURCE VALIDATION');
    console.log('============================================================');

    const apiKey = process.env.HUNTER_SEARCH_API_KEY || process.env.SERP_API_KEY;
    const hasKey = Boolean(apiKey && apiKey.trim().length > 0);

    if (!hasKey) {
        console.warn('⚠️ No HUNTER_SEARCH_API_KEY or SERP_API_KEY configured in backend/.env');
    } else {
        console.log('✓ Authorized search credential detected (masked for audit).');
    }

    const controlledQuery = 'need Varanasi tour package hotel darshan booking next month';
    console.log(`Target customer-intent query: "${controlledQuery}"`);

    const connector = new SearchApiConnector({
        sourceId: 'SRC_SEARCH_API',
        name: 'SerpApi Live Validation',
        enabled: true,
        timeoutMs: 25000,
        maxPerHour: 10,
        maxPerDay: 50
    });

    const startTime = Date.now();
    let rawSignals = [];
    const errors = [];
    let liveSuccess = false;

    try {
        console.log('Sending single controlled request to approved SerpApi endpoint...');
        rawSignals = await connector.fetchSignals({
            query: controlledQuery,
            keywords: [controlledQuery],
            limit: 5,
            mode: 'OUTSIDE'
        });
        liveSuccess = true;
        console.log(`✓ Real request completed. Retrieved ${rawSignals.length} raw search signals.`);
    } catch (err) {
        const errorMsg = String(err.message || err.errorCode || err);
        errors.push(errorMsg);
        console.warn(`Live request result note: ${errorMsg}`);
    }

    const latencyMs = Date.now() - startTime;

    // Process signals through Prompt 9.10 intelligence pipeline
    let signalCount = rawSignals.length;
    let relevantCount = 0;
    let qualifiedCount = 0;
    let actionableCount = 0;
    let contactableCount = 0;
    let humanReviewedCount = 0;
    let genuineCount = 0;
    let rejectedCount = 0;
    const reasonCategories = {};

    const evaluatedSignals = [];

    for (const raw of rawSignals) {
        const norm = normalizeSignal(raw, 'SRC_SEARCH_API', HUNTER_SOURCE_TYPES.SEARCH_API);
        const intentData = detectIntent(norm);

        // 1. Relevance Gate Check
        const relevanceResult = classifySignalRelevance(norm, intentData);
        const category = relevanceResult.category;
        reasonCategories[category] = (reasonCategories[category] || 0) + 1;

        if (!relevanceResult.isQualifiedForOpportunity) {
            rejectedCount++;
            evaluatedSignals.push({
                title: norm.title || 'Untitled',
                url: norm.sourceUrl,
                relevanceCategory: category,
                isQualified: false,
                rejectionReason: relevanceResult.reason
            });
            continue;
        }

        relevantCount++;

        // 2. Commercial Intent Classification
        const commercialIntent = classifyCommercialIntent(norm, intentData);

        // 3. Qualification
        const qual = qualifyOpportunity(norm, intentData);
        if (qual.qualificationScore >= 50) {
            qualifiedCount++;
        }

        // 4. Contactability check via public page provider
        let contactRoutes = [];
        try {
            if (norm.sourceUrl) {
                contactRoutes = await publicPageContactProvider.discover({
                    opportunityId: 'VAL-REAL-TEMP',
                    sourceUrl: norm.sourceUrl
                });
            }
        } catch {
            contactRoutes = [];
        }

        if (contactRoutes.length > 0) {
            contactableCount++;
        }

        // 5. Actionability Score
        const actionResult = calculateActionabilityScore(norm, intentData, qual, {
            status: contactRoutes.length > 0 ? 'ROUTES_FOUND' : 'NO_ROUTES_FOUND',
            routeCount: contactRoutes.length,
            routes: contactRoutes
        });

        if (actionResult.actionabilityScore >= 60) {
            actionableCount++;
        }

        // 6. Explainable Prospect Breakdown
        const explanation = generateProspectExplanation({
            opportunity: {
                detectedIntent: intentData.detectedIntent,
                hunterMode: intentData.mode,
                serviceInterest: norm.detectedServices,
                location: norm.detectedLocation,
                travelWindow: norm.detectedTravelWindow,
                sourceUrl: norm.sourceUrl,
                source: 'SRC_SEARCH_API'
            },
            signal: norm,
            actionResult,
            relevanceResult,
            commercialIntent,
            contactRoutes
        });

        // 7. Human Review gate simulation
        humanReviewedCount++;
        if (commercialIntent.category === 'COMMERCIAL_TRIP_REQUEST' || commercialIntent.category === 'ACTIVE_TRAVEL_PLANNING') {
            genuineCount++;
        }

        evaluatedSignals.push({
            title: norm.title || 'Untitled',
            url: norm.sourceUrl,
            relevanceCategory: category,
            commercialIntent: commercialIntent.category,
            actionabilityScore: actionResult.actionabilityScore,
            actionabilityTier: actionResult.actionabilityTier,
            bestContactRoute: explanation.bestContactRoute,
            isQualified: true,
            whyThisProspect: explanation.whyThisProspect,
            whatTheyNeed: explanation.whatTheyNeed
        });
    }

    const auditArtifact = {
        meta: {
            title: 'Prompt 9.10 Controlled Real-Source SerpApi Validation Audit',
            runAt: new Date().toISOString(),
            environment: 'validation-controlled',
            liveSuccess,
            safeMode: true,
            autonomousOutreachAllowed: false
        },
        execution: {
            query: controlledQuery,
            sourceId: 'SRC_SEARCH_API',
            provider: 'SERP_API',
            latencyMs,
            errors
        },
        funnelResults: {
            signalCount,
            relevantCount,
            qualifiedCount,
            actionableCount,
            contactableCount,
            humanReviewedCount,
            genuineCount,
            rejectedCount
        },
        reasonCategories,
        evaluatedSignalsSummary: evaluatedSignals.map(s => ({
            title: s.title,
            category: s.relevanceCategory,
            commercialIntent: s.commercialIntent || 'N/A',
            isQualified: s.isQualified,
            actionabilityScore: s.actionabilityScore ?? 'N/A'
        }))
    };

    const outPath = path.join(__dirname, 'prompt910-real-validation-audit.json');
    fs.writeFileSync(outPath, JSON.stringify(auditArtifact, null, 2));
    console.log(`✓ Audit artifact saved to ${outPath} without secrets.`);
    console.log('Results summary:');
    console.log(JSON.stringify(auditArtifact.funnelResults, null, 2));

    return auditArtifact;
}

if (require.main === module) {
    runControlledValidation()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Fatal error during controlled validation:', err);
            process.exit(1);
        });
}

module.exports = { runControlledValidation };
