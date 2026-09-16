/**
 * AI Customer Hunter Relevance Gate
 * Varanasi Yatra Platform — Prompt 9.5 + 9.9
 *
 * Enforces strict semantic classification before opportunity generation.
 * Categorizes signals into 7 canonical tiers:
 * - INFORMATIONAL (e.g. "Best places to visit in Varanasi" → rejected)
 * - EARLY_INTENT (vague travel interest, single soft signal)
 * - PLANNING_INTENT (future trip planning with dates/services → qualified)
 * - HIGH_INTENT (immediate/specific booking needs → qualified)
 * - IRRELEVANT (unrelated location/topics → rejected)
 * - SPAM (promotions, crypto, loans → rejected)
 * - INJECTION_ATTEMPT (malicious jailbreak/instruction → rejected)
 *
 * Prompt 9.9 strengthens INFORMATIONAL detection to prevent SEO content,
 * listicles, and generic travel guides from becoming opportunities.
 * Minimum qualifying signal requirements raised for PLANNING_INTENT.
 */

const SIGNAL_RELEVANCE_CATEGORIES = Object.freeze({
    INFORMATIONAL: 'INFORMATIONAL',
    EARLY_INTENT: 'EARLY_INTENT',
    PLANNING_INTENT: 'PLANNING_INTENT',
    HIGH_INTENT: 'HIGH_INTENT',
    IRRELEVANT: 'IRRELEVANT',
    SPAM: 'SPAM',
    INJECTION_ATTEMPT: 'INJECTION_ATTEMPT'
});

const ALL_RELEVANCE_CATEGORIES = Object.freeze(Object.values(SIGNAL_RELEVANCE_CATEGORIES));

// ─── Purely informational patterns (articles, SEO content, guides, news) ───────
// Prompt 9.9: Expanded from 8 → 28 patterns
const INFORMATIONAL_PATTERNS = [
    // Listicles & travel guides
    /\b(best\s+places\s+to\s+visit)\b/i,
    /\b(top\s+\d+\s+(places|things|ghats|temples|spots|restaurants|cafes))\b/i,
    /\b(must\s+visit\s+places|must\s+see\s+in|must\s+do\s+in)\b/i,
    /\b(places\s+to\s+see\s+in|attractions\s+in|sightseeing\s+spots)\b/i,
    /\b(travel\s+guide\s+to|guide\s+to\s+visiting|complete\s+guide\s+to)\b/i,
    /\b(everything\s+you\s+need\s+to\s+know|beginners?\s+guide)\b/i,
    /\b(what\s+to\s+see\s+in|what\s+to\s+do\s+in|things\s+to\s+do\s+in)\b/i,

    // History / culture / informational
    /\b(history\s+of\s+varanasi|history\s+of\s+kashi|story\s+of\s+kashi)\b/i,
    /\b(guide\s+to\s+varanasi\s+history|about\s+varanasi|varanasi\s+facts)\b/i,
    /\b(cultural\s+significance|architectural\s+beauty|spiritual\s+importance)\b/i,
    /\b(ancient\s+city|holy\s+city\s+of|oldest\s+city)\b/i,
    /\b(mythology|legends?\s+of|folklore\s+of|religious\s+history)\b/i,

    // Weather / logistics info articles
    /\b(weather\s+in\s+varanasi|best\s+time\s+to\s+visit\s+varanasi)\b/i,
    /\b(when\s+to\s+visit\s+varanasi|climate\s+in\s+varanasi|temperature\s+in)\b/i,
    /\b(monsoon\s+in\s+varanasi|summer\s+in\s+varanasi|winter\s+in\s+varanasi)\b/i,

    // Published media
    /\b(wikipedia|photos?\s+of|tourism\s+bulletin|tourism\s+statistics)\b/i,
    /\b(news\s+from\s+varanasi|breaking\s+news|headline|article\s+about)\b/i,
    /\b(blog\s+post|travel\s+blog|photo\s+gallery|vlog|youtube\s+video)\b/i,
    /\b(instagram\s+post|facebook\s+post|tweet\s+about|reddit\s+thread)\b/i,

    // Generic question without purchase intent
    /\b(kya\s+hai|kya\s+hota\s+hai|tell\s+me\s+about|information\s+about)\b/i,
    /\b(just\s+curious|just\s+asking|wondering\s+about|interested\s+in\s+knowing)\b/i,
    /\b(how\s+many\s+ghats?\s+in|how\s+old\s+is\s+varanasi|why\s+is\s+varanasi)\b/i,
    /\b(famous\s+for|known\s+for|popular\s+for|celebrated\s+for)\b/i,

    // SEO bait / "How to" content without booking intent
    /\b(how\s+to\s+reach\s+varanasi|how\s+to\s+get\s+to\s+varanasi)\b/i,
    /\b(varanasi\s+itinerary\s+for\s+tourists|sample\s+itinerary|typical\s+itinerary)\b/i,
    /\b(ultimate\s+guide|definitive\s+guide|comprehensive\s+guide)\b/i,
    /\b(travel\s+tips\s+for|tips\s+for\s+visiting|advice\s+for\s+visiting)\b/i,
    /\b(packing\s+list\s+for|what\s+to\s+pack\s+for)\b/i
];

