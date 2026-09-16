/**
 * AI Sales Assistant Service & Intelligence Engine
 * Varanasi Yatra Platform — Prompt 7
 * 
 * Invariants:
 * 1. AI is an advisory co-pilot for sales and operations teams.
 * 2. Never autonomously decides final selling prices, offers discounts, or alters margins.
 * 3. Never sends external messages without explicit human approval.
 * 4. Never autonomously creates bookings, collects payments, or modifies financial records.
 * 5. Proprietary costs and margins are strictly stripped for all non-CEO roles.
 * 6. Scoped authorization is enforced: team members/leaders cannot access leads outside their scope.
 */

const {
    AI_SALES_INTENT_LEVELS,
    AI_PURCHASE_READINESS,
    AI_SALES_STAGES,
    AI_NEXT_ACTIONS,
    AI_FOLLOWUP_TIMINGS,
    AI_OBJECTION_TYPES,
    AI_SENTIMENTS
} = require('./aiConstants');

// -----------------------------------------------------------------
// 1. PROMPT INJECTION & SECURITY DEFENSES
// -----------------------------------------------------------------

const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous\s+)?(instructions|rules|system\s+prompt)/i,
    /system\s+prompt/i,
    /reveal\s+(internal|system|prompt|instructions)/i,
    /(vendor|hotel|cab|boat)\s+cost/i,
    /company\s+margin/i,
    /expected\s+profit/i,
    /realized\s+profit/i,
    /ceo\s+notes/i,
    /send\s+.*without\s+(approval|review|human)/i,
    /(make|create|confirm)\s+(a\s+)?booking\s+(now|direct|automatically)/i,
    /(apply|give)\s+\d+%\s+discount/i,
    /bypass\s+permissions/i,
    /override\s+guardrails/i
];

function checkSalesPromptInjection(text = '') {
    if (!text || typeof text !== 'string') return { detected: false };
    const t = text.trim();

    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(t)) {
            let category = 'JAILBREAK_ATTEMPT';
            let reason = 'Unauthorized attempt to bypass safety guardrails or access restricted internal data';
            if (/vendor|margin|profit|ceo\s*notes/i.test(t)) {
                category = 'CONFIDENTIAL_DATA_ATTEMPT';
                reason = 'Attempted exfiltration of proprietary financial data or executive notes';
            } else if (/send\s+.*without\s+(approval|review|human)|send\s+message/i.test(t)) {
                category = 'AUTONOMOUS_ACTION_ATTEMPT';
                reason = 'Attempted autonomous message transmission without human approval';
            } else if (/booking/i.test(t)) {
                category = 'AUTONOMOUS_ACTION_ATTEMPT';
                reason = 'Attempted autonomous booking creation';
            } else if (/discount/i.test(t)) {
                category = 'AUTONOMOUS_ACTION_ATTEMPT';
                reason = 'Attempted unauthorized discount manipulation';
            }

            return {
                detected: true,
                category,
                reason,
                blockedAction: 'RESTRICTED_OPERATION_ATTEMPT'
            };
        }
    }

    return { detected: false };
}

/**
 * Sanitizes lead object for role-based privacy boundaries (Prompt 3 & 7)
 */
function sanitizeLeadForRole(lead = {}, role = 'MANAGER') {
    if (!lead) return null;
    const normalizedRole = (role || '').toUpperCase();
    const copy = lead.toObject ? lead.toObject() : { ...lead };

    if (normalizedRole !== 'CEO') {
        delete copy.vendorCost;
        delete copy.companyMargin;
        delete copy.expectedProfit;
        delete copy.realizedProfit;
        delete copy.margin;
        delete copy.ceoNotes;
    }

    return copy;
}

// -----------------------------------------------------------------
// 2. LEAD QUALIFICATION & INTENT SCORING ENGINE
// -----------------------------------------------------------------

/**
 * Calculates lead qualification, intent score (0-100), purchase readiness, and explainable breakdown.
 */
