/**
 * Explainable Commercial Intent Classifier
 * Varanasi Yatra Platform — Prompt 9.10 Phase 2
 *
 * Distinguishes REAL COMMERCIAL TRAVEL PROSPECTS from generic informational/SEO content.
 *
 * 6 Canonical Intent Categories:
 * 1. INFORMATIONAL: General knowledge, history, weather, listicles, travel blogs, SEO guides.
 * 2. INSPIRATIONAL: Aesthetic appreciation, admiration, spiritual enthusiasm without travel intent.
 * 3. PLANNING: Early, loose travel consideration without concrete dates or specific services.
 * 4. ACTIVE_TRAVEL_PLANNING: Definite future travel window (including 3+ months advance) +
 *    service interest or group/family context. Must NOT be rejected merely for low urgency.
 * 5. COMMERCIAL_TRIP_REQUEST: Direct, immediate, or transactional purchase/service request
 *    with clear pricing, booking, or quoting intent.
 * 6. UNKNOWN: Insufficient or ambiguous evidence. Preserves uncertainty honestly.
 *
 * Invariants:
 * - Pure deterministic evaluation; zero side-effects.
 * - No black-box qualification; full evidence breakdown and reasons provided.
 * - Low urgency (e.g. 3+ months ahead) is fully accepted for qualified prospects.
 * - Generic informational/SEO content is strictly rejected.
 */

'use strict';

const {
    COMMERCIAL_INTENT_CATEGORIES,
    HUNTER_SERVICES
} = require('../hunterConstants');

// ─── Pattern Matchers ─────────────────────────────────────────────────────────

// 1. Explicit commercial / request language
const EXPLICIT_REQUEST_PATTERNS = [
    { pattern: /\b(need|chahiye|looking\s+for|require|requirements?)\b/i, label: 'NEED_STATED' },
    { pattern: /\b(want\s+to\s+book|book|booking|reserve|reservation)\b/i, label: 'BOOKING_INTENT' },
    { pattern: /\b(hire|arrange|organize|charter)\b/i, label: 'SERVICE_ARRANGEMENT' },
    { pattern: /\b(rate|rates|cost|costing|price|pricing|quote|quotation|estimate|budget|package\s*rate)\b/i, label: 'PRICING_QUERY' },
    { pattern: /\b(suggest\s+a\s+(hotel|package|guide|driver)|recommend\s+a\s+(hotel|package|guide|driver))\b/i, label: 'VENDOR_RECOMMENDATION_SEEKING' },
    { pattern: /\b(help\s+us\s+plan|help\s+me\s+plan|help\s+with\s+booking|can\s+you\s+arrange)\b/i, label: 'PLANNING_ASSISTANCE' },
    { pattern: /\b(kitna\s+lagega|kitne\s+mein|kitna\s+kharcha|quote\s+bhejo|package\s+batao)\b/i, label: 'COMMERCIAL_HINGLISH' }
];

// 2. Purely informational / SEO / Guide patterns
const INFORMATIONAL_PATTERNS = [
    /\b(best\s+places\s+to\s+visit)\b/i,
    /\b(top\s+\d+\s+(places|things|ghats|temples|spots|restaurants|cafes|attractions))\b/i,
    /\b(must\s+visit\s+places|must\s+see\s+in|must\s+do\s+in)\b/i,
    /\b(complete\s+guide|travel\s+guide\s+to|guide\s+to\s+visiting|ultimate\s+guide|definitive\s+guide)\b/i,
    /\b(history\s+of\s+varanasi|history\s+of\s+kashi|story\s+of\s+kashi|ancient\s+history)\b/i,
    /\b(weather\s+in\s+varanasi|best\s+time\s+to\s+visit\s+varanasi|climate\s+in\s+varanasi|temperature\s+in)\b/i,
    /\b(how\s+many\s+ghats?\s+in|how\s+old\s+is\s+varanasi|why\s+is\s+varanasi\s+famous)\b/i,
    /\b(wikipedia|wikivoyage|britannica|encyclopedia)\b/i,
    /\b(packing\s+list\s+for|what\s+to\s+pack\s+for|travel\s+tips\s+for)\b/i,
    /\b(photo\s+gallery|wallpaper|desktop\s+background|travel\s+blog|vlog\s+episode)\b/i
];