// ─── Commercial transaction / booking intent tokens ────────────────────────────
const COMMERCIAL_INTENT_PATTERNS = [
    /\b(need|chahiye|looking\s+for|want|book|booking|arrange|rate|cost|price|hire)\b/i,
    /\b(traveling\s+with|going\s+to|planning\s+to\s+visit|family\s+trip|pilgrimage)\b/i,
    /\b(budget|package|vip\s+darshan|darshan\s+ticket)\b/i,
    /\b(recommend\s+a\s+hotel|suggest\s+a\s+hotel|find\s+me\s+a|get\s+me\s+a)\b/i,
    /\b(help\s+me\s+plan|help\s+me\s+book|help\s+with\s+booking)\b/i,
    /\b(kab\s+milega|kab\s+jayenge|kab\s+hoga|kab\s+book|kab\s+jaana)\b/i,
    /\b(kitna\s+lagega|kitne\s+mein|kitna\s+cost|quote\s+karo)\b/i
];

// ─── Prompt 9.9: SEO Content Source patterns (URL-based) ─────────────────────
const INFORMATIONAL_URL_PATTERNS = [
    /\/(blog|article|news|post|guide|tips|listicle|magazine|review)\//i,
    /\/(travel-guide|how-to|what-to|things-to-do|best-places|top-\d+)\//i,
    /(wikipedia\.org|wikivoyage\.org|britannica\.com|lonelyplanet\.com)/i,
    /(tripadvisor\.com\/Attraction|tripadvisor\.com\/Tourism)/i,
    /(makemytrip\.com\/tripideas|cleartrip\.com\/collections|holidify\.com)/i,
    /(wanderlust|goibibo\.com\/hotels\/varanasi-guide)/i
];

/**
 * Classifies a normalized signal into one of the 7 canonical relevance tiers.
 *
 * @param {Object} normalized - Normalized signal object from hunterService.normalizeSignal
 * @param {Object} [intentData] - Optional intent detection result
 * @returns {{
 *   category: string,
 *   isQualifiedForOpportunity: boolean,
 *   reason: string,
 *   relevanceScore: number
 * }}
 */
const { classifyCommercialIntent } = require('../scoring/commercialIntentClassifier');

/**
 * Classifies a normalized signal into one of the 7 canonical relevance tiers
 * and resolves explainable commercial intent.
 *
 * @param {Object} normalized - Normalized signal object from hunterService.normalizeSignal
 * @param {Object} [intentData] - Optional intent detection result
 * @returns {{
 *   category: string,
 *   commercialIntentCategory: string,
 *   commercialIntent: Object,
 *   isQualifiedForOpportunity: boolean,
 *   reason: string,
 *   relevanceScore: number
 * }}
 */
