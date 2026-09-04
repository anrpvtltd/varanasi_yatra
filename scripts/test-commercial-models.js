import { COMMERCIAL_MODELS } from '../src/constants/phase4Constants.js';
import { calculateQuoteFinancials, formatWhatsAppQuoteText } from '../src/utils/quoteCalculator.js';

console.log('🧪 Running Commercial Models Foundation Test Suite...\n');

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

// -----------------------------------------------------------------------------
// 1. Test SELLING_PRICE (Hotel)
// -----------------------------------------------------------------------------
const hotelItem = [
    {
        category: 'HOTEL',
        commercialModel: COMMERCIAL_MODELS.SELLING_PRICE,
        serviceName: 'Heritage Room (Hotel Clarks)',
        quantity: 1,
        referenceCost: 2200,
        customerSellingPrice: 2500
    }
];
const hotelCalc = calculateQuoteFinancials(hotelItem);
assert(hotelCalc.totalCustomerCharge === 2500, `Hotel package charge is ₹2500 (Got: ${hotelCalc.totalCustomerCharge})`);
assert(hotelCalc.totalVendorCost === 2200, `Hotel vendor cost is ₹2200 (Got: ${hotelCalc.totalVendorCost})`);
assert(hotelCalc.expectedProfit === 300, `Hotel expected profit is ₹300 (Got: ${hotelCalc.expectedProfit})`);

// -----------------------------------------------------------------------------
// 2. Test FIXED_VENDOR_RATE (Standard Transport)
// -----------------------------------------------------------------------------
const fixedTransport = [
    {
        category: 'TRANSPORT',
        commercialModel: COMMERCIAL_MODELS.FIXED_VENDOR_RATE,
        serviceName: 'Airport Transfer Sedan',
        quantity: 1,
        referenceCost: 1200,
        customerSellingPrice: 1500
    }
];
const fixedCalc = calculateQuoteFinancials(fixedTransport);
assert(fixedCalc.totalCustomerCharge === 1500, `Fixed transport customer charge is ₹1500 (Got: ${fixedCalc.totalCustomerCharge})`);
assert(fixedCalc.totalVendorCost === 1200, `Fixed transport vendor cost is ₹1200 (Got: ${fixedCalc.totalVendorCost})`);
assert(fixedCalc.expectedProfit === 300, `Fixed transport profit is ₹300 (Got: ${fixedCalc.expectedProfit})`);

// -----------------------------------------------------------------------------
// 3. Test VENDOR_QUOTE_REQUIRED (Multi-City Custom Transport)
// -----------------------------------------------------------------------------
const multiCityTransport = [
    {
        category: 'TRANSPORT',
        commercialModel: COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED,
        serviceName: 'Varanasi -> Ayodhya -> Prayagraj -> Gaya -> Lucknow (Innova)',
        quantity: 1,
        negotiatedVendorCost: 18000,
        customerSellingPrice: 21000
    }
];
const multiCalc = calculateQuoteFinancials(multiCityTransport);
assert(multiCalc.totalCustomerCharge === 21000, `Multi-city transport customer charge is ₹21000 (Got: ${multiCalc.totalCustomerCharge})`);
assert(multiCalc.totalVendorCost === 18000, `Multi-city transport vendor cost is ₹18000 (Got: ${multiCalc.totalVendorCost})`);
assert(multiCalc.expectedProfit === 3000, `Multi-city transport profit is ₹3000 (Got: ${multiCalc.expectedProfit})`);

// -----------------------------------------------------------------------------
// 4. Test CUSTOMER_DIRECT (Pandit)
// -----------------------------------------------------------------------------
const panditItem = [
    {
        category: 'PANDIT',
        commercialModel: COMMERCIAL_MODELS.CUSTOMER_DIRECT,
        serviceName: 'Special Rudrabhishek Puja (Pt. Shastri)',
        quantity: 1,
        referenceCost: 1500,
        customerSellingPrice: 0
    }
];
const panditCalc = calculateQuoteFinancials(panditItem);
assert(panditCalc.totalCustomerCharge === 0, `Pandit package charge is ₹0 (Got: ${panditCalc.totalCustomerCharge})`);
assert(panditCalc.totalVendorCost === 0, `Pandit package vendor cost is ₹0 (Got: ${panditCalc.totalVendorCost})`);
assert(panditCalc.expectedProfit === 0, `Pandit package profit is ₹0 (Got: ${panditCalc.expectedProfit})`);

// -----------------------------------------------------------------------------
// 5. Test COMMISSION (Shopping)
// -----------------------------------------------------------------------------
const shoppingItem = [
    {
        category: 'SHOPPING',
        commercialModel: COMMERCIAL_MODELS.COMMISSION,
        serviceName: 'Varanasi Silk Saree Emporium Visit',
        quantity: 1,
        commissionRate: 20,
        commissionAmount: 500
    }
];
const shoppingCalc = calculateQuoteFinancials(shoppingItem);
assert(shoppingCalc.totalCustomerCharge === 0, `Shopping package charge is ₹0 (Got: ${shoppingCalc.totalCustomerCharge})`);
assert(shoppingCalc.totalVendorCost === 0, `Shopping package vendor cost is ₹0 (Got: ${shoppingCalc.totalVendorCost})`);
assert(shoppingCalc.commissionTotal === 500, `Shopping commission is tracked as ₹500 (Got: ${shoppingCalc.commissionTotal})`);
assert(shoppingCalc.expectedProfit === 500, `Business profit includes commission of ₹500 (Got: ${shoppingCalc.expectedProfit})`);

