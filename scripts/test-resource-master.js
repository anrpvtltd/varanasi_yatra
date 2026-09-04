/**
 * scripts/test-resource-master.js
 * Comprehensive automated verification for Prompt 2: CEO Resource Master + Rate/Rule Management.
 * 
 * Verifies:
 * 1. Hotel Master: multiple hotels, multiple room rates (AC/Non-AC), snapshot immunity.
 * 2. Transport Master: vehicle types, FIXED_VENDOR_RATE vs VENDOR_QUOTE_REQUIRED.
 * 3. Pandit Master: contact stored, CUSTOMER_DIRECT, ₹0 in package charge.
 * 4. Boat Master: capacity, route/distance, and slot rate rules.
 * 5. Guide Master: languages, daily reference rate, shopping partner link.
 * 6. Shopping Partner: COMMISSION model, zero package price, commission tracked.
 * 7. Darshan / Pass Master: PASS_THROUGH model, 0% company margin.
 * 8. Lead Partner: simple registry, agency agreement, create/update/deactivate.
 * 9. Role Security: CEO allowed write, Manager read-only, Manager write blocked (403).
 * 10. Privacy & Status Filter: CEO-only notes scrubbed for Manager; Inactive hidden from new selection.
 */

import assert from 'assert';
import {
    CATEGORY_DEFAULT_COMMERCIAL_MODELS
} from '../src/constants/phase4Constants.js';
import { calculateQuoteFinancials } from '../src/utils/quoteCalculator.js';

// In-Memory Database Simulation mirroring backend/server.js VendorSchema & Controller Logic
class MockVendorDatabase {
    constructor() {
        this.vendors = new Map();
        this.quotes = new Map();
        this.idCounter = 1000;
    }

    // Role-based auth check
    checkRole(user, allowedRoles) {
        if (!user || !allowedRoles.includes(user.role)) {
            const err = new Error('Access denied: insufficient permissions');
            err.statusCode = 403;
            throw err;
        }
    }

    // CREATE VENDOR (CEO only)
    createVendor(user, data) {
        this.checkRole(user, ['CEO']);

        const effectiveName = data.businessName || data.name;
        const effectivePhone = data.phone || data.mobile;

        if (!data.category || !effectiveName || !effectivePhone) {
            const err = new Error('category, businessName, and phone/mobile are required.');
            err.statusCode = 400;
            throw err;
        }

        this.idCounter++;
        const vendorId = `vnd_${this.idCounter}`;
        const vendorCode = `VY-V-${this.idCounter}`;

        const newVendor = {
            _id: vendorId,
            vendorCode,
            category: data.category.toUpperCase(),
            businessName: effectiveName,
            name: effectiveName,
            contactPerson: data.contactPerson || '',
            phone: effectivePhone,
            mobile: effectivePhone,
            alternatePhone: data.alternatePhone || '',
            email: data.email || '',
            city: data.city || 'Varanasi',
            location: data.city || 'Varanasi',
            address: data.address || '',
            status: 'ACTIVE',
            availabilityStatus: 'Active',
            baseRate: Number(data.baseRate) || 0,
            commercialModel: data.commercialModel || CATEGORY_DEFAULT_COMMERCIAL_MODELS[data.category.toUpperCase()] || 'SELLING_PRICE',
            notes: data.notes || '',
            rateRules: data.rateRules ? JSON.parse(JSON.stringify(data.rateRules)) : [],
            services: data.services ? JSON.parse(JSON.stringify(data.services)) : [],
            metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : {},
            createdAt: new Date().toISOString()
        };

        this.vendors.set(vendorId, newVendor);
        return JSON.parse(JSON.stringify(newVendor));
    }

    // UPDATE VENDOR (CEO only)
    updateVendor(user, id, updateData) {
        this.checkRole(user, ['CEO']);

        const existing = this.vendors.get(id);
        if (!existing) {
            const err = new Error('Vendor not found.');
            err.statusCode = 404;
            throw err;
        }

        const updated = {
            ...existing,
            ...updateData,
            rateRules: updateData.rateRules ? JSON.parse(JSON.stringify(updateData.rateRules)) : existing.rateRules,
            metadata: updateData.metadata ? { ...existing.metadata, ...updateData.metadata } : existing.metadata
        };

        this.vendors.set(id, updated);
        return JSON.parse(JSON.stringify(updated));
    }

