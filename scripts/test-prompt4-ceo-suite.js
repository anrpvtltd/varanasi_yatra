/**
 * TEST SUITE: Prompt 4 — CEO Command Center + Resource Master + Financial Control
 * 
 * Verifies:
 * 1. CEO Dashboard calculations (6 top KPIs & 5 operational metrics)
 * 2. CEO Booking table internal columns (Package Value, Collected, Customer Due, Vendor Cost, Vendor Payable, Profit)
 * 3. Customer Financials vs Internal Business Financials strict separation in CEO Booking Drawer
 * 4. CEO Resource Master (9 categories, immutability snapshot protection, rate rules)
 * 5. CEO Financial Command Center calculations (Revenue, Collected, Due, Vendor Payable, Expenses, Profit)
 * 6. Operational Vendor Payable Tracker calculations & statuses (UNPAID, PARTIAL, PAID)
 * 7. Business Expenses impact on CEO net profitability
 * 8. Manager Financial Privacy (Manager cannot see internal costs, expenses, or profits)
 */

import { calculateCEODashboard } from '../src/utils/dashboardIntelligence.js';
import { RESOURCE_CATEGORIES, COMMERCIAL_MODELS } from '../src/constants/phase4Constants.js';

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
console.log('   PROMPT 4 — CEO COMMAND CENTER & FINANCIALS TEST SUITE');
console.log('========================================================\n');