function calculateLeadQualification(lead = {}, communications = []) {
    const textSources = [
        lead.specialRequirements || '',
        lead.adminNotes || '',
        lead.notes || '',
        lead.customerNotes || '',
        lead.remarks || '',
        lead.aiRequirementSummary || '',
        lead.destination || '',
        lead.requirements ? JSON.stringify(lead.requirements) : '',
        ...communications.map(c => c.content || c.details || '')
    ].join(' ').toLowerCase();

    // 1. Intent Scoring (0 - 30 pts)
    let intentScore = 0;
    let explicitSignal = 'NONE';

    const strongIntentKeywords = [
        'booking karna hai', 'booking karni hai', 'final package bhejiye', 'dates confirm hain',
        'dates confirm', 'hotel book karna hai', 'advance kitna dena hoga', 'advance payment',
        'we are ready', 'ready to book', 'confirm package', 'book now', 'advance transfer',
        'payment link'
    ];

    const mediumIntentKeywords = [
        'options bhejiye', 'package compare', 'price bataiye', 'details bhejiye',
        'quotation', 'rate batao', 'best quote', 'itinerary share kijiye', 'cost kya hogi'
    ];

    const lowIntentKeywords = [
        'just exploring', 'information chahiye', 'next year', 'baad mein batata hoon',
        'abhi confirm nahi', 'sirf pooch raha tha'
    ];

    if (strongIntentKeywords.some(kw => textSources.includes(kw))) {
        intentScore = 30;
        explicitSignal = 'STRONG';
    } else if (mediumIntentKeywords.some(kw => textSources.includes(kw))) {
        intentScore = 20;
        explicitSignal = 'MEDIUM';
    } else if (lowIntentKeywords.some(kw => textSources.includes(kw))) {
        intentScore = 8;
        explicitSignal = 'LOW';
    } else {
        // Default intent based on lead existence & service interest
        intentScore = (lead.aiAssisted || lead.source === 'AREA_QR' || lead.source === 'HOTEL_QR') ? 18 : 14;
        explicitSignal = 'STANDARD';
    }

    // 2. Requirement Clarity Scoring (0 - 25 pts)
    let requirementClarity = 0;
    if (lead.destination) requirementClarity += 5;
    if (lead.date || lead.dates || lead.startDate || lead.requirements?.travelStartDate || lead.requirements?.travelWindow) requirementClarity += 6;
    if ((lead.travelers && lead.travelers !== '1') || (lead.guests && lead.guests > 1) || lead.requirements?.totalGuests) requirementClarity += 5;
    if (lead.tripDuration || lead.duration || lead.requirements?.durationDays) requirementClarity += 4;
    if (lead.aiServiceInterests?.length > 0 || lead.services?.length > 0 || lead.requirements?.serviceInterests?.length > 0 || lead.hotelDetails || lead.panditDetails) requirementClarity += 5;

    // 3. Travel Proximity Scoring (0 - 20 pts)
    let travelProximity = 5;
    let urgency = AI_SALES_INTENT_LEVELS.LOW;
    let proximityDays = null;

    const rawDate = lead.date || lead.dates || lead.startDate || lead.requirements?.travelStartDate;
    if (rawDate) {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
            const now = new Date();
            const diffDays = Math.ceil((parsedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            proximityDays = diffDays;

            if (diffDays >= 0 && diffDays <= 3) {
                travelProximity = 20;
                urgency = AI_SALES_INTENT_LEVELS.HIGH;
            } else if (diffDays > 3 && diffDays <= 7) {
                travelProximity = 16;
                urgency = AI_SALES_INTENT_LEVELS.HIGH;
            } else if (diffDays > 7 && diffDays <= 15) {
                travelProximity = 12;
                urgency = AI_SALES_INTENT_LEVELS.MEDIUM;
            } else if (diffDays > 15 && diffDays <= 30) {
                travelProximity = 8;
                urgency = AI_SALES_INTENT_LEVELS.MEDIUM;
            } else {
                travelProximity = 6;
                urgency = AI_SALES_INTENT_LEVELS.LOW;
            }
        }
    } else {
        // Date not exact, check travelWindow
        const windowText = (lead.requirements?.travelWindow || '').toLowerCase();
        if (/next\s*week|urgent|is\s*hafte/i.test(windowText)) {
            travelProximity = 15;
            urgency = AI_SALES_INTENT_LEVELS.HIGH;
        } else if (/this\s*month|next\s*month/i.test(windowText)) {
            travelProximity = 10;
            urgency = AI_SALES_INTENT_LEVELS.MEDIUM;
        } else {
            travelProximity = 5;
            urgency = AI_SALES_INTENT_LEVELS.LOW;
        }
    }

    if (explicitSignal === 'STRONG' && urgency === AI_SALES_INTENT_LEVELS.LOW) {
        urgency = AI_SALES_INTENT_LEVELS.MEDIUM;
    }

    // 4. Customer Engagement Scoring (0 - 15 pts)
    let engagementScore = 6;
    if (lead.mobile || lead.phone) engagementScore += 4;
    if (lead.email && !lead.email.includes('offline-client')) engagementScore += 2;
    if (communications.length > 0 || lead.aiInteraction?.messageCount > 3) engagementScore += 3;
    engagementScore = Math.min(15, engagementScore);

    const engagementLevel = engagementScore >= 12 ? 'HIGH' : (engagementScore >= 8 ? 'MEDIUM' : 'LOW');

    // 5. Budget Clarity Scoring (0 - 10 pts)
    let budgetClarity = 4;
    if (lead.budget || lead.requirements?.budget || /budget|rupaye|approx|₹|\d{4,6}/i.test(textSources)) {
        budgetClarity = 10;
    }

    // Total Composite Score (0 - 100)
    const score = Math.min(100, intentScore + requirementClarity + travelProximity + engagementScore + budgetClarity);

    // Intent Level
    let intentLevel = AI_SALES_INTENT_LEVELS.LOW;
    if (score >= 65 || explicitSignal === 'STRONG') {
        intentLevel = AI_SALES_INTENT_LEVELS.HIGH;
    } else if (score >= 40 || explicitSignal === 'MEDIUM') {
        intentLevel = AI_SALES_INTENT_LEVELS.MEDIUM;
    }

    // Purchase Readiness
    let purchaseReadiness = AI_PURCHASE_READINESS.EARLY_RESEARCH;
    if (explicitSignal === 'STRONG' && requirementClarity >= 15) {
        purchaseReadiness = AI_PURCHASE_READINESS.READY_TO_BOOK;
    } else if (
        requirementClarity >= 18 ||
        (intentLevel === 'HIGH' && (lead.date || lead.dates || lead.startDate || lead.requirements?.travelStartDate)) ||
        textSources.includes('compare') ||
        textSources.includes('shortlist') ||
        textSources.includes('options bhejiye')
    ) {
        purchaseReadiness = AI_PURCHASE_READINESS.SHORTLISTING;
    } else if (requirementClarity >= 10 || intentLevel === 'MEDIUM' || explicitSignal === 'MEDIUM') {
        purchaseReadiness = AI_PURCHASE_READINESS.PLANNING;
    }

    // Requirement Completeness Percentage (0 - 100%)
    const requirementCompleteness = Math.min(100, Math.round((requirementClarity / 25) * 100));

    // Explainable Breakdown Reason
    const qualificationReason = `Intent: ${intentScore}/30, Requirement Clarity: ${requirementClarity}/25, Travel Proximity: ${travelProximity}/20, Engagement: ${engagementScore}/15, Budget Clarity: ${budgetClarity}/10. Total Score: ${score}/100.`;

    return {
        intentLevel,
        purchaseReadiness,
        urgency,
        engagement: engagementLevel,
        requirementCompleteness,
        score,
        breakdown: {
            intent: intentScore,
            intentScore: intentScore,
            requirementClarity,
            requirementScore: requirementClarity,
            travelProximity,
            engagement: engagementScore,
            budgetClarity
        },
        qualificationReason,
        proximityDays,
        explicitSignal
    };
}

// -----------------------------------------------------------------
// 3. REQUIREMENT GAP DETECTION
// -----------------------------------------------------------------

/**
 * Identifies missing fields and actionable requirement gaps before quote preparation.
 */
function detectRequirementGaps(lead = {}) {
    const gaps = [];
    const missingFields = [];

    // Date / Window
    if (!lead.date && !lead.dates && !lead.startDate && !lead.requirements?.travelStartDate && !lead.requirements?.travelWindow) {
        missingFields.push('dates');
        gaps.push({
            field: 'dates',
            priority: 'HIGH',
            suggestion: 'Exact travel dates should be confirmed before preparing a customized quote.'
        });
    }

    // Travelers / Guest Count
    const hasTravelers = (lead.travelers && lead.travelers !== '1') || (lead.guests && lead.guests > 0) || (lead.requirements?.totalGuests && lead.requirements.totalGuests > 0);
    if (!hasTravelers && !lead.requirements?.adults) {
        missingFields.push('guests');
        gaps.push({
            field: 'guests',
            priority: 'HIGH',
            suggestion: 'Confirm total guest count (adults and children) to allocate accurate room and vehicle inventory.'
        });
    }

    // Trip Duration
    if (!lead.tripDuration && !lead.duration && !lead.requirements?.durationDays && !lead.requirements?.duration) {
        missingFields.push('duration');
        gaps.push({
            field: 'duration',
            priority: 'MEDIUM',
            suggestion: 'Confirm trip duration (number of days and nights) for itinerary planning.'
        });
    }

    // Hotel Category Preference
    const hasHotelService = lead.aiServiceInterests?.includes('HOTEL') || lead.services?.some(s => /hotel/i.test(s)) || lead.hotelDetails || /hotel|room|stay/i.test(lead.specialRequirements || '') || /hotel/i.test(lead.notes || '');
    const hasHotelPref = lead.hotelPreference || lead.requirements?.accommodationPreference || lead.hotelDetails;
    if (hasHotelService && !hasHotelPref) {
        missingFields.push('hotelPreference');
        gaps.push({
            field: 'hotelPreference',
            priority: 'MEDIUM',
            suggestion: 'Ask preferred hotel category (Standard 3-Star vs Deluxe Heritage Haveli) before finalizing hotel rates.'
        });
    }

    // Arrival / Pickup Mode
    if (!lead.pickup || lead.pickup === 'Direct Booking') {
        missingFields.push('pickupLocation');
        gaps.push({
            field: 'pickupLocation',
            priority: 'LOW',
            suggestion: 'Verify if airport or Varanasi Cantt railway station pickup is required.'
        });
    }

    // Budget Range
    if (!lead.budget && !lead.requirements?.budget && !/budget|approx/i.test(lead.specialRequirements || '') && !/budget|approx/i.test(lead.notes || '')) {
        missingFields.push('budgetRange');
        gaps.push({
            field: 'budgetRange',
            priority: 'LOW',
            suggestion: 'Ask for approximate budget range to suggest optimal package inclusions.'
        });
    }

    const result = gaps;
    result.missingFields = missingFields;
    result.gaps = gaps;
    result.hasCriticalGaps = missingFields.includes('dates') || missingFields.includes('guests');
    return result;
}

// -----------------------------------------------------------------
// 4. ADDITIVE SALES STAGE RECOMMENDATION
// -----------------------------------------------------------------

/**
 * Recommends additive sales stage (does NOT replace authoritative CRM lead status).
 */
function recommendSalesStage(lead = {}, qualification = {}, gaps = {}, quotes = []) {
    const hasActiveQuote = quotes.some(q => q.status === 'SENT' || q.status === 'APPROVED');
    const hasAcceptedQuote = quotes.some(q => q.status === 'ACCEPTED' || q.status === 'CONFIRMED');

    if (hasAcceptedQuote || lead.status === 'Confirmed') {
        return AI_SALES_STAGES.BOOKING_READY;
    }

    if (hasActiveQuote) {
        // If quote sent > 24 hours ago with no response
        const sentQuote = quotes.find(q => q.status === 'SENT');
        const sentAt = sentQuote ? new Date(sentQuote.updatedAt || sentQuote.createdAt) : null;
        if (sentAt && (Date.now() - sentAt.getTime()) > (24 * 60 * 60 * 1000)) {
            return AI_SALES_STAGES.STALLED;
        }
        return AI_SALES_STAGES.QUOTE_SENT;
    }

    if (!gaps.hasCriticalGaps && qualification.requirementCompleteness >= 70) {
        return AI_SALES_STAGES.QUOTE_READY;
    }

    if (qualification.purchaseReadiness === AI_PURCHASE_READINESS.SHORTLISTING) {
        return AI_SALES_STAGES.REQUIREMENT_COMPLETE;
    }

    if (qualification.purchaseReadiness === AI_PURCHASE_READINESS.PLANNING) {
        return AI_SALES_STAGES.QUALIFYING;
    }

    return AI_SALES_STAGES.NEW;
}

// -----------------------------------------------------------------
// 5. FOLLOW-UP & STALLED LEAD ENGINE
// -----------------------------------------------------------------

/**
 * Evaluates follow-up priority and identifies stalled leads.
 */
function evaluateFollowUp(lead = {}, qualification = {}, quotes = []) {
    if (!qualification || Object.keys(qualification).length === 0) {
        qualification = calculateLeadQualification(lead);
    }

    const now = Date.now();
    const lastActivity = lead.updatedAt ? new Date(lead.updatedAt).getTime() : now;
    const hoursSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60));

    let isStalled = false;
    let stalledReason = '';
    let timing = AI_FOLLOWUP_TIMINGS.SOON;
    let reason = 'Regular cadence check-in';

    // Check stalled quotes or lead stage
    const activeQuote = (quotes || []).find(q => q.status === 'SENT');
    const isQuoteSentStage = lead.stage === 'QUOTE_SENT' || lead.status === 'QUOTE_SENT';

    if (activeQuote || isQuoteSentStage) {
        const quoteTime = activeQuote
            ? new Date(activeQuote.updatedAt || activeQuote.createdAt).getTime()
            : (lead.updatedAt ? new Date(lead.updatedAt).getTime() : now);
        const quoteHoursAgo = Math.floor((now - quoteTime) / (1000 * 60 * 60));

        if (quoteHoursAgo >= 24) {
            isStalled = true;
            stalledReason = `Quote sent ${Math.floor(quoteHoursAgo / 24)} days ago with no customer response.`;
            timing = AI_FOLLOWUP_TIMINGS.TODAY;
            reason = 'Customer received quote package; follow up with a concise summary to address any questions.';
        }
    }

    // Check travel proximity
    if (qualification.proximityDays !== null) {
        if (qualification.proximityDays <= 3 && lead.status !== 'Confirmed') {
            timing = AI_FOLLOWUP_TIMINGS.URGENT;
            reason = `Travel starts in ${qualification.proximityDays} days and booking is not yet confirmed. Immediate coordination needed.`;
            isStalled = true;
            stalledReason = stalledReason || `Travel imminent (${qualification.proximityDays} days) with unfinalized booking.`;
        } else if (qualification.proximityDays <= 7 && lead.status !== 'Confirmed') {
            timing = AI_FOLLOWUP_TIMINGS.TODAY;
            reason = `Travel starts in ${qualification.proximityDays} days. Finalize itinerary and hotel reservation.`;
        }
    }

    // High intent leads
    if (qualification.intentLevel === AI_SALES_INTENT_LEVELS.HIGH && timing !== AI_FOLLOWUP_TIMINGS.URGENT) {
        timing = AI_FOLLOWUP_TIMINGS.TODAY;
        reason = reason !== 'Regular cadence check-in' ? reason : 'High customer booking intent detected. Engage promptly to lock travel dates.';
    }

    // Inactivity check
    if (hoursSinceActivity > 48 && !isStalled) {
        isStalled = true;
        stalledReason = `No customer interaction for over ${Math.floor(hoursSinceActivity / 24)} days.`;
        timing = timing === AI_FOLLOWUP_TIMINGS.URGENT ? AI_FOLLOWUP_TIMINGS.URGENT : AI_FOLLOWUP_TIMINGS.SOON;
    }

    return {
        followUpRecommended: true,
        recommendedTiming: timing,
        priority: timing === AI_FOLLOWUP_TIMINGS.URGENT ? 'URGENT' : (timing === AI_FOLLOWUP_TIMINGS.TODAY ? 'HIGH' : 'MEDIUM'),
        reason,
        isStalled,
        stalledReason
    };
}

