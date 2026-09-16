/**
 * Explainable Prospect Quality & Advisory Best Route Engine
 * Varanasi Yatra Platform — Prompt 9.10 Phase 3 & 4
 *
 * Exposes complete transparency for CEO and Manager:
 * - actionability score (0-100) & tier
 * - relevance category
 * - commercial intent category
 * - service matches
 * - location evidence
 * - travel-window evidence
 * - source-quality evidence
 * - contactability evidence
 * - missing information
 * - positive qualification reasons
 * - rejection/weakness reasons
 * - recommended next action (advisory)
 * - best contact route (advisory: WhatsApp > phone > email > website > directory/social)
 *
 * INVARIANTS:
 * 1. Zero black-box qualification. Every decision has explicit evidence and rationales.
 * 2. Pure function; deterministic output given inputs.
 * 3. Advisory recommendations are non-autonomous; human decides next action.
 */

'use strict';

const {
    RECOMMENDED_NEXT_ACTIONS,
    CONTACT_VERIFICATION_STATUSES
} = require('../hunterConstants');

/**
 * Deterministically select the best contact route from discovered and manual routes.
 *
 * Priority order:
 * 1. WhatsApp
 * 2. Public Phone
 * 3. Public Email
 * 4. Business Website
 * 5. Google Business / Business Directory / Listing
 * 6. Social Media / Tourism Portal / Partner Contact
 *
 * Verified routes strictly outrank unverified routes within the same category.
 *
 * @param {Array} routes - Discovered routes array
 * @param {Array} [manualRoutes=[]] - Manually added routes
 * @returns {Object|null} Best contact route recommendation (or null if none)
 */
function determineBestContactRoute(routes = [], manualRoutes = []) {
    const all = [...(manualRoutes || []), ...(routes || [])].filter(r => r && r.value);
    if (all.length === 0) return null;

    // Route scoring function (higher is better)
    const scoreRoute = (r) => {
        const type = String(r.type || '').toUpperCase();
        const val = String(r.value || '').toLowerCase();
        const isVerified = r.verifiedByHuman === true ||
            r.verificationStatus === CONTACT_VERIFICATION_STATUSES.VERIFIED ||
            r.verificationStatus === CONTACT_VERIFICATION_STATUSES.HUMAN_VERIFIED;
        const isStaleOrRejected = r.verificationStatus === 'STALE' || r.verificationStatus === 'REJECTED';

        if (isStaleOrRejected) return -100;

        let baseScore = 10;
        const isWhatsApp = type === 'WHATSAPP' ||
            (type === 'SOCIAL_MEDIA' && (val.includes('wa.me') || val.includes('whatsapp') || (r.label && r.label.toLowerCase().includes('whatsapp'))));
        const isPhone = type === 'PUBLIC_PHONE' || (!isWhatsApp && /^\+?[\d\s-]{10,15}$/.test(r.value.trim()));
        const isEmail = type === 'PUBLIC_EMAIL' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.value.trim());
        const isWebsite = type === 'BUSINESS_WEBSITE';
        const isDirectoryOrGMB = type === 'GOOGLE_BUSINESS' || type === 'BUSINESS_DIRECTORY' || type === 'PUBLIC_LISTING';
        const isSocialOrPortal = type === 'SOCIAL_MEDIA' || type === 'TOURISM_PORTAL' || type === 'PARTNER_REFERRAL_CONTACT';

        if (isWhatsApp) baseScore = 90;
        else if (isPhone) baseScore = 80;
        else if (isEmail) baseScore = 70;
        else if (isWebsite) baseScore = 60;
        else if (isDirectoryOrGMB) baseScore = 50;
        else if (isSocialOrPortal) baseScore = 40;

        // Verified bonus
        if (isVerified) baseScore += 10;

        // Route confidence weighting (0-5)
        const confWeight = Math.round((Number(r.confidence) || 0.5) * 5);
        return baseScore + confWeight;
    };

    let best = null;
    let highestScore = -Infinity;

    for (const r of all) {
        const score = scoreRoute(r);
        if (score > highestScore) {
            highestScore = score;
            best = r;
        }
    }

    if (!best || highestScore <= 0) return null;

    const bestType = String(best.type || '').toUpperCase();
    const bestVal = String(best.value || '').toLowerCase();
    const isWhatsApp = bestType === 'WHATSAPP' ||
        (bestType === 'SOCIAL_MEDIA' && (bestVal.includes('wa.me') || bestVal.includes('whatsapp') || (best.label && best.label.toLowerCase().includes('whatsapp'))));

    const resolvedType = isWhatsApp ? 'WHATSAPP' : best.type;

    return {
        type: resolvedType,
        value: best.value,
        label: best.label || '',
        provider: best.provider || 'UNKNOWN',
        provenance: best.provenance || 'UNKNOWN',
        verificationStatus: best.verificationStatus || 'UNVERIFIED',
        isVerified: best.verifiedByHuman === true || best.verificationStatus === 'VERIFIED' || best.verificationStatus === 'HUMAN_VERIFIED',
        advisoryRecommendation: `Recommended primary route: ${resolvedType} (${best.label || best.value})`
    };
}

