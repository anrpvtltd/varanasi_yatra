/**
 * Actionability Scorer — Prompt 9.9
 * Varanasi Yatra Platform
 *
 * Produces a 0–100 actionability score and tier for each opportunity.
 * Distinct from qualificationScore (which measures intent) and
 * overallConfidence (which measures signal reliability).
 *
 * Actionability measures: "How worth pursuing is this prospect RIGHT NOW?"
 *
 * INVARIANTS:
 * 1. Score is deterministic given the same inputs.
 * 2. No side-effects; pure scoring function.
 * 3. Score is informational — human makes the contact decision.
 * 4. Tier thresholds: LOW 0–39, WEAK 40–59, ACTIONABLE 60–79, HIGH_PRIORITY 80–100.
 */

const {
    HUNTER_INTENT_LEVELS,
    ACTIONABILITY_TIERS,
    CONTACT_STATUSES
} = require('../hunterConstants');

/**
 * Mapping of travel window urgency to urgency score (0–10)
 */
const TRAVEL_WINDOW_URGENCY = {
    today: 10,
    tomorrow: 9,
    'this weekend': 8,
    'next week': 6,
    'next month': 4,
    january: 3, february: 3, march: 3, april: 3, may: 3,
    june: 3, july: 3, august: 3, september: 3, october: 3,
    november: 3, december: 3,
    diwali: 5, 'dev diwali': 6, shivratri: 5
};

/**
 * Maps a raw 0–100 score to an actionability tier.
 * @param {number} score
 * @returns {string} ACTIONABILITY_TIERS value
 */
function scoreToTier(score) {
    if (score >= 80) return ACTIONABILITY_TIERS.HIGH_PRIORITY;
    if (score >= 60) return ACTIONABILITY_TIERS.ACTIONABLE;
    if (score >= 40) return ACTIONABILITY_TIERS.WEAK;
    return ACTIONABILITY_TIERS.LOW;
}

/**
 * Compute an actionability score for a prospect opportunity.
 *
 * @param {Object} normalized      - Normalized signal from hunterService.normalizeSignal
 * @param {Object} intentData      - Intent detection result from detectIntent
 * @param {Object} qualData        - Qualification data from qualifyOpportunity
 * @param {Object} [contactData]   - Optional contactability subdocument from opportunity
 * @returns {{
 *   actionabilityScore: number,
 *   actionabilityTier: string,
 *   breakdown: Object
 * }}
 */
function calculateActionabilityScore(normalized, intentData, qualData, contactData = null) {
    const services = normalized.detectedServices || [];
    const travelWindow = (normalized.detectedTravelWindow || '').toLowerCase();
    const intentLevel = intentData.intentLevel || HUNTER_INTENT_LEVELS.LOW;
    const qualScore = qualData.qualificationScore || 0;
    const qualityScore = normalized.qualityScore || 50;
    const isCurrentlyIn = normalized.isCurrentlyIn || false;
    const hasArea = !!normalized.detectedArea;

    // ─── Factor 1: Intent Strength (0–30) ────────────────────────────────────
    let intentFactor = 0;
    if (intentLevel === HUNTER_INTENT_LEVELS.HIGH) {
        intentFactor = 30;
    } else if (intentLevel === HUNTER_INTENT_LEVELS.MEDIUM) {
        intentFactor = 18;
    } else {
        intentFactor = 5;
    }
    // Boost if already in Varanasi (local immediate need)
    if (isCurrentlyIn && intentLevel !== HUNTER_INTENT_LEVELS.LOW) {
        intentFactor = Math.min(30, intentFactor + 5);
    }

    // ─── Factor 2: Service Requirements Clarity (0–20) ───────────────────────
    let serviceFactor = 0;
    if (services.length >= 3) {
        serviceFactor = 20;
    } else if (services.length === 2) {
        serviceFactor = 16;
    } else if (services.length === 1) {
        serviceFactor = 10;
    }
    // Package/multi-service adds extra weight
    if (services.includes('PACKAGE')) {
        serviceFactor = Math.min(20, serviceFactor + 4);
    }

    // ─── Factor 3: Travel Window Urgency (0–15) ───────────────────────────────
    let timingFactor = 0;
    if (travelWindow) {
        const urgency = TRAVEL_WINDOW_URGENCY[travelWindow];
        if (urgency !== undefined) {
            timingFactor = Math.round((urgency / 10) * 15);
        } else {
            timingFactor = 5; // known window but unrecognized
        }
        if (normalized.detectedDuration) {
            timingFactor = Math.min(15, timingFactor + 2);
        }
    }

    // ─── Factor 4: Location Precision (0–10) ─────────────────────────────────
    let locationFactor = 0;
    if (normalized.detectedLocation === 'Varanasi') {
        locationFactor = hasArea ? 10 : 7;
    }

    // ─── Factor 5: Source Quality (0–10) ─────────────────────────────────────
    let sourceFactor = 0;
    if (qualityScore >= 85) {
        sourceFactor = 10;
    } else if (qualityScore >= 70) {
        sourceFactor = 7;
    } else if (qualityScore >= 50) {
        sourceFactor = 4;
    } else {
        sourceFactor = 1;
    }

    // ─── Factor 6: Contactability (0–10) ─────────────────────────────────────
    let contactabilityFactor = 0;
    if (contactData) {
        const cStatus = contactData.status || CONTACT_STATUSES.NOT_ATTEMPTED;
        const routeCount = contactData.routeCount || 0;
        const hasVerifiedRoute = [...(contactData.routes || []), ...(contactData.manualRoutes || [])]
            .some(r => r.verifiedByHuman === true);

        if (hasVerifiedRoute) {
            contactabilityFactor = 10;
        } else if (cStatus === CONTACT_STATUSES.ROUTES_FOUND && routeCount > 0) {
            contactabilityFactor = 6;
        } else if (cStatus === CONTACT_STATUSES.IN_PROGRESS) {
            contactabilityFactor = 2;
        }
    }

    // ─── Factor 7: Recency (0–5) ──────────────────────────────────────────────
    let recencyFactor = 0;
    const signalTimestamp = normalized.timestamp ? new Date(normalized.timestamp) : null;
    if (signalTimestamp && !isNaN(signalTimestamp.getTime())) {
        const ageHours = (Date.now() - signalTimestamp.getTime()) / (1000 * 60 * 60);
        if (ageHours <= 6) {
            recencyFactor = 5;
        } else if (ageHours <= 24) {
            recencyFactor = 4;
        } else if (ageHours <= 72) {
            recencyFactor = 3;
        } else if (ageHours <= 168) {
            recencyFactor = 1;
        }
    } else {
        recencyFactor = 2; // unknown age: neutral
    }

    // ─── Total Score ─────────────────────────────────────────────────────────
    const rawScore = intentFactor + serviceFactor + timingFactor + locationFactor + sourceFactor + contactabilityFactor + recencyFactor;
    const actionabilityScore = Math.max(0, Math.min(100, rawScore));
    const actionabilityTier = scoreToTier(actionabilityScore);

    const breakdown = {
        intentFactor,
        serviceFactor,
        timingFactor,
        locationFactor,
        sourceFactor,
        contactabilityFactor,
        recencyFactor,
        rawScore,
        qualificationScoreRef: qualScore
    };

    return {
        actionabilityScore,
        actionabilityTier,
        breakdown
    };
}

