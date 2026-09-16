/**
 * Prompt 9.13 — AI + QR Production Alignment & Workflow Freeze Test Suite
 * Validates commercial rules, AI module invariants, QR network attribution,
 * RBAC financial privacy, and authentication hardening.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Load Environment
const envPath = path.resolve(__dirname, '../backend/.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const BACKEND_URL = 'http://localhost:5001';
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
    console.log('\n🚀 Starting Prompt 9.13 Production Alignment Verification Suite...\n');

    // ─── 1. Commercial Rules & Phase 4 Constants ──────────────────────────────
    console.log('--- Suite 1: Commercial & Resource Rules ---');
    try {
        const constantsContent = fs.readFileSync(path.resolve(__dirname, '../src/constants/phase4Constants.js'), 'utf8');
        
        // Invariant: TRANSPORT must NOT force FIXED_VENDOR_RATE; must use VENDOR_QUOTE_REQUIRED
        const transportDefaultMatches = constantsContent.includes("TRANSPORT: 'VENDOR_QUOTE_REQUIRED'");
        record('Commercial Rules', 'Transport default is VENDOR_QUOTE_REQUIRED', transportDefaultMatches, 'TRANSPORT must be VENDOR_QUOTE_REQUIRED');

        // Invariant: HOTEL and BOAT maintain SELLING_PRICE / reference rates
        const hotelDefaultMatches = constantsContent.includes("HOTEL: 'SELLING_PRICE'");
        const boatDefaultMatches = constantsContent.includes("BOAT: 'SELLING_PRICE'");
        record('Commercial Rules', 'Hotel retains SELLING_PRICE reference model', hotelDefaultMatches);
        record('Commercial Rules', 'Boat retains SELLING_PRICE reference model', boatDefaultMatches);

        // QuoteBuilderModal inspection: Transport defaults to VENDOR_QUOTE_REQUIRED
        const quoteBuilderContent = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/shared/QuoteBuilderModal.jsx'), 'utf8');
        const hasVendorQuoteRequired = quoteBuilderContent.includes("commercialModel: COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED");
        record('Commercial Rules', 'QuoteBuilder defaults Transport to VENDOR_QUOTE_REQUIRED', hasVendorQuoteRequired);
    } catch (err) {
        record('Commercial Rules', 'Constants File Verification', false, err.message);
    }

    // ─── 2. CEO AI Control Center & Developer Label Cleanup ───────────────────
    console.log('\n--- Suite 2: CEO AI Control Center Business Terminology ---');
    try {
        const controlCenterContent = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/ceo/ai/AIControlCenter.jsx'), 'utf8');
        const hasPrompt5Badge = controlCenterContent.includes('Prompt 5 Foundation');
        record('AI Control Center', 'Prompt 5 Foundation badge removed', !hasPrompt5Badge, 'Found Prompt 5 Foundation in AIControlCenter.jsx');

        const moduleFlagsContent = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/ceo/ai/AIModuleFlags.jsx'), 'utf8');
        const hasPrompt7Or8Flags = moduleFlagsContent.includes('Prompt 7 Implementation') || moduleFlagsContent.includes('Prompt 8 Implementation');
        record('AI Control Center', 'Prompt 7/8 implementation strings removed from module flags', !hasPrompt7Or8Flags);

        const hasVoiceDisabled = moduleFlagsContent.includes('Future Module (Disabled)');
        record('AI Control Center', 'Voice AI clearly marked Future Module (Disabled)', hasVoiceDisabled);

        const oppQueueContent = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/ceo/ai/AIOpportunityQueue.jsx'), 'utf8');
        const hasPrompt9Engine = oppQueueContent.includes('Prompt 9 Engine');
        record('AI Control Center', 'Prompt 9 Engine label cleaned in Opportunity Queue', !hasPrompt9Engine);
    } catch (err) {
        record('AI Control Center', 'UI Inspection', false, err.message);
    }

    // ─── 3. Authentication Hardening & Non-Leaking Endpoints ──────────────────
    console.log('\n--- Suite 3: Authentication & Security Hardening ---');
    let ceoToken = null;
    let mgrToken = null;

    try {
        // Test CEO Login
        const ceoRes = await fetch(`${BACKEND_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: CEO_EMAIL, password: CEO_PASS, loginType: 'CEO' })
        });
        const ceoData = await safeJson(ceoRes);
        const ceoLoginOk = ceoRes.status === 200 && ceoData?.success && Boolean(ceoData?.token);
        record('Auth', 'CEO Login via /admin/login', ceoLoginOk);
        if (ceoLoginOk) ceoToken = ceoData.token;

        // Test Manager Login
        const mgrRes = await fetch(`${BACKEND_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: MGR_EMAIL, password: MGR_PASS, loginType: 'TEAM' })
        });
        const mgrData = await safeJson(mgrRes);
        const mgrLoginOk = mgrRes.status === 200 && mgrData?.success && Boolean(mgrData?.token);
        record('Auth', 'Manager Login via /admin/login', mgrLoginOk);
        if (mgrLoginOk) mgrToken = mgrData.token;

        // Test Forgot Password Endpoint for explicit SMTP status
        const forgotRes = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: CEO_EMAIL })
        });
        const forgotData = await safeJson(forgotRes);
        const hasExplicitDelivery = forgotData && forgotData.deliveryStatus === 'SMTP_NOT_CONFIGURED';
        record('Auth', 'Forgot password declares deliveryStatus: SMTP_NOT_CONFIGURED', hasExplicitDelivery, 'Expected deliveryStatus: SMTP_NOT_CONFIGURED');

        // Check server.js does not contain console.log of reset token
        const serverContent = fs.readFileSync(path.resolve(__dirname, '../backend/server.js'), 'utf8');
        const printsResetToken = serverContent.includes('Reset Token: ${resetToken}');
        record('Auth', 'Server does not log plaintext reset tokens', !printsResetToken, 'Found plaintext reset token console.log in server.js');

    } catch (err) {
        record('Auth', 'API Execution', false, err.message);
    }

    // ─── 4. RBAC & Financial Margin Privacy ───────────────────────────────────
    console.log('\n--- Suite 4: RBAC & Financial Data Privacy ---');
    if (mgrToken) {
        try {
            // Manager attempting to access CEO Dashboard -> 403
            const ceoDashRes = await fetch(`${BACKEND_URL}/admin/dashboard/ceo`, {
                headers: { 'Authorization': `Bearer ${mgrToken}` }
            });
            record('RBAC', 'Manager blocked from CEO Dashboard (403)', ceoDashRes.status === 403);

            // Manager fetching Manager Dashboard -> vendorCost / profit must be stripped
            const mgrDashRes = await fetch(`${BACKEND_URL}/admin/dashboard/manager`, {
                headers: { 'Authorization': `Bearer ${mgrToken}` }
            });
            const mgrDashData = await safeJson(mgrDashRes);
            const dashStr = JSON.stringify(mgrDashData || {});
            const leaksCost = dashStr.includes('"vendorCost"') || dashStr.includes('"expectedProfit"') || dashStr.includes('"companyMargin"');
            record('Financial Privacy', 'Manager Dashboard strips internal costs/margins', !leaksCost);

            // Manager fetching Enquiries -> internal notes and vendor payables stripped
            const enqRes = await fetch(`${BACKEND_URL}/admin/enquiries?limit=5`, {
                headers: { 'Authorization': `Bearer ${mgrToken}` }
            });
            const enqData = await safeJson(enqRes);
            const enqStr = JSON.stringify(enqData || {});
            const leaksEnqCost = enqStr.includes('"vendorCost"') || enqStr.includes('"companyMargin"');
            record('Financial Privacy', 'Enquiries list strips vendor cost and company margin for Manager', !leaksEnqCost);
        } catch (err) {
            record('RBAC', 'Access Guard Verification', false, err.message);
        }
    } else {
        record('RBAC', 'Manager Token Available', false, 'Could not authenticate Manager');
    }

    // ─── 5. Dynamic QR Network & Attribution ──────────────────────────────────
    console.log('\n--- Suite 5: Dynamic QR Network & Attribution ---');
    try {
        // Hotel partner public resolution
        const partnerRes = await fetch(`${BACKEND_URL}/public/partners/hotel-taj-ganges`);
        const partnerData = await safeJson(partnerRes);
        const partnerOk = partnerRes.status === 200 && partnerData?.success && partnerData.partner?.partnerCode === 'hotel-taj-ganges';
        record('QR Network', 'Public Hotel Concierge resolves /public/partners/hotel-taj-ganges', partnerOk);

        // Area public resolution (lookup area record or test fallback)
        const areaRes = await fetch(`${BACKEND_URL}/public/qr/NON_EXISTENT_QR`);
        const areaData = await safeJson(areaRes);
        const areaFallbackOk = areaRes.status === 404 && areaData && areaData.success === false;
        record('QR Network', 'Invalid QR safely returns 404 without crashing', areaFallbackOk);

        // QR Models duplicate index inspection
        const qrModelsContent = fs.readFileSync(path.resolve(__dirname, '../backend/modules/qr/qrModels.js'), 'utf8');
        const hasDuplicateAreaCodeIndex = qrModelsContent.includes("AreaSchema.index({ code: 1 }, { unique: true });");
        const hasDuplicateQrRecordIndex = qrModelsContent.includes("QRRecordSchema.index({ qrId: 1 }, { unique: true });");
        record('Database Hygiene', 'AreaSchema code duplicate index removed', !hasDuplicateAreaCodeIndex);
        record('Database Hygiene', 'QRRecordSchema qrId duplicate index removed', !hasDuplicateQrRecordIndex);
    } catch (err) {
        record('QR Network', 'Resolution Verification', false, err.message);
    }

    // ─── 6. AI Invariants & Hunter Human Gate ─────────────────────────────────
    console.log('\n--- Suite 6: AI Invariants & Safe Mode ---');
    if (ceoToken) {
        try {
            const aiHealthRes = await fetch(`${BACKEND_URL}/admin/ai/health`, {
                headers: { 'Authorization': `Bearer ${ceoToken}` }
            });
            const aiHealthData = await safeJson(aiHealthRes);
            const safeModeOn = aiHealthData?.safeMode === true || aiHealthData?.data?.safeMode === true;
            record('AI Invariants', 'Safe Mode is strictly ACTIVE', safeModeOn);

            const aiConfigRes = await fetch(`${BACKEND_URL}/admin/ai/config`, {
                headers: { 'Authorization': `Bearer ${ceoToken}` }
            });
            const aiConfigData = await safeJson(aiConfigRes);
            const voiceDisabled = (aiConfigData?.config?.modules?.voiceAi?.enabled === false) || (aiConfigData?.data?.modules?.voiceAi?.enabled === false);
            record('AI Invariants', 'Voice AI module is strictly DISABLED', voiceDisabled);
        } catch (err) {
            record('AI Invariants', 'Health Verification', false, err.message);
        }
    } else {
        record('AI Invariants', 'CEO Token Available', false, 'Could not authenticate CEO');
    }

    // ─── Summary Report ───────────────────────────────────────────────────────
    console.log('\n============================================================');
    console.log(`PROMPT 9.13 TEST SUITE SUMMARY: ${results.passed}/${results.total} Passed (${Math.round(results.passed / results.total * 100)}%)`);
    console.log('============================================================\n');

    return results;
}

if (require.main === module) {
    runTests().then(res => {
        if (res.failed > 0) {
            console.error(`❌ Completed with ${res.failed} failure(s).`);
            process.exit(1);
        } else {
            console.log('🎉 All Prompt 9.13 Production Alignment checks PASSED.');
            process.exit(0);
        }
    }).catch(err => {
        console.error('Fatal execution error:', err);
        process.exit(1);
    });
}

module.exports = { runTests };
