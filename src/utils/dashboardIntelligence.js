import { calculateOperationalPriorities } from './priorityEngine.js';
import { calculateBusinessRisks } from './businessRiskEngine.js';
import { calculateVendorPerformance } from './vendorPerformanceCalculator.js';

/**
 * MANAGER OPERATIONS CENTER INTELLIGENCE
 * Strictly operational focus: Priorities, Upcoming Trips, Payment Queues, Quote Queues, Lead Queues.
 * EXCLUDES all vendor costs, company margins, and actual profit metrics.
 */
export function calculateManagerDashboard(bookings = [], leads = [], quotes = []) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Calculate Operational Priorities
    const priorities = calculateOperationalPriorities(bookings, leads, quotes);

    // 2. Filter Upcoming Trips (7–30 Days, Excludes ELAPSED past trips)
    const upcomingTrips = (bookings || []).filter((b) => {
        if (b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'COMPLETED') return false;
        const tDateStr = b.travelDetails?.travelDate;
        if (!tDateStr) return false;
        const tDate = new Date(tDateStr);
        if (isNaN(tDate.getTime())) return false;
        tDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((tDate - today) / (1000 * 60 * 60 * 24));
        const readinessStatus = b.tripReadiness?.status || 'INCOMPLETE';

        // Exclude past trips (ELAPSED)
        if (diffDays < 0 || readinessStatus === 'ELAPSED') return false;
        return diffDays <= 30;
    }).sort((a, b) => {
        const aAtRisk = a.tripReadiness?.status === 'AT_RISK' ? 1 : 0;
        const bAtRisk = b.tripReadiness?.status === 'AT_RISK' ? 1 : 0;
        if (aAtRisk !== bAtRisk) return bAtRisk - aAtRisk;
        const aDate = new Date(a.travelDetails?.travelDate || '9999-12-31').getTime();
        const bDate = new Date(b.travelDetails?.travelDate || '9999-12-31').getTime();
        return aDate - bDate;
    });

    // 3. Payment Follow-Up Queue (customerDue > 0)
    const paymentFollowups = (bookings || []).filter((b) => {
        if (b.bookingStatus === 'CANCELLED') return false;
        const due = b.customerPaymentSummary?.customerDue || 0;
        return due > 0;
    }).map((b) => ({
        bookingId: b._id,
        bookingNumber: b.bookingNumber,
        customerName: b.customerDetails?.name || 'Guest',
        phone: b.customerDetails?.phone || '',
        packagePrice: b.customerPaymentSummary?.packagePrice || b.packageDetails?.finalCustomerPrice || 0,
        totalPaid: b.customerPaymentSummary?.totalPaid || 0,
        customerDue: b.customerPaymentSummary?.customerDue || 0,
        paymentStatus: b.customerPaymentSummary?.paymentStatus || 'UNPAID',
        travelDate: b.travelDetails?.travelDate || ''
    }));

    // 4. Quote Follow-Up Queue (status === SENT or PENDING, oldest first)
    const quoteFollowups = (quotes || [])
        .filter(q => q.status === 'SENT' || q.status === 'PENDING')
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
        .map(q => ({
            quoteId: q._id,
            quoteNumber: q.quoteNumber || 'VY-Q-000',
            leadId: q.leadId,
            customerName: q.customerDetails?.name || 'Guest',
            version: q.version || 1,
            finalPrice: q.pricing?.finalCustomerPrice || 0,
            status: q.status,
            createdAt: q.createdAt
        }));

    // 5. Lead Follow-Up Queue
    const leadFollowups = (leads || []).filter((lead) => {
        if (lead.status === 'LOST' || lead.status === 'BOOKED') return false;
        const fDate = lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate) : null;
        if (!fDate || isNaN(fDate.getTime())) return true;
        fDate.setHours(0, 0, 0, 0);
        return fDate <= today;
    });

    return {
        priorities,
        upcomingTrips,
        paymentFollowups,
        quoteFollowups,
        leadFollowups
    };
}

/**
 * CEO COMMAND CENTER INTELLIGENCE
 * Full executive view: Revenue, Profit, Cash Position, Risk Radar, Funnel, Expenses, Vendor Performance.
 */
