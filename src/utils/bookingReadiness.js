import { isTestOrStaleLead } from './leadIssues.js';

/**
 * Computes live trip preparation readiness & status for a Booking.
 *
 * @param {Object} booking Booking object containing travelDetails and preparationChecklist
 * @param {Object} lead Optional lead object to check for test/stale evidence
 * @returns {Object} Readiness breakdown & status
 */
export function computeBookingReadiness(booking, lead = null) {
    if (!booking) {
        return {
            totalRequired: 0,
            completed: 0,
            pending: 0,
            percentage: 0,
            status: 'INCOMPLETE',
            missingItems: []
        };
    }

    const checklist = booking.preparationChecklist || [];
    const requiredItems = checklist.filter(item => item.required !== false);
    const totalRequired = requiredItems.length;

    const completedItems = requiredItems.filter(item =>
        item.status === 'CONFIRMED' || item.status === 'ARRANGED'
    );
    const completed = completedItems.length;
    const pending = totalRequired - completed;
    const percentage = totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 100;

    const missingItems = requiredItems
        .filter(item => item.status !== 'CONFIRMED' && item.status !== 'ARRANGED')
        .map(item => item.label || item.serviceCategory);

    // Calculate Travel Date & Safeguards
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const travelDateStr = (booking.travelDetails?.travelDate || '').split('T')[0];

    let readinessStatus = 'INCOMPLETE';

    // Safeguard 1: Past Travel Date -> ELAPSED (Never UPCOMING or AT_RISK)
    if (travelDateStr && travelDateStr < todayStr) {
        readinessStatus = 'ELAPSED';
    }
    // 100% Completed -> READY
    else if (percentage === 100) {
        readinessStatus = 'READY';
    }
    // Near travel date (0 <= daysUntil <= 3) with critical missing items -> AT_RISK
    else if (travelDateStr && travelDateStr >= todayStr) {
        const daysUntil = Math.ceil((new Date(travelDateStr) - now) / (1000 * 60 * 60 * 24));
        const isCriticalMissing = missingItems.some(cat =>
            cat.toUpperCase().includes('HOTEL') ||
            cat.toUpperCase().includes('VEHICLE') ||
            cat.toUpperCase().includes('TRANSPORT') ||
            cat.toUpperCase().includes('DRIVER')
        );

        const isTestLead = isTestOrStaleLead(lead || booking.customerDetails);

        if (daysUntil >= 0 && daysUntil <= 3 && isCriticalMissing && !isTestLead) {
            readinessStatus = 'AT_RISK';
        } else {
            readinessStatus = 'INCOMPLETE';
        }
    }

    return {
        totalRequired,
        completed,
        pending,
        percentage,
        status: readinessStatus,
        missingItems
    };
}