    // UPDATE VENDOR STATUS (CEO only)
    updateVendorStatus(user, id, status) {
        this.checkRole(user, ['CEO']);

        const existing = this.vendors.get(id);
        if (!existing) {
            const err = new Error('Vendor not found.');
            err.statusCode = 404;
            throw err;
        }

        const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        const newStatus = (status || '').toUpperCase();
        if (!validStatuses.includes(newStatus)) {
            const err = new Error('Invalid status.');
            err.statusCode = 400;
            throw err;
        }

        existing.status = newStatus;
        existing.availabilityStatus = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
        this.vendors.set(id, existing);
        return JSON.parse(JSON.stringify(existing));
    }

    // GET VENDORS (CEO & Manager allowed, Manager sanitization & default active)
    getVendors(user, query = {}) {
        this.checkRole(user, ['CEO', 'Manager']);

        let list = Array.from(this.vendors.values());

        // Category filter (handles aliases)
        if (query.category && query.category !== 'ALL') {
            const catUpper = query.category.toUpperCase();
            if (catUpper === 'BOAT' || catUpper === 'BOAT_RIDE') {
                list = list.filter(v => ['BOAT', 'BOAT_RIDE'].includes(v.category));
            } else if (catUpper === 'GUIDE' || catUpper === 'TOUR_GUIDE') {
                list = list.filter(v => ['GUIDE', 'TOUR_GUIDE'].includes(v.category));
            } else if (catUpper === 'SHOPPING' || catUpper === 'SHOPPING_PARTNER') {
                list = list.filter(v => ['SHOPPING', 'SHOPPING_PARTNER'].includes(v.category));
            } else if (catUpper === 'DARSHAN' || catUpper === 'VIP_DARSHAN') {
                list = list.filter(v => ['DARSHAN', 'VIP_DARSHAN'].includes(v.category));
            } else {
                list = list.filter(v => v.category === catUpper);
            }
        }

        // Status filter: If Manager and no status requested, default to ACTIVE only
        if (query.status && query.status !== 'ALL') {
            const st = query.status.toUpperCase();
            list = list.filter(v => v.status === st || v.availabilityStatus === query.status);
        } else if (user.role === 'Manager') {
            list = list.filter(v => v.status === 'ACTIVE' || v.availabilityStatus === 'Active');
        }

        // Sensitive data sanitization for Manager
        if (user.role === 'Manager') {
            list = list.map(v => {
                const copy = JSON.parse(JSON.stringify(v));
                if (copy.metadata && copy.metadata.ceoOnlyNotes) {
                    delete copy.metadata.ceoOnlyNotes;
                }
                return copy;
            });
        }

        return JSON.parse(JSON.stringify(list));
    }

    // GET SINGLE VENDOR
    getVendorById(user, id) {
        this.checkRole(user, ['CEO', 'Manager']);

        const existing = this.vendors.get(id);
        if (!existing) {
            const err = new Error('Vendor not found.');
            err.statusCode = 404;
            throw err;
        }

        const copy = JSON.parse(JSON.stringify(existing));
        if (user.role === 'Manager' && copy.metadata && copy.metadata.ceoOnlyNotes) {
            delete copy.metadata.ceoOnlyNotes;
        }
        return copy;
    }

    // CREATE QUOTE WITH IMMUTABLE SNAPSHOT
    createQuote(user, quoteData) {
        this.checkRole(user, ['CEO', 'Manager']);

        const quoteId = `qt_${Date.now()}`;
        const items = quoteData.serviceItems.map(item => {
            // Financial calculation per item
            const calc = calculateQuoteFinancials([item]);
            return {
                ...item,
                snapshotVendorCost: item.vendorCost,
                snapshotSellingPrice: item.customerSellingPrice || calc.totalCustomerCharge,
                calculatedTotalCharge: calc.totalCustomerCharge,
                calculatedProfit: calc.expectedProfit
            };
        });

        const overallCalc = calculateQuoteFinancials(quoteData.serviceItems);

        const newQuote = {
            _id: quoteId,
            leadId: quoteData.leadId,
            customerName: quoteData.customerName,
            serviceItems: items,
            quoteSummary: {
                totalCustomerPrice: overallCalc.totalCustomerCharge,
                totalVendorCost: overallCalc.totalVendorCost,
                totalExpectedProfit: overallCalc.expectedProfit
            }
        };

        this.quotes.set(quoteId, newQuote);
        return JSON.parse(JSON.stringify(newQuote));
    }