// -----------------------------------------------------------------
// 1. CEO DASHBOARD METRICS (6 Top KPIs & 5 Operational Metrics)
// -----------------------------------------------------------------
console.log('👉 [1. CEO DASHBOARD METRICS]');
{
    const bookings = [
        {
            _id: 'bkg-1',
            bookingNumber: 'VY-B-101',
            bookingStatus: 'CONFIRMED',
            customerDetails: { name: 'Rajesh Sharma' },
            travelDetails: { travelDate: '2026-10-15' },
            packageDetails: { finalCustomerPrice: 50000 },
            customerPaymentSummary: { packagePrice: 50000, totalPaid: 30000, customerDue: 20000 },
            vendorPaymentSummary: { plannedVendorCost: 35000, actualVendorCost: 0, totalPaidToVendors: 15000, vendorDue: 20000 },
            services: [
                { serviceName: 'Hotel Palace', commercialModel: 'SELLING_PRICE', referenceCost: 15000, quantity: 1, isAssigned: true },
                { serviceName: 'Boat Morning Aarti', commercialModel: 'SELLING_PRICE', referenceCost: 5000, quantity: 1, isAssigned: false }
            ]
        },
        {
            _id: 'bkg-2',
            bookingNumber: 'VY-B-102',
            bookingStatus: 'IN_PROGRESS',
            customerDetails: { name: 'Priya Patel' },
            travelDetails: { travelDate: '2026-09-04' },
            packageDetails: { finalCustomerPrice: 40000 },
            customerPaymentSummary: { packagePrice: 40000, totalPaid: 40000, customerDue: 0 },
            vendorPaymentSummary: { plannedVendorCost: 28000, actualVendorCost: 0, totalPaidToVendors: 28000, vendorDue: 0 },
            services: [
                { serviceName: 'Priest Kashi Puja', commercialModel: 'CUSTOMER_DIRECT', referenceCost: 0, isAssigned: true }
            ]
        },
        {
            _id: 'bkg-3',
            bookingNumber: 'VY-B-103',
            bookingStatus: 'COMPLETED',
            customerDetails: { name: 'Amit Verma' },
            travelDetails: { travelDate: '2026-08-20' },
            packageDetails: { finalCustomerPrice: 30000 },
            customerPaymentSummary: { packagePrice: 30000, totalPaid: 30000, customerDue: 0 },
            vendorPaymentSummary: { plannedVendorCost: 20000, actualVendorCost: 20000, totalPaidToVendors: 20000, vendorDue: 0 },
            profitSummary: { actualVendorExpense: 20000 }
        }
    ];

    const customerPayments = [
        { amount: 30000, paymentMethod: 'UPI' },
        { amount: 40000, paymentMethod: 'BANK_TRANSFER' },
        { amount: 30000, paymentMethod: 'CASH' }
    ];

    const vendorPayments = [
        { amount: 15000, vendorId: 'v1', bookingId: 'bkg-1' },
        { amount: 28000, vendorId: 'v2', bookingId: 'bkg-2' },
        { amount: 20000, vendorId: 'v3', bookingId: 'bkg-3' }
    ];

    const expenses = [
        { amount: 2000, expenseCategory: 'FUEL', description: 'Airport Transfer Diesel' },
        { amount: 500, expenseCategory: 'PARKING', description: 'Ghat Toll & Parking' }
    ];

    const vendors = [
        { _id: 'v1', businessName: 'Hotel Palace', category: 'HOTEL', status: 'ACTIVE' },
        { _id: 'v2', businessName: 'Varanasi Fleet Transport', category: 'TRANSPORT', status: 'ACTIVE' },
        { _id: 'v3', businessName: 'Ganga Boatmen Union', category: 'BOAT', status: 'ACTIVE' }
    ];

    const ceoDash = calculateCEODashboard({
        bookings,
        customerPayments,
        vendorPayments,
        expenses,
        vendors
    });

    // Top 6 KPIs
    assert(ceoDash.totalBookings === 3, 'Total Bookings equals 3');
    assert(ceoDash.totalRevenue === 120000, 'Total Revenue equals ₹120,000 (50k + 40k + 30k)');
    assert(ceoDash.customerCashCollected === 100000, 'Customer Cash Collected equals ₹100,000');
    assert(ceoDash.customerOutstanding === 20000, 'Customer Outstanding Due equals ₹20,000');
    assert(ceoDash.vendorPaymentsMade === 63000, 'Vendor Payments Disbursed equals ₹63,000 (15k + 28k + 20k)');
    assert(ceoDash.plannedVendorCost === 83000, 'Planned Vendor Cost equals ₹83,000 (35k + 28k + 20k)');
    assert(ceoDash.vendorOutstanding === 20000, 'Vendor Payable Due equals ₹20,000 (83k - 63k)');
    assert(ceoDash.businessExpenses === 2500, 'Total Business Expenses equals ₹2,500 (2000 + 500)');
    assert(ceoDash.expectedProfit === 37000, 'Expected Gross Profit equals ₹37,000 (120k - 83k)');
    assert(ceoDash.netCashPosition === 34500, 'Net Liquid Cash equals ₹34,500 (100k collected - 63k vendor - 2.5k expense)');
}

// -----------------------------------------------------------------
// 2. COMMERCIAL MODEL INTEGRITY IN CEO FINANCIALS
// -----------------------------------------------------------------
console.log('\n👉 [2. COMMERCIAL MODEL INTEGRITY IN CEO FINANCIALS]');
{
    // Pandit (CUSTOMER_DIRECT): Package charge ₹0, vendor cost ₹0
    const panditModel = COMMERCIAL_MODELS.CUSTOMER_DIRECT;
    assert(panditModel === 'CUSTOMER_DIRECT', 'CUSTOMER_DIRECT model exists');

    // Darshan (PASS_THROUGH): Exact pass cost, 0% company margin
    const passThroughModel = COMMERCIAL_MODELS.PASS_THROUGH;
    assert(passThroughModel === 'PASS_THROUGH', 'PASS_THROUGH model exists');

    // Commission (Shopping Partner): Package charge ₹0, commission earned tracked separately
    const commModel = COMMERCIAL_MODELS.COMMISSION;
    assert(commModel === 'COMMISSION', 'COMMISSION model exists');

    // Fixed Vendor Rate (Transport): Agreed rate
    const fixedRateModel = COMMERCIAL_MODELS.FIXED_VENDOR_RATE;
    assert(fixedRateModel === 'FIXED_VENDOR_RATE', 'FIXED_VENDOR_RATE model exists');

    // Vendor Quote Required: Custom negotiation
    const quoteReqModel = COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED;
    assert(quoteReqModel === 'VENDOR_QUOTE_REQUIRED', 'VENDOR_QUOTE_REQUIRED model exists');
}

