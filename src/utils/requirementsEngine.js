import { LEAD_STAGES, STAGE_LABELS } from '../constants/phase4Constants.js';


/**
 * Normalizes legacy MongoDB status ('Pending', 'In-Progress', 'Confirmed', 'Trip Started', 'Completed', 'Cancelled')
 * and Phase 4 lead stages ('NEW', 'CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'REQUIREMENTS_READY', 'QUOTE_READY', 'QUOTED', 'WON', 'LOST').
 */
export function getNormalizedStage(lead) {
    if (!lead) return LEAD_STAGES.NEW;

    // Explicit stage takes precedence if saved
    if (lead.stage && LEAD_STAGES[lead.stage]) {
        return lead.stage;
    }

    const status = lead.status || 'Pending';

    if (status === 'Completed' || status === 'Confirmed' || status === 'Trip Started') {
        return LEAD_STAGES.WON;
    }
    if (status === 'Cancelled') {
        return LEAD_STAGES.LOST;
    }
    if (status === 'Pending') {
        if (!lead.statusHistory || lead.statusHistory.length <= 1) {
            return LEAD_STAGES.NEW;
        }
        return LEAD_STAGES.CONTACTED;
    }
    if (status === 'In-Progress') {
        if (lead.quoteNumber || lead.quoteStatus) {
            return LEAD_STAGES.QUOTED;
        }
        const readiness = checkRequirementsReadiness(lead);
        if (readiness.isQuoteReady) {
            return LEAD_STAGES.QUOTE_READY;
        }
        if (readiness.isReady) {
            return LEAD_STAGES.REQUIREMENTS_READY;
        }
        if (lead.followUpDate) {
            return LEAD_STAGES.FOLLOW_UP;
        }
        return LEAD_STAGES.INTERESTED;
    }

    return LEAD_STAGES.NEW;
}

export function getStageLabel(stage) {
    return STAGE_LABELS[stage] || stage || 'New Lead';
}

/**
 * Checks customer requirements completeness for quote readiness.
 * Minimum conditions for QUOTE_READY:
 * 1. Customer Name
 * 2. Mobile Number
 * 3. Travel Date
 * 4. Number of Travelers
 * 5. At least 1 selected service
 */
export function checkRequirementsReadiness(lead) {
    if (!lead) {
        return {
            isReady: false,
            isQuoteReady: false,
            missingFields: ['Customer Name', 'Mobile Number', 'Travel Date', 'Travelers', 'At Least 1 Service'],
            completedCount: 0,
            totalCount: 5,
            percentage: 0
        };
    }

    const missingFields = [];
    let completedCount = 0;

    // 1. Name
    const hasName = Boolean(lead.name && lead.name.trim());
    if (hasName) completedCount++;
    else missingFields.push('Customer Name');

    // 2. Mobile
    const hasMobile = Boolean(lead.mobile && String(lead.mobile).trim());
    if (hasMobile) completedCount++;
    else missingFields.push('Mobile Number');

    // 3. Travel Date
    const hasDate = Boolean(lead.date && lead.date.trim());
    if (hasDate) completedCount++;
    else missingFields.push('Travel Date');

    // 4. Travelers
    const hasTravelers = Boolean(lead.travelers && String(lead.travelers).trim() !== '' && String(lead.travelers) !== '0');
    if (hasTravelers) completedCount++;
    else missingFields.push('Number of Travelers');

    // 5. At least 1 service selected or requirement details provided
    const reqs = lead.requirements || {};
    const selectedServicesCount = Object.values(reqs).filter(val => val === true || (typeof val === 'object' && val?.selected)).length;
    const hasServiceNotes = Boolean((lead.specialRequirements && lead.specialRequirements.trim()) || (lead.adminNotes && lead.adminNotes.trim()));
    const hasServices = selectedServicesCount > 0 || hasServiceNotes || Boolean(lead.pickup || lead.destination);

    if (hasServices) completedCount++;
    else missingFields.push('At Least 1 Service Selected');

    const totalCount = 5;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const isReady = completedCount >= 4;
    const isQuoteReady = completedCount === 5;

    return {
        isReady,
        isQuoteReady,
        missingFields,
        completedCount,
        totalCount,
        percentage
    };
}
