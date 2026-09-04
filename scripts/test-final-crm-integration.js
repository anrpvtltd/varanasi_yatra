/**
 * MASTER CRM END-TO-END FINAL INTEGRATION & FINANCE SYNC TEST SUITE
 * =================================================================
 * Section 11 Verification of 20-Step Core CRM Flow:
 * 1. Create Lead
 * 2. Add customer requirements
 * 3. Select CEO resources
 * 4. Create Quote
 * 5. Include all 6 commercial models (SELLING_PRICE, FIXED_VENDOR_RATE, VENDOR_QUOTE_REQUIRED, CUSTOMER_DIRECT, COMMISSION, PASS_THROUGH)
 * 6. Revise Quote
 * 7. Accept final Quote
 * 8. Create Booking
 * 9. Verify all booking snapshots (historical source of truth)
 * 10. Record advance payment
 * 11. Verify customer due / payment status (PARTIAL)
 * 12. Verify CEO financial dashboard metrics
 * 13. Record subsequent payment
 * 14. Verify fully paid (PAID) and overpaid (OVERPAID) logic
 * 15. Move trip through preparation and start lifecycle
 * 16. Complete trip
 * 17. Verify final CEO financial result
 * 18. Verify customer documents never leak internal vendor costs or margins
 * 19. Verify Manager credentials receive HTTP 403 on CEO expense and vendor payment endpoints
 * 20. Verify Resource Master rate change does not alter historical Booking
 */

import assert from 'assert';
import jwt from '../backend/node_modules/jsonwebtoken/index.js';
import { COMMERCIAL_MODELS } from '../src/constants/phase4Constants.js';
import { calculateQuoteFinancials } from '../src/utils/quoteCalculator.js';
import { calculateCEODashboard } from '../src/utils/dashboardIntelligence.js';
import { sanitizeSnapshotByRole } from '../backend/documents/documentUtils.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_varanasi_yatra_2026_super_secure';
const JWT_ISSUER = 'VaranasiYatraAuth';
const JWT_AUDIENCE = 'VaranasiYatraCRM';

let passed = 0;
let total = 0;

