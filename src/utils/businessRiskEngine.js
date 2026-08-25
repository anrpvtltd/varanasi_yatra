/**
 * Business Risk Radar Engine for CEO Command Center.
 * Detects financial overruns, unready upcoming trips, customer payment risks, and vendor reliability issues.
 */

export function calculateBusinessRisks({ bookings = [], customerPayments: _customerPayments = [], vendorPayments: _vendorPayments = [], vendors = [] }) {
    const risks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check Unready Upcoming Trips (within 48 hrs)
    const unready48h = (bookings || []).filter((b) => {
        if (b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'COMPLETED') return false;
        const tDateStr = b.travelDetails?.travelDate;
        if (!tDateStr) return false;
        const tDate = new Date(tDateStr);
        if (isNaN(tDate.getTime())) return false;
        tDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((tDate - today) / (1000 * 60 * 60 * 24));
        const isUnready = b.tripReadiness?.status !== 'READY' && b.tripReadiness?.percentage < 100;
        return diffDays >= 0 && diffDays <= 2 && isUnready;
    });

    if (unready48h.length > 0) {
        risks.push({
            id: 'risk_unready_48h',
            severity: 'CRITICAL',
            score: 100,
            title: `${unready48h.length} Trip(s) Starting Within 48 Hours Are NOT Ready!`,
            description: `Bookings: ${unready48h.map(b => b.bookingNumber).join(', ')}. Unconfirmed services may disrupt guest experiences.`,
            affectedCount: unready48h.length,
            financialImpact: unready48h.reduce((sum, b) => sum + (b.packageDetails?.finalCustomerPrice || 0), 0),
            relatedItems: unready48h.map(b => b._id)
        });
    }

    // 2. Check High Customer Outstanding Payments
    const totalCustomerDue = (bookings || []).reduce((sum, b) => {
        if (b.bookingStatus === 'CANCELLED') return sum;
        return sum + (b.customerPaymentSummary?.customerDue || 0);
    }, 0);

    if (totalCustomerDue > 25000) {
        risks.push({
            id: 'risk_cust_due_high',
            severity: 'HIGH',
            score: 75,
            title: `High Customer Outstanding Payment: ₹${totalCustomerDue.toLocaleString('en-IN')}`,
            description: `Customer receivables across active bookings require collection follow-up.`,
            affectedCount: (bookings || []).filter(b => (b.customerPaymentSummary?.customerDue || 0) > 0).length,
            financialImpact: totalCustomerDue,
            relatedItems: []
        });
    }

    // 3. Check Vendor Cost Variance / Overruns
    let totalCostOverrun = 0;
    let overrunCount = 0;

    (bookings || []).forEach((b) => {
        const planned = b.vendorPaymentSummary?.plannedVendorCost || 0;
        const actual = b.vendorPaymentSummary?.actualVendorCost || planned;
        if (actual > planned) {
            totalCostOverrun += (actual - planned);
            overrunCount++;
        }
    });

    if (totalCostOverrun > 0) {
        risks.push({
            id: 'risk_vendor_overrun',
            severity: totalCostOverrun > 10000 ? 'HIGH' : 'MEDIUM',
            score: totalCostOverrun > 10000 ? 70 : 45,
            title: `Vendor Cost Overrun Detected: +₹${totalCostOverrun.toLocaleString('en-IN')}`,
            description: `Actual vendor costs exceed planned quote budgets across ${overrunCount} booking(s).`,
            affectedCount: overrunCount,
            financialImpact: totalCostOverrun,
            relatedItems: []
        });
    }

    // 4. Check Low-Reliability Vendors Active in Bookings
    const lowReliabilityVendors = (vendors || []).filter(v => v.performance?.reliabilityScore !== null && v.performance?.reliabilityScore < 70);
    if (lowReliabilityVendors.length > 0) {
        risks.push({
            id: 'risk_low_vendor_reliability',
            severity: 'MEDIUM',
            score: 40,
            title: `${lowReliabilityVendors.length} Low-Reliability Partner Vendor(s) Detected`,
            description: `Partners with reliability scores below 70/100: ${lowReliabilityVendors.map(v => v.businessName || v.name).join(', ')}.`,
            affectedCount: lowReliabilityVendors.length,
            financialImpact: 0,
            relatedItems: lowReliabilityVendors.map(v => v._id)
        });
    }

    // Sort by score descending (CRITICAL -> HIGH -> MEDIUM -> LOW)
    return risks.sort((a, b) => b.score - a.score);
}