/**
 * Generates an exhaustive, explainable prospect quality assessment.
 */
function generateProspectExplanation(params = {}) {
    const normalized = params.normalized || params.signal || {};
    const intentData = params.intentData || {};
    const qualData = params.qualData || {};
    const actionResult = params.actionResult || {};
    const relevanceResult = params.relevanceResult || {};
    const commercialIntent = params.commercialIntent || {};
    const contactData = params.contactData || null;

    const actionScore = actionResult.actionabilityScore || 0;
    const actionTier = actionResult.actionabilityTier || 'LOW';
    const relCategory = relevanceResult.category || 'UNKNOWN';
    const commCategory = commercialIntent.category || 'UNKNOWN';
    const services = normalized.detectedServices || [];

    // Location Evidence
    const locationEvidence = {
        destination: normalized.detectedLocation || 'Varanasi',
        area: normalized.detectedArea || null,
        isCurrentlyIn: normalized.isCurrentlyIn || false,
        summary: normalized.detectedArea
            ? `Specific locality identified: ${normalized.detectedArea} (Varanasi).`
            : (normalized.detectedLocation === 'Varanasi' ? 'Target destination confirmed as Varanasi.' : 'Varanasi connection unconfirmed.')
    };

    // Travel Window Evidence
    const travelWindowEvidence = {
        travelWindow: normalized.detectedTravelWindow || 'Flexible / Unspecified',
        duration: normalized.detectedDuration || null,
        timingUrgency: commercialIntent.evidence?.timingUrgency || 'UNKNOWN',
        advanceWindowMonths: commercialIntent.evidence?.advanceWindowMonths || null,
        summary: normalized.detectedTravelWindow
            ? `Travel horizon: '${normalized.detectedTravelWindow}'${normalized.detectedDuration ? ` (duration: ${normalized.detectedDuration})` : ''}. Urgency: ${commercialIntent.evidence?.timingUrgency || 'MEDIUM'}.`
            : 'Exact travel date unspecified.'
    };

    // Source Quality Evidence
    const sourceQualityEvidence = {
        sourceId: normalized.sourceId || 'UNKNOWN',
        sourceType: normalized.sourceType || 'MOCK',
        qualityScore: normalized.qualityScore || 50,
        sourceUrl: normalized.sourceUrl || '',
        summary: `Discovered from ${normalized.sourceType} (${normalized.sourceId}). Source credibility score: ${normalized.qualityScore || 50}/100.`
    };

    // Contactability Evidence & Best Route
    const routes = params.contactRoutes || contactData?.contactability?.routes || contactData?.routes || [];
    const manualRoutes = contactData?.contactability?.manualRoutes || contactData?.manualRoutes || [];
    const bestRoute = determineBestContactRoute(routes, manualRoutes);
    const verifiedRoutesCount = [...routes, ...manualRoutes].filter(r => r.verifiedByHuman === true || r.verificationStatus === 'VERIFIED' || r.verificationStatus === 'HUMAN_VERIFIED').length;

    const contactabilityEvidence = {
        status: contactData?.contactability?.status || contactData?.status || (routes.length > 0 ? 'ROUTES_FOUND' : 'NOT_ATTEMPTED'),
        routeCount: (routes.length + manualRoutes.length),
        verifiedRoutesCount,
        contactFreshness: contactData?.contactability?.contactFreshness || contactData?.contactFreshness || 'UNKNOWN',
        bestContactRoute: bestRoute,
        routes: [...routes, ...manualRoutes]
    };

    // Missing Information
    const missing = [...(commercialIntent.missingInformation || [])];
    if (routes.length + manualRoutes.length === 0) {
        missing.push('No verified public contact route available');
    }

    // Consolidated Positive & Weakness Reasons
    const positiveReasons = [
        ...(qualData.qualificationReasons || []),
        ...(commercialIntent.positiveReasons || []),
        ...(commercialIntent.positiveSignals || []),
        ...(params.opportunity?.qualificationReasons || [])
    ];
    if (positiveReasons.length === 0 && (actionScore >= 60 || commercialIntent.isCommercial || commercialIntent.isCommercialProspect)) {
        positiveReasons.push('Commercial travel inquiry signals detected with actionable service intent.');
    }
    // Deduplicate positive reasons
    const uniquePositive = [...new Set(positiveReasons)];

    const weaknessReasons = [
        ...(commercialIntent.rejectionReasons || [])
    ];
    if (actionScore < 60) {
        weaknessReasons.push(`Actionability score (${actionScore}/100) in ${actionTier} tier.`);
    }
    if (routes.length + manualRoutes.length === 0) {
        weaknessReasons.push('Lacks direct contactability route.');
    }
    const uniqueWeakness = [...new Set(weaknessReasons)];

    // Advisory Recommended Next Action
    let recommendedNextAction = RECOMMENDED_NEXT_ACTIONS.HUMAN_REVIEW;
    if (contactabilityEvidence.verifiedRoutesCount > 0) {
        if (actionScore >= 70 && commercialIntent.isCommercialProspect) {
            recommendedNextAction = RECOMMENDED_NEXT_ACTIONS.INITIATE_HUMAN_CONTACT;
        } else {
            recommendedNextAction = RECOMMENDED_NEXT_ACTIONS.DISCUSS_REQUIREMENTS;
        }
    } else if (contactabilityEvidence.routeCount > 0) {
        recommendedNextAction = RECOMMENDED_NEXT_ACTIONS.HUMAN_REVIEW;
    } else if (!commercialIntent.isCommercialProspect) {
        recommendedNextAction = RECOMMENDED_NEXT_ACTIONS.MARK_NOT_GENUINE;
    } else {
        recommendedNextAction = RECOMMENDED_NEXT_ACTIONS.HUMAN_REVIEW;
    }

    return {
        actionabilityScore: actionScore,
        actionabilityTier: actionTier,
        relevanceCategory: relCategory,
        intentCategory: commCategory,
        commercialIntentCategory: commCategory,
        serviceMatches: services,
        locationEvidence: locationEvidence.summary || `${normalized.detectedLocation || 'Varanasi'}`,
        locationEvidenceDetail: locationEvidence,
        travelWindowEvidence: travelWindowEvidence.summary || `${normalized.detectedTravelWindow || 'Flexible'}`,
        travelWindowEvidenceDetail: travelWindowEvidence,
        sourceQualityEvidence,
        contactabilityEvidence,
        bestContactRoute: bestRoute,
        missingInformation: missing,
        positiveQualificationReasons: uniquePositive,
        positiveReasons: uniquePositive,
        rejectionReasons: uniqueWeakness,
        rejectionWeaknessReasons: uniqueWeakness,
        recommendedNextAction,
        aiRecommendedNextAction: recommendedNextAction
    };
}

module.exports = {
    generateProspectExplanation,
    determineBestContactRoute
};
