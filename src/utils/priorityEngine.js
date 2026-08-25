/**
 * Priority Scoring Engine for Manager Operations Center.
 * Evaluates bookings, leads, and quotes to produce deterministic, explainable priority items.
 */

export function calculateOperationalPriorities(bookings = [], leads = [], quotes = []) {
    const priorities = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Evaluate Bookings
    (bookings || []).forEach((booking) => {
        const bStatus = booking.bookingStatus || 'PENDING';
        if (bStatus === 'CANCELLED' || bStatus === 'COMPLETED') return;

        const travelDateStr = booking.travelDetails?.travelDate;
        let daysUntilTrip = null;

        if (travelDateStr) {
            const tDate = new Date(travelDateStr);
            if (!isNaN(tDate.getTime())) {
                tDate.setHours(0, 0, 0, 0);
                const diffTime = tDate - today;
                daysUntilTrip = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        const readinessStatus = booking.tripReadiness?.status || 'INCOMPLETE';
        const missingItems = booking.tripReadiness?.missingItems || [];
        const isAtRisk = readinessStatus === 'AT_RISK';
        const isPast = daysUntilTrip !== null && daysUntilTrip < 0;

        if (isPast) return; // Ignore elapsed past trips

        // CRITICAL: Trip starts within 24 hrs with missing items OR booking is AT_RISK
        if ((daysUntilTrip !== null && daysUntilTrip <= 1 && missingItems.length > 0) || isAtRisk) {
            priorities.push({
                id: `pri_b_${booking._id}_crit`,
                type: 'BOOKING_CRITICAL',
                priority: 'CRITICAL',
                score: 100,
                title: isAtRisk ? `Booking #${booking.bookingNumber} is AT RISK!` : `Trip Starts Within 24 Hours!`,
                description: `Customer: ${booking.customerDetails?.name || 'Guest'} · Missing: ${missingItems.length > 0 ? missingItems.join(', ') : 'Preparation incomplete'}`,
                customerName: booking.customerDetails?.name || 'Guest',
                relatedId: booking._id,
                bookingNumber: booking.bookingNumber,
                navigationTarget: 'BOOKING_DRAWER',
                recommendedAction: 'Confirm missing services immediately',
                dueDate: travelDateStr || 'Immediate'
            });
        }
        // HIGH: Trip starts within 3 days with incomplete prep OR customer payment overdue
        else if (daysUntilTrip !== null && daysUntilTrip <= 3 && readinessStatus !== 'READY') {
            priorities.push({
                id: `pri_b_${booking._id}_high`,
                type: 'BOOKING_HIGH',
                priority: 'HIGH',
                score: 70,
                title: `Trip Starts in ${daysUntilTrip} Day(s)`,
                description: `Customer: ${booking.customerDetails?.name || 'Guest'} · Readiness: ${booking.tripReadiness?.percentage || 0}%`,
                customerName: booking.customerDetails?.name || 'Guest',
                relatedId: booking._id,
                bookingNumber: booking.bookingNumber,
                navigationTarget: 'BOOKING_DRAWER',
                recommendedAction: 'Complete vendor assignments & checklist',
                dueDate: travelDateStr
            });
        }

        // HIGH: Customer Payment Overdue (due > 0 and travel date < 7 days away)
        const due = booking.customerPaymentSummary?.customerDue || 0;
        if (due > 0 && daysUntilTrip !== null && daysUntilTrip <= 7) {
            priorities.push({
                id: `pri_b_${booking._id}_pay`,
                type: 'PAYMENT_OVERDUE',
                priority: 'HIGH',
                score: 75,
                title: `Customer Payment Due: ₹${due.toLocaleString('en-IN')}`,
                description: `Customer: ${booking.customerDetails?.name || 'Guest'} · Trip in ${daysUntilTrip} day(s)`,
                customerName: booking.customerDetails?.name || 'Guest',
                relatedId: booking._id,
                bookingNumber: booking.bookingNumber,
                navigationTarget: 'BOOKING_PAYMENTS',
                recommendedAction: 'Follow up for advance payment',
                dueDate: travelDateStr
            });
        }
    });

    // 2. Evaluate Quotes
    (quotes || []).forEach((q) => {
        if (q.status === 'SENT' || q.status === 'PENDING') {
            priorities.push({
                id: `pri_q_${q._id}`,
                type: 'QUOTE_PENDING',
                priority: 'MEDIUM',
                score: 40,
                title: `Quote #${q.quoteNumber || 'VY-Q-000'} Awaiting Response`,
                description: `Customer: ${q.customerDetails?.name || 'Guest'} · Amount: ₹${(q.pricing?.finalCustomerPrice || 0).toLocaleString('en-IN')}`,
                customerName: q.customerDetails?.name || 'Guest',
                relatedId: q.leadId || q._id,
                navigationTarget: 'QUOTE_BUILDER',
                recommendedAction: 'Follow up with customer on quote options',
                dueDate: 'Today'
            });
        }
    });

    // 3. Evaluate Leads
    (leads || []).forEach((lead) => {
        if (lead.status === 'LOST' || lead.status === 'BOOKED') return;

        const nextFollowUp = lead.nextFollowUpDate;
        let isOverdue = false;
        let isToday = false;

        if (nextFollowUp) {
            const fDate = new Date(nextFollowUp);
            if (!isNaN(fDate.getTime())) {
                fDate.setHours(0, 0, 0, 0);
                if (fDate < today) isOverdue = true;
                else if (fDate.getTime() === today.getTime()) isToday = true;
            }
        }

        if (isOverdue) {
            priorities.push({
                id: `pri_l_${lead._id}_over`,
                type: 'LEAD_OVERDUE',
                priority: 'HIGH',
                score: 70,
                title: `Overdue Lead Follow-Up: ${lead.name}`,
                description: `Phone: ${lead.phone} · Stage: ${lead.stage || 'Enquiry'}`,
                customerName: lead.name,
                relatedId: lead._id,
                navigationTarget: 'LEAD_DRAWER',
                recommendedAction: 'Call customer immediately',
                dueDate: nextFollowUp
            });
        } else if (isToday) {
            priorities.push({
                id: `pri_l_${lead._id}_today`,
                type: 'LEAD_TODAY',
                priority: 'MEDIUM',
                score: 40,
                title: `Lead Follow-Up Scheduled Today: ${lead.name}`,
                description: `Phone: ${lead.phone} · Source: ${lead.leadSource || 'Website'}`,
                customerName: lead.name,
                relatedId: lead._id,
                navigationTarget: 'LEAD_DRAWER',
                recommendedAction: 'Perform scheduled follow-up',
                dueDate: 'Today'
            });
        }
    });

    // Sort by score descending
    return priorities.sort((a, b) => b.score - a.score);
}
