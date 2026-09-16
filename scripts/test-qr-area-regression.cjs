/**
 * QR Network & Area Regression Test Suite
 * Validates:
 * 1. Existing area -> duplicate create blocked (400)
 * 2. Existing area -> visible in CEO & Manager area lists
 * 3. crmApi response normalization for areas and records
 * 4. CreateAreaModal zero pre-selected allowed types
 * 5. QuickTripPlanner zero pre-selected requirements
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

async function runRegression() {
    console.log('\n🔍 Running QR Network & Area Regression Test Suite...\n');

    let ceoToken = null;
    let mgrToken = null;

    // 1. Auth Login
    console.log('--- Suite 1: Authentication ---');
    try {
        const ceoRes = await fetch(`${BACKEND_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: CEO_EMAIL, password: CEO_PASS, loginType: 'CEO' })
        });
        const ceoData = await safeJson(ceoRes);
        const ceoOk = ceoRes.status === 200 && Boolean(ceoData?.token);
        record('Auth', 'CEO Login', ceoOk);
        if (ceoOk) ceoToken = ceoData.token;

        const mgrRes = await fetch(`${BACKEND_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: MGR_EMAIL, password: MGR_PASS, loginType: 'TEAM' })
        });
        const mgrData = await safeJson(mgrRes);
        const mgrOk = mgrRes.status === 200 && Boolean(mgrData?.token);
        record('Auth', 'Manager Login', mgrOk);
        if (mgrOk) mgrToken = mgrData.token;
    } catch (err) {
        record('Auth', 'Login API Execution', false, err.message);
    }

    // 2. Existing Area -> List Visible for CEO and Manager
    console.log('\n--- Suite 2: Existing Area List Visibility ---');
    try {
        // CEO fetch
        const ceoAreasRes = await fetch(`${BACKEND_URL}/admin/qr/areas`, {
            headers: { 'Authorization': `Bearer ${ceoToken}` }
        });
        const ceoAreasData = await safeJson(ceoAreasRes);
        const ceoAreas = ceoAreasData?.areas || ceoAreasData?.data || [];
        const hasGodauliaCeo = ceoAreas.some(a => a.code === 'GOD' && a.name.toLowerCase().includes('godaulia'));
        
        record('Area Visibility', 'CEO sees existing Godaulia (GOD) in areas list', hasGodauliaCeo, 
            `Found ${ceoAreas.length} areas. Godaulia GOD present: ${hasGodauliaCeo}`);
        record('Area Visibility', 'API returns both .areas and .data aliases', 
            Array.isArray(ceoAreasData?.areas) && Array.isArray(ceoAreasData?.data));

        // Manager fetch
        const mgrAreasRes = await fetch(`${BACKEND_URL}/admin/qr/areas`, {
            headers: { 'Authorization': `Bearer ${mgrToken}` }
        });
        const mgrAreasData = await safeJson(mgrAreasRes);
        const mgrAreas = mgrAreasData?.areas || mgrAreasData?.data || [];
        const hasGodauliaMgr = mgrAreas.some(a => a.code === 'GOD' && a.name.toLowerCase().includes('godaulia'));
        record('Area Visibility', 'Manager sees existing Godaulia (GOD) in areas list', hasGodauliaMgr,
            `Found ${mgrAreas.length} areas. Godaulia GOD present: ${hasGodauliaMgr}`);
    } catch (err) {
        record('Area Visibility', 'Area List API Execution', false, err.message);
    }

    // 3. Existing Area -> Duplicate Create Blocked
    console.log('\n--- Suite 3: Duplicate Area Prevention ---');
    try {
        const dupRes = await fetch(`${BACKEND_URL}/admin/qr/areas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ceoToken}`
            },
            body: JSON.stringify({
                name: 'Godoulia Chowk Test',
                code: 'GOD',
                description: 'Attempting to duplicate code GOD',
                allowedQrTypes: ['ROADSIDE']
            })
        });
        const dupData = await safeJson(dupRes);
        const isBlocked = dupRes.status === 400 && dupData?.success === false;
        const mentionsExisting = dupData?.message?.includes('already in use by');
        record('Duplicate Prevention', 'Duplicate area code GOD blocked with HTTP 400', isBlocked);
        record('Duplicate Prevention', 'Error message identifies existing area name', mentionsExisting, dupData?.message);
    } catch (err) {
        record('Duplicate Prevention', 'Duplicate Create Execution', false, err.message);
    }

    // 4. QR Records List Visibility & Aliases
    console.log('\n--- Suite 4: QR Records List Visibility ---');
    try {
        const qrsRes = await fetch(`${BACKEND_URL}/admin/qr`, {
            headers: { 'Authorization': `Bearer ${ceoToken}` }
        });
        const qrsData = await safeJson(qrsRes);
        const hasRecordsArray = Array.isArray(qrsData?.records);
        const hasDataAlias = Array.isArray(qrsData?.data);
        record('QR Records', 'GET /admin/qr returns records array', hasRecordsArray);
        record('QR Records', 'GET /admin/qr returns data alias array', hasDataAlias);
    } catch (err) {
        record('QR Records', 'QR Records API Execution', false, err.message);
    }

    // 5. Frontend Inspection: CreateAreaModal allowed types defaults
    console.log('\n--- Suite 5: CreateAreaModal Allowed Types Inspection ---');
    try {
        const modalContent = fs.readFileSync(path.resolve(__dirname, '../src/components/crm/ceo/qr/CreateAreaModal.jsx'), 'utf8');
        const defaultEmptyState = modalContent.includes('const [allowedQrTypes, setAllowedQrTypes] = useState([])');
        const resetEmptyState = modalContent.includes('setAllowedQrTypes([])');
        const noArbitraryPreselect = !modalContent.includes("setAllowedQrTypes(['HOTEL', 'PAID_PLACEMENT'])");
        record('New Area Form', 'allowedQrTypes initializes to empty array []', defaultEmptyState);
        record('New Area Form', 'Reset sets allowedQrTypes to empty array []', resetEmptyState);
        record('New Area Form', 'Old pre-selection [HOTEL, PAID_PLACEMENT] removed', noArbitraryPreselect);
    } catch (err) {
        record('New Area Form', 'Modal Code Inspection', false, err.message);
    }

    // 6. Frontend Inspection: QuickTripPlanner requirements defaults
    console.log('\n--- Suite 6: QuickTripPlanner Form Defaults Inspection ---');
    try {
        const plannerContent = fs.readFileSync(path.resolve(__dirname, '../src/public/components/QuickTripPlanner.jsx'), 'utf8');
        const defaultRequirementsEmpty = plannerContent.includes("requirements: initialPackage ? [initialPackage] : []");
        const noPreselectedDarshanBoat = !plannerContent.includes("['darshan', 'boat']");
        record('Public Trip Planner', 'Default requirements is empty array [] unless initialPackage is passed', defaultRequirementsEmpty);
        record('Public Trip Planner', "Pre-selected ['darshan', 'boat'] eliminated", noPreselectedDarshanBoat);
    } catch (err) {
        record('Public Trip Planner', 'Planner Code Inspection', false, err.message);
    }

    // ─── Summary Report ───────────────────────────────────────────────────────
    console.log('\n============================================================');
    console.log(`QR REGRESSION TEST SUMMARY: ${results.passed}/${results.total} Passed (${Math.round(results.passed / results.total * 100)}%)`);
    console.log('============================================================\n');

    return results;
}

if (require.main === module) {
    runRegression().then(res => {
        if (res.failed > 0) {
            console.error(`❌ Completed with ${res.failed} failure(s).`);
            process.exit(1);
        } else {
            console.log('🎉 All QR regression checks PASSED.');
            process.exit(0);
        }
    }).catch(err => {
        console.error('Fatal execution error:', err);
        process.exit(1);
    });
}

module.exports = { runRegression };