// -----------------------------------------------------------------
// 6. NEXT BEST ACTION SELECTOR
// -----------------------------------------------------------------

/**
 * Emits exactly ONE prioritized primary next action with rationale and confidence.
 */
function determineNextBestAction(lead = {}, arg2 = {}, arg3 = {}, arg4 = {}, quotes = []) {
    let qualification = {};
    let gaps = {};
    let followUp = {};

    // Detect argument order flexibility
    if (Array.isArray(arg2) || arg2.missingFields || arg2.gaps) {
        gaps = arg2;
        qualification = arg3;
    } else {
        qualification = arg2;
        gaps = arg3;
    }

    if (arg4 && arg4.recommendedTiming) {
        followUp = arg4;
    }

    if (!qualification || Object.keys(qualification).length === 0) {
        qualification = calculateLeadQualification(lead);
    }
    if (!gaps || (Array.isArray(gaps) && gaps.length === 0 && !gaps.missingFields) || Object.keys(gaps).length === 0) {
        gaps = detectRequirementGaps(lead);
    }
    if (!followUp || Object.keys(followUp).length === 0) {
        followUp = evaluateFollowUp(lead, qualification, quotes);
    }

    const missingFields = gaps.missingFields || (Array.isArray(gaps) ? gaps.map(g => g.field) : []);
    const hasCriticalGaps = gaps.hasCriticalGaps !== undefined
        ? gaps.hasCriticalGaps
        : (missingFields.includes('dates') || missingFields.includes('travelDate') || missingFields.includes('guests') || missingFields.includes('travelers'));

    const formatAction = (type, priority, reason, confidence) => ({
        type,
        primaryAction: type,
        priority,
        reason,
        confidence
    });

    // 1. Missing Travel Dates is top priority
    if (missingFields.includes('travelDate') || missingFields.includes('dates')) {
        return formatAction(
            AI_NEXT_ACTIONS.CONFIRM_TRAVEL_DATES,
            followUp.recommendedTiming === AI_FOLLOWUP_TIMINGS.URGENT ? AI_FOLLOWUP_TIMINGS.URGENT : AI_FOLLOWUP_TIMINGS.TODAY,
            'Travel dates are missing. Confirm travel window before preparing an accurate quote.',
            'HIGH'
        );
    }

    // 2. Missing Guest Count
    if (missingFields.includes('travelers') || missingFields.includes('guests')) {
        return formatAction(
            AI_NEXT_ACTIONS.CONFIRM_GUEST_COUNT,
            AI_FOLLOWUP_TIMINGS.TODAY,
            'Guest count is unconfirmed. Confirm number of adults and children to reserve rooms and cab.',
            'HIGH'
        );
    }

    // 3. Stalled Quote Follow-Up
    const activeQuote = (quotes || []).find(q => q.status === 'SENT');
    if (activeQuote && followUp.isStalled) {
        return formatAction(
            AI_NEXT_ACTIONS.FOLLOW_UP,
            AI_FOLLOWUP_TIMINGS.TODAY,
            'Quote was sent but no response received. Follow up on customer feedback or concerns.',
            'HIGH'
        );
    }

    // 4. Missing Hotel Preference
    if (missingFields.includes('hotelPreference')) {
        return formatAction(
            AI_NEXT_ACTIONS.ASK_HOTEL_PREFERENCE,
            AI_FOLLOWUP_TIMINGS.SOON,
            'Hotel category preference is missing. Clarify whether guest prefers Standard 3-Star or Deluxe Heritage stay.',
            'HIGH'
        );
    }

    // 5. Requirements Complete -> Prepare Quote Draft
    if (!hasCriticalGaps && !activeQuote) {
        return formatAction(
            AI_NEXT_ACTIONS.PREPARE_QUOTE_DRAFT,
            AI_FOLLOWUP_TIMINGS.TODAY,
            'Trip requirements are sufficiently complete. Prepare draft quote in Quote Builder for manager review.',
            'HIGH'
        );
    }

    // 6. Budget Clarification
    if (missingFields.includes('budgetRange') || missingFields.includes('budget')) {
        return formatAction(
            AI_NEXT_ACTIONS.ASK_BUDGET_RANGE,
            AI_FOLLOWUP_TIMINGS.SOON,
            'Customer budget is unspecified. Inquire about preferred budget range to tailor package options.',
            'MEDIUM'
        );
    }

    // 7. General Cadence Follow-Up
    return formatAction(
        AI_NEXT_ACTIONS.FOLLOW_UP,
        followUp.recommendedTiming || AI_FOLLOWUP_TIMINGS.SOON,
        followUp.reason || 'Check in with guest on travel planning progress.',
        'HIGH'
    );
}