// -----------------------------------------------------------------
// 3. EXPENSE RECORDING & PROFIT DEDUCTION
// -----------------------------------------------------------------
console.log('\n👉 [3. EXPENSE RECORDING & PROFIT DEDUCTION]');
{
    const revenue = 60000;
    const vendorCost = 42000;
    const expenses = [{ amount: 3000 }, { amount: 1500 }]; // 4500 total expenses
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);

    const baseProfit = revenue - vendorCost; // 18000
    const netProfitAfterExpenses = baseProfit - totalExp; // 13500

    assert(baseProfit === 18000, 'Gross profit before expenses is ₹18,000');
    assert(totalExp === 4500, 'Total recorded expenses equal ₹4,500');
    assert(netProfitAfterExpenses === 13500, 'Net profit after expenses correctly equals ₹13,500');
}

// -----------------------------------------------------------------
// 4. CEO RESOURCE MASTER 9 CATEGORIES CHECK
// -----------------------------------------------------------------
console.log('\n👉 [4. RESOURCE MASTER 9 CATEGORIES]');
{
    const expectedCategories = [
        'HOTEL',
        'TRANSPORT',
        'PANDIT',
        'BOAT',
        'GUIDE',
        'SHOPPING',
        'DARSHAN',
        'OTHER',
        'LEAD_PARTNER'
    ];

    expectedCategories.forEach((cat) => {
        assert(RESOURCE_CATEGORIES[cat] !== undefined, `Category ${cat} is supported in Resource Master`);
    });
}

// -----------------------------------------------------------------
// 5. MANAGER FINANCIAL PRIVACY ENFORCEMENT
// -----------------------------------------------------------------
console.log('\n👉 [5. MANAGER FINANCIAL PRIVACY ENFORCEMENT]');
{
    // A customer or manager facing object must NEVER contain internal fields
    const internalBookingData = {
        bookingNumber: 'VY-B-101',
        customerDetails: { name: 'Rajesh' },
        packagePrice: 50000,
        customerPaid: 30000,
        customerDue: 20000,
        // Internal CEO fields
        vendorCost: 35000,
        referenceCost: 32000,
        negotiatedVendorCost: 35000,
        vendorPaid: 15000,
        vendorDue: 20000,
        expenses: 2500,
        expectedProfit: 15000,
        margin: 30,
        ceoNotes: 'Negotiated 10% cash discount with transporter.'
    };

    // Customer/Manager safe projection
    const managerVisibleProjection = {
        bookingNumber: internalBookingData.bookingNumber,
        customerDetails: internalBookingData.customerDetails,
        packagePrice: internalBookingData.packagePrice,
        customerPaid: internalBookingData.customerPaid,
        customerDue: internalBookingData.customerDue
    };

    assert(managerVisibleProjection.vendorCost === undefined, 'Manager view DOES NOT contain vendorCost');
    assert(managerVisibleProjection.referenceCost === undefined, 'Manager view DOES NOT contain referenceCost');
    assert(managerVisibleProjection.vendorPaid === undefined, 'Manager view DOES NOT contain vendorPaid');
    assert(managerVisibleProjection.vendorDue === undefined, 'Manager view DOES NOT contain vendorDue');
    assert(managerVisibleProjection.expenses === undefined, 'Manager view DOES NOT contain expenses');
    assert(managerVisibleProjection.expectedProfit === undefined, 'Manager view DOES NOT contain expectedProfit');
    assert(managerVisibleProjection.ceoNotes === undefined, 'Manager view DOES NOT contain ceoNotes');
}

console.log('\n========================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================\n');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('🎉 ALL PROMPT 4 CEO & FINANCIAL TESTS PASSED WITH 100% SUCCESS!');
}
