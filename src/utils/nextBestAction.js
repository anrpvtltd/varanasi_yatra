import { computeLeadPriority } from './leadPriority.js';
import { computeTripReadiness } from './tripReadiness.js';
import { getNormalizedStage, checkRequirementsReadiness } from './requirementsEngine.js';
import { LEAD_STAGES } from '../constants/phase4Constants.js';


export function computeNextBestAction(lead) {
    const priority = computeLeadPriority(lead);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let action = 'OPEN_PROFILE';
    let label = 'Open Profile';
    let reason = priority.reasons[0] || 'Requires operations review.';

    if (lead.status === 'Completed' || lead.status === 'Cancelled') {
        return {
            action: 'OPEN_PROFILE',
            label: 'Open Profile',
            reason: `Lead is ${lead.status.toLowerCase()}`,
            urgency: 'LOW',
            priorityTier: 'COLD',
            confidence: priority.confidence,
            score: priority.score,
            evidence: priority.evidence
        };
    }

    // Deprioritized test / stale leads
    if (priority.evidence.includes('test/stale record (deprioritized)')) {
        return {
            action: 'REVIEW',
            label: 'Review Lead',
            reason: 'Test / stale inactive lead. Review before action.',
            urgency: 'LOW',
            priorityTier: 'COLD',
            confidence: priority.confidence,
            score: priority.score,
            evidence: priority.evidence
        };
    }

    // 1. Confirmed / Trip Started operational actions
    if (lead.status === 'Confirmed' || lead.status === 'Trip Started') {
        const readiness = computeTripReadiness(lead);
        if (readiness) {
            if (readiness.status === 'ELAPSED') {
                action = 'REVIEW';
                label = 'Review Trip';
                reason = 'Trip travel date has passed.';
            } else {
                const missingCheck = readiness.checks.find(c => !c.done);
                if (missingCheck) {
                    if (missingCheck.field === 'driverName') {
                        action = 'ASSIGN_DRIVER';
                        label = 'Assign Driver';
                        reason = `Trip ${lead.date ? `on ${lead.date}` : 'confirmed'}. Driver assignment missing.`;
                    } else if (missingCheck.field === 'hotelDetails') {
                        action = 'CONFIRM_HOTEL';
                        label = 'Confirm Hotel';
                        reason = `Trip ${lead.date ? `on ${lead.date}` : 'confirmed'}. Hotel booking missing.`;
                    } else if (missingCheck.field === 'vehicleModel') {
                        action = 'ASSIGN_VEHICLE';
                        label = 'Assign Vehicle';
                        reason = `Trip ${lead.date ? `on ${lead.date}` : 'confirmed'}. Vehicle details missing.`;
                    } else if (missingCheck.field === 'panditDetails') {
                        action = 'ASSIGN_GUIDE';
                        label = 'Assign Guide';
                        reason = `Trip ${lead.date ? `on ${lead.date}` : 'confirmed'}. Guide/Pandit missing.`;
                    } else {
                        action = 'PREPARE_TRIP';
                        label = 'Prepare Trip';
                        reason = `Trip ${lead.date ? `on ${lead.date}` : 'confirmed'}. Preparation incomplete.`;
                    }
                } else {
                    action = 'PREPARE_TRIP';
                    label = 'Review Trip';
                    reason = `Trip ${lead.date ? `on ${lead.date}` : 'confirmed'}. All resources assigned.`;
                }
            }
        }
    }

    // 2. Overdue follow-up for active leads
    else if (lead.followUpDate && lead.followUpDate.split('T')[0] <= todayStr && (lead.status === 'In-Progress' || lead.status === 'Pending')) {
        const overdueDays = Math.max(0, Math.floor((now - new Date(lead.followUpDate)) / (1000 * 60 * 60 * 24)));
        action = 'FOLLOW_UP';
        label = 'Follow up now';
        reason = overdueDays === 0 ? 'Follow-up date is TODAY.' : `Follow-up is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue.`;
    }

    // 3. Stage-driven workflow actions for Pending & In-Progress enquiries
    else {
        const stage = getNormalizedStage(lead);
        const reqCheck = checkRequirementsReadiness(lead);

        if (stage === LEAD_STAGES.NEW) {
            action = 'CALL';
            label = 'Contact Customer';
            reason = 'New enquiry awaiting first contact.';
        } else if (stage === LEAD_STAGES.QUOTED) {
            action = 'FOLLOW_UP';
            label = 'Follow up on Quote';
            reason = lead.quoteNumber ? `Quote ${lead.quoteNumber} sent. Awaiting customer response.` : 'Quote sent to customer. Follow up on status.';
        } else if (reqCheck.isQuoteReady || stage === LEAD_STAGES.QUOTE_READY || stage === LEAD_STAGES.REQUIREMENTS_READY) {
            action = 'CREATE_QUOTE';
            label = 'Create Quote';
            reason = 'Requirements complete. Ready to generate package quote.';
        } else if (stage === LEAD_STAGES.CONTACTED || stage === LEAD_STAGES.FOLLOW_UP || stage === LEAD_STAGES.INTERESTED) {
            if (reqCheck.missingFields.length > 0) {
                action = 'COLLECT_REQUIREMENTS';
                label = 'Collect Requirements';
                reason = `Missing: ${reqCheck.missingFields.join(', ')}`;
            } else {
                action = 'CREATE_QUOTE';
                label = 'Create Quote';
                reason = 'Customer requirements collected.';
            }
        } else {
            action = 'FOLLOW_UP';
            label = 'Continue Discussion';
            reason = lead.followUpDate ? `Follow-up scheduled for ${lead.followUpDate}` : 'Active lead requiring follow-up.';
        }
    }

    return {
        action,
        label,
        reason,
        urgency: priority.urgency,
        priorityTier: priority.tier,
        confidence: priority.confidence,
        score: priority.score,
        evidence: priority.evidence
    };
}