function classifySignalRelevance(normalized, intentData = {}) {
    const text = String(normalized.normalizedText || normalized.text || '').trim();
    const services = normalized.detectedServices || [];
    const travelWindow = normalized.detectedTravelWindow;
    const isMalicious = normalized.isMalicious;
    const isSpam = normalized.isSpam;
    const isVaranasi = normalized.detectedLocation === 'Varanasi' || /\b(varanasi|banaras|kashi|benares)\b/i.test(text);
    const sourceUrl = String(normalized.sourceUrl || normalized.canonicalUrl || '').toLowerCase();

    // ─── 1. Security: Injection attempts ─────────────────────────────────────
    if (isMalicious) {
        return {
            category: SIGNAL_RELEVANCE_CATEGORIES.INJECTION_ATTEMPT,
            commercialIntentCategory: 'UNKNOWN',
            isQualifiedForOpportunity: false,
            reason: `Malicious prompt injection or jailbreak attempt detected (${normalized.maliciousCategory || 'UNTRUSTED_INSTRUCTION'}).`,
            relevanceScore: 0
        };
    }

    // ─── 2. Spam ──────────────────────────────────────────────────────────────
    if (isSpam) {
        return {
            category: SIGNAL_RELEVANCE_CATEGORIES.SPAM,
            commercialIntentCategory: 'UNKNOWN',
            isQualifiedForOpportunity: false,
            reason: 'Promotional, crypto, or spam content detected.',
            relevanceScore: 5
        };
    }

    // ─── 3. Geographic irrelevance ────────────────────────────────────────────
    if (!isVaranasi && services.length === 0) {
        return {
            category: SIGNAL_RELEVANCE_CATEGORIES.IRRELEVANT,
            commercialIntentCategory: 'UNKNOWN',
            isQualifiedForOpportunity: false,
            reason: 'Signal has no geographical or commercial connection to Varanasi.',
            relevanceScore: 10
        };
    }

    // Commercial intent analysis
    const commercialIntent = classifyCommercialIntent(normalized, intentData);
    const hasCommercialIntent = COMMERCIAL_INTENT_PATTERNS.some(pat => pat.test(text)) ||
        commercialIntent.evidence.explicitRequest;

    // ─── 4. Informational content detection (Prompt 9.9 & 9.10 strengthened) ─
    const isInfoTextPattern = INFORMATIONAL_PATTERNS.some(pat => pat.test(text));
    const isInfoUrlPattern = sourceUrl ? INFORMATIONAL_URL_PATTERNS.some(pat => pat.test(sourceUrl)) : false;
    const isInfoContent = isInfoTextPattern || isInfoUrlPattern ||
        commercialIntent.category === 'INFORMATIONAL' ||
        commercialIntent.category === 'INSPIRATIONAL';

    // Reject if EITHER text OR URL is informational, AND no strong commercial signal
    if (isInfoContent && (!hasCommercialIntent || commercialIntent.category === 'INFORMATIONAL') && !travelWindow) {
        return {
            category: SIGNAL_RELEVANCE_CATEGORIES.INFORMATIONAL,
            commercialIntentCategory: commercialIntent.category,
            commercialIntent,
            isQualifiedForOpportunity: false,
            reason: commercialIntent.rejectionReasons[0] || 'Informational travel guide, SEO article, or historical query with zero purchasing/booking intent.',
            relevanceScore: 20
        };
    }

    // Edge case — URL is an info source but text has commercial intent
    if (isInfoUrlPattern && hasCommercialIntent && services.length === 0) {
        return {
            category: SIGNAL_RELEVANCE_CATEGORIES.EARLY_INTENT,
            commercialIntentCategory: commercialIntent.category,
            commercialIntent,
            isQualifiedForOpportunity: false,
            reason: 'Commercial comment on informational page but no service requirements specified.',
            relevanceScore: 35
        };
    }

    // ─── 5. High Intent Tier ──────────────────────────────────────────────────
    const isUrgent = /\b(urgent|today|tomorrow|now|immediately|this\s+weekend|aaj|abhi|jaldi)\b/i.test(text);
    const isAdvanceWindow = /\b(next\s+month|next\s+year|later|after\s+\d+\s+months)\b/i.test(text);

    const isHighIntent = intentData.intentLevel === 'HIGH' ||
        commercialIntent.category === 'COMMERCIAL_TRIP_REQUEST' ||
        (hasCommercialIntent && isUrgent) ||
        (hasCommercialIntent && services.length >= 2 && !isAdvanceWindow);

    if (isHighIntent) {
        return {
            category: SIGNAL_RELEVANCE_CATEGORIES.HIGH_INTENT,
            commercialIntentCategory: commercialIntent.category,
            commercialIntent,
            isQualifiedForOpportunity: true,
            reason: `High commercial booking intent with explicit services (${services.join(', ') || 'travel'}) and clear timing.`,
            relevanceScore: 95
        };
    }

    // ─── 6. Planning Intent Tier ──────────────────────────────────────────────
    // Accept advance window (even 3+ months future) if services or planning language present
    const isPlanningA = services.length >= 1 && !!travelWindow;
    const isPlanningB = services.length >= 1 && hasCommercialIntent;
    const isPlanningC = hasCommercialIntent && /\b(next\s+month|planning|family\s+trip|pilgrimage|trip\s+planning|in\s+\d+\s+months)\b/i.test(text);
    const isActivePlanning = commercialIntent.category === 'ACTIVE_TRAVEL_PLANNING';

    if (isPlanningA || isPlanningB || isPlanningC || isActivePlanning) {
        return {
            category: SIGNAL_RELEVANCE_CATEGORIES.PLANNING_INTENT,
            commercialIntentCategory: commercialIntent.category,
            commercialIntent,
            isQualifiedForOpportunity: true,
            reason: `Prospective pilgrimage/travel planning with requested services (${services.join(', ')}) and travel horizon.`,
            relevanceScore: 75
        };
    }

    // ─── 7. Early Intent Tier ─────────────────────────────────────────────────
    if (services.length === 1 || travelWindow) {
        return {
            category: SIGNAL_RELEVANCE_CATEGORIES.EARLY_INTENT,
            commercialIntentCategory: commercialIntent.category,
            commercialIntent,
            isQualifiedForOpportunity: false,
            reason: 'Early or passive travel interest without specific booking urgency or commercial signal.',
            relevanceScore: 45
        };
    }

    // ─── Default: Informational / Unknown ─────────────────────────────────────
    return {
        category: SIGNAL_RELEVANCE_CATEGORIES.INFORMATIONAL,
        commercialIntentCategory: commercialIntent.category,
        commercialIntent,
        isQualifiedForOpportunity: false,
        reason: 'General inquiry lacking actionable commercial intent.',
        relevanceScore: 25
    };
}

module.exports = {
    SIGNAL_RELEVANCE_CATEGORIES,
    ALL_RELEVANCE_CATEGORIES,
    classifySignalRelevance
};

