/**
 * TEST SUITE: CEO Financial Semantics & Profit Calculation Validation
 * 
 * Validates:
 * 1. Accrual revenue & cost separation from cash inflows & outflows.
 * 2. Realized Profit NEVER uses `Collected Cash - Vendor Paid + Commission`.
 * 3. Case A: Zero vendor payouts cannot inflate realized profit to equal collected cash.
 * 4. Case B: Full settlement with trustworthy actual cost basis yields correct realized margin.
 * 5. Case C: Partial collection and partial vendor payment maintain strict separation between cash flow and profit.
 * 6. Case D: High-volume simulation dataset (₹7,53,000 revenue) reports "Not Yet Realized" when vendor costs are pending settlement.
 */

import { calculateCEODashboard } from '../src/utils/dashboardIntelligence.js';
import { calculateBookingProfit, calculateCashPosition } from '../src/utils/paymentCalculator.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

console.log('🧪 ========================================================');
console.log('   CEO FINANCIAL SEMANTICS & PROFIT CALCULATION TEST SUITE');
console.log('========================================================\n');

// -----------------------------------------------------------------
// CASE A: FULL REVENUE COLLECTED, ₹0 VENDOR PAID
// -----------------------------------------------------------------
console.log('👉 [TEST CASE A] Revenue: ₹100,000 | Collected: ₹100,000 | Vendor Cost: ₹70,000 | Vendor Paid: ₹0');
{
    const bookingA = {
        _id: 'b-case-a',
        bookingStatus: 'CONFIRMED',
        packageDetails: { finalCustomerPrice: 100000 },
        customerPaymentSummary: { packagePrice: 100000, totalPaid: 100000, customerDue: 0 },
        vendorPaymentSummary: { plannedVendorCost: 70000, actualVendorCost: 0, totalPaidToVendors: 0, vendorDue: 70000 },
        vendorAssignments: [{ vendorId: 'v1', plannedCost: 70000, actualCost: 0 }]
    };

    const customerPayments = [{ amount: 100000 }];
    const vendorPayments = [];

    const ceoDash = calculateCEODashboard({
        bookings: [bookingA],
        customerPayments,
        vendorPayments,
        expenses: []
    });

    assert(ceoDash.totalRevenue === 100000, 'Customer Revenue equals package price (₹100,000)');
    assert(ceoDash.customerCashCollected === 100000, 'Cash Collected equals ₹100,000');
    assert(ceoDash.customerOutstanding === 0, 'Customer Due equals ₹0');
    assert(ceoDash.plannedVendorCost === 70000, 'Vendor Planned Cost equals ₹70,000');
    assert(ceoDash.vendorPaymentsMade === 0, 'Vendor Paid equals ₹0');
    assert(ceoDash.vendorOutstanding === 70000, 'Vendor Due equals ₹70,000');
    assert(ceoDash.expectedProfit === 30000, 'Expected Gross Profit equals ₹30,000 (100k - 70k)');
    
    // CRITICAL: Realized Profit must NOT equal ₹100,000 (which was the old false cash formula 100k - 0)
    assert(ceoDash.realizedProfit !== 100000, 'CRITICAL: Realized Profit does NOT equal ₹100,000');
    assert(ceoDash.realizedProfit === null, 'Realized Profit is correctly null ("Not Yet Realized") because trip is pending');

    // Single booking profit check
    const singleProfit = calculateBookingProfit(100000, 70000, customerPayments, vendorPayments, [], 0, 0);
    assert(singleProfit.actualProfit !== 100000, 'Single booking actual profit does NOT equal ₹100,000');
    assert(singleProfit.actualVendorExpense === 70000, 'Single booking actualVendorExpense uses cost basis (₹70,000), not vendor payments (₹0)');
}