// 3. Purely inspirational / aesthetic appreciation patterns (no intent to visit)
const INSPIRATIONAL_PATTERNS = [
    /\b(so\s+beautiful|breathtaking|mesmerizing|divine\s+beauty|spiritual\s+vibe|peaceful\s+ghats)\b/i,
    /\b(amazing\s+photo|great\s+picture|lovely\s+shot|stunning\s+view|magical\s+evening)\b/i,
    /\b(someday\s+i\s+wish|hope\s+to\s+see|dream\s+destination|on\s+my\s+bucket\s+list)\b/i,
    /\b(kashi\s+ki\s+mahima|har\s+har\s+mahadev|jai\s+bhole\s+nath)\b/i
];

// 4. Family / Group / Travelers context
const GROUP_FAMILY_PATTERNS = [
    { pattern: /\b(family|parents|elderly|grandparents|mom\s+and\s+dad|mata\s+pita)\b/i, label: 'FAMILY_ELDERLY' },
    { pattern: /\b(couple|husband|wife|honeymoon|anniversary)\b/i, label: 'COUPLE' },
    { pattern: /\b(group|friends|colleagues|batchmates|yaari|dost)\b/i, label: 'GROUP' },
    { pattern: /\b(solo|alone|by\s+myself)\b/i, label: 'SOLO' },
    { pattern: /\b(\d+)\s*(people|persons?|members?|adults?|guests?|passengers?|log)\b/i, label: 'EXPLICIT_COUNT' }
];

// 5. Travel Window Timing Patterns
const ADVANCE_TIMING_PATTERNS = [
    { pattern: /\b(today|tonight|now|immediately|urgent|abhi|aaj)\b/i, urgency: 'IMMEDIATE', months: 0 },
    { pattern: /\b(tomorrow|kal)\b/i, urgency: 'HIGH', months: 0 },
    { pattern: /\b(this\s+weekend|next\s+week)\b/i, urgency: 'HIGH', months: 0.25 },
    { pattern: /\b(next\s+month|coming\s+month|agle\s+mahine)\b/i, urgency: 'MEDIUM', months: 1 },
    { pattern: /\b(in\s+2\s+months|after\s+2\s+months)\b/i, urgency: 'MEDIUM', months: 2 },
    { pattern: /\b(in\s+3\s+months|after\s+3\s+months|in\s+4\s+months|in\s+5\s+months|in\s+6\s+months)\b/i, urgency: 'LOW', months: 3 },
    { pattern: /\b(next\s+year|coming\s+year|in\s+\d{4})\b/i, urgency: 'LOW', months: 6 },
    { pattern: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i, urgency: 'MEDIUM', months: 2 },
    { pattern: /\b(diwali|dev\s+diwali|shivratri|chath|kartik\s+purnima|navratri)\b/i, urgency: 'MEDIUM', months: 2 }
];

/**
 * Classifies commercial travel intent with complete explainability.
 *
 * @param {Object} normalized - Normalized signal from hunterService
 * @param {Object} [intentData] - Preliminary intent data
 * @returns {Object} Commercial classification explanation
 */
