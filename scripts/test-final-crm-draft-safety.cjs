/**
 * scripts/test-final-crm-draft-safety.cjs
 *
 * PROMPT 9.16 Test Suite: Final CRM Draft Safety & Small UX Fixes
 *
 * Tests:
 * 1. Saved lead survives refresh (retrievable from backend /admin/enquiries).
 * 2. Unsaved lead behavior is safe (session storage draft mechanism & beforeunload protection).
 * 3. Saved quote survives refresh (retrievable from backend /admin/quote/:leadId).
 * 4. Unsaved quote does NOT become a fake committed backend record.
 * 5. Transport remains VENDOR_QUOTE_REQUIRED.
 * 6. Transport current-rate guidance exists in UI.
 * 7. Empty custom line-item label is rejected clearly (backend 400 & frontend validation).
 * 8. Valid custom line-item label still works.
 * 9. Payment behavior unchanged (no auto-draft persistence).
 * 10. Booking behavior unchanged (no auto-draft persistence).
 * 11. Financial privacy unchanged (Manager cannot see vendorCost / companyMargin).
 * 12. Manager permissions unchanged (CEO endpoints blocked for Manager).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../backend/.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const CEO_EMAIL = env.CEO_EMAIL || 'ceo@banarasyatra.com';
const CEO_PASS = env.CEO_INITIAL_PASSWORD || 'CeoSecurePass123!';
const MGR_EMAIL = env.MANAGER_EMAIL || 'manager@banarasyatra.com';
const MGR_PASS = env.MANAGER_INITIAL_PASSWORD || 'ManagerSecurePass123!';

const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
};

function record(suite, testName, pass, message = '') {
    results.total++;
    if (pass) {
        results.passed++;
        console.log(`  ✅ [PASS] ${suite} — ${testName}`);
    } else {
        results.failed++;
        console.error(`  ❌ [FAIL] ${suite} — ${testName}: ${message}`);
    }
    results.details.push({ suite, testName, pass, message });
}

async function safeJson(res) {
    try {
        const text = await res.text();
        return JSON.parse(text);
    } catch {
        return null;
    }
}

async function runTests() {
    console.log('============================================================');
    console.log('PROMPT 9.16: FINAL CRM DRAFT SAFETY & UX FIXES TEST SUITE');
    console.log('============================================================\n');

    let ceoToken = null;
    let mgrToken = null;

    // --- Authentication ---
    console.log('--- Suite 1: Authentication & Pre-Flight ---');
    try {
        const ceoRes = await fetch(`${BACKEND_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: CEO_EMAIL, password: CEO_PASS })
        });
        const ceoData = await safeJson(ceoRes);
        ceoToken = ceoData?.token || ceoData?.data?.token;
        record('Auth', 'CEO Login', !!ceoToken, !ceoToken ? 'Failed to login CEO' : '');

        const mgrRes = await fetch(`${BACKEND_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: MGR_EMAIL, password: MGR_PASS })
        });
        const mgrData = await safeJson(mgrRes);
        mgrToken = mgrData?.token || mgrData?.data?.token;
        record('Auth', 'Manager Login', !!mgrToken, !mgrToken ? 'Failed to login Manager' : '');
    } catch (err) {
        record('Auth', 'Login API Execution', false, err.message);
        return;
    }

    if (!mgrToken) {
        console.error('Abort: Manager token required.');
        return;
    }

    // --- Test 1: Saved Lead Survives Refresh ---
    console.log('\n--- Suite 2: Lead Persistence & Draft Safety ---');
    const uniqueTime = Date.now();
    const mockLeadMobile = `99999${String(uniqueTime).slice(-5)}`;
    const mockLeadEmail = `final.crm.safety.${uniqueTime}@example.com`;
    const mockLeadName = 'Final CRM Safety Test';
    let createdLeadId = null;

    try {
        // Step A: Create a manual lead via /admin/enquiry/manual
        const leadRes = await fetch(`${BACKEND_URL}/admin/enquiry/manual`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mgrToken}`
            },
            body: JSON.stringify({
                name: mockLeadName,
                mobile: mockLeadMobile,
                email: mockLeadEmail,
                source: 'PHONE_CALL',
                status: 'NEW',
                destination: 'Varanasi',
                remarks: 'PROMPT 9.16 Draft Safety Test Lead'
            })
        });

        const leadData = await safeJson(leadRes);
        createdLeadId = leadData?.data?._id || leadData?.lead?._id || leadData?._id;
        record('Lead Safety', '1. Create and commit lead to backend', (leadRes.status === 200 || leadRes.status === 201) && !!createdLeadId, `Status ${leadRes.status}`);

        // Step B: Simulate page refresh by retrieving leads afresh from backend /admin/enquiries
        const fetchRes = await fetch(`${BACKEND_URL}/admin/enquiries`, {
            headers: { 'Authorization': `Bearer ${mgrToken}` }
        });
        const allLeadsData = await safeJson(fetchRes);
        const leadList = Array.isArray(allLeadsData) ? allLeadsData : (allLeadsData?.data || []);
        const found = leadList.find(l => (String(l._id) === String(createdLeadId) || l.mobile === mockLeadMobile || l.phone === mockLeadMobile));

        record('Lead Safety', '1. Saved lead survives refresh (persisted in backend)', !!found && found.name === mockLeadName, 'Lead not found in backend query');
    } catch (err) {
        record('Lead Safety', 'Lead Persistence Execution', false, err.message);
    }

    // --- Test 2: Unsaved Lead Draft Safety Architecture ---
    try {
        const useCRMLeadsCode = fs.readFileSync(path.resolve(__dirname, '../src/hooks/useCRMLeads.js'), 'utf8');
        const manualDrawerCode = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/shared/ManualLeadDrawer.jsx'), 'utf8');

        const hasStorageRead = useCRMLeadsCode.includes("sessionStorage.getItem('crm_manual_lead_draft')");
        const hasStorageWrite = useCRMLeadsCode.includes("sessionStorage.setItem('crm_manual_lead_draft'");
        const hasBeforeUnload = useCRMLeadsCode.includes("addEventListener('beforeunload'") || useCRMLeadsCode.includes('beforeunload');
        const hasClearDraft = useCRMLeadsCode.includes("handleClearManualDraft") && manualDrawerCode.includes("Clear Draft");
        const hasDraftBadge = manualDrawerCode.includes("Unsaved draft saved locally");

        record('Lead Safety', '2. Unsaved lead uses session draft persistence', hasStorageRead && hasStorageWrite, 'Draft storage read/write missing');
        record('Lead Safety', '2. Unsaved lead has beforeunload protection listener', hasBeforeUnload, 'beforeunload listener missing in useCRMLeads');
        record('Lead Safety', '2. Unsaved lead has visual draft indicator and clear draft option', hasClearDraft && hasDraftBadge, 'Clear draft or badge missing');
    } catch (err) {
        record('Lead Safety', 'Lead Draft Inspection', false, err.message);
    }

    // --- Test 3 & 4: Quote Builder Draft & Persistence Safety ---
    console.log('\n--- Suite 3: Quote Draft Safety & Persistence ---');
    let savedQuoteId = null;

    try {
        const quoteBuilderCode = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/shared/QuoteBuilderModal.jsx'), 'utf8');

        // Verify quote draft storage architecture
        const hasQuoteSessionDraft = quoteBuilderCode.includes("crm_quote_draft_");
        const hasQuoteBeforeUnload = quoteBuilderCode.includes("addEventListener('beforeunload'");
        const hasDiscardDraft = quoteBuilderCode.includes("handleDiscardDraft");
        const hasDraftRestoreAlert = quoteBuilderCode.includes("Unsaved working quote draft restored");

        record('Quote Safety', 'Quote session draft caching architecture exists', hasQuoteSessionDraft, 'Session draft key missing');
        record('Quote Safety', 'Quote beforeunload protection warning exists', hasQuoteBeforeUnload, 'beforeunload listener missing in QuoteBuilderModal');
        record('Quote Safety', 'Quote draft restore banner & discard action present', hasDiscardDraft && hasDraftRestoreAlert, 'Discard/Restore UI missing');

        // Test that an unsaved quote draft DOES NOT create a backend quote record
        const preQuotesRes = await fetch(`${BACKEND_URL}/admin/quotes/lead/${createdLeadId}`, {
            headers: { 'Authorization': `Bearer ${mgrToken}` }
        });
        const preQuotesData = await safeJson(preQuotesRes);
        const preQuotesList = Array.isArray(preQuotesData) ? preQuotesData : (preQuotesData?.quotes || preQuotesData?.data || []);
        record('Quote Safety', '4. Unsaved quote does NOT become a fake committed record in DB', preQuotesList.length === 0, 'Unexpected quotes found before save');

        // Now save a valid quote with travel/transport and custom item
        const saveQuoteRes = await fetch(`${BACKEND_URL}/admin/quote/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mgrToken}`
            },
            body: JSON.stringify({
                leadId: createdLeadId,
                clientName: mockLeadName,
                clientEmail: mockLeadEmail,
                clientPhone: mockLeadMobile,
                packageType: 'CUSTOM',
                servicesList: [
                    {
                        category: 'TRANSPORT',
                        serviceName: 'Sedan AC 8Hr Varanasi Darshan',
                        customerDisplayName: 'Sedan AC 8Hr Varanasi Darshan',
                        quantity: 1,
                        unit: 'Day',
                        commercialModel: 'VENDOR_QUOTE_REQUIRED',
                        customerSellingPrice: 4500,
                        customerCharge: 4500
                    },
                    {
                        category: 'HOTEL',
                        serviceName: 'Heritage Haveli Deluxe Room',
                        customerDisplayName: 'Heritage Haveli Deluxe Room',
                        quantity: 2,
                        unit: 'Nights',
                        commercialModel: 'SELLING_PRICE',
                        customerSellingPrice: 4000,
                        customerCharge: 8000
                    }
                ]
            })
        });

        const saveQuoteData = await safeJson(saveQuoteRes);
        savedQuoteId = saveQuoteData?.data?._id || saveQuoteData?.quote?._id || saveQuoteData?._id;
        record('Quote Safety', '3. Save valid quote with transport & hotel to backend', saveQuoteRes.ok && !!savedQuoteId, `Status ${saveQuoteRes.status}`);

        // Step C: Simulate refresh by retrieving quotes afresh from backend
        const postQuotesRes = await fetch(`${BACKEND_URL}/admin/quotes/lead/${createdLeadId}`, {
            headers: { 'Authorization': `Bearer ${mgrToken}` }
        });
        const postQuotesData = await safeJson(postQuotesRes);
        const postQuotesList = Array.isArray(postQuotesData) ? postQuotesData : (postQuotesData?.quotes || postQuotesData?.data || []);
        const foundQuote = postQuotesList.find(q => (String(q._id) === String(savedQuoteId) || String(q.id) === String(savedQuoteId)));
        record('Quote Safety', '3. Saved quote survives refresh (present in backend query)', !!foundQuote, 'Saved quote not found in backend');
    } catch (err) {
        record('Quote Safety', 'Quote Persistence Execution', false, err.message);
    }

    // --- Test 5 & 6: Transport Pricing Rule & UI Guidance ---
    console.log('\n--- Suite 4: Transport Commercial Rule & Current Rate Guidance ---');
    try {
        const quoteBuilderCode = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/shared/QuoteBuilderModal.jsx'), 'utf8');
        const vendorSelectorCode = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/shared/VendorSelector.jsx'), 'utf8');
        const phase4Constants = fs.readFileSync(path.resolve(__dirname, '../src/constants/phase4Constants.js'), 'utf8');

        // 5. Commercial rule verification
        const hasVendorQuoteRequired = phase4Constants.includes("commercialModel: 'VENDOR_QUOTE_REQUIRED'") &&
            phase4Constants.includes("category: 'TRANSPORT'");
        record('Transport Guidance', '5. Transport remains strictly VENDOR_QUOTE_REQUIRED in rules', hasVendorQuoteRequired, 'Transport model altered');

        // 6. UI guidance verification in QuoteBuilderModal
        const hasRateGuidanceQuote = quoteBuilderCode.includes("Current Vehicle Rate — Vendor Quote Required") &&
            quoteBuilderCode.includes("Enter Current Vendor Rate");
        record('Transport Guidance', '6. Transport current-rate guidance exists in QuoteBuilderModal', hasRateGuidanceQuote, 'Guidance missing in QuoteBuilderModal');

        // UI guidance verification in VendorSelector
        const hasRateGuidanceVendor = vendorSelectorCode.includes("Current Vehicle Rate — Vendor Quote Required");
        record('Transport Guidance', '6. Transport current-rate guidance exists in VendorSelector', hasRateGuidanceVendor, 'Guidance missing in VendorSelector');
    } catch (err) {
        record('Transport Guidance', 'Transport Guidance Inspection', false, err.message);
    }

    // --- Test 7 & 8: Custom Line Item Validation ---
    console.log('\n--- Suite 5: Custom Line Item Inline & Backend Validation ---');
    try {
        // Backend validation: attempt to create quote with empty line item name
        const invalidQuoteRes = await fetch(`${BACKEND_URL}/admin/quote/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mgrToken}`
            },
            body: JSON.stringify({
                leadId: createdLeadId,
                clientName: mockLeadName,
                servicesList: [
                    {
                        category: 'CUSTOM_SERVICE',
                        serviceName: '',
                        customerDisplayName: '',
                        quantity: 1,
                        customerSellingPrice: 1500,
                        customerCharge: 1500
                    }
                ]
            })
        });

        const invalidQuoteData = await safeJson(invalidQuoteRes);
        const isRejectedWith400 = invalidQuoteRes.status === 400 &&
            ((invalidQuoteData?.error || invalidQuoteData?.message || '').toLowerCase().includes('item name is required'));
        record('Custom Validation', '7. Backend rejects empty custom line-item label with 400', isRejectedWith400, `Expected 400 with item name error, got ${invalidQuoteRes.status}: ${JSON.stringify(invalidQuoteData)}`);

        // Frontend validation verification
        const quoteBuilderCode = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/shared/QuoteBuilderModal.jsx'), 'utf8');
        const hasFrontendValidation = quoteBuilderCode.includes("Item name is required") &&
            quoteBuilderCode.includes("validationErrors") &&
            quoteBuilderCode.includes("border-rose-500");
        record('Custom Validation', '7. Frontend displays inline validation for empty item name', hasFrontendValidation, 'Inline validation missing in QuoteBuilderModal');

        // Valid custom line item works
        const validCustomQuoteRes = await fetch(`${BACKEND_URL}/admin/quote/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mgrToken}`
            },
            body: JSON.stringify({
                leadId: createdLeadId,
                clientName: mockLeadName,
                clientPhone: mockLeadMobile,
                packageType: 'CUSTOM',
                servicesList: [
                    {
                        category: 'CUSTOM_SERVICE',
                        serviceName: 'Special Evening Ganga Aarti Reserved Boat',
                        customerDisplayName: 'Special Evening Ganga Aarti Reserved Boat',
                        quantity: 1,
                        unit: 'Session',
                        commercialModel: 'SELLING_PRICE',
                        customerSellingPrice: 2500,
                        customerCharge: 2500
                    }
                ]
            })
        });

        const validCustomData = await safeJson(validCustomQuoteRes);
        record('Custom Validation', '8. Valid custom line item saves successfully', validCustomQuoteRes.ok && !!(validCustomData?.quote?._id || validCustomData?.data?._id || validCustomData?._id), `Status ${validCustomQuoteRes.status}`);
    } catch (err) {
        record('Custom Validation', 'Line Item Validation Execution', false, err.message);
    }

    // --- Test 9 & 10: Payment & Booking High-Value Safety ---
    console.log('\n--- Suite 6: Payment & Booking Safety (No Auto-Draft) ---');
    try {
        const bookingDrawerCode = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/shared/BookingDetailsDrawer.jsx'), 'utf8');
        const ceoBookingCode = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/ceo/CEOBookingDrawer.jsx'), 'utf8');

        // Verify neither drawer has automated local storage draft injection that could commit fake records
        const hasBookingAutoDraft = bookingDrawerCode.includes("localStorage.setItem('booking_draft'") ||
            ceoBookingCode.includes("localStorage.setItem('booking_draft'");
        record('Payment/Booking Safety', '9 & 10. No dangerous auto-draft persistence in Booking drawers', !hasBookingAutoDraft, 'Found unauthorized auto-draft in booking drawer');
    } catch (err) {
        record('Payment/Booking Safety', 'Payment/Booking Inspection', false, err.message);
    }

    // --- Test 11: Financial Privacy ---
    console.log('\n--- Suite 7: Financial Privacy Preserved ---');
    try {
        const mgrQuotesRes = await fetch(`${BACKEND_URL}/admin/quotes/lead/${createdLeadId}`, {
            headers: { 'Authorization': `Bearer ${mgrToken}` }
        });
        const mgrQuotes = await safeJson(mgrQuotesRes);
        const quotesArr = Array.isArray(mgrQuotes) ? mgrQuotes : (mgrQuotes?.quotes || mgrQuotes?.data || []);
        let costLeaked = false;
        let marginLeaked = false;

        quotesArr.forEach(q => {
            (q.servicesList || q.services || []).forEach(s => {
                if (s.vendorCost !== undefined && s.vendorCost !== null && s.vendorCost > 0) {
                    costLeaked = true;
                }
            });
            if (q.companyMargin !== undefined && q.companyMargin !== null && q.companyMargin > 0) {
                marginLeaked = true;
            }
        });

        record('Financial Privacy', '11. Manager view strips vendorCost from quote services', !costLeaked, 'Vendor cost leaked to Manager');
        record('Financial Privacy', '11. Manager view strips companyMargin from quote pricing', !marginLeaked, 'Company margin leaked to Manager');
    } catch (err) {
        record('Financial Privacy', 'Financial Privacy Execution', false, err.message);
    }

    // --- Test 12: Manager Permissions Intact ---
    console.log('\n--- Suite 8: Role-Based Access Control ---');
    try {
        const blockCeoDashboard = await fetch(`${BACKEND_URL}/admin/dashboard/ceo`, {
            headers: { 'Authorization': `Bearer ${mgrToken}` }
        });
        record('RBAC', '12. Manager cannot access CEO Dashboard (403 Forbidden)', blockCeoDashboard.status === 403, `Status ${blockCeoDashboard.status}`);

        const blockAiConfig = await fetch(`${BACKEND_URL}/admin/ai/config`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${mgrToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ masterEnabled: false })
        });
        record('RBAC', '12. Manager cannot alter CEO AI Config (403 Forbidden)', blockAiConfig.status === 403, `Status ${blockAiConfig.status}`);
    } catch (err) {
        record('RBAC', 'RBAC Execution', false, err.message);
    }

    // --- Clean up mock test lead if created ---
    if (createdLeadId && ceoToken) {
        try {
            await fetch(`${BACKEND_URL}/admin/leads/${createdLeadId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${ceoToken}` }
            });
        } catch {}
    }

    // --- Final Summary ---
    console.log('\n============================================================');
    const percent = Math.round((results.passed / results.total) * 100);
    console.log(`FINAL CRM DRAFT SAFETY & UX SUMMARY: ${results.passed}/${results.total} Passed (${percent}%)`);
    console.log('============================================================');

    if (results.failed === 0) {
        console.log('\n🎉 ALL PROMPT 9.16 CHECKS PASSED.');
        process.exit(0);
    } else {
        console.error(`\n❌ Completed with ${results.failed} failure(s).`);
        process.exit(1);
    }
}

runTests();