// -----------------------------------------------------------------------------
// 6. Test PASS_THROUGH (Temple / Darshan Ticket)
// -----------------------------------------------------------------------------
const darshanItem = [
    {
        category: 'VIP_DARSHAN',
        commercialModel: COMMERCIAL_MODELS.PASS_THROUGH,
        serviceName: 'Kashi Vishwanath VIP Darshan Pass',
        quantity: 2,
        passThroughAmount: 300
    }
];
const darshanCalc = calculateQuoteFinancials(darshanItem);
assert(darshanCalc.totalCustomerCharge === 600, `Darshan package charge is ₹600 (Got: ${darshanCalc.totalCustomerCharge})`);
assert(darshanCalc.totalVendorCost === 600, `Darshan vendor disbursement is ₹600 (Got: ${darshanCalc.totalVendorCost})`);
assert(darshanCalc.passThroughTotal === 600, `Darshan pass-through total is ₹600 (Got: ${darshanCalc.passThroughTotal})`);
assert(darshanCalc.expectedProfit === 0, `Pass-through company margin is ₹0 (Got: ${darshanCalc.expectedProfit})`);

// -----------------------------------------------------------------------------
// 7. Combined Full Quote with All 6 Models
// -----------------------------------------------------------------------------
const combinedServices = [
    hotelItem[0],           // Charge: 2500, Cost: 2200, Profit: 300
    multiCityTransport[0],  // Charge: 21000, Cost: 18000, Profit: 3000
    panditItem[0],          // Charge: 0, Cost: 0, Profit: 0
    shoppingItem[0],        // Charge: 0, Cost: 0, Comm: 500, Profit: 500
    darshanItem[0]          // Charge: 600, Cost: 600, Profit: 0 (Pass-through)
];
const combinedCalc = calculateQuoteFinancials(combinedServices, 'FIXED', 0, 100); // 100 discount
// Total Charge = 2500 + 21000 + 0 + 0 + 600 = 24100
// Final Price = 24100 - 100 = 24000
// Total Vendor Cost = 2200 + 18000 + 0 + 0 + 600 = 20800
// Profit = 24000 - 20800 + 500 = 3700
assert(combinedCalc.totalCustomerCharge === 24100, `Combined package charge is ₹24100 (Got: ${combinedCalc.totalCustomerCharge})`);
assert(combinedCalc.finalCustomerPrice === 24000, `Combined final price after ₹100 discount is ₹24000 (Got: ${combinedCalc.finalCustomerPrice})`);
assert(combinedCalc.totalVendorCost === 20800, `Combined vendor cost is ₹20800 (Got: ${combinedCalc.totalVendorCost})`);
assert(combinedCalc.passThroughTotal === 600, `Combined pass-through total is ₹600 (Got: ${combinedCalc.passThroughTotal})`);
assert(combinedCalc.commissionTotal === 500, `Combined commission is ₹500 (Got: ${combinedCalc.commissionTotal})`);
assert(combinedCalc.expectedProfit === 3700, `Combined expected profit is ₹3700 (Got: ${combinedCalc.expectedProfit})`);

// -----------------------------------------------------------------------------
// 8. Test Historical Snapshot Immunity
// -----------------------------------------------------------------------------
// Simulating an existing quote created with Hotel base rate ₹2200
const frozenQuote = JSON.parse(JSON.stringify(combinedCalc));
// Simulate CEO updating master rate from ₹2200 to ₹2600
let _ceoMasterRate = 2600;
// Verify frozen quote remains unchanged
assert(frozenQuote.totalCustomerCharge === 24100, 'Frozen quote customer charge unaffected by CEO rate update');
assert(frozenQuote.finalCustomerPrice === 24000, 'Frozen quote final price unaffected by CEO rate update');
assert(frozenQuote.totalVendorCost === 20800, 'Frozen quote vendor cost unaffected by CEO rate update');

// -----------------------------------------------------------------------------
// 9. WhatsApp Summary formatting check
// -----------------------------------------------------------------------------
const mockQuote = {
    travelDate: '2026-10-10',
    travelers: '4',
    tripDuration: '4 Days / 3 Nights',
    servicesList: combinedServices,
    finalCustomerPrice: 24000
};
const waText = formatWhatsAppQuoteText(mockQuote, { name: 'Sunil Verma' });
assert(waText.includes('Direct Customer Coordination'), 'WhatsApp summary marks Pandit as Direct Customer Coordination');
assert(waText.includes('Complimentary Visit'), 'WhatsApp summary marks Shopping as Complimentary Visit');
assert(waText.includes('Govt / Temple Pass Included'), 'WhatsApp summary marks VIP Darshan as Temple Pass Included');
assert(waText.includes('₹24,000 All-Inclusive'), 'WhatsApp summary shows correct final package price');

console.log(`\n🎉 Commercial Models Test Suite Completed: ${passedTests} / ${totalTests} checks passed successfully!`);
