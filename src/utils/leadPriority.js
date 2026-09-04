import { computeTripReadiness } from './tripReadiness.js';
import { detectIssues, isTestOrStaleLead } from './leadIssues.js';
import { computeNextBestAction as computeNextBestActionExt } from './nextBestAction.js';


export function computeLeadPriority(lead) {
    let score = 0;
    const reasons = [];
    const evidence = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Exclude completed & cancelled leads
    if (lead.status === 'Completed' || lead.status === 'Cancelled') {
        return {
            tier: 'COLD',
            score: 0,
            urgency: 'LOW',
            confidence: 'HIGH',
            reasons: [`Lead is ${lead.status.toLowerCase()}`],
            evidence: ['closed status']
        };
    }

    // Deprioritize Test or Stale Inactive records
    if (isTestOrStaleLead(lead)) {
        return {
            tier: 'COLD',
            score: 15,
            urgency: 'LOW',
            confidence: 'HIGH',
            reasons: ['Deprioritized (test / inactive stale record)'],
            evidence: ['test/stale record (deprioritized)']
        };
    }

    let urgencyLevel = 'LOW';
    let dataPoints = 0;


    // 1. Follow-up urgency (Major weight fix for Phase 2)
    if (lead.followUpDate) {
        dataPoints++;
        const followUp = new Date(lead.followUpDate);
        const followUpStr = lead.followUpDate.split('T')[0];

        if (followUpStr < todayStr) {
            const overdueDays = Math.max(1, Math.floor((now - followUp) / (1000 * 60 * 60 * 24)));
            evidence.push('follow-up overdue');
            if (overdueDays >= 3) {
                score += 40;
                reasons.push(`Follow-up is ${overdueDays} days overdue`);
                urgencyLevel = 'CRITICAL';
            } else {
                score += 32;
                reasons.push(`Follow-up is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`);
                if (urgencyLevel !== 'CRITICAL') urgencyLevel = 'HIGH';
            }
        } else if (followUpStr === todayStr) {
            score += 25;
            evidence.push('follow-up due today');
            reasons.push('Follow-up date is TODAY');
            if (urgencyLevel !== 'CRITICAL') urgencyLevel = 'HIGH';
        } else {
            const daysToFollowUp = Math.ceil((followUp - now) / (1000 * 60 * 60 * 24));
            if (daysToFollowUp <= 2) {
                score += 15;
                evidence.push('follow-up due soon');
                reasons.push(`Follow-up due in ${daysToFollowUp} days`);
                if (urgencyLevel === 'LOW') urgencyLevel = 'MEDIUM';
            }
        }
    }

    // 2. Travel-date proximity & urgency
    if (lead.date) {
        dataPoints++;
        const travelDate = new Date(lead.date);
        const daysUntil = Math.ceil((travelDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntil === 0) {
            score += 35;
            evidence.push('travel today');
            reasons.push('Travel date is TODAY');
            urgencyLevel = 'CRITICAL';
        } else if (daysUntil === 1) {
            score += 32;
            evidence.push('travel tomorrow');
            reasons.push('Travel date is TOMORROW');
            urgencyLevel = 'CRITICAL';
        } else if (daysUntil >= 2 && daysUntil <= 3) {
            score += 28;
            evidence.push(`travel in ${daysUntil} days`);
            reasons.push(`Travel in ${daysUntil} days`);
            if (urgencyLevel !== 'CRITICAL') urgencyLevel = 'HIGH';
        } else if (daysUntil >= 4 && daysUntil <= 7) {
            score += 20;
            evidence.push(`travel in ${daysUntil} days`);
            reasons.push(`Travel in ${daysUntil} days`);
            if (urgencyLevel === 'LOW') urgencyLevel = 'MEDIUM';
        } else if (daysUntil >= 8 && daysUntil <= 14) {
            score += 10;
            evidence.push(`travel in ${daysUntil} days`);
            reasons.push(`Travel in ${daysUntil} days`);
        } else if (daysUntil < 0 && daysUntil >= -7) {
            evidence.push('travel date past');
            reasons.push('Travel date recently passed');
        }
    }

    // 3. Pipeline stage urgency
    if (lead.status === 'Pending') {
        dataPoints++;
        score += 20;
        evidence.push('pending status');
        reasons.push('New enquiry awaiting first contact');
        if (urgencyLevel === 'LOW') urgencyLevel = 'HIGH';
    } else if (lead.status === 'In-Progress') {
        dataPoints++;
        score += 15;
        evidence.push('in-progress status');
        reasons.push('Active negotiation in progress');
    } else if (lead.status === 'Confirmed') {
        dataPoints++;
        score += 10;
        evidence.push('confirmed status');
        reasons.push('Confirmed trip needs preparation');
    } else if (lead.status === 'Trip Started') {
        dataPoints++;
        score += 25;
        evidence.push('trip started');
        reasons.push('Trip is currently active');
        if (urgencyLevel === 'LOW') urgencyLevel = 'HIGH';
    }

    // 4. Operational Risk / Readiness (Confirmed or Trip Started)
    if (lead.status === 'Confirmed' || lead.status === 'Trip Started') {
        const readiness = computeTripReadiness(lead);
        if (readiness && readiness.status !== 'READY') {
            score += 25;
            evidence.push('operational gaps');
            const missing = readiness.checks.filter(c => !c.done).map(c => c.label);
            reasons.push(`Unassigned: ${missing.join(', ')}`);
            if (readiness.status === 'AT RISK' || urgencyLevel === 'HIGH') {
                urgencyLevel = 'CRITICAL';
            }
        }
    }

    // 5. Detected Issues
    const issueResult = detectIssues(lead);
    if (issueResult.hasIssue) {
        score += 15;
        evidence.push('detected issue');
        issueResult.warnings.forEach(w => {
            if (!reasons.includes(w)) reasons.push(w);
        });
    }

    // 6. Staleness
    if (lead.updatedAt && (lead.status === 'Pending' || lead.status === 'In-Progress')) {
        dataPoints++;
        const daysSinceUpdate = Math.floor((now - new Date(lead.updatedAt)) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate >= 7) {
            score += 15;
            evidence.push('stale lead');
            reasons.push(`No activity for ${daysSinceUpdate} days`);
        } else if (daysSinceUpdate >= 3) {
            score += 8;
            reasons.push(`Last updated ${daysSinceUpdate} days ago`);
        }
    }

    // 7. Group size
    const travelers = parseInt(lead.travelers) || 1;
    if (travelers >= 6) {
        score += 10;
        evidence.push('large group');
        reasons.push(`Large group (${travelers} travelers)`);
    } else if (travelers >= 4) {
        score += 5;
        reasons.push(`Group of ${travelers} travelers`);
    }

    // 8. Special requirements
    if (lead.specialRequirements && lead.specialRequirements.trim().length > 3) {
        score += 5;
        evidence.push('special requirements');
        reasons.push('Special requirements require confirmation');
    }

    // Normalized 0-100 score cap
    const finalScore = Math.min(Math.max(score, 0), 100);

    // Tier thresholds: HOT (>= 60 or CRITICAL urgency), WARM (>= 35), COLD (< 35)
    let tier = 'COLD';
    if (finalScore >= 60 || urgencyLevel === 'CRITICAL') {
        tier = 'HOT';
    } else if (finalScore >= 35) {
        tier = 'WARM';
    }

    // Confidence Calculation
    let confidence = 'MEDIUM';
    if (dataPoints >= 3 && evidence.length >= 2) {
        confidence = 'HIGH';
    } else if (dataPoints <= 1 && evidence.length <= 1) {
        confidence = 'LOW';
    }

    return {
        tier,
        score: finalScore,
        urgency: urgencyLevel,
        confidence,
        reasons,
        evidence
    };
}

export function computeNextBestAction(lead) {
    return computeNextBestActionExt(lead);
}
