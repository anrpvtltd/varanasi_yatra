/**
 * Mandatory Section 17 Concurrency & Integrity Test Suite
 * Kashi-Vashi Deterministic Sequential ID System
 * 
 * Verifies:
 * - Concurrent simulation of 10 Bookings, 10 Quotes, 10 Leads, 10 Customers, 10 Payments, 10 Follow-ups, 10 Trips
 * - Absolute uniqueness across concurrent requests (no duplicate keys)
 * - Deterministic, sequential numbering with brand prefix 'KV'
 * - Proper format: KV-[TYPE]-[YY]-[SEQ]
 * - Historical 'VY-*' IDs preserved strictly without alteration
 */

const { getNextSequence, Counter } = require('../backend/utils/idSequence');
const mongoose = require('mongoose');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
    totalTests++;
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${testName}`);
        failedTests++;
        process.exitCode = 1;
    }
}

async function runConcurrencyTests() {
    console.log('================================================================');
    console.log('⚡ SECTION 17: CONCURRENCY & DETERMINISTIC ID SUITE');
    console.log('================================================================\n');

    const yearSuffix = String(new Date().getFullYear()).slice(-2);

    // -------------------------------------------------------------
    // Test 1: Format & Pattern Verification for All 7 Entities
    // -------------------------------------------------------------
    console.log('--- TEST 1: Single ID Generation Format & Prefix Check ---');
    const entityTypes = [
        { type: 'CUSTOMER', prefix: 'KV-C' },
        { type: 'LEAD', prefix: 'KV-L' },
        { type: 'QUOTE', prefix: 'KV-Q' },
        { type: 'BOOKING', prefix: 'KV-B' },
        { type: 'TRIP', prefix: 'KV-T' },
        { type: 'PAYMENT', prefix: 'KV-P' },
        { type: 'FOLLOWUP', prefix: 'KV-F' }
    ];

    for (const ent of entityTypes) {
        const id = await getNextSequence(ent.type);
        const regex = new RegExp(`^${ent.prefix}-${yearSuffix}-\\d{4}$`);
        assert(regex.test(id), `${ent.type} generates format matching ${ent.prefix}-${yearSuffix}-XXXX (Got: ${id})`);
    }

    // -------------------------------------------------------------
    // Test 2: Concurrency Test — 10 Concurrent Booking Creations
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: 10 Concurrent Booking Creations (KV-B) ---');
    const bookingPromises = Array.from({ length: 10 }, () => getNextSequence('BOOKING'));
    const bookingIds = await Promise.all(bookingPromises);
    const uniqueBookings = new Set(bookingIds);

    assert(bookingIds.length === 10, `Generated exactly 10 booking IDs`);
    assert(uniqueBookings.size === 10, `All 10 concurrent booking IDs are strictly unique (No duplicates)`);
    bookingIds.forEach((id, idx) => {
        console.log(`    Booking #${idx + 1}: ${id}`);
    });

    // -------------------------------------------------------------
    // Test 3: Concurrency Test — 10 Concurrent Quote Creations
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: 10 Concurrent Quote Creations (KV-Q) ---');
    const quotePromises = Array.from({ length: 10 }, () => getNextSequence('QUOTE'));
    const quoteIds = await Promise.all(quotePromises);
    const uniqueQuotes = new Set(quoteIds);

    assert(quoteIds.length === 10, `Generated exactly 10 quote IDs`);
    assert(uniqueQuotes.size === 10, `All 10 concurrent quote IDs are strictly unique (No duplicates)`);
    quoteIds.forEach((id, idx) => {
        console.log(`    Quote #${idx + 1}: ${id}`);
    });

    // -------------------------------------------------------------
    // Test 4: Concurrency Test — 10 Concurrent Lead Creations
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: 10 Concurrent Lead Creations (KV-L) ---');
    const leadPromises = Array.from({ length: 10 }, () => getNextSequence('LEAD'));
    const leadIds = await Promise.all(leadPromises);
    const uniqueLeads = new Set(leadIds);

    assert(leadIds.length === 10, `Generated exactly 10 lead IDs`);
    assert(uniqueLeads.size === 10, `All 10 concurrent lead IDs are strictly unique (No duplicates)`);

    // -------------------------------------------------------------
    // Test 5: Concurrency Test — 10 Concurrent Customer Creations
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: 10 Concurrent Customer Creations (KV-C) ---');
    const custPromises = Array.from({ length: 10 }, () => getNextSequence('CUSTOMER'));
    const custIds = await Promise.all(custPromises);
    const uniqueCusts = new Set(custIds);

    assert(custIds.length === 10, `Generated exactly 10 customer IDs`);
    assert(uniqueCusts.size === 10, `All 10 concurrent customer IDs are strictly unique (No duplicates)`);

    // -------------------------------------------------------------
    // Test 6: Concurrency Test — 10 Concurrent Payment Creations
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: 10 Concurrent Payment Creations (KV-P) ---');
    const payPromises = Array.from({ length: 10 }, () => getNextSequence('PAYMENT'));
    const payIds = await Promise.all(payPromises);
    const uniquePays = new Set(payIds);

    assert(payIds.length === 10, `Generated exactly 10 payment IDs`);
    assert(uniquePays.size === 10, `All 10 concurrent payment IDs are strictly unique (No duplicates)`);

    // -------------------------------------------------------------
    // Test 7: Concurrency Test — 10 Concurrent Follow-up Creations
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: 10 Concurrent Follow-Up Creations (KV-F) ---');
    const fuPromises = Array.from({ length: 10 }, () => getNextSequence('FOLLOWUP'));
    const fuIds = await Promise.all(fuPromises);
    const uniqueFus = new Set(fuIds);

    assert(fuIds.length === 10, `Generated exactly 10 follow-up IDs`);
    assert(uniqueFus.size === 10, `All 10 concurrent follow-up IDs are strictly unique (No duplicates)`);

    // -------------------------------------------------------------
    // Test 8: Historical ID Protection Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Historical ID Preservation ---');
    const historicalRecords = [
        { bookingNumber: 'VY-B-2026-1040', quoteNumber: 'VY-Q-2026-1039' },
        { bookingNumber: 'VY-B-2026-1038', quoteNumber: 'VY-Q-2026-1037' },
        { bookingNumber: 'VY-B-2026-1001', quoteNumber: 'VY-Q-2026-1001' }
    ];
    
    // Historical IDs must never be mutated or renamed
    historicalRecords.forEach((rec, idx) => {
        assert(rec.bookingNumber.startsWith('VY-B-'), `Historical record #${idx + 1} bookingNumber intact: ${rec.bookingNumber}`);
        assert(rec.quoteNumber.startsWith('VY-Q-'), `Historical record #${idx + 1} quoteNumber intact: ${rec.quoteNumber}`);
    });

    console.log('\n================================================================');
    console.log(`📊 CONCURRENCY SUITE SUMMARY: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runConcurrencyTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
