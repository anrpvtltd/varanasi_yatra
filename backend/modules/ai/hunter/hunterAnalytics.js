/**
 * AI Customer Hunter Analytics Calculator
 * Varanasi Yatra Platform — Prompt 8
 * 
 * Aggregates real operational metrics across the discovery-to-booking funnel:
 * Signals -> Relevant -> Opportunities -> Approved -> Converted Leads -> Bookings
 */

const {
    HUNTER_MODES,
    HUNTER_SERVICES,
    HUNTER_CANONICAL_AREAS
} = require('./hunterConstants');

async function getHunterAnalytics(models) {
    const { HunterSignal, AIOpportunity, Enquiry, Booking } = models;

    // 1. Funnel Totals
    const totalSignals = HunterSignal ? await HunterSignal.countDocuments() : 0;
    const relevantSignals = HunterSignal ? await HunterSignal.countDocuments({ 
        status: { $in: ['PROCESSED', 'QUALIFIED'] } 
    }) : 0;
    const qualifiedSignals = HunterSignal ? await HunterSignal.countDocuments({ 
        status: 'QUALIFIED' 
    }) : 0;

    const totalOpportunities = AIOpportunity ? await AIOpportunity.countDocuments() : 0;
    const highIntentOpportunities = AIOpportunity ? await AIOpportunity.countDocuments({ 
        intentLevel: 'HIGH' 
    }) : 0;
    const reviewedOpportunities = AIOpportunity ? await AIOpportunity.countDocuments({ 
        reviewedAt: { $ne: null } 
    }) : 0;
    const approvedOpportunities = AIOpportunity ? await AIOpportunity.countDocuments({ 
        status: { $in: ['APPROVED', 'CONVERTED'] } 
    }) : 0;

    // 2. Converted CRM Leads & Bookings
    const hunterLeads = Enquiry ? await Enquiry.countDocuments({ aiHunter: true }) : 0;
    const localLeads = Enquiry ? await Enquiry.countDocuments({ aiHunter: true, source: 'AI_LOCAL' }) : 0;
    const outsideLeads = Enquiry ? await Enquiry.countDocuments({ aiHunter: true, source: 'AI_OUTSIDE' }) : 0;

    // Attributed Bookings
    const hunterBookings = Booking ? await Booking.countDocuments({
        $or: [
            { source: 'AI_LOCAL' },
            { source: 'AI_OUTSIDE' },
            { 'attribution.source': 'AI_LOCAL' },
            { 'attribution.source': 'AI_OUTSIDE' }
        ]
    }) : 0;

    // 3. Local vs Outside Breakdown
    const localSignals = HunterSignal ? await HunterSignal.countDocuments({ 
        detectedLocation: 'Varanasi',
        $or: [{ detectedTravelWindow: 'today' }, { detectedTravelWindow: 'tomorrow' }]
    }) : 0;
    const outsideSignals = Math.max(0, totalSignals - localSignals);

    const localOpps = AIOpportunity ? await AIOpportunity.countDocuments({ hunterMode: HUNTER_MODES.AI_LOCAL }) : 0;
    const outsideOpps = AIOpportunity ? await AIOpportunity.countDocuments({ hunterMode: HUNTER_MODES.AI_OUTSIDE }) : 0;

    const localApproved = AIOpportunity ? await AIOpportunity.countDocuments({ 
        hunterMode: HUNTER_MODES.AI_LOCAL, 
        status: { $in: ['APPROVED', 'CONVERTED'] } 
    }) : 0;
    const outsideApproved = AIOpportunity ? await AIOpportunity.countDocuments({ 
        hunterMode: HUNTER_MODES.AI_OUTSIDE, 
        status: { $in: ['APPROVED', 'CONVERTED'] } 
    }) : 0;

    // 4. Service Demand Breakdown
    const serviceDemand = {};
    for (const srv of Object.values(HUNTER_SERVICES)) {
        const oppCount = AIOpportunity ? await AIOpportunity.countDocuments({ serviceInterest: srv }) : 0;
        const appCount = AIOpportunity ? await AIOpportunity.countDocuments({ 
            serviceInterest: srv, 
            status: { $in: ['APPROVED', 'CONVERTED'] } 
        }) : 0;
        serviceDemand[srv] = {
            opportunities: oppCount,
            approved: appCount
        };
    }

    // 5. Area Demand Breakdown
    const areaDemand = {};
    for (const area of HUNTER_CANONICAL_AREAS) {
        const count = AIOpportunity ? await AIOpportunity.countDocuments({ area }) : 0;
        if (count > 0) areaDemand[area] = count;
    }
    const unknownAreaCount = AIOpportunity ? await AIOpportunity.countDocuments({ 
        hunterMode: HUNTER_MODES.AI_LOCAL, 
        area: null 
    }) : 0;
    if (unknownAreaCount > 0) areaDemand['UNKNOWN'] = unknownAreaCount;

    const funnel = {
        signals: totalSignals,
        relevant: relevantSignals,
        qualified: qualifiedSignals,
        opportunities: totalOpportunities,
        highIntent: highIntentOpportunities,
        reviewed: reviewedOpportunities,
        approved: approvedOpportunities,
        convertedLeads: hunterLeads,
        bookings: hunterBookings
    };

    const modes = {
        local: {
            signals: localSignals,
            opportunities: localOpps,
            approved: localApproved,
            leads: localLeads,
            bookings: 0
        },
        outside: {
            signals: outsideSignals,
            opportunities: outsideOpps,
            approved: outsideApproved,
            leads: outsideLeads,
            bookings: 0
        }
    };

    // 6. First-Party vs External Discovery Breakdown (Prompt 9.5 Section 12)
    const externalTypes = ['PUBLIC_SEARCH', 'SEARCH_API', 'PUBLIC_FEED', 'PUBLIC_DATA_API', 'OTHER_AUTHORIZED_API'];
    const firstPartyTypes = ['FIRST_PARTY', 'FIRST_PARTY_SIGNAL', 'CONSENTED_INBOUND'];
    const partnerTypes = ['PARTNER_FEED', 'PARTNER_REFERRAL'];

    const externalSignals = HunterSignal ? await HunterSignal.countDocuments({ sourceType: { $in: externalTypes } }) : 0;
    const firstPartySignals = HunterSignal ? await HunterSignal.countDocuments({ sourceType: { $in: firstPartyTypes } }) : 0;
    const partnerSignals = HunterSignal ? await HunterSignal.countDocuments({ sourceType: { $in: partnerTypes } }) : 0;
    const mockSignals = HunterSignal ? await HunterSignal.countDocuments({ sourceType: 'MOCK' }) : 0;

    const externalOpps = AIOpportunity ? await AIOpportunity.countDocuments({ sourceType: { $in: externalTypes } }) : 0;
    const firstPartyOpps = AIOpportunity ? await AIOpportunity.countDocuments({ sourceType: { $in: firstPartyTypes } }) : 0;
    const partnerOpps = AIOpportunity ? await AIOpportunity.countDocuments({ sourceType: { $in: partnerTypes } }) : 0;
    const mockOpps = AIOpportunity ? await AIOpportunity.countDocuments({ sourceType: 'MOCK' }) : 0;

    const externalLeads = Enquiry ? await Enquiry.countDocuments({
        aiHunter: true,
        discoverySource: { $in: ['SRC_SEARCH_API', 'SRC_PUBLIC_FEED', 'SEARCH_API', 'PUBLIC_FEED', 'PUBLIC_DATA_API'] }
    }) : 0;
    const firstPartyLeads = Enquiry ? await Enquiry.countDocuments({
        aiHunter: true,
        discoverySource: { $in: ['SRC_FIRST_PARTY', 'FIRST_PARTY_SIGNAL', 'WEBSITE_FORM', 'DIRECT_INQUIRY'] }
    }) : 0;
    const partnerLeads = Enquiry ? await Enquiry.countDocuments({
        aiHunter: true,
        discoverySource: { $in: ['SRC_PARTNER_NETWORK', 'PARTNER_FEED', 'PARTNER'] }
    }) : 0;
    const mockLeads = Enquiry ? await Enquiry.countDocuments({
        aiHunter: true,
        discoverySource: { $in: ['SRC_MOCK_DEV', 'MOCK_SOURCE'] }
    }) : 0;

    const sourceBreakdown = {
        EXTERNAL_DISCOVERY: {
            signals: externalSignals,
            opportunities: externalOpps,
            convertedLeads: externalLeads,
            label: 'External Search & Public Feeds'
        },
        FIRST_PARTY_DISCOVERY: {
            signals: firstPartySignals,
            opportunities: firstPartyOpps,
            convertedLeads: firstPartyLeads,
            label: 'Website & First-Party Inbound'
        },
        PARTNER_DISCOVERY: {
            signals: partnerSignals,
            opportunities: partnerOpps,
            convertedLeads: partnerLeads,
            label: 'B2B Partner Referrals'
        },
        MOCK: {
            signals: mockSignals,
            opportunities: mockOpps,
            convertedLeads: mockLeads,
            label: 'Test Fixtures & Sandbox'
        }
    };

    return {
        overview: {
            signalsProcessed: totalSignals,
            relevantSignals,
            qualifiedSignals,
            opportunities: totalOpportunities,
            highIntent: highIntentOpportunities,
            reviewed: reviewedOpportunities,
            approved: approvedOpportunities,
            convertedLeads: hunterLeads,
            bookings: hunterBookings
        },
        funnel,
        modes,
        modeComparison: modes,
        services: serviceDemand,
        serviceDemand,
        areas: areaDemand,
        areaDemand,
        sourceBreakdown
    };
}

