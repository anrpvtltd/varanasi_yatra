import { PACKAGE_TEMPLATES } from '../src/constants/phase4Constants.js';
import { calculateQuoteFinancials, formatWhatsAppQuoteText } from '../src/utils/quoteCalculator.js';
import { recommendVendors } from '../src/utils/smartVendorRecommender.js';
import { computeLeadPriority, computeNextBestAction } from '../src/utils/leadPriority.js';

console.log('🧪 Running Lead -> Quote Complete Flow Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
    totalTests++;
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passedTests++;
    } else {
        console.error(`❌ FAIL: ${testName}`);
        process.exitCode = 1;
    }
}

// 1. Template Integrity
assert(PACKAGE_TEMPLATES.COMPLETE !== undefined, 'Complete Package Template exists');
assert(PACKAGE_TEMPLATES.COMPLETE.defaultServices.length === 5, 'Complete Package has 5 default services');
assert(PACKAGE_TEMPLATES.COMFORT.defaultServices.length === 4, 'Comfort Package has 4 default services');
assert(PACKAGE_TEMPLATES.BASIC.defaultServices.length === 3, 'Basic Package has 3 default services');

// 2. Financial Calculation Engine - Fixed Margin
const testServices = [
    { category: 'HOTEL', serviceName: 'Deluxe Room', quantity: 2, vendorCost: 2500 }, // 5000
    { category: 'TRANSPORT', serviceName: 'Sedan Car', quantity: 3, vendorCost: 1500 }, // 4500
];
const fixedCalc = calculateQuoteFinancials(testServices, 'FIXED', 3000, 500);
assert(fixedCalc.totalVendorCost === 9500, `Total Vendor Cost is 9500 (Got: ${fixedCalc.totalVendorCost})`);
assert(fixedCalc.companyMargin === 3000, `Company Margin is 3000 (Got: ${fixedCalc.companyMargin})`);
assert(fixedCalc.suggestedCustomerPrice === 12500, `Suggested Price is 12500 (Got: ${fixedCalc.suggestedCustomerPrice})`);
assert(fixedCalc.discount === 500, `Discount is 500 (Got: ${fixedCalc.discount})`);
assert(fixedCalc.finalCustomerPrice === 12000, `Final Customer Price is 12000 (Got: ${fixedCalc.finalCustomerPrice})`);
assert(fixedCalc.expectedProfit === 2500, `Expected Profit is 2500 (Got: ${fixedCalc.expectedProfit})`);
assert(fixedCalc.isLowProfitWarning === false, 'Safe margin: isLowProfitWarning is false');

// 3. Financial Calculation Engine - Percentage Margin & Low Profit Warning
const percentCalc = calculateQuoteFinancials(testServices, 'PERCENTAGE', 20, 1500); // 20% of 9500 = 1900
assert(percentCalc.companyMargin === 1900, `Company Margin (20%) is 1900 (Got: ${percentCalc.companyMargin})`);
assert(percentCalc.suggestedCustomerPrice === 11400, `Suggested Price is 11400 (Got: ${percentCalc.suggestedCustomerPrice})`);
assert(percentCalc.finalCustomerPrice === 9900, `Final Customer Price is 9900 (Got: ${percentCalc.finalCustomerPrice})`);
assert(percentCalc.expectedProfit === 400, `Expected Profit is 400 (Got: ${percentCalc.expectedProfit})`);
assert(percentCalc.isLowProfitWarning === true, 'Low profit warning triggered when profit < 1500');

// 4. WhatsApp Text Generation
const mockLead = {
    _id: 'lead_test_123',
    name: 'Amit Sharma',
    mobile: '9876543210',
    date: '2026-09-15',
    travelers: '3',
    tripDuration: '3 Days / 2 Nights'
};
const mockQuote = {
    travelDate: '2026-09-15',
    travelers: '3',
    tripDuration: '3 Days / 2 Nights',
    servicesList: testServices,
    finalCustomerPrice: 12000
};
const waText = formatWhatsAppQuoteText(mockQuote, mockLead);
assert(waText.includes('Amit Sharma'), 'WhatsApp text includes Customer Name');
assert(waText.includes('₹12,000'), 'WhatsApp text includes formatted Final Price');
assert(waText.includes('2026-09-15'), 'WhatsApp text includes Travel Date');
assert(waText.includes('3 Person(s)'), 'WhatsApp text includes Travelers Pax');

// 5. Vendor Recommender & Reliability Scoring
const mockVendors = [
    { _id: 'v1', name: 'Vendor One', category: 'HOTEL', status: 'ACTIVE', baseRate: 3000, performance: { totalAssignments: 10, successfulAssignments: 10, issueCount: 0 } },
    { _id: 'v2', name: 'Vendor Two', category: 'HOTEL', status: 'ACTIVE', baseRate: 2000, performance: { totalAssignments: 10, successfulAssignments: 7, issueCount: 2 } },
    { _id: 'v3', name: 'Vendor Three', category: 'TRANSPORT', status: 'ACTIVE', baseRate: 1500 }
];
const recommendedHotels = recommendVendors(mockVendors, 'HOTEL');
assert(recommendedHotels.length === 2, `Filtered only HOTEL vendors (Got ${recommendedHotels.length})`);
assert(recommendedHotels[0]._id === 'v1', 'Top reliability vendor ranked first');
assert(recommendedHotels[0].isRecommended === true, 'Top vendor marked as recommended');

// 6. Lead Priority & Next Best Action Integration
const testLeadForPriority = {
    _id: 'lead_p_1',
    name: 'Ramesh Gupta',
    mobile: '9988776655',
    status: 'Pending',
    date: '2026-09-20',
    travelers: '2',
    requirements: { hotel: true, transport: true }
};
const priorityRes = computeLeadPriority(testLeadForPriority);
assert(priorityRes && priorityRes.score > 0, 'Lead Priority computed successfully');
const nextActionRes = computeNextBestAction(testLeadForPriority);
assert(nextActionRes && nextActionRes.label !== undefined, 'Next Best Action computed without runtime error');

console.log(`\n🎉 Test Suite Completed: ${passedTests} / ${totalTests} checks passed successfully!`);