export function calculateCEODashboard({
    bookings = [],
    customerPayments = [],
    vendorPayments = [],
    expenses = [],
    quotes = [],
    leads = [],
    vendors = []
}) {
    // 1. Calculate Cash Position & Revenue Metrics
    const customerCashCollected = (customerPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const vendorPaymentsMade = (vendorPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const businessExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const customerOutstanding = (bookings || []).reduce((sum, b) => {
        if (b.bookingStatus === 'CANCELLED') return sum;
        return sum + (b.customerPaymentSummary?.customerDue || 0);
    }, 0);

    const vendorOutstanding = (bookings || []).reduce((sum, b) => {
        if (b.bookingStatus === 'CANCELLED') return sum;
        return sum + (b.vendorPaymentSummary?.vendorDue || 0);
    }, 0);

    const totalRevenue = (bookings || []).reduce((sum, b) => {
        if (b.bookingStatus === 'CANCELLED') return sum;
        return sum + (b.packageDetails?.finalCustomerPrice || 0);
    }, 0);

    const commissionIncome = (bookings || []).reduce((sum, b) => {
        return sum + (b.shoppingCommission?.expectedCommission || 0);
    }, 0);

    const netCashPosition = customerCashCollected + commissionIncome - vendorPaymentsMade - businessExpenses;
    const actualProfit = customerCashCollected - vendorPaymentsMade - businessExpenses + commissionIncome;

    const plannedVendorCost = (bookings || []).reduce((sum, b) => sum + (b.vendorPaymentSummary?.plannedVendorCost || 0), 0);
    const expectedProfit = totalRevenue - plannedVendorCost;
    const profitVariance = actualProfit - expectedProfit;

    let profitStatus = 'ON_TRACK';
    if (actualProfit < 0) profitStatus = 'LOSS';
    else if (profitVariance < 0) profitStatus = 'BELOW_EXPECTATION';
    else if (profitVariance > 0) profitStatus = 'ABOVE_EXPECTATION';

    // 2. Business Funnel & Conversions (Division-by-zero protection)
    const newLeads = (leads || []).length;
    const qualifiedLeads = (leads || []).filter(l => l.stage && l.stage !== 'NEW_ENQUIRY').length;
    const quotesSent = (quotes || []).length;
    const quotesAccepted = (quotes || []).filter(q => q.status === 'ACCEPTED').length;
    const bookingsConfirmed = (bookings || []).filter(b => b.bookingStatus !== 'CANCELLED').length;
    const tripsCompleted = (bookings || []).filter(b => b.bookingStatus === 'COMPLETED').length;

    const leadToQuotePct = newLeads > 0 ? Math.round((quotesSent / newLeads) * 100) : 0;
    const quoteToBookingPct = quotesSent > 0 ? Math.round((bookingsConfirmed / quotesSent) * 100) : 0;
    const bookingToCompletedPct = bookingsConfirmed > 0 ? Math.round((tripsCompleted / bookingsConfirmed) * 100) : 0;

    // 3. Operational Risk Radar
    const operationalRiskRadar = calculateBusinessRisks({ bookings, customerPayments, vendorPayments, vendors });

    // 4. Vendor Performance Overview
    const vendorPerformances = (vendors || []).map(v => {
        const perf = calculateVendorPerformance(v.performance);
        return {
            vendorId: v._id,
            name: v.businessName || v.name,
            category: v.category,
            reliabilityScore: perf.reliabilityScore,
            label: perf.reliabilityLabel,
            isNewVendor: perf.isNewVendor
        };
    });

    const topVendors = vendorPerformances.filter(v => v.reliabilityScore !== null && v.reliabilityScore >= 80);
    const lowReliabilityVendors = vendorPerformances.filter(v => v.reliabilityScore !== null && v.reliabilityScore < 70);
    const newVendors = vendorPerformances.filter(v => v.isNewVendor);

    // 5. Aggregated Expense Breakdown
    const expenseBreakdown = {
        MARKETING: 0,
        OFFICE: 0,
        TRAVEL: 0,
        STAFF: 0,
        COMMISSION: 0,
        REFUND: 0,
        OTHER: 0
    };

    (expenses || []).forEach((e) => {
        const cat = (e.expenseCategory || 'OTHER').toUpperCase();
        if (expenseBreakdown[cat] !== undefined) {
            expenseBreakdown[cat] += (Number(e.amount) || 0);
        } else {
            expenseBreakdown.OTHER += (Number(e.amount) || 0);
        }
    });

    return {
        financialCommandStrip: {
            totalRevenue,
            customerCashCollected,
            customerOutstanding,
            vendorPaymentsMade,
            vendorOutstanding,
            businessExpenses,
            commissionIncome,
            netCashPosition,
            actualProfit
        },
        profitPerformance: {
            expectedProfit,
            actualProfit,
            profitVariance,
            status: profitStatus
        },
        businessFunnel: {
            newLeads,
            qualifiedLeads,
            quotesSent,
            quotesAccepted,
            bookingsConfirmed,
            tripsCompleted,
            leadToQuotePct,
            quoteToBookingPct,
            bookingToCompletedPct
        },
        operationalRiskRadar,
        performanceOverview: {
            bookingPerformance: {
                totalBookings: (bookings || []).length,
                upcomingTrips: (bookings || []).filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PREPARING' || b.bookingStatus === 'IN_PROGRESS').length,
                tripsCompleted,
                cancelledTrips: (bookings || []).filter(b => b.bookingStatus === 'CANCELLED').length
            },
            customerPaymentHealth: {
                totalCustomerDue: customerOutstanding,
                totalCollected: customerCashCollected,
                overdueAmount: customerOutstanding
            },
            vendorPerformance: {
                topVendors,
                lowReliabilityVendors,
                newVendors
            },
            expenseBreakdown
        }
    };
}