// -----------------------------------------------------------------
// CASE B: FULL REVENUE COLLECTED, ₹70,000 VENDOR PAID & SETTLED
// -----------------------------------------------------------------
console.log('\n👉 [TEST CASE B] Revenue: ₹100,000 | Collected: ₹100,000 | Vendor Cost: ₹70,000 | Vendor Paid: ₹70,000 (Settled)');
{
    const bookingB = {
        _id: 'b-case-b',
        bookingStatus: 'COMPLETED',
        packageDetails: { finalCustomerPrice: 100000 },
        customerPaymentSummary: { packagePrice: 100000, totalPaid: 100000, customerDue: 0 },
        vendorPaymentSummary: { plannedVendorCost: 70000, actualVendorCost: 70000, totalPaidToVendors: 70000, vendorDue: 0 },
        vendorAssignments: [{ vendorId: 'v1', plannedCost: 70000, actualCost: 70000 }]
    };

    const customerPayments = [{ amount: 100000 }];
    const vendorPayments = [{ amount: 70000 }];

    const ceoDash = calculateCEODashboard({
        bookings: [bookingB],
        customerPayments,
        vendorPayments,
        expenses: []
    });

    assert(ceoDash.totalRevenue === 100000, 'Customer Revenue equals ₹100,000');
    assert(ceoDash.customerCashCollected === 100000, 'Cash Collected equals ₹100,000');
    assert(ceoDash.vendorPaymentsMade === 70000, 'Vendor Paid equals ₹70,000');
    assert(ceoDash.vendorOutstanding === 0, 'Vendor Due equals ₹0');
    assert(ceoDash.expectedProfit === 30000, 'Expected Profit equals ₹30,000');
    assert(ceoDash.realizedProfit === 30000, 'Realized Profit equals ₹30,000 on completed & trustworthy cost basis');
    assert(ceoDash.profitPerformance.status === 'ON_TRACK', 'Profit performance status is ON_TRACK');
}

// -----------------------------------------------------------------
// CASE C: PARTIAL REVENUE ₹50,000, PARTIAL VENDOR PAID ₹20,000
// -----------------------------------------------------------------
console.log('\n👉 [TEST CASE C] Revenue: ₹100,000 | Collected: ₹50,000 | Vendor Cost: ₹70,000 | Vendor Paid: ₹20,000');
{
    const bookingC = {
        _id: 'b-case-c',
        bookingStatus: 'CONFIRMED',
        packageDetails: { finalCustomerPrice: 100000 },
        customerPaymentSummary: { packagePrice: 100000, totalPaid: 50000, customerDue: 50000 },
        vendorPaymentSummary: { plannedVendorCost: 70000, actualVendorCost: 0, totalPaidToVendors: 20000, vendorDue: 50000 },
        vendorAssignments: [{ vendorId: 'v1', plannedCost: 70000, actualCost: 0 }]
    };

    const customerPayments = [{ amount: 50000 }];
    const vendorPayments = [{ amount: 20000 }];

    const ceoDash = calculateCEODashboard({
        bookings: [bookingC],
        customerPayments,
        vendorPayments,
        expenses: []
    });

    assert(ceoDash.customerCashCollected === 50000, 'Cash Collected equals ₹50,000');
    assert(ceoDash.customerOutstanding === 50000, 'Customer Due equals ₹50,000');
    assert(ceoDash.plannedVendorCost === 70000, 'Vendor Planned Cost equals ₹70,000');
    assert(ceoDash.vendorPaymentsMade === 20000, 'Vendor Paid equals ₹20,000');
    assert(ceoDash.vendorOutstanding === 50000, 'Vendor Due equals ₹50,000 (70k - 20k)');
    assert(ceoDash.expectedProfit === 30000, 'Expected Profit equals ₹30,000 (100k - 70k)');
    
    // Liquid cash in-hand is ₹30,000, but Realized Profit is NOT yet realized
    assert(ceoDash.netCashPosition === 30000, 'Net Liquid Cash position equals ₹30,000 (50k in - 20k out)');
    assert(ceoDash.realizedProfit === null, 'Realized Profit is null ("Not Yet Realized") because trip is uncompleted');
    assert(ceoDash.profitPerformance.status === 'PENDING_REALIZATION', 'Profit status is PENDING_REALIZATION');

    // Single booking profit check
    const singleProfit = calculateBookingProfit(100000, 70000, customerPayments, vendorPayments, [], 0, 0);
    assert(singleProfit.actualProfit === -20000, 'Single booking profit on cost basis: 50k revenue - 70k cost = -20k (NOT 50k - 20k = +30k)');
    assert(singleProfit.actualVendorExpense === 70000, 'Vendor expense basis is 70,000 (not 20,000)');

    // Cash position check
    const cashPos = calculateCashPosition(customerPayments, vendorPayments, [], 0);
    assert(cashPos.currentNetCash === 30000, 'Cash position correctly isolates net liquid cash (₹30,000)');
}