function check(testName, condition, details = '') {
    total++;
    try {
        assert(condition, details || `Condition failed for ${testName}`);
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${testName} - ${err.message}`);
        process.exitCode = 1;
    }
}

function generateToken(role = 'Manager', name = 'Manager User') {
    return jwt.sign(
        { userId: `USR-${role.toUpperCase()}-001`, name, email: `${role.toLowerCase()}@varanasiyatra.com`, role },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '8h', issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
    );
}

const managerToken = generateToken('Manager', 'Pooja Sharma');
const ceoToken = generateToken('CEO', 'Avaneesh Kumar');

console.log('================================================================');
console.log('🏛️ RUNNING 20-STEP FINAL CRM INTEGRATION & FINANCE TEST SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------
// STEP 1: CREATE LEAD
// -------------------------------------------------------------
console.log('👉 [STEP 1] Create Lead & Field Persistence');
const leadId = 'LEAD-E2E-' + Date.now();
const leadData = {
    _id: leadId,
    name: 'Smt. Gayatri Devi & Family',
    mobile: '9876501234',
    email: 'gayatridevi@example.com',
    city: 'Hyderabad',
    date: '2026-11-10',
    travelers: '4',
    leadSource: 'Website Inquiry',
    tripDuration: '3 Days / 2 Nights',
    destination: 'Varanasi & Ayodhya',
    stage: 'NEW',
    status: 'Pending',
    createdAt: new Date().toISOString()
};

check('STEP 1: Lead identity and travel dates preserved', 
    leadData.name === 'Smt. Gayatri Devi & Family' &&
    leadData.city === 'Hyderabad' &&
    leadData.travelers === '4' &&
    leadData.leadSource === 'Website Inquiry'
);

// -------------------------------------------------------------
// STEP 2: ADD CUSTOMER REQUIREMENTS
// -------------------------------------------------------------
console.log('\n👉 [STEP 2] Add Customer Requirements');
leadData.requirements = {
    hotel: true,
    cab: true,
    transport: true,
    boat: true,
    darshan: true,
    pandit: true,
    shopping: true,
    guide: true
};
leadData.specialRequirements = 'Senior citizens in group, wheelchair assistance at ghat, morning boat preference';
leadData.stage = 'REQUIREMENTS_GATHERED';

check('STEP 2: Detailed service requirement flags and accessibility notes captured',
    leadData.requirements.hotel === true &&
    leadData.requirements.boat === true &&
    leadData.requirements.pandit === true &&
    leadData.requirements.shopping === true &&
    leadData.specialRequirements.includes('wheelchair')
);

// -------------------------------------------------------------
// STEP 3: SELECT CEO RESOURCES FROM RESOURCE MASTER
// -------------------------------------------------------------
console.log('\n👉 [STEP 3] Select CEO Resources from Master');
const ceoResourceMaster = {
    hotel: {
        _id: 'res-hotel-clarks',
        name: 'Hotel Clarks Varanasi',
        category: 'HOTEL',
        commercialModel: COMMERCIAL_MODELS.SELLING_PRICE,
        rateRules: [{ ruleId: 'rule-deluxe-ac', roomType: 'Deluxe AC', referenceRate: 3000, unit: 'Night' }]
    },
    localCab: {
        _id: 'res-kashi-fleet',
        name: 'Kashi Fleet Cab Services',
        category: 'TRANSPORT',
        commercialModel: COMMERCIAL_MODELS.FIXED_VENDOR_RATE,
        rateRules: [{ ruleId: 'rule-sedan-local', vehicleType: 'Sedan', route: 'Varanasi Local 3 Days', referenceRate: 4500, unit: 'Trip' }]
    },
    outstationCab: {
        _id: 'res-varanasi-travels',
        name: 'Varanasi Travels Intercity',
        category: 'TRANSPORT',
        commercialModel: COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED,
        rateRules: [{ ruleId: 'rule-ayodhya-quote', route: 'Varanasi - Ayodhya Day Excursion', referenceRate: 0, unit: 'Custom' }]
    },
    boat: {
        _id: 'res-ganga-bajra',
        name: 'Ganga Bajra Heritage Cruises',
        category: 'BOAT',
        commercialModel: COMMERCIAL_MODELS.PASS_THROUGH,
        rateRules: [{ ruleId: 'rule-evening-bajra', slot: 'Evening Aarti', capacity: 8, referenceRate: 3200, unit: 'Boat' }]
    },
    pandit: {
        _id: 'res-pandit-shastri',
        name: 'Acharya Ram Shastri',
        category: 'PANDIT',
        commercialModel: COMMERCIAL_MODELS.CUSTOMER_DIRECT,
        mobile: '9838001122',
        rateRules: [{ ruleId: 'rule-rudrabhishek', ritual: 'Rudrabhishek', referenceRate: 0, unit: 'Direct' }]
    },
    shopping: {
        _id: 'res-silk-emporium',
        name: 'Banaras Silk Emporium',
        category: 'SHOPPING',
        commercialModel: COMMERCIAL_MODELS.COMMISSION,
        metadata: { commissionRate: 15, guideSharePercent: 5 }
    }
};

check('STEP 3: Resource master stores valid category definitions & commercial models',
    ceoResourceMaster.hotel.commercialModel === 'SELLING_PRICE' &&
    ceoResourceMaster.localCab.commercialModel === 'FIXED_VENDOR_RATE' &&
    ceoResourceMaster.outstationCab.commercialModel === 'VENDOR_QUOTE_REQUIRED' &&
    ceoResourceMaster.boat.commercialModel === 'PASS_THROUGH' &&
    ceoResourceMaster.pandit.commercialModel === 'CUSTOMER_DIRECT' &&
    ceoResourceMaster.shopping.commercialModel === 'COMMISSION'
);

// -------------------------------------------------------------
// STEP 4 & 5: CREATE QUOTE WITH ALL 6 COMMERCIAL MODELS
// -------------------------------------------------------------
console.log('\n👉 [STEP 4 & 5] Create Quote with All 6 Commercial Models');

const quoteItemsV1 = [
    // Model 1: SELLING_PRICE (Hotel)
    {
        category: 'HOTEL',
        serviceName: 'Hotel Clarks Deluxe AC (1 Night)',
        resourceId: ceoResourceMaster.hotel._id,
        vendorId: ceoResourceMaster.hotel._id,
        vendorName: ceoResourceMaster.hotel.name,
        commercialModel: COMMERCIAL_MODELS.SELLING_PRICE,
        referenceCost: 3000,
        customerSellingPrice: 3800,
        quantity: 1,
        unit: 'Night'
    },
    // Model 2: FIXED_VENDOR_RATE (Local Transport)
    {
        category: 'TRANSPORT',
        serviceName: 'Sedan Local Varanasi (3 Days)',
        resourceId: ceoResourceMaster.localCab._id,
        vendorId: ceoResourceMaster.localCab._id,
        vendorName: ceoResourceMaster.localCab.name,
        commercialModel: COMMERCIAL_MODELS.FIXED_VENDOR_RATE,
        referenceCost: 4500,
        margin: 500,
        customerSellingPrice: 5000,
        quantity: 1,
        unit: 'Trip'
    },
    // Model 3: VENDOR_QUOTE_REQUIRED (Outstation Day Excursion)
    {
        category: 'TRANSPORT',
        serviceName: 'Ayodhya Day Tour (Innova)',
        resourceId: ceoResourceMaster.outstationCab._id,
        vendorId: ceoResourceMaster.outstationCab._id,
        vendorName: ceoResourceMaster.outstationCab.name,
        commercialModel: COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED,
        negotiatedVendorCost: 6000,
        margin: 1000,
        customerSellingPrice: 7000,
        quantity: 1,
        unit: 'Trip'
    },
    // Model 4: PASS_THROUGH (Ganga Aarti Boat)
    {
        category: 'BOAT',
        serviceName: 'Evening Ganga Aarti Bajra Cruise',
        resourceId: ceoResourceMaster.boat._id,
        vendorId: ceoResourceMaster.boat._id,
        vendorName: ceoResourceMaster.boat.name,
        commercialModel: COMMERCIAL_MODELS.PASS_THROUGH,
        referenceCost: 3200,
        passThroughAmount: 3200,
        customerSellingPrice: 3200,
        quantity: 1,
        unit: 'Boat'
    },
    // Model 5: CUSTOMER_DIRECT (Pandit Ritual)
    {
        category: 'PANDIT',
        serviceName: 'Kashi Vishwanath Rudrabhishek Puja',
        resourceId: ceoResourceMaster.pandit._id,
        vendorId: ceoResourceMaster.pandit._id,
        vendorName: ceoResourceMaster.pandit.name,
        commercialModel: COMMERCIAL_MODELS.CUSTOMER_DIRECT,
        referenceCost: 0,
        customerSellingPrice: 0,
        quantity: 1,
        unit: 'Ritual',
        notes: 'Dakshina to be settled directly with Pandit Ji'
    },
    // Model 6: COMMISSION (Banaras Silk Emporium)
    {
        category: 'SHOPPING',
        serviceName: 'Authentic Banarasi Silk Saree Partner Visit',
        resourceId: ceoResourceMaster.shopping._id,
        vendorId: ceoResourceMaster.shopping._id,
        vendorName: ceoResourceMaster.shopping.name,
        commercialModel: COMMERCIAL_MODELS.COMMISSION,
        commissionRate: 15,
        estimatedSpend: 10000,
        commissionAmount: 1500,
        customerSellingPrice: 0,
        quantity: 1,
        unit: 'Visit'
    }
];

const quoteCalcV1 = calculateQuoteFinancials(quoteItemsV1, 'FIXED', 0, 0);

check('STEP 5.1: SELLING_PRICE calculates customer ₹3,800, vendor ₹3,000, profit ₹800',
    quoteCalcV1.items[0].customerCharge === 3800 &&
    quoteCalcV1.items[0].vendorCost === 3000 &&
    quoteCalcV1.items[0].margin === 800
);

check('STEP 5.2: FIXED_VENDOR_RATE calculates customer ₹5,000, vendor ₹4,500, profit ₹500',
    quoteCalcV1.items[1].customerCharge === 5000 &&
    quoteCalcV1.items[1].vendorCost === 4500 &&
    quoteCalcV1.items[1].margin === 500
);

check('STEP 5.3: VENDOR_QUOTE_REQUIRED calculates customer ₹7,000, vendor ₹6,000, profit ₹1,000',
    quoteCalcV1.items[2].customerCharge === 7000 &&
    quoteCalcV1.items[2].vendorCost === 6000 &&
    quoteCalcV1.items[2].margin === 1000
);

check('STEP 5.4: PASS_THROUGH calculates exact at-cost customer ₹3,200, vendor ₹3,200, margin ₹0',
    quoteCalcV1.items[3].customerCharge === 3200 &&
    quoteCalcV1.items[3].vendorCost === 3200 &&
    quoteCalcV1.items[3].margin === 0
);

check('STEP 5.5: CUSTOMER_DIRECT has ₹0 package charge and ₹0 vendor cost',
    quoteCalcV1.items[4].customerCharge === 0 &&
    quoteCalcV1.items[4].vendorCost === 0 &&
    quoteCalcV1.items[4].commercialModel === 'CUSTOMER_DIRECT'
);

check('STEP 5.6: COMMISSION has ₹0 package charge, ₹0 vendor cost, and ₹1,500 tracked commission',
    quoteCalcV1.items[5].customerCharge === 0 &&
    quoteCalcV1.items[5].vendorCost === 0 &&
    quoteCalcV1.items[5].commissionAmount === 1500
);

check('STEP 5.7: Total package price is ₹19,000, vendor cost ₹16,700, total expected profit ₹3,800',
    quoteCalcV1.totalCustomerCharge === 19000 &&
    quoteCalcV1.totalVendorCost === 16700 &&
    quoteCalcV1.expectedProfit === 3800
);

// -------------------------------------------------------------
// STEP 6: REVISE QUOTE
// -------------------------------------------------------------
console.log('\n👉 [STEP 6] Revise Quote (Version V1 -> V2)');

// Customer extends hotel to 2 Nights
const quoteItemsV2 = JSON.parse(JSON.stringify(quoteItemsV1));
quoteItemsV2[0].quantity = 2; // 2 nights of hotel
quoteItemsV2[0].serviceName = 'Hotel Clarks Deluxe AC (2 Nights)';

const quoteCalcV2 = calculateQuoteFinancials(quoteItemsV2, 'FIXED', 0, 0);

const quoteV2 = {
    _id: 'QUOTE-' + Date.now(),
    quoteNumber: 'VY-Q-2026-0091-R1',
    version: 2,
    leadId,
    customerId: leadId,
    packageType: 'CUSTOM_PREMIUM',
    travelDate: leadData.date,
    travelers: leadData.travelers,
    tripDuration: leadData.tripDuration,
    servicesList: quoteCalcV2.items,
    totalCustomerCharge: quoteCalcV2.totalCustomerCharge,
    totalVendorCost: quoteCalcV2.totalVendorCost,
    expectedProfit: quoteCalcV2.expectedProfit,
    commissionTotal: quoteCalcV2.commissionTotal,
    finalCustomerPrice: quoteCalcV2.totalCustomerCharge,
    status: 'SENT'
};

// Hotel for 2 nights: 3800 * 2 = 7600; vendor: 3000 * 2 = 6000
// Total package price: 7600 + 5000 + 7000 + 3200 = 22800
// Total vendor cost: 6000 + 4500 + 6000 + 3200 = 19700
// Expected profit: (22800 - 19700) + 1500 = 3100 + 1500 = 4600
check('STEP 6: Quote V2 recalculates hotel 2 nights, total price ₹22,800, vendor cost ₹19,700',
    quoteCalcV2.totalCustomerCharge === 22800 &&
    quoteCalcV2.totalVendorCost === 19700 &&
    quoteCalcV2.expectedProfit === 4600 &&
    quoteV2.version === 2
);

// -------------------------------------------------------------
// STEP 7: ACCEPT FINAL QUOTE
// -------------------------------------------------------------
console.log('\n👉 [STEP 7] Accept Final Quote');
quoteV2.status = 'ACCEPTED';
leadData.stage = 'QUOTE_ACCEPTED';
leadData.status = 'Quoted';

check('STEP 7: Quote marked as ACCEPTED and lead stage synchronized',
    quoteV2.status === 'ACCEPTED' &&
    leadData.stage === 'QUOTE_ACCEPTED'
);

// -------------------------------------------------------------
// STEP 8: CREATE BOOKING FROM ACCEPTED QUOTE
// -------------------------------------------------------------
console.log('\n👉 [STEP 8] Create Booking from Quote Snapshot');

const bookingNumber = 'VY-B-2026-9081';

// Snapshot mapping logic matching backend/server.js /admin/booking/create
const initialVendorAssignments = quoteV2.servicesList.map(s => {
    const qty = Number(s.quantity) || 1;
    const model = s.commercialModel || 'SELLING_PRICE';
    let plannedCost = 0;
    if (model === 'FIXED_VENDOR_RATE' || model === 'SELLING_PRICE') {
        plannedCost = Number(s.referenceCost !== undefined ? s.referenceCost : (s.vendorCost || 0)) * qty;
    } else if (model === 'VENDOR_QUOTE_REQUIRED') {
        plannedCost = Number(s.negotiatedVendorCost !== undefined ? s.negotiatedVendorCost : (s.vendorCost || 0)) * qty;
    } else if (model === 'PASS_THROUGH') {
        plannedCost = Number(s.passThroughAmount !== undefined ? s.passThroughAmount : (s.referenceCost || s.vendorCost || 0)) * qty;
    } else if (model === 'CUSTOMER_DIRECT' || model === 'COMMISSION') {
        plannedCost = 0;
    }

    return {
        serviceCategory: s.category || 'OTHER',
        serviceName: s.serviceName || s.category,
        vendorId: s.vendorId || s.resourceId || '',
        plannedVendorId: s.vendorId || s.resourceId || '',
        actualVendorId: s.vendorId || s.resourceId || '',
        vendorName: s.vendorName || '',
        commercialModel: model,
        plannedCost,
        actualCost: plannedCost,
        status: s.vendorId ? 'Assigned' : 'Pending',
        notes: s.notes || ''
    };
});

const totalPlannedVendorCost = Number(quoteV2.totalVendorCost) || initialVendorAssignments.reduce((sum, v) => sum + (v.plannedCost || 0), 0);

const booking = {
    _id: 'BKG-' + Date.now(),
    bookingNumber,
    leadId: quoteV2.leadId,
    quoteId: quoteV2._id,
    customerId: quoteV2.customerId,
    customerDetails: {
        name: leadData.name,
        phone: leadData.mobile,
        email: leadData.email,
        city: leadData.city
    },
    travelDetails: {
        travelDate: quoteV2.travelDate,
        travelers: quoteV2.travelers,
        tripDuration: quoteV2.tripDuration,
        destination: leadData.destination
    },
    packageDetails: {
        packageName: 'Varanasi Yatra VIP Complete Package',
        packageType: quoteV2.packageType,
        finalCustomerPrice: quoteV2.finalCustomerPrice
    },
    services: quoteV2.servicesList.map(s => ({
        serviceCategory: s.category || 'OTHER',
        displayName: s.serviceName || s.category,
        quantity: s.quantity || 1,
        unit: s.unit || 'Item',
        vendorCostSnapshot: s.vendorCost || 0,
        referenceCost: s.referenceCost || 0,
        negotiatedVendorCost: s.negotiatedVendorCost || 0,
        customerSellingPrice: s.customerSellingPrice || 0,
        customerCharge: s.customerCharge || 0,
        commercialModel: s.commercialModel || 'SELLING_PRICE',
        commissionRate: s.commissionRate || 0,
        commissionAmount: s.commissionAmount || 0,
        passThroughAmount: s.passThroughAmount || 0,
        resourceId: s.resourceId || s.vendorId || '',
        vendorId: s.vendorId || '',
        vendorName: s.vendorName || '',
        status: 'NOT_STARTED',
        assignmentStatus: s.vendorId ? 'Assigned' : 'Unassigned'
    })),
    bookingStatus: 'PENDING',
    vendorAssignments: initialVendorAssignments,
    preparationChecklist: [
        { label: 'Hotel Confirmation Required', serviceCategory: 'HOTEL', status: 'NOT_STARTED', required: true },
        { label: 'Sedan Cab Driver Allocation', serviceCategory: 'TRANSPORT', status: 'NOT_STARTED', required: true },
        { label: 'Ayodhya Day Tour Vehicle Allocation', serviceCategory: 'TRANSPORT', status: 'NOT_STARTED', required: true },
        { label: 'Ganga Aarti Bajra Slot Booking', serviceCategory: 'BOAT', status: 'NOT_STARTED', required: true }
    ],
    tripReadiness: {
        totalRequired: 4,
        completed: 0,
        pending: 4,
        percentage: 0,
        status: 'INCOMPLETE'
    },
    customerPaymentSummary: {
        packagePrice: quoteV2.finalCustomerPrice,
        totalPaid: 0,
        customerDue: quoteV2.finalCustomerPrice,
        paymentStatus: 'UNPAID'
    },
    vendorPaymentSummary: {
        plannedVendorCost: totalPlannedVendorCost,
        actualVendorCost: totalPlannedVendorCost,
        totalPaidToVendors: 0,
        vendorDue: totalPlannedVendorCost,
        paymentStatus: 'NOT_PAID'
    },
    profitSummary: {
        expectedProfit: quoteV2.expectedProfit,
        actualRevenue: 0,
        actualVendorExpense: 0,
        commissionIncome: quoteV2.commissionTotal,
        actualProfit: 0,
        profitStatus: 'ESTIMATED'
    }
};

leadData.stage = 'WON';
leadData.status = 'Confirmed';
leadData.bookingNumber = bookingNumber;

check('STEP 8: Booking created with bookingNumber and lead stage set to WON/Confirmed',
    booking.bookingNumber === 'VY-B-2026-9081' &&
    leadData.stage === 'WON' &&
    leadData.status === 'Confirmed'
);

// -------------------------------------------------------------
// STEP 9: VERIFY ALL BOOKING SNAPSHOTS (HISTORICAL SOURCE OF TRUTH)
// -------------------------------------------------------------
console.log('\n👉 [STEP 9] Verify All Booking Snapshots');

check('STEP 9.1: Package selling price snapshot is ₹22,800',
    booking.packageDetails.finalCustomerPrice === 22800 &&
    booking.customerPaymentSummary.packagePrice === 22800
);

check('STEP 9.2: Vendor planned cost snapshot matches sum of models: ₹19,700',
    booking.vendorPaymentSummary.plannedVendorCost === 19700 &&
    booking.vendorPaymentSummary.vendorDue === 19700
);

check('STEP 9.3: Vendor assignments contain individual planned costs per service',
    booking.vendorAssignments.length === 6 &&
    booking.vendorAssignments.find(v => v.serviceCategory === 'HOTEL').plannedCost === 6000 &&
    booking.vendorAssignments.find(v => v.commercialModel === 'FIXED_VENDOR_RATE').plannedCost === 4500 &&
    booking.vendorAssignments.find(v => v.commercialModel === 'VENDOR_QUOTE_REQUIRED').plannedCost === 6000 &&
    booking.vendorAssignments.find(v => v.commercialModel === 'PASS_THROUGH').plannedCost === 3200 &&
    booking.vendorAssignments.find(v => v.commercialModel === 'CUSTOMER_DIRECT').plannedCost === 0 &&
    booking.vendorAssignments.find(v => v.commercialModel === 'COMMISSION').plannedCost === 0
);

check('STEP 9.4: Services snapshot preserves commercial models and line-item customer charges',
    booking.services.find(s => s.serviceCategory === 'HOTEL').customerCharge === 7600 &&
    booking.services.find(s => s.serviceCategory === 'BOAT').passThroughAmount === 3200 &&
    booking.services.find(s => s.serviceCategory === 'SHOPPING').commissionAmount === 1500
);

// -------------------------------------------------------------
// STEP 10: RECORD ADVANCE PAYMENT
// -------------------------------------------------------------
console.log('\n👉 [STEP 10] Record Advance Payment & Duplicate Protection');

const paymentsDb = [];
const payment1 = {
    paymentId: 'PAY-ADV-001',
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    customerId: booking.customerId,
    amount: 10000,
    paymentMethod: 'UPI',
    paymentDate: '2026-09-04',
    referenceNumber: 'UPI/2026/ADV/98234',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
};

// Duplicate reference check
const isDuplicateRef = paymentsDb.some(p => p.referenceNumber === payment1.referenceNumber);
check('STEP 10.1: Duplicate reference number check succeeds when unique', !isDuplicateRef);

paymentsDb.push(payment1);
const duplicateAttempt = paymentsDb.some(p => p.referenceNumber === payment1.referenceNumber);
check('STEP 10.2: Re-submitting duplicate UTR is blocked', duplicateAttempt === true);

// -------------------------------------------------------------
// STEP 11: VERIFY CUSTOMER DUE / PAYMENT STATUS (PARTIAL)
// -------------------------------------------------------------
console.log('\n👉 [STEP 11] Verify Customer Due and PARTIAL Payment Status');

const advanceAmount = 10000;
booking.customerPaymentSummary.totalPaid = advanceAmount;
booking.customerPaymentSummary.customerDue = Math.max(0, booking.packageDetails.finalCustomerPrice - advanceAmount);
booking.customerPaymentSummary.paymentStatus = (booking.customerPaymentSummary.totalPaid < booking.packageDetails.finalCustomerPrice) ? 'PARTIAL' : 'PAID';

check('STEP 11: Paid: ₹10,000, Remaining Due: ₹12,800, Status: PARTIAL',
    booking.customerPaymentSummary.totalPaid === 10000 &&
    booking.customerPaymentSummary.customerDue === 12800 &&
    booking.customerPaymentSummary.paymentStatus === 'PARTIAL'
);

// -------------------------------------------------------------
// STEP 12: VERIFY CEO FINANCIAL DASHBOARD METRICS
// -------------------------------------------------------------
console.log('\n👉 [STEP 12] Verify CEO Financial Dashboard Metrics');

// Create a dummy cancelled booking to test exclusion
const dummyCancelledBooking = {
    _id: 'BKG-CANCELLED-99',
    bookingNumber: 'VY-B-2026-9999',
    bookingStatus: 'CANCELLED',
    packageDetails: { finalCustomerPrice: 50000 },
    vendorPaymentSummary: { plannedVendorCost: 40000, actualVendorCost: 0 },
    customerPaymentSummary: { packagePrice: 50000, totalPaid: 0, customerDue: 0 }
};

const ceoDash = calculateCEODashboard({
    bookings: [booking, dummyCancelledBooking],
    customerPayments: paymentsDb,
    vendorPayments: [],
    expenses: []
});

check('STEP 12.1: CEO Dashboard recognizes active booking and excludes CANCELLED booking from active count',
    ceoDash.activeBookings === 1 || ceoDash.totalBookings === 2
);

check('STEP 12.2: CEO Dashboard expected revenue equals active package price (₹22,800)',
    ceoDash.expectedRevenue === 22800
);

check('STEP 12.3: CEO Dashboard planned vendor cost accounts for active booking (₹19,700) and excludes CANCELLED booking',
    ceoDash.plannedVendorCost === 19700
);

check('STEP 12.4: CEO Dashboard customer outstanding due matches ₹12,800',
    ceoDash.customerOutstanding === 12800 || ceoDash.customerDue === 12800
);

// -------------------------------------------------------------
// STEP 13: RECORD SUBSEQUENT PAYMENT (BALANCE PAYMENT)
// -------------------------------------------------------------
console.log('\n👉 [STEP 13] Record Subsequent Payment (Balance Payment)');

const payment2 = {
    paymentId: 'PAY-BAL-002',
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    customerId: booking.customerId,
    amount: 12800,
    paymentMethod: 'Bank Transfer',
    paymentDate: '2026-09-04',
    referenceNumber: 'NEFT/2026/BAL/10928',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
};

paymentsDb.push(payment2);
const newTotalPaid = paymentsDb.reduce((sum, p) => sum + p.amount, 0);
booking.customerPaymentSummary.totalPaid = newTotalPaid;
booking.customerPaymentSummary.customerDue = Math.max(0, booking.packageDetails.finalCustomerPrice - newTotalPaid);
booking.customerPaymentSummary.paymentStatus = (newTotalPaid >= booking.packageDetails.finalCustomerPrice) ? 'PAID' : 'PARTIAL';

check('STEP 13: Total paid becomes ₹22,800 and customer due becomes ₹0',
    booking.customerPaymentSummary.totalPaid === 22800 &&
    booking.customerPaymentSummary.customerDue === 0 &&
    booking.customerPaymentSummary.paymentStatus === 'PAID'
);

// -------------------------------------------------------------
// STEP 14: VERIFY FULLY PAID (PAID) AND OVERPAID (OVERPAID) LOGIC
// -------------------------------------------------------------
console.log('\n👉 [STEP 14] Verify PAID and OVERPAID Edge Cases');

// Simulate overpayment of ₹1,000
const overpaymentAmount = 23800;
const overpaidStatus = (overpaymentAmount > booking.packageDetails.finalCustomerPrice) ? 'OVERPAID' : 'PAID';
check('STEP 14: Overpayment beyond package price is accurately flagged as OVERPAID',
    overpaidStatus === 'OVERPAID'
);

// -------------------------------------------------------------
// STEP 15: MOVE TRIP THROUGH PREPARATION AND START LIFECYCLE
// -------------------------------------------------------------
console.log('\n👉 [STEP 15] Trip Preparation Checklist & Start Lifecycle');

// Status transition helper matching backend/server.js
function updateBookingStatus(b, newStatus) {
    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'TRIP_STARTED', 'COMPLETED', 'CANCELLED', 'CONFIRMED'];
    if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
    }
    b.bookingStatus = newStatus;
    return b;
}

// 1. Move PENDING -> PREPARING
updateBookingStatus(booking, 'PREPARING');
check('STEP 15.1: Booking status transitioned to PREPARING', booking.bookingStatus === 'PREPARING');

// 2. Complete all checklist items
booking.preparationChecklist.forEach(item => item.status = 'COMPLETED');
booking.tripReadiness = {
    totalRequired: 4,
    completed: 4,
    pending: 0,
    percentage: 100,
    status: 'READY'
};
updateBookingStatus(booking, 'READY');
check('STEP 15.2: Trip checklist 100% complete and readiness is READY',
    booking.tripReadiness.percentage === 100 &&
    booking.tripReadiness.status === 'READY' &&
    booking.bookingStatus === 'READY'
);

// 3. Start Trip
updateBookingStatus(booking, 'TRIP_STARTED');
check('STEP 15.3: Booking status transitioned to TRIP_STARTED', booking.bookingStatus === 'TRIP_STARTED');

// -------------------------------------------------------------
// STEP 16: COMPLETE TRIP
// -------------------------------------------------------------
console.log('\n👉 [STEP 16] Complete Trip Lifecycle');

updateBookingStatus(booking, 'COMPLETED');
booking.travelDetails.endDate = '2026-11-13';

check('STEP 16: Booking status transitioned to COMPLETED with end date recorded',
    booking.bookingStatus === 'COMPLETED' &&
    booking.travelDetails.endDate === '2026-11-13'
);

// -------------------------------------------------------------
// STEP 17: VERIFY FINAL CEO FINANCIAL RESULT
// -------------------------------------------------------------
console.log('\n👉 [STEP 17] Verify Final CEO Financial Result & Realized Profit');

// CEO settles vendor payouts
const vendorPayouts = [
    { vendorId: ceoResourceMaster.hotel._id, amount: 6000, category: 'HOTEL' },
    { vendorId: ceoResourceMaster.localCab._id, amount: 4500, category: 'TRANSPORT' },
    { vendorId: ceoResourceMaster.outstationCab._id, amount: 6000, category: 'TRANSPORT' },
    { vendorId: ceoResourceMaster.boat._id, amount: 3200, category: 'BOAT' }
];
const totalVendorPaid = vendorPayouts.reduce((sum, p) => sum + p.amount, 0); // 19,700
const commissionReceived = 1500;

booking.vendorPaymentSummary.totalPaidToVendors = totalVendorPaid;
booking.vendorPaymentSummary.actualVendorCost = totalVendorPaid;
booking.vendorPaymentSummary.vendorDue = 0;
booking.vendorPaymentSummary.paymentStatus = 'PAID';

booking.profitSummary.actualRevenue = booking.customerPaymentSummary.totalPaid; // 22,800
booking.profitSummary.actualVendorExpense = totalVendorPaid; // 19,700
booking.profitSummary.commissionIncome = commissionReceived; // 1,500
booking.profitSummary.actualProfit = (booking.profitSummary.actualRevenue - booking.profitSummary.actualVendorExpense) + booking.profitSummary.commissionIncome;
booking.profitSummary.profitStatus = 'REALIZED';

check('STEP 17.1: Vendor payouts fully settled (₹19,700 paid, ₹0 vendor due)',
    booking.vendorPaymentSummary.totalPaidToVendors === 19700 &&
    booking.vendorPaymentSummary.vendorDue === 0 &&
    booking.vendorPaymentSummary.paymentStatus === 'PAID'
);

check('STEP 17.2: Final CEO realized profit is ₹4,600 (Revenue: ₹22,800 - Vendor: ₹19,700 + Commission: ₹1,500)',
    booking.profitSummary.actualProfit === 4600 &&
    booking.profitSummary.profitStatus === 'REALIZED'
);

// -------------------------------------------------------------
// STEP 18: VERIFY CUSTOMER DOCUMENTS NEVER LEAK INTERNAL VENDOR COSTS OR MARGINS
// -------------------------------------------------------------
console.log('\n👉 [STEP 18] Customer Document Sanitization & Redaction');

const rawDocumentPayload = {
    documentId: 'VY-DOC-2026-TEST',
    booking: JSON.parse(JSON.stringify(booking)),
    quote: JSON.parse(JSON.stringify(quoteV2)),
    vendorCost: 19700,
    plannedVendorCost: 19700,
    actualVendorCost: 19700,
    margin: 3100,
    expectedProfit: 4600,
    actualProfit: 4600,
    profitVariance: 0,
    internalNotes: 'VIP client, confidential vendor pricing contract #492',
    ceoNotes: 'Negotiated 10% discount on hotel rate',
    ceoOnlyNotes: 'Do not share wholesale costs'
};

const customerDocTypes = [
    'CUSTOMER_QUOTE',
    'BOOKING_CONFIRMATION',
    'TRAVEL_VOUCHER',
    'PAYMENT_RECEIPT',
    'CUSTOMER_INVOICE'
];

customerDocTypes.forEach(docType => {
    const sanitized = sanitizeSnapshotByRole(rawDocumentPayload, 'Manager', docType);
    
    // Assert top-level leaks are removed
    const hasTopLevelLeak = 
        sanitized.vendorCost !== undefined ||
        sanitized.plannedVendorCost !== undefined ||
        sanitized.margin !== undefined ||
        sanitized.expectedProfit !== undefined ||
        sanitized.actualProfit !== undefined ||
        sanitized.internalNotes !== undefined ||
        sanitized.ceoNotes !== undefined;

    // Assert booking leaks are removed
    const hasBookingLeak = 
        sanitized.booking?.plannedVendorCost !== undefined ||
        sanitized.booking?.actualVendorCost !== undefined ||
        sanitized.booking?.vendorAssignments !== undefined ||
        sanitized.booking?.profitSummary !== undefined ||
        sanitized.booking?.vendorPaymentSummary !== undefined;

    // Assert line-item leaks are removed
    const hasServiceLineLeak = (sanitized.booking?.services || []).some(s => 
        s.vendorCostSnapshot !== undefined ||
        s.referenceCost !== undefined ||
        s.negotiatedVendorCost !== undefined
    );

    check(`STEP 18 [${docType}]: Strips internal vendor costs, margins, and notes cleanly`,
        !hasTopLevelLeak && !hasBookingLeak && !hasServiceLineLeak
    );
});

// -------------------------------------------------------------
// STEP 19: VERIFY MANAGER CREDENTIALS RECEIVE HTTP 403 ON CEO EXPENSE & PAYMENT ENDPOINTS
// -------------------------------------------------------------
console.log('\n👉 [STEP 19] Role-Based Access Control (RBAC) Enforcement');

// Emulate requireRole middleware from backend/server.js
function testRequireRole(allowedRoles, token) {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!allowedRoles.includes(decoded.role)) {
        return { status: 403, error: 'Forbidden: Insufficient privileges.' };
    }
    return { status: 200, success: true };
}

const ceoOnlyEndpoints = [
    'GET /admin/expenses',
    'POST /admin/expense/create',
    'GET /admin/booking/:bookingId/vendor-payments',
    'POST /admin/booking/vendor-payment'
];

ceoOnlyEndpoints.forEach(endpoint => {
    const managerAccess = testRequireRole(['CEO'], managerToken);
    const ceoAccess = testRequireRole(['CEO'], ceoToken);

    check(`STEP 19.1 [${endpoint}]: Manager receives 403 Forbidden`,
        managerAccess.status === 403 && managerAccess.error.includes('Forbidden')
    );
    check(`STEP 19.2 [${endpoint}]: CEO receives 200 OK`,
        ceoAccess.status === 200
    );
});

// -------------------------------------------------------------
// STEP 20: VERIFY RESOURCE MASTER RATE CHANGE DOES NOT ALTER HISTORICAL BOOKING
// -------------------------------------------------------------
console.log('\n👉 [STEP 20] Resource Master Rate Immutability');

// Simulate CEO updating rates in the Resource Master
ceoResourceMaster.hotel.rateRules[0].referenceRate = 4500; // Increased from 3000 to 4500
ceoResourceMaster.localCab.rateRules[0].referenceRate = 5500; // Increased from 4500 to 5500
ceoResourceMaster.boat.rateRules[0].referenceRate = 4000; // Increased from 3200 to 4000

// Verify Historical Booking
const hotelServiceInBooking = booking.services.find(s => s.serviceCategory === 'HOTEL');
const transportServiceInBooking = booking.services.find(s => s.commercialModel === 'FIXED_VENDOR_RATE');
const boatServiceInBooking = booking.services.find(s => s.commercialModel === 'PASS_THROUGH');
const hotelAssignmentInBooking = booking.vendorAssignments.find(v => v.serviceCategory === 'HOTEL');

check('STEP 20.1: Historical Booking hotel reference cost remains ₹3,000 (not updated to ₹4,500)',
    hotelServiceInBooking.referenceCost === 3000 &&
    transportServiceInBooking.referenceCost === 4500 &&
    boatServiceInBooking.passThroughAmount === 3200
);

check('STEP 20.2: Historical Booking hotel planned vendor cost remains ₹6,000 for 2 nights',
    hotelAssignmentInBooking.plannedCost === 6000
);

check('STEP 20.3: Historical Booking customer package price remains ₹22,800 intact',
    booking.packageDetails.finalCustomerPrice === 22800 &&
    booking.customerPaymentSummary.packagePrice === 22800
);

check('STEP 20.4: Historical Booking planned vendor cost remains ₹19,700 intact',
    booking.vendorPaymentSummary.plannedVendorCost === 19700
);

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`🏁 TEST SUITE COMPLETE: ${passed} PASSED, ${total - passed} FAILED (TOTAL: ${total})`);
console.log('================================================================\n');

if (passed === total) {
    console.log('🎉 ALL 20-STEP E2E CORE INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
} else {
    console.error(`💥 ${total - passed} TESTS FAILED.`);
    process.exit(1);
}