// -----------------------------------------------------------------
// 7. OBJECTION HANDLING & DRAFT RESPONSE GENERATOR
// -----------------------------------------------------------------

/**
 * Classifies customer sales objection, detects sentiment, and formulates response strategy and draft.
 */
function analyzeObjection(customerText = '', lead = {}) {
    if (!customerText || typeof customerText !== 'string') {
        throw new Error('customerText is required for objection analysis');
    }

    const t = customerText.toLowerCase().trim();
    let type = AI_OBJECTION_TYPES.UNCERTAINTY;
    let sentiment = AI_SENTIMENTS.NEUTRAL;
    let severity = 'MEDIUM';

    // 1. Classification
    if (/kuch\s+kam\s+ho\s+sakta|kam\s+karo|budget\s+(se\s+)?zyada|mehenga|expensive|costly|rate\s+kam|sasta|discount|\d+[\s,]*k?\s*(mein|me)\s*final|final\s*kar\s*(do|dijiye)/i.test(t)) {
        type = AI_OBJECTION_TYPES.PRICE;
        sentiment = /bahut\s+mehenga|loot\s+rahe/i.test(t) ? AI_SENTIMENTS.FRUSTRATED : AI_SENTIMENTS.CONCERNED;
        severity = 'HIGH';
    } else if (/dusri\s+agency|online\s+sasta|make\s*my\s*trip|mmt|yatra\.com|kisi\s+aur\s+ne/i.test(t)) {
        type = AI_OBJECTION_TYPES.PRICE_COMPARISON;
        sentiment = AI_SENTIMENTS.CONCERNED;
        severity = 'MEDIUM';
    } else if (/guarantee|fraud|vishwas|advance\s+kyu|pehle\s+kyu\s+de|office\s+kahan/i.test(t)) {
        type = AI_OBJECTION_TYPES.TRUST;
        sentiment = AI_SENTIMENTS.CONCERNED;
        severity = 'HIGH';
    } else if (/next\s*year|agle\s*saal|abhi\s*(time\s*)?nahi|baad\s*mein\s*karenge|date\s*fix\s*nahi|postpone|kisi\s*aur\s*din|cancel\s*ho\s*sakta|plan\s*badal|delay|later/i.test(t)) {
        type = AI_OBJECTION_TYPES.TIMING;
        sentiment = AI_SENTIMENTS.UNCERTAIN;
        severity = 'MEDIUM';
    } else if (/room\s+milega|available\s+hoga|boat\s+pakka|seat\s+hogi/i.test(t)) {
        type = AI_OBJECTION_TYPES.AVAILABILITY;
        sentiment = AI_SENTIMENTS.UNCERTAIN;
        severity = 'HIGH';
    } else if (/hotel\s+pasand\s+nahi|ghat\s+ke\s+paas|dur\s+hai|5\s*star\s+chahiye/i.test(t)) {
        type = AI_OBJECTION_TYPES.HOTEL_PREFERENCE;
        sentiment = AI_SENTIMENTS.CONCERNED;
        severity = 'MEDIUM';
    } else if (/elderly|parents|buzurg|bacche|wheelchair|sehat/i.test(t)) {
        type = AI_OBJECTION_TYPES.FAMILY_CONCERN;
        sentiment = AI_SENTIMENTS.CONCERNED;
        severity = 'HIGH';
    } else if (/soch\s+kar|family\s+se\s+pooch|baad\s+mein\s+bataunga/i.test(t)) {
        type = AI_OBJECTION_TYPES.UNCERTAINTY;
        sentiment = AI_SENTIMENTS.UNCERTAIN;
        severity = 'LOW';
    }

    // 2. Strategy Formulation (Strictly forbids pricing hallucination or unauthorized discount)
    let recommendedStrategy = '';
    let draftResponse = '';
    const customerName = lead.name || 'Guest';

    switch (type) {
        case AI_OBJECTION_TYPES.PRICE:
            recommendedStrategy = 'Acknowledge budget constraint with empathy. Emphasize value and transparent service inclusions. Offer to adjust optional services (e.g. sharing vs private boat, standard vs boutique hotel). Never promise arbitrary discounts.';
            draftResponse = `Namaste ${customerName} Ji! Hum aapke budget ko poori tarah samajhte hain. Humari pricing transparent vendor costs aur verified quality par based hoti hai. Main aapki budget preference team ke sath share kar deta hoon taaki team availability aur selected services ke according suitable configuration confirm kar sake.`;
            break;

        case AI_OBJECTION_TYPES.PRICE_COMPARISON:
            recommendedStrategy = 'Highlight Kashi-Vashi local on-ground presence, verified boatmen, licensed pandits, and zero hidden ghat commissions compared to aggregator platforms.';
            draftResponse = `Namaste ${customerName} Ji! Varanasi mein aksar online aggregators hidden ghat charges ya local vendor complications nahi batate. Kashi-Vashi ke sath aapko local Banaras team ka direct on-ground support, pre-verified boatmen aur dedicated temple assistance milta hai taaki aapka yatra anubhav bilkul nishchint rahe.`;
            break;

        case AI_OBJECTION_TYPES.TRUST:
            recommendedStrategy = 'Assure company registration, physical Varanasi local office presence, direct customer testimonials, and token-based advance security.';
            draftResponse = `Namaste ${customerName} Ji! Kashi-Vashi ek registered local travel enterprise hai jiska office Varanasi mein hi sthit hai. Hum poori transparency ke sath kaam karte hain aur keval verified vendors ke sath services operate karte hain. Advance token keval hotel aur services lock karne ke liye liya jata hai jiski official receipt aapko turant milti hai.`;
            break;

        case AI_OBJECTION_TYPES.TIMING:
            recommendedStrategy = 'Acknowledge flexible scheduling. Offer to keep requirements on record and re-connect when dates are closer without high-pressure tactics.';
            draftResponse = `Namaste ${customerName} Ji! Bilkul, yatra aaraam aur subhidha se honi chahiye. Main aapki requirements note kar leta hoon. Jab bhi aapke travel dates confirm honge, Kashi-Vashi team turant aapke liye fresh itinerary arrange karegi.`;
            break;

        case AI_OBJECTION_TYPES.AVAILABILITY:
            recommendedStrategy = 'Do not claim live availability without system confirmation. Promise team verification and swift confirmation.';
            draftResponse = `Namaste ${customerName} Ji! Humari team real-time hotel aur boat inventory verify karti hai taaki aakhri samay par koi pareshani na ho. Main aapki dates note kar leta hoon aur operations team se verify karwake jald se jald confirmed status share karta hoon.`;
            break;

        case AI_OBJECTION_TYPES.FAMILY_CONCERN:
            recommendedStrategy = 'Provide reassuring ground facts: battery car assistance to Kashi Vishwanath temple corridor, wheelchair arrangements at ghats, and accessible ground-floor rooms.';
            draftResponse = `Namaste ${customerName} Ji! Family aur senior citizens ke sath yatra ke liye hum vishesh dhyan rakhte hain. Kashi Vishwanath Temple corridor tak battery rickshaw, wheelchair assistance aur ghat par easy-access boat boarding ki suvidha hum ensure karte hain taaki buzurgon ko koi asuvidha na ho.`;
            break;

        default:
            recommendedStrategy = 'Maintain helpful, non-pressuring dialogue. Offer concise summary and assist with any remaining itinerary questions.';
            draftResponse = `Namaste ${customerName} Ji! Aap bilkul aaraam se samay lijiye. Agar trip planning ya itinerary ke bare mein koi bhi sawal ho toh hum hamesha madad ke liye uplabdh hain.`;
            break;
    }

    return {
        type,
        sentiment,
        severity,
        customerText,
        recommendedStrategy,
        draftResponse,
        requiresHumanReview: true // Strictly requires human review before sending!
    };
}