function classifyCommercialIntent(normalized, intentData = {}) {
    const rawText = String(normalized.normalizedText || normalized.text || '').trim();
    const cleanText = rawText.toLowerCase();
    const sourceUrl = String(normalized.sourceUrl || normalized.canonicalUrl || '').toLowerCase();
    const services = Array.isArray(normalized.detectedServices) ? normalized.detectedServices : [];
    const destination = normalized.detectedLocation || 'Unknown';
    const isVaranasi = destination === 'Varanasi' || /\b(varanasi|banaras|kashi|benares)\b/i.test(cleanText);

    const positiveReasons = [];
    const rejectionReasons = [];
    const missingInformation = [];
    const matchedKeywords = [];

    // ─── 1. Evidence Extraction ──────────────────────────────────────────────
    
    // Explicit Request Language
    let hasExplicitRequest = false;
    for (const item of EXPLICIT_REQUEST_PATTERNS) {
        if (item.pattern.test(cleanText)) {
            hasExplicitRequest = true;
            matchedKeywords.push(item.label);
        }
    }
    if (hasExplicitRequest) {
        positiveReasons.push(`Explicit request / transactional language identified (${matchedKeywords.join(', ')}).`);
    }

    // Specific Service Requirements
    const serviceReqs = {
        accommodationReq: services.includes(HUNTER_SERVICES.HOTEL) || /\b(hotel|stay|room|dharamshala|resort)\b/i.test(cleanText),
        transportReq: services.includes(HUNTER_SERVICES.TRANSPORT) || /\b(cab|taxi|car|tempo|airport\s*pickup)\b/i.test(cleanText),
        darshanReq: services.includes(HUNTER_SERVICES.DARSHAN) || /\b(darshan|mandir|temple|vip\s*darshan)\b/i.test(cleanText),
        boatReq: services.includes(HUNTER_SERVICES.BOAT) || /\b(boat|boating|bajra|ghat\s*ride)\b/i.test(cleanText),
        guideReq: services.includes(HUNTER_SERVICES.GUIDE) || /\b(guide|tour\s*guide)\b/i.test(cleanText),
        itineraryPackageReq: services.includes(HUNTER_SERVICES.PACKAGE) || services.includes(HUNTER_SERVICES.ITINERARY) || /\b(package|itinerary|tour)\b/i.test(cleanText)
    };

    const requestedServicesList = services.length > 0 ? services : Object.keys(serviceReqs).filter(k => serviceReqs[k]);
    if (requestedServicesList.length > 0) {
        positiveReasons.push(`Concrete travel services requested: ${requestedServicesList.join(', ')}.`);
    } else {
        missingInformation.push('No specific travel service (hotel, boat, darshan, cab) identified');
    }

    // Travel Timing & Urgency
    let detectedTiming = normalized.detectedTravelWindow || null;
    let timingUrgency = 'UNKNOWN';
    let advanceMonths = null;

    for (const t of ADVANCE_TIMING_PATTERNS) {
        if (t.pattern.test(cleanText) || (detectedTiming && t.pattern.test(detectedTiming))) {
            timingUrgency = t.urgency;
            advanceMonths = t.months;
            if (!detectedTiming) {
                const match = cleanText.match(t.pattern);
                detectedTiming = match ? match[0] : 'Specified in text';
            }
            break;
        }
    }

    if (detectedTiming) {
        positiveReasons.push(`Travel timing horizon identified: '${detectedTiming}' (Urgency: ${timingUrgency}, Approx. +${advanceMonths !== null ? advanceMonths : '?'} mo).`);
    } else {
        missingInformation.push('Travel date or departure window unspecified');
    }

    // Group / Family Context
    let groupFamilyContext = null;
    for (const g of GROUP_FAMILY_PATTERNS) {
        if (g.pattern.test(cleanText)) {
            groupFamilyContext = g.label;
            const match = cleanText.match(g.pattern);
            positiveReasons.push(`Party composition indicated: ${g.label} ('${match ? match[0] : ''}').`);
            break;
        }
    }
    if (!groupFamilyContext) {
        missingInformation.push('Party size and composition (family, couple, solo, group size) unspecified');
    }

    // ─── 2. Informational / SEO check ────────────────────────────────────────
    const isInfoUrl = /\/(blog|article|guide|tips|listicle|wiki|news)\//i.test(sourceUrl) ||
        /(wikipedia\.org|wikivoyage\.org|lonelyplanet\.com|britannica\.com|tripadvisor\.com\/attraction)/i.test(sourceUrl);
    const isInfoText = INFORMATIONAL_PATTERNS.some(p => p.test(cleanText));
    const isPurelyInformational = (isInfoText || isInfoUrl) && !hasExplicitRequest;

    // ─── 3. Inspirational check ──────────────────────────────────────────────
    const isInspirational = INSPIRATIONAL_PATTERNS.some(p => p.test(cleanText)) &&
        !hasExplicitRequest &&
        services.length === 0 &&
        !detectedTiming;

    // ─── 4. Categorization Logic ─────────────────────────────────────────────
    let category = COMMERCIAL_INTENT_CATEGORIES.UNKNOWN;
    let isCommercialProspect = false;
    let confidence = 0.5;

    if (cleanText.length < 10 && services.length === 0 && !hasExplicitRequest) {
        // Insufficient evidence -> UNKNOWN
        category = COMMERCIAL_INTENT_CATEGORIES.UNKNOWN;
        isCommercialProspect = false;
        confidence = 0.2;
        rejectionReasons.push('Insufficient text signal to determine commercial or travel intent.');
    } else if (isPurelyInformational) {
        // Pure informational / SEO content -> INFORMATIONAL
        category = COMMERCIAL_INTENT_CATEGORIES.INFORMATIONAL;
        isCommercialProspect = false;
        confidence = 0.95;
        rejectionReasons.push('Generic informational article, travel guide, or historical query with zero purchasing/booking intent.');
    } else if (isInspirational) {
        // Aesthetic / emotional post without intent -> INSPIRATIONAL
        category = COMMERCIAL_INTENT_CATEGORIES.INSPIRATIONAL;
        isCommercialProspect = false;
        confidence = 0.90;
        rejectionReasons.push('General spiritual or aesthetic appreciation of Varanasi without active travel intent or booking requirements.');
    } else if (hasExplicitRequest && (services.length >= 1 || timingUrgency === 'IMMEDIATE' || timingUrgency === 'HIGH')) {
        // Direct purchase or service inquiry -> COMMERCIAL_TRIP_REQUEST
        category = COMMERCIAL_INTENT_CATEGORIES.COMMERCIAL_TRIP_REQUEST;
        isCommercialProspect = true;
        confidence = 0.92;
        positiveReasons.push('Actionable commercial booking request with specific services and purchasing language.');
    } else if ((detectedTiming || advanceMonths !== null) && (services.length >= 1 || groupFamilyContext || hasExplicitRequest)) {
        // Definite future travel planning -> ACTIVE_TRAVEL_PLANNING
        // Rule: DO NOT reject LOW urgency solely because it's in the future!
        category = COMMERCIAL_INTENT_CATEGORIES.ACTIVE_TRAVEL_PLANNING;
        isCommercialProspect = true;
        confidence = 0.82;
        positiveReasons.push('Active travel planning with concrete horizon and service or party requirements.');
        if (timingUrgency === 'LOW') {
            positiveReasons.push('Accepted advance planning prospect (3+ months horizon is fully valid for pilgrimage tour operators).');
        }
    } else if (services.length >= 1 || /\b(planning|thinking\s+of|visit|trip)\b/i.test(cleanText)) {
        // Early stage planning -> PLANNING
        category = COMMERCIAL_INTENT_CATEGORIES.PLANNING;
        // Mild commercial viability if services requested
        isCommercialProspect = services.length >= 1;
        confidence = 0.65;
        if (isCommercialProspect) {
            positiveReasons.push('Early travel planning with service interest identified.');
        } else {
            rejectionReasons.push('Vague planning inquiry without concrete service demands or booking intent.');
        }
    } else {
        // Lack of signals -> UNKNOWN
        category = COMMERCIAL_INTENT_CATEGORIES.UNKNOWN;
        isCommercialProspect = false;
        confidence = 0.40;
        rejectionReasons.push('Signal lacks sufficient travel planning or commercial booking indicators.');
    }

    // Geolocation check
    if (!isVaranasi) {
        isCommercialProspect = false;
        rejectionReasons.push('Signal does not target Varanasi / Kashi.');
    }

    const overallScore = Math.round(confidence * 100);

    return {
        category,
        isCommercial: isCommercialProspect,
        isCommercialProspect,
        score: overallScore,
        confidence: +confidence.toFixed(2),
        urgency: timingUrgency,
        advancePlanning: (advanceMonths !== null && advanceMonths >= 2) || timingUrgency === 'LOW',
        timingDetail: {
            travelWindow: detectedTiming,
            urgency: timingUrgency,
            advanceMonths
        },
        evidence: {
            explicitRequest: hasExplicitRequest,
            matchedKeywords,
            serviceRequirements: requestedServicesList,
            destination: isVaranasi ? 'Varanasi' : 'Unknown',
            travelTiming: detectedTiming,
            timingUrgency,
            advanceWindowMonths: advanceMonths,
            groupFamilyContext,
            accommodationReq: serviceReqs.accommodationReq,
            transportReq: serviceReqs.transportReq,
            darshanReq: serviceReqs.darshanReq,
            boatReq: serviceReqs.boatReq,
            guideReq: serviceReqs.guideReq,
            itineraryPackageReq: serviceReqs.itineraryPackageReq
        },
        positiveReasons,
        rejectionReasons,
        missingInformation
    };
}

module.exports = {
    classifyCommercialIntent,
    EXPLICIT_REQUEST_PATTERNS,
    INFORMATIONAL_PATTERNS,
    INSPIRATIONAL_PATTERNS,
    GROUP_FAMILY_PATTERNS,
    ADVANCE_TIMING_PATTERNS
};