/**
 * Compute a contactability score (0–100) from a contactability subdocument.
 * Measures how reachable a prospect is through discovered/verified routes.
 *
 * @param {Object} contactability - Contactability subdoc from AIOpportunity
 * @returns {number} 0–100
 */
function calculateContactabilityScore(contactability) {
    if (!contactability) return 0;

    const status = contactability.status || CONTACT_STATUSES.NOT_ATTEMPTED;
    const routes = contactability.routes || [];
    const manualRoutes = contactability.manualRoutes || [];
    const allRoutes = [...routes, ...manualRoutes];

    if (status === CONTACT_STATUSES.NOT_ATTEMPTED) return 0;
    if (allRoutes.length === 0) return 0;

    let score = 0;

    // Base: routes discovered
    score += Math.min(30, allRoutes.length * 10);

    // Verified routes
    const verifiedRoutes = allRoutes.filter(r => r.verifiedByHuman === true);
    score += Math.min(40, verifiedRoutes.length * 20);

    // High-confidence routes
    const highConfRoutes = allRoutes.filter(r => (r.confidence || 0) >= 0.80);
    score += Math.min(20, highConfRoutes.length * 10);

    // Phone available
    if (contactability.phone && contactability.phone.availability === 'AVAILABLE') {
        score += 10;
    }
    // Email available
    if (contactability.email && contactability.email.availability === 'AVAILABLE') {
        score += 5;
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Determine contact freshness from the last verified timestamp.
 *
 * @param {Date|string|null} lastVerifiedAt
 * @returns {'FRESH'|'STALE'|'UNKNOWN'}
 */
function checkContactFreshness(lastVerifiedAt) {
    if (!lastVerifiedAt) return 'UNKNOWN';
    const lastVerified = new Date(lastVerifiedAt);
    if (isNaN(lastVerified.getTime())) return 'UNKNOWN';

    const daysSince = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30 ? 'FRESH' : 'STALE';
}

/**
 * Masks a phone number for logs: keeps last 4 digits.
 * @param {string} phone
 * @returns {string}
 */
function maskPhone(phone) {
    const clean = String(phone || '').replace(/\D/g, '');
    if (clean.length < 4) return '****';
    return `+**-***-***-${clean.slice(-4)}`;
}

/**
 * Masks an email address for logs: keeps domain.
 * @param {string} email
 * @returns {string}
 */
function maskEmail(email) {
    const str = String(email || '');
    const atIdx = str.indexOf('@');
    if (atIdx < 1) return '****@****';
    const local = str.slice(0, atIdx);
    const domain = str.slice(atIdx);
    const masked = local[0] + '****';
    return `${masked}${domain}`;
}

module.exports = {
    calculateActionabilityScore,
    calculateContactabilityScore,
    checkContactFreshness,
    scoreToTier,
    maskPhone,
    maskEmail,
    ACTIONABILITY_TIERS
};