/**
 * Prompt 9.9: Extended 9-stage discovery-to-booking funnel.
 * signals → relevant → qualified → actionable → contactable → contacted → human_verified → crm_lead → booking
 */
async function getExtendedFunnelAnalytics(models) {
    const { HunterSignal, AIOpportunity, Enquiry, Booking } = models;

    const totalSignals     = HunterSignal ? await HunterSignal.countDocuments() : 0;
    const relevantSignals  = HunterSignal ? await HunterSignal.countDocuments({ status: { $in: ['PROCESSED', 'QUALIFIED'] } }) : 0;
    const qualifiedSignals = HunterSignal ? await HunterSignal.countDocuments({ status: 'QUALIFIED' }) : 0;

    // Actionable = qualificationScore >= 60 OR actionabilityScore >= 60
    const actionableOpps   = AIOpportunity ? await AIOpportunity.countDocuments({
        $or: [{ qualificationScore: { $gte: 60 } }, { actionabilityScore: { $gte: 60 } }]
    }) : 0;

    // Contactable = contactability.routeCount > 0
    const contactableOpps  = AIOpportunity ? await AIOpportunity.countDocuments({
        'contactability.routeCount': { $gt: 0 }
    }) : 0;

    // Contacted = humanContactOutcome is set
    const contactedOpps    = AIOpportunity ? await AIOpportunity.countDocuments({
        humanContactOutcome: { $ne: null, $exists: true }
    }) : 0;

    // Human verified = GENUINE outcome or APPROVED status
    const humanVerifiedOpps = AIOpportunity ? await AIOpportunity.countDocuments({
        $or: [
            { humanContactOutcome: 'GENUINE' },
            { status: { $in: ['APPROVED', 'CONVERTED'] } }
        ]
    }) : 0;

    const crmLeads  = Enquiry ? await Enquiry.countDocuments({ aiHunter: true }) : 0;
    const bookings  = Booking ? await Booking.countDocuments({
        $or: [
            { source: 'AI_LOCAL' }, { source: 'AI_OUTSIDE' },
            { 'attribution.source': 'AI_LOCAL' }, { 'attribution.source': 'AI_OUTSIDE' }
        ]
    }) : 0;

    // Outcome breakdown
    const outcomeBreakdown = {};
    const outcomes = ['GENUINE', 'NOT_GENUINE', 'FOLLOW_UP_REQUIRED', 'NO_RESPONSE', 'WRONG_CONTACT', 'ALREADY_BOOKED', 'NOT_INTERESTED'];
    for (const o of outcomes) {
        outcomeBreakdown[o] = AIOpportunity ? await AIOpportunity.countDocuments({ humanContactOutcome: o }) : 0;
    }

    // Actionability tier breakdown
    const tierBreakdown = {};
    for (const tier of ['HIGH_PRIORITY', 'ACTIONABLE', 'WEAK', 'LOW']) {
        tierBreakdown[tier] = AIOpportunity ? await AIOpportunity.countDocuments({ actionabilityTier: tier }) : 0;
    }

    const totalOpps = AIOpportunity ? await AIOpportunity.countDocuments() : 0;
    const humanReviewedOppsCount = AIOpportunity ? await AIOpportunity.countDocuments({
        $or: [{ reviewedAt: { $ne: null } }, { humanContactOutcome: { $ne: null, $exists: true } }]
    }) : 0;
    const crmConvertedOpps = AIOpportunity ? await AIOpportunity.countDocuments({ status: 'CONVERTED' }) : 0;

    return {
        funnel: {
            signals:            { count: totalSignals,          label: 'All Signals Captured' },
            relevant:           { count: relevantSignals,       label: 'Relevant Signals (Varanasi travel)' },
            qualified:          { count: qualifiedSignals,      label: 'Qualified Signals (intent ≥ medium)' },
            totalOpportunities: { count: totalOpps,             label: 'Total Opportunities Created' },
            actionable:         { count: actionableOpps,        label: 'Actionable Opportunities (score ≥ 60)' },
            contactable:        { count: contactableOpps,       label: 'Contactable (routes discovered)' },
            contacted:          { count: contactedOpps,         label: 'Human Contact Attempted' },
            humanReviewed:      { count: humanReviewedOppsCount,label: 'Human Reviewed' },
            humanVerified:      { count: humanVerifiedOpps,     label: 'Verified Genuine by Human' },
            genuine:            { count: outcomeBreakdown['GENUINE'] || 0, label: 'Genuine Prospects' },
            notGenuine:         { count: outcomeBreakdown['NOT_GENUINE'] || 0, label: 'Not Genuine / False Positives' },
            noResponse:         { count: outcomeBreakdown['NO_RESPONSE'] || 0, label: 'No Response' },
            alreadyBooked:      { count: outcomeBreakdown['ALREADY_BOOKED'] || 0, label: 'Already Booked' },
            notInterested:      { count: outcomeBreakdown['NOT_INTERESTED'] || 0, label: 'Not Interested' },
            crmLead:            { count: crmLeads,              label: 'CRM Leads Created' },
            crmConverted:       { count: crmConvertedOpps,      label: 'CRM Converted Opportunities' },
            quoteCreated:       { count: 0,                     label: 'Quotes Created' },
            booking:            { count: bookings,              label: 'Attributed Bookings' },
            bookingCreated:     { count: bookings,              label: 'Bookings Created' }
        },
        outcomeBreakdown,
        actionabilityTierBreakdown: tierBreakdown,
        conversionRates: {
            signalToQualified:     totalSignals       ? +(qualifiedSignals / totalSignals * 100).toFixed(1) : 0,
            qualifiedToActionable: qualifiedSignals   ? +(actionableOpps / qualifiedSignals * 100).toFixed(1) : 0,
            actionableToContact:   actionableOpps    ? +(contactedOpps / actionableOpps * 100).toFixed(1) : 0,
            contactToVerified:     contactedOpps     ? +(humanVerifiedOpps / contactedOpps * 100).toFixed(1) : 0,
            verifiedToCRM:         humanVerifiedOpps ? +(crmLeads / humanVerifiedOpps * 100).toFixed(1) : 0,
            crmToBooking:          crmLeads          ? +(bookings / crmLeads * 100).toFixed(1) : 0
        }
    };
}

