/**
 * Financial Calculation Engine for Customer Payments, Vendor Payments, Business Expenses & Real Profit.
 */

export function calculateCustomerPaymentSummary(packagePrice = 0, payments = []) {
    const price = Number(packagePrice) || 0;
    const totalPaid = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const customerDue = price - totalPaid;

    let paymentStatus = 'UNPAID';
    if (totalPaid === 0) {
        paymentStatus = 'UNPAID';
    } else if (totalPaid > 0 && totalPaid < price) {
        paymentStatus = 'PARTIAL';
    } else if (totalPaid === price) {
        paymentStatus = 'PAID';
    } else if (totalPaid > price) {
        paymentStatus = 'OVERPAID';
    }

    return {
        packagePrice: price,
        totalPaid,
        customerDue: Math.max(0, customerDue),
        overpaidAmount: customerDue < 0 ? Math.abs(customerDue) : 0,
        paymentStatus
    };
}

export function calculateVendorPaymentSummary(vendorAssignments = [], vendorPayments = []) {
    const plannedVendorCost = (vendorAssignments || []).reduce((sum, v) => sum + (Number(v.plannedCost) || 0), 0);
    const actualVendorCost = (vendorAssignments || []).reduce((sum, v) => sum + (Number(v.actualCost) || Number(v.plannedCost) || 0), 0);
    const totalPaidToVendors = (vendorPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const vendorDue = actualVendorCost - totalPaidToVendors;

    let paymentStatus = 'NOT_PAID';
    if (totalPaidToVendors === 0) {
        paymentStatus = 'NOT_PAID';
    } else if (totalPaidToVendors > 0 && totalPaidToVendors < actualVendorCost) {
        paymentStatus = 'PARTIALLY_PAID';
    } else if (totalPaidToVendors === actualVendorCost) {
        paymentStatus = 'PAID';
    } else if (totalPaidToVendors > actualVendorCost) {
        paymentStatus = 'OVERPAID';
    }

    return {
        plannedVendorCost,
        actualVendorCost,
        totalPaidToVendors,
        vendorDue: Math.max(0, vendorDue),
        overpaidAmount: vendorDue < 0 ? Math.abs(vendorDue) : 0,
        paymentStatus
    };
}

export function calculateBookingProfit(packagePrice = 0, plannedVendorCost = 0, customerPayments = [], vendorPayments = [], businessExpenses = [], commissionIncome = 0, actualVendorCostOverride = 0) {
    const price = Number(packagePrice) || 0;
    const plannedCost = Number(plannedVendorCost) || 0;
    const commission = Number(commissionIncome) || 0;

    const expectedProfit = price - plannedCost + commission;

    const actualRevenue = (customerPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const actualVendorPayments = (vendorPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Accounting Rule: Vendor payment is cash outflow ONLY.
    // Realized vendor cost must come from a trustworthy actual/incurred cost field or planned cost snapshot, NEVER vendor payment outflow.
    const actualVendorExpense = Number(actualVendorCostOverride) > 0 
        ? Number(actualVendorCostOverride) 
        : plannedCost;

    const additionalBusinessExpense = (businessExpenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const actualProfit = actualRevenue - actualVendorExpense - additionalBusinessExpense + commission;

    let profitStatus = 'ESTIMATED';
    if (customerPayments.length === 0) {
        profitStatus = 'ESTIMATED';
    } else if (actualProfit < 0) {
        profitStatus = 'LOSS';
    } else if (actualProfit < expectedProfit) {
        profitStatus = 'LOWER_THAN_EXPECTED';
    } else {
        profitStatus = 'ON_TRACK';
    }

    return {
        expectedProfit,
        actualRevenue,
        vendorPaid: actualVendorPayments,
        actualVendorExpense,
        additionalBusinessExpense,
        commissionIncome: commission,
        actualProfit,
        profitStatus,
        differenceFromExpected: actualProfit - expectedProfit
    };
}

export function calculateCashPosition(customerPayments = [], vendorPayments = [], businessExpenses = [], commissionIncome = 0) {
    const moneyReceived = (customerPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const vendorPaid = (vendorPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const expensesPaid = (businessExpenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const commission = Number(commissionIncome) || 0;

    const currentNetCash = moneyReceived + commission - vendorPaid - expensesPaid;

    return {
        moneyReceived,
        commissionIncome: commission,
        vendorPaid,
        expensesPaid,
        currentNetCash
    };
}