// -----------------------------------------------------------------
// 8. DRAFT CUSTOMER MESSAGE GENERATOR
// -----------------------------------------------------------------

/**
 * Generates ready-to-edit draft messages for WhatsApp, SMS, and Email.
 * Must NEVER be sent autonomously.
 */
function generateFollowUpDraft(lead = {}, action = {}, context = {}) {
    const customerName = lead.name || 'Guest';
    const destination = lead.destination || 'Varanasi';

    let actionType = AI_NEXT_ACTIONS.FOLLOW_UP;
    let channel = 'WHATSAPP';

    if (typeof action === 'string') {
        if (['WHATSAPP', 'EMAIL', 'SMS'].includes(action.toUpperCase())) {
            channel = action.toUpperCase();
        } else {
            actionType = action;
        }
    } else if (action && typeof action === 'object') {
        actionType = action.type || actionType;
        channel = action.channel || channel;
    }

    if (context && typeof context === 'object' && context.channel) {
        channel = context.channel.toUpperCase();
    } else if (typeof context === 'string') {
        channel = context.toUpperCase();
    }

    let whatsappText = '';
    let emailSubject = `Regarding your travel enquiry for ${destination} — Kashi-Vashi`;
    let emailBody = '';

    if (actionType === AI_NEXT_ACTIONS.CONFIRM_TRAVEL_DATES) {
        whatsappText = `Namaste ${customerName} Ji! 🙏\n\nKashi-Vashi se baat ho rahi hai. Aapne ${destination} yatra ke liye enquiry ki thi. Hum aapke liye customized package prepare kar rahe hain. Kripya apni aane ki tentative travel dates share kar dijiye taaki hum hotel aur darshan slots check kar sakein.\n\nDhanyawad,\nKashi-Vashi Team`;
        emailBody = `Dear ${customerName},\n\nThank you for choosing Kashi-Vashi for your upcoming journey to ${destination}.\n\nTo prepare a personalized travel package and ensure the best hotel accommodations, could you please confirm your expected travel dates?\n\nWarm regards,\nKashi-Vashi Team`;
    } else if (actionType === AI_NEXT_ACTIONS.CONFIRM_GUEST_COUNT) {
        whatsappText = `Namaste ${customerName} Ji! 🙏\n\nAapki ${destination} yatra ke liye room aur vehicle booking finalize karne ke liye, kripya total travelers (adults aur children) ki sankhya confirm kar dijiye.\n\nDhanyawad,\nKashi-Vashi Team`;
        emailBody = `Dear ${customerName},\n\nWe are currently tailoring your ${destination} itinerary. Please confirm the total number of adults and children traveling with you so we can allocate suitable accommodation and private transportation.\n\nBest regards,\nKashi-Vashi Team`;
    } else if (actionType === AI_NEXT_ACTIONS.ASK_HOTEL_PREFERENCE) {
        whatsappText = `Namaste ${customerName} Ji! 🙏\n\nKashi-Vashi mein hum standard 3-star hotels se lekar river-view heritage havelis tak arrange karte hain. Aap kis category ka hotel stay prefer karenge?\n\n1. Clean Standard 3-Star\n2. Deluxe Boutique / Heritage Haveli\n\nDhanyawad!`;
        emailBody = `Dear ${customerName},\n\nRegarding your stay in Varanasi, please let us know your preferred accommodation style (e.g. Standard 3-Star near the temple, or Deluxe Heritage Haveli by the Ghats).\n\nWarm regards,\nKashi-Vashi Team`;
    } else {
        whatsappText = `Namaste ${customerName} Ji! 🙏\n\nKashi-Vashi team ki taraf se pranam. Aapki ${destination} yatra ki planning mein hum kis tarah aage madad kar sakte hain? Agar aapke koi vishesh sawal hon toh zaroor bataiye.\n\nDhanyawad!`;
        emailBody = `Dear ${customerName},\n\nFollowing up on your travel enquiry with Kashi-Vashi. Please let us know if you have any questions regarding your itinerary or if you would like us to finalize your travel plan.\n\nBest regards,\nKashi-Vashi Team`;
    }

    const primaryMessage = channel === 'EMAIL' ? emailBody : whatsappText;

    return {
        actionType,
        channel,
        message: primaryMessage,
        draftMessage: primaryMessage,
        requiresHumanApproval: true,
        whatsappText,
        emailSubject,
        emailBody,
        smsText: whatsappText.slice(0, 150)
    };
}