// -----------------------------------------------------------------
// CASE D: REALISTIC QA DATASET (₹7,53,000 REVENUE)
// -----------------------------------------------------------------
console.log('\n👉 [TEST CASE D] Realistic QA High-Volume Dataset (₹7,53,000 Revenue, ₹6,06,200 Collected, ₹0 Vendor Paid)');
{
    const bookings = [
        {
            _id: 'qa-1',
            bookingStatus: 'CONFIRMED',
            packageDetails: { finalCustomerPrice: 450000 },
            customerPaymentSummary: { packagePrice: 450000, totalPaid: 359000, customerDue: 91000 },
            vendorPaymentSummary: { plannedVendorCost: 380000, actualVendorCost: 0, totalPaidToVendors: 0, vendorDue: 380000 }
        },
        {
            _id: 'qa-2',
            bookingStatus: 'PREPARING',
            packageDetails: { finalCustomerPrice: 303000 },
            customerPaymentSummary: { packagePrice: 303000, totalPaid: 247200, customerDue: 56800 },
            vendorPaymentSummary: { plannedVendorCost: 251200, actualVendorCost: 0, totalPaidToVendors: 0, vendorDue: 251200 }
        }
    ];

    const customerPayments = [{ amount: 359000 }, { amount: 247200 }]; // 6,06,200
    const vendorPayments = []; // 0

    const ceoDash = calculateCEODashboard({
        bookings,
        customerPayments,
        vendorPayments,
        expenses: []
    });

    assert(ceoDash.totalRevenue === 753000, 'Revenue equals ₹7,53,000');
    assert(ceoDash.customerCashCollected === 606200, 'Cash Collected equals ₹6,06,200');
    assert(ceoDash.customerOutstanding === 147800, 'Customer Due equals ₹1,47,800');
    assert(ceoDash.plannedVendorCost === 631200, 'Vendor Planned Cost equals ₹6,31,200');
    assert(ceoDash.vendorPaymentsMade === 0, 'Vendor Paid equals ₹0');
    assert(ceoDash.vendorOutstanding === 631200, 'Vendor Due equals ₹6,31,200');
    assert(ceoDash.expectedProfit === 121800, 'Expected Gross Profit equals ₹1,21,800 (753k - 631.2k)');
    
    // CRITICAL: Realized Profit MUST NOT be ₹6,06,200!
    assert(ceoDash.realizedProfit !== 606200, 'CRITICAL: Realized Profit does NOT equal ₹6,06,200');
    assert(ceoDash.realizedProfit === null, 'Realized Profit is correctly shown as null ("Not Yet Realized")');
    assert(ceoDash.financialCommandStrip.realizedProfit === null, 'FinancialCommandStrip receives realizedProfit = null');
    assert(ceoDash.netCashPosition === 606200, 'Net Cash Position correctly shows liquid cash of ₹6,06,200 separately from profit');
}

// -----------------------------------------------------------------
// CASE E: COMMERCIAL MODELS INTEGRITY
// -----------------------------------------------------------------
console.log('\n👉 [TEST CASE E] Commercial Models Integrity (Commission & Pass-Through)');
{
    const bookingModels = {
        _id: 'qa-models',
        bookingStatus: 'CONFIRMED',
        packageDetails: { finalCustomerPrice: 50000 },
        customerPaymentSummary: { packagePrice: 50000, totalPaid: 50000, customerDue: 0 },
        vendorPaymentSummary: { plannedVendorCost: 35000, actualVendorCost: 0, totalPaidToVendors: 0, vendorDue: 35000 },
        servicesList: [
            { commercialModel: 'SELLING_PRICE', customerSellingPrice: 40000, negotiatedVendorCost: 35000, quantity: 1 },
            { commercialModel: 'COMMISSION', commissionAmount: 5000, quantity: 1 },
            { commercialModel: 'PASS_THROUGH', passThroughAmount: 5000, quantity: 1 },
            { commercialModel: 'CUSTOMER_DIRECT', customerSellingPrice: 0, negotiatedVendorCost: 0, quantity: 1 }
        ]
    };

    const ceoDash = calculateCEODashboard({
        bookings: [bookingModels],
        customerPayments: [{ amount: 50000 }],
        vendorPayments: [],
        expenses: []
    });

    assert(ceoDash.commissionIncome === 5000, 'Commission Income (₹5,000) tracked separately');
    assert(ceoDash.passThroughTotal === 5000, 'Pass-Through (₹5,000) tracked separately');
    assert(ceoDash.expectedProfit === 20000, 'Expected Profit includes commission: 50k - 35k + 5k = ₹20,000');
}

// -----------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------
console.log('\n========================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================\n');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('🎉 ALL CEO FINANCIAL SEMANTICS & ACCOUNTING TESTS PASSED!');
}