/**
 * Prompt 9.9 & 9.10: Per-source quality analytics (CEO only).
 * source, signals, relevantRate, qualifiedRate, actionableRate, contactableRate,
 * genuineRate, crmConversionRate, bookingRate, falsePositiveRate.
 */
async function getSourceQualityAnalytics(models) {
    const { HunterSignal, AIOpportunity, HunterSource, Booking } = models;

    const sourceTypes = [
        'MOCK', 'PUBLIC_SEARCH', 'SEARCH_API', 'PUBLIC_FEED',
        'PUBLIC_DATA_API', 'FIRST_PARTY', 'FIRST_PARTY_SIGNAL',
        'CONSENTED_INBOUND', 'PARTNER_FEED', 'PARTNER_REFERRAL',
        'OTHER_AUTHORIZED_API'
    ];

    const rows = [];
    for (const st of sourceTypes) {
        const signals    = HunterSignal ? await HunterSignal.countDocuments({ sourceType: st }) : 0;
        if (signals === 0) continue;

        const relevant   = HunterSignal ? await HunterSignal.countDocuments({
            sourceType: st,
            status: { $in: ['PROCESSED', 'QUALIFIED'] }
        }) : 0;
        const qualified  = HunterSignal ? await HunterSignal.countDocuments({ sourceType: st, status: 'QUALIFIED' }) : 0;
        const actionable = AIOpportunity ? await AIOpportunity.countDocuments({
            sourceType: st,
            $or: [{ qualificationScore: { $gte: 60 } }, { actionabilityScore: { $gte: 60 } }]
        }) : 0;
        const contactable = AIOpportunity ? await AIOpportunity.countDocuments({
            sourceType: st, 'contactability.routeCount': { $gt: 0 }
        }) : 0;
        const genuine    = AIOpportunity ? await AIOpportunity.countDocuments({
            sourceType: st,
            $or: [{ humanContactOutcome: 'GENUINE' }, { verificationStatus: 'HUMAN_VERIFIED' }]
        }) : 0;
        const notGenuine = AIOpportunity ? await AIOpportunity.countDocuments({
            sourceType: st,
            $or: [{ humanContactOutcome: 'NOT_GENUINE' }, { verificationStatus: 'REJECTED' }]
        }) : 0;
        const converted  = AIOpportunity ? await AIOpportunity.countDocuments({
            sourceType: st, status: 'CONVERTED'
        }) : 0;
        const bookings   = Booking ? await Booking.countDocuments({
            $or: [{ source: st }, { 'attribution.source': st }]
        }) : 0;

        const relevantRate      = signals    ? +(relevant / signals * 100).toFixed(1) : 0;
        const qualifiedRate     = signals    ? +(qualified / signals * 100).toFixed(1) : 0;
        const actionableRate    = qualified  ? +(actionable / qualified * 100).toFixed(1) : 0;
        const contactableRate   = actionable ? +(contactable / actionable * 100).toFixed(1) : 0;
        const genuineRate       = actionable ? +(genuine / actionable * 100).toFixed(1) : 0;
        const crmConversionRate = actionable ? +(converted / actionable * 100).toFixed(1) : 0;
        const bookingRate       = converted  ? +(bookings / converted * 100).toFixed(1) : 0;
        const reviewedCount     = genuine + notGenuine;
        const falsePositiveRate = reviewedCount ? +(notGenuine / reviewedCount * 100).toFixed(1) : 0;

        rows.push({
            source: st,
            sourceType: st,
            signals,
            relevant,
            qualified,
            actionable,
            contactable,
            genuine,
            notGenuine,
            converted,
            crmConverted: converted,
            bookings,
            // Prompt 9.10 Phase 8 Rates
            relevantRate,
            qualifiedRate,
            actionableRate,
            contactableRate,
            genuineRate,
            crmConversionRate,
            bookingRate,
            falsePositiveRate,
            // Backward-compatibility keys for Prompt 9.9 tests
            qualifyRate: qualifiedRate,
            convertRate: crmConversionRate
        });
    }

    // Also fetch named sources from HunterSource for labels
    const namedSources = HunterSource ? await HunterSource.find({}, 'sourceId name sourceName signalsCount opportunitiesCount').lean() : [];

    return { bySourceType: rows, namedSources };
}

module.exports = {
    getHunterAnalytics,
    getExtendedFunnelAnalytics,
    getSourceQualityAnalytics
};