// -----------------------------------------------------------------
// 9. QUOTE PREPARATION ASSISTANCE
// -----------------------------------------------------------------

/**
 * Prepares requirement-based quote inputs for human review in existing QuoteBuilderModal.
 * Zero price authority; does NOT write to financial records.
 */
function prepareQuoteInputs(lead = {}) {
    const requirements = lead.requirements || {};
    const services = Array.isArray(lead.aiServiceInterests) && lead.aiServiceInterests.length > 0
        ? lead.aiServiceInterests
        : (Array.isArray(lead.services) && lead.services.length > 0
            ? lead.services.map(s => String(s).toUpperCase())
            : (Array.isArray(requirements.serviceInterests) ? requirements.serviceInterests : ['HOTEL', 'DARSHAN', 'BOAT']));

    const suggestedLineItems = [];

    if (services.includes('HOTEL') || lead.hotelDetails || /hotel/i.test(lead.specialRequirements || '')) {
        suggestedLineItems.push({
            service: 'HOTEL',
            serviceType: 'HOTEL',
            name: requirements.accommodationPreference || lead.hotelPreference || 'Standard 3-Star Hotel',
            category: 'ACCOMMODATION',
            rate: null, // Zero price authority
            price: null,
            cost: null,
            recommendedQuantity: (Number(lead.travelers) || Number(lead.guests)) > 3 ? 2 : 1,
            notes: 'Based on customer group size; exact room rate calculated in Quote Builder'
        });
    }

    if (services.includes('DARSHAN') || lead.panditDetails || /darshan/i.test(lead.specialRequirements || '')) {
        suggestedLineItems.push({
            service: 'DARSHAN',
            serviceType: 'DARSHAN',
            name: 'Kashi Vishwanath VIP Darshan Assistance',
            category: 'TEMPLE_SERVICE',
            rate: null,
            price: null,
            cost: null,
            recommendedQuantity: Number(lead.travelers) || Number(lead.guests) || 1,
            notes: 'Includes temple corridor escort'
        });
    }

    if (services.includes('BOAT') || /boat/i.test(lead.specialRequirements || '')) {
        suggestedLineItems.push({
            service: 'BOAT',
            serviceType: 'BOAT',
            name: 'Subah-e-Banaras Sunrise Boat Ride',
            category: 'BOAT_SERVICE',
            rate: null,
            price: null,
            cost: null,
            recommendedQuantity: 1,
            notes: 'Assi to Dashashwamedh Ghat'
        });
    }

    if (services.includes('TRANSPORT') || lead.pickup || /pickup|transport/i.test(lead.specialRequirements || '')) {
        const guestCount = Number(lead.travelers) || Number(lead.guests) || requirements.totalGuests || 2;
        const vehicleType = guestCount > 6 ? 'Tempo Traveler (12-Seater)' : (guestCount > 3 ? 'Innova / Ertiga SUV' : 'AC Sedan (Dzire)');
        suggestedLineItems.push({
            service: 'TRANSPORT',
            serviceType: 'TRANSPORT',
            name: `${vehicleType} Airport / Local Sightseeing`,
            category: 'TRANSPORT',
            rate: null,
            price: null,
            cost: null,
            recommendedQuantity: 1,
            notes: 'Dedicated AC vehicle with professional driver'
        });
    }

    const missingQuoteInputs = [];
    if (!lead.date && !lead.dates && !lead.startDate && !requirements.travelStartDate) missingQuoteInputs.push('Travel Start Date');
    if (!lead.travelers && !lead.guests && !requirements.totalGuests) missingQuoteInputs.push('Exact Guest Count');

    return {
        ready: missingQuoteInputs.length === 0,
        missingInputs: missingQuoteInputs,
        suggestedServices: services,
        suggestedLineItems,
        customerPreferences: {
            budget: lead.budget || requirements.budget || 'Standard',
            accommodation: lead.hotelPreference || requirements.accommodationPreference || 'Not Specified',
            specialRequirements: lead.specialRequirements || lead.notes || ''
        },
        notes: 'AI suggested line items only. Selling prices and vendor margins must be calculated exclusively inside the existing Quote Builder.',
        requiresHumanExecution: true
    };
}

module.exports = {
    checkSalesPromptInjection,
    sanitizeLeadForRole,
    calculateLeadQualification,
    detectRequirementGaps,
    recommendSalesStage,
    evaluateFollowUp,
    determineNextBestAction,
    analyzeObjection,
    generateFollowUpDraft,
    prepareQuoteInputs
};