    getQuote(id) {
        return JSON.parse(JSON.stringify(this.quotes.get(id)));
    }
}

async function runTestSuite() {
    console.log('================================================================');
    console.log('🏛️ RUNNING CEO RESOURCE MASTER & RATE MANAGEMENT TEST SUITE');
    console.log('================================================================\n');

    const db = new MockVendorDatabase();
    const ceoUser = { id: 'usr_ceo_01', role: 'CEO', name: 'Executive Officer' };
    const managerUser = { id: 'usr_mgr_01', role: 'Manager', name: 'Operations Manager' };

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ FAIL: ${name}`);
            console.error(`     Error: ${err.message}`);
            failed++;
        }
    }

    let hotelVendorId = null;
    let _transportVendorId = null;
    let panditVendorId = null;
    let boatVendorId = null;
    let guideVendorId = null;
    let shoppingVendorId = null;
    let darshanVendorId = null;
    let leadPartnerVendorId = null;

    // -------------------------------------------------------------------------
    // 1. HOTEL MASTER TESTS
    // -------------------------------------------------------------------------
    test('1. Hotel Master: Create Hotel with multiple room rates (Deluxe AC & Standard Non-AC)', () => {
        const hotel = db.createVendor(ceoUser, {
            category: 'HOTEL',
            businessName: 'Hotel Heritage Ganges',
            contactPerson: 'Mukesh Sharma',
            phone: '9839011111',
            city: 'Varanasi',
            commercialModel: 'SELLING_PRICE',
            baseRate: 2200,
            notes: 'Prime ghat property near Dashashwamedh',
            rateRules: [
                { ruleId: 'hr_deluxe_ac', ruleName: 'Deluxe AC Room', roomType: 'Deluxe Room', acType: 'AC', referenceRate: 2200, unit: 'Night' },
                { ruleId: 'hr_std_non_ac', ruleName: 'Standard Non-AC Room', roomType: 'Standard Room', acType: 'Non-AC', referenceRate: 1500, unit: 'Night' }
            ],
            metadata: {
                starCategory: '3-Star',
                ceoOnlyNotes: 'Confidential net credit limit: ₹1,00,000 with 15 days credit cycle'
            }
        });

        assert.strictEqual(hotel.category, 'HOTEL');
        assert.strictEqual(hotel.commercialModel, 'SELLING_PRICE');
        assert.strictEqual(hotel.rateRules.length, 2);
        assert.strictEqual(hotel.rateRules[0].referenceRate, 2200);
        assert.strictEqual(hotel.rateRules[1].referenceRate, 1500);
        assert.strictEqual(hotel.metadata.starCategory, '3-Star');
        hotelVendorId = hotel._id;
    });

    test('2. Hotel Master: Rate Immutability - Updating Hotel Master rate does NOT alter existing quotes', () => {
        // Step A: Create quote using initial base rate 2200
        const initialQuote = db.createQuote(managerUser, {
            leadId: 'lead_immut_01',
            customerName: 'Aarav Patel',
            serviceItems: [
                {
                    serviceCategory: 'HOTEL',
                    serviceName: 'Hotel Heritage Ganges - Deluxe AC',
                    commercialModel: 'SELLING_PRICE',
                    vendorId: hotelVendorId,
                    referenceCost: 2200,
                    vendorCost: 2200,
                    customerSellingPrice: 3200,
                    quantity: 2
                }
            ]
        });

        assert.strictEqual(initialQuote.quoteSummary.totalCustomerPrice, 6400);

        // Step B: CEO updates Hotel Master rate from 2200 to 2800
        db.updateVendor(ceoUser, hotelVendorId, {
            baseRate: 2800,
            rateRules: [
                { ruleId: 'hr_deluxe_ac', ruleName: 'Deluxe AC Room', roomType: 'Deluxe Room', acType: 'AC', referenceRate: 2800, unit: 'Night' },
                { ruleId: 'hr_std_non_ac', ruleName: 'Standard Non-AC Room', roomType: 'Standard Room', acType: 'Non-AC', referenceRate: 1800, unit: 'Night' }
            ]
        });

        // Step C: Verify existing quote remains strictly 6400 (immutability preserved)
        const preservedQuote = db.getQuote(initialQuote._id);
        assert.strictEqual(
            preservedQuote.quoteSummary.totalCustomerPrice,
            6400,
            'Rate snapshot failed: quote was mutated when master rate updated!'
        );
    });

    // -------------------------------------------------------------------------
    // 2. TRANSPORT MASTER TESTS
    // -------------------------------------------------------------------------
    test('3. Transport Master: Support both FIXED_VENDOR_RATE and VENDOR_QUOTE_REQUIRED', () => {
        const transport = db.createVendor(ceoUser, {
            category: 'TRANSPORT',
            businessName: 'Kashi Fleet & Cabs',
            contactPerson: 'Sanjay Yadav',
            phone: '9839022222',
            city: 'Varanasi',
            commercialModel: 'FIXED_VENDOR_RATE',
            baseRate: 3500,
            rateRules: [
                {
                    ruleId: 'tr_sedan_local',
                    ruleName: 'Sedan Local 8hr/80km',
                    vehicleType: 'Sedan',
                    seatingCapacity: 4,
                    vehicleName: 'Dzire',
                    route: 'Varanasi Local',
                    commercialModel: 'FIXED_VENDOR_RATE',
                    referenceRate: 3500,
                    unit: 'Day'
                },
                {
                    ruleId: 'tr_airport_transfer',
                    ruleName: 'Airport Transfer',
                    vehicleType: 'Sedan',
                    seatingCapacity: 4,
                    vehicleName: 'Dzire',
                    route: 'Airport Pick/Drop',
                    commercialModel: 'FIXED_VENDOR_RATE',
                    referenceRate: 1500,
                    unit: 'Trip'
                },
                {
                    ruleId: 'tr_custom_multi_city',
                    ruleName: 'Custom Multi-City Tour',
                    vehicleType: 'Innova Crysta',
                    seatingCapacity: 6,
                    vehicleName: 'Crysta',
                    route: 'Varanasi-Ayodhya-Prayagraj-Gaya',
                    commercialModel: 'VENDOR_QUOTE_REQUIRED',
                    referenceRate: 0,
                    unit: 'Trip'
                }
            ]
        });

        assert.strictEqual(transport.rateRules.length, 3);
        const fixedRule = transport.rateRules.find(r => r.ruleId === 'tr_sedan_local');
        const customRule = transport.rateRules.find(r => r.ruleId === 'tr_custom_multi_city');
        assert.strictEqual(fixedRule.commercialModel, 'FIXED_VENDOR_RATE');
        assert.strictEqual(fixedRule.referenceRate, 3500);
        assert.strictEqual(customRule.commercialModel, 'VENDOR_QUOTE_REQUIRED');
        assert.strictEqual(customRule.referenceRate, 0);
        _transportVendorId = transport._id;
    });

    // -------------------------------------------------------------------------
    // 3. PANDIT MASTER TESTS
    // -------------------------------------------------------------------------
    test('4. Pandit Master: Contact stored, CUSTOMER_DIRECT model, zero in package charge', () => {
        const pandit = db.createVendor(ceoUser, {
            category: 'PANDIT',
            businessName: 'Pandit Ramesh Shastri',
            contactPerson: 'Pt. Ramesh Shastri',
            phone: '9839033333',
            city: 'Varanasi',
            commercialModel: 'CUSTOMER_DIRECT',
            baseRate: 0,
            notes: 'Senior Kashi Vishwanath Purohit. Direct guest payment at temple.',
            metadata: {
                rituals: ['Rudrabhishek', 'Mangla Aarti Sankalp', 'Pind Daan']
            }
        });

        assert.strictEqual(pandit.commercialModel, 'CUSTOMER_DIRECT');
        assert.ok(pandit.metadata.rituals.includes('Rudrabhishek'));
        panditVendorId = pandit._id;

        // Quote test: CUSTOMER_DIRECT adds ₹0 to package total price
        const quote = db.createQuote(managerUser, {
            leadId: 'lead_pandit_01',
            customerName: 'Devotee Ramesh',
            serviceItems: [
                {
                    serviceCategory: 'PANDIT',
                    serviceName: 'Rudrabhishek Pooja',
                    commercialModel: 'CUSTOMER_DIRECT',
                    vendorId: panditVendorId,
                    vendorCost: 2100, // Ritual dakshina settled directly by guest
                    customerSellingPrice: 0,
                    quantity: 1
                }
            ]
        });

        assert.strictEqual(
            quote.quoteSummary.totalCustomerPrice,
            0,
            'CUSTOMER_DIRECT service must add ₹0 to package total price'
        );
    });

    // -------------------------------------------------------------------------
    // 4. BOAT MASTER TESTS
    // -------------------------------------------------------------------------
    test('5. Boat Master: Capacity, route/distance, and slot rate rules', () => {
        const boat = db.createVendor(ceoUser, {
            category: 'BOAT',
            businessName: 'Ganga Boat Operators Syndicate',
            contactPerson: 'Babu Manjhi',
            phone: '9839044444',
            city: 'Varanasi',
            commercialModel: 'SELLING_PRICE',
            rateRules: [
                { ruleId: 'br_7_short', ruleName: '7-Seater 0-2km Morning', seatingCapacity: 7, route: '0-2 km', slot: 'Morning', referenceRate: 2000, unit: 'Ride' },
                { ruleId: 'br_7_long', ruleName: '7-Seater 2-4km Aarti', seatingCapacity: 7, route: '2-4 km', slot: 'Evening Ganga Aarti', referenceRate: 2300, unit: 'Ride' },
                { ruleId: 'br_bajra', ruleName: '20-Seater Bajra', seatingCapacity: 20, route: 'Full Ghats', slot: 'Subah-e-Banaras', referenceRate: 8500, unit: 'Ride' }
            ]
        });

        assert.strictEqual(boat.rateRules.length, 3);
        assert.strictEqual(boat.rateRules[0].slot, 'Morning');
        assert.strictEqual(boat.rateRules[1].referenceRate, 2300);
        boatVendorId = boat._id;
    });

    // -------------------------------------------------------------------------
    // 5. GUIDE MASTER TESTS
    // -------------------------------------------------------------------------
    test('6. Guide Master: Languages, daily reference rate, shopping partner link', () => {
        const guide = db.createVendor(ceoUser, {
            category: 'GUIDE',
            businessName: 'Vikas Guide Services',
            contactPerson: 'Vikas Tripathi',
            phone: '9839055555',
            city: 'Varanasi',
            commercialModel: 'SELLING_PRICE',
            baseRate: 1500,
            metadata: {
                languages: ['Hindi', 'English', 'Bengali', 'Tamil'],
                guideType: 'SHOPPING_PARTNER_LINKED',
                associatedPartnerName: 'Banaras Handloom Emporium'
            }
        });

        assert.strictEqual(guide.metadata.guideType, 'SHOPPING_PARTNER_LINKED');
        assert.ok(guide.metadata.languages.includes('Bengali'));
        guideVendorId = guide._id;
    });

    // -------------------------------------------------------------------------
    // 6. SHOPPING PARTNER TESTS
    // -------------------------------------------------------------------------
    test('7. Shopping Partner Master: COMMISSION model, zero package price, commission tracked', () => {
        const shopping = db.createVendor(ceoUser, {
            category: 'SHOPPING',
            businessName: 'Kashi Silk Emporium',
            contactPerson: 'Raman Agarwal',
            phone: '9839066666',
            city: 'Varanasi',
            commercialModel: 'COMMISSION',
            baseRate: 0,
            metadata: {
                commissionRate: 15,
                guideSharePercent: 5,
                commissionTerms: '15% on genuine Banarasi sarees; 5% guide kickback disbursed weekly.'
            }
        });

        assert.strictEqual(shopping.commercialModel, 'COMMISSION');
        assert.strictEqual(shopping.metadata.commissionRate, 15);
        assert.strictEqual(shopping.metadata.guideSharePercent, 5);
        shoppingVendorId = shopping._id;

        // Quote test: COMMISSION adds ₹0 to package total price
        const quote = db.createQuote(managerUser, {
            leadId: 'lead_shop_01',
            customerName: 'Saree Shopper',
            serviceItems: [
                {
                    serviceCategory: 'SHOPPING',
                    serviceName: 'Kashi Silk Emporium Visit',
                    commercialModel: 'COMMISSION',
                    vendorId: shoppingVendorId,
                    vendorCost: 0,
                    customerSellingPrice: 0,
                    quantity: 1
                }
            ]
        });

        assert.strictEqual(
            quote.quoteSummary.totalCustomerPrice,
            0,
            'COMMISSION model must result in ₹0 package charge to customer'
        );
    });

    // -------------------------------------------------------------------------
    // 7. DARSHAN / PASS MASTER TESTS
    // -------------------------------------------------------------------------
    test('8. Darshan / Pass Master: PASS_THROUGH model, 0% company margin', () => {
        const darshan = db.createVendor(ceoUser, {
            category: 'DARSHAN',
            businessName: 'Kashi Vishwanath Trust Desk',
            contactPerson: 'Help Desk Facilitator',
            phone: '9839077777',
            city: 'Varanasi',
            commercialModel: 'PASS_THROUGH',
            baseRate: 500,
            metadata: {
                templeName: 'Kashi Vishwanath',
                passName: 'VIP Sugam Darshan Pass',
                passCost: 500
            }
        });

        assert.strictEqual(darshan.commercialModel, 'PASS_THROUGH');
        darshanVendorId = darshan._id;

        // Quote test: PASS_THROUGH passes actual cost directly to customer with 0% margin
        const quote = db.createQuote(managerUser, {
            leadId: 'lead_darshan_01',
            customerName: 'Pooja Sharma',
            serviceItems: [
                {
                    serviceCategory: 'DARSHAN',
                    serviceName: 'VIP Sugam Darshan Pass',
                    commercialModel: 'PASS_THROUGH',
                    vendorId: darshanVendorId,
                    vendorCost: 500,
                    quantity: 3
                }
            ]
        });

        assert.strictEqual(
            quote.quoteSummary.totalCustomerPrice,
            1500,
            'PASS_THROUGH must charge passCost * quantity directly to customer'
        );
        assert.strictEqual(
            quote.quoteSummary.totalExpectedProfit,
            0,
            'PASS_THROUGH items must have 0 expected company profit'
        );
    });

    // -------------------------------------------------------------------------
    // 8. LEAD PARTNER TESTS
    // -------------------------------------------------------------------------
    test('9. Lead Partner: Simple registry, agency agreement, create/update/deactivate', () => {
        const leadPartner = db.createVendor(ceoUser, {
            category: 'LEAD_PARTNER',
            businessName: 'Royal Bengal Tours',
            contactPerson: 'Subhash Mukherjee',
            phone: '9839088888',
            email: 'subhash@royalbengal.com',
            city: 'Kolkata',
            commercialModel: 'COMMISSION',
            metadata: {
                agencyName: 'Royal Bengal Tours Pvt Ltd',
                commissionTerms: '10% referral commission on net package profit margin'
            }
        });

        assert.strictEqual(leadPartner.status, 'ACTIVE');
        leadPartnerVendorId = leadPartner._id;

        // CEO deactivates
        const deactivated = db.updateVendorStatus(ceoUser, leadPartnerVendorId, 'INACTIVE');
        assert.strictEqual(deactivated.status, 'INACTIVE');

        // CEO reactivates
        const reactivated = db.updateVendorStatus(ceoUser, leadPartnerVendorId, 'ACTIVE');
        assert.strictEqual(reactivated.status, 'ACTIVE');
    });

    // -------------------------------------------------------------------------
    // 9. ROLE SECURITY & SENSITIVE DATA PRIVACY
    // -------------------------------------------------------------------------
    test('10. Role Security: Manager CANNOT create, update, or alter vendor status (403 Forbidden)', () => {
        // Manager attempts Create
        assert.throws(
            () => {
                db.createVendor(managerUser, {
                    category: 'HOTEL',
                    businessName: 'Unauthorized Hotel',
                    phone: '9999999999'
                });
            },
            (err) => err.statusCode === 403,
            'Manager was unexpectedly allowed to create vendor!'
        );

        // Manager attempts Update
        assert.throws(
            () => {
                db.updateVendor(managerUser, hotelVendorId, { baseRate: 9999 });
            },
            (err) => err.statusCode === 403,
            'Manager was unexpectedly allowed to update vendor!'
        );

        // Manager attempts Status Alteration
        assert.throws(
            () => {
                db.updateVendorStatus(managerUser, hotelVendorId, 'INACTIVE');
            },
            (err) => err.statusCode === 403,
            'Manager was unexpectedly allowed to change status!'
        );
    });

    test('11. Security & Privacy: Manager can READ active resources, but ceoOnlyNotes are redacted', () => {
        const managerVendorView = db.getVendorById(managerUser, hotelVendorId);
        assert.strictEqual(managerVendorView.businessName, 'Hotel Heritage Ganges');
        assert.strictEqual(
            managerVendorView.metadata?.ceoOnlyNotes,
            undefined,
            'Manager should NEVER receive ceoOnlyNotes!'
        );

        // CEO reads and receives confidential notes
        const ceoVendorView = db.getVendorById(ceoUser, hotelVendorId);
        assert.ok(
            ceoVendorView.metadata?.ceoOnlyNotes?.includes('Confidential'),
            'CEO should receive ceoOnlyNotes'
        );
    });

    // -------------------------------------------------------------------------
    // 10. STATUS FILTERING & DEACTIVATION
    // -------------------------------------------------------------------------
    test('12. Inactive Filter: Deactivated resources are hidden from Manager new selections', () => {
        // Deactivate hotel
        db.updateVendorStatus(ceoUser, hotelVendorId, 'INACTIVE');

        // Manager fetches active vendors
        const managerList = db.getVendors(managerUser);
        const hasHotel = managerList.some(v => v._id === hotelVendorId);
        assert.strictEqual(hasHotel, false, 'Inactive hotel appeared in Manager active list!');

        // Reactivate hotel for clean state
        db.updateVendorStatus(ceoUser, hotelVendorId, 'ACTIVE');
        const managerListAfter = db.getVendors(managerUser);
        const hasHotelAfter = managerListAfter.some(v => v._id === hotelVendorId);
        assert.strictEqual(hasHotelAfter, true, 'Reactivated hotel did not appear in Manager active list!');
    });

    test('13. Category Aliases: Queries for BOAT, GUIDE, SHOPPING, DARSHAN resolve aliases seamlessly', () => {
        const boatQuery = db.getVendors(ceoUser, { category: 'BOAT_RIDE' });
        assert.ok(boatQuery.some(v => v._id === boatVendorId), 'BOAT_RIDE alias failed to resolve');

        const guideQuery = db.getVendors(ceoUser, { category: 'TOUR_GUIDE' });
        assert.ok(guideQuery.some(v => v._id === guideVendorId), 'TOUR_GUIDE alias failed to resolve');

        const shopQuery = db.getVendors(ceoUser, { category: 'SHOPPING_PARTNER' });
        assert.ok(shopQuery.some(v => v._id === shoppingVendorId), 'SHOPPING_PARTNER alias failed to resolve');

        const darshanQuery = db.getVendors(ceoUser, { category: 'VIP_DARSHAN' });
        assert.ok(darshanQuery.some(v => v._id === darshanVendorId), 'VIP_DARSHAN alias failed to resolve');
    });

    console.log('\n================================================================');
    console.log(`🏁 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runTestSuite().catch(err => {
    console.error('Fatal error running tests:', err);
    process.exit(1);
});
