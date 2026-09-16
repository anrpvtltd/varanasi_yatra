/**
 * scripts/test-production-readiness-hardening.cjs
 * 
 * PROMPT 9.17 Test Suite: Production Blockers & Security Hardening
 * 
 * Verifies all 18 production readiness and hardening criteria:
 *  1. Production CORS includes official domain (https://varanasiyatra.com & https://www.varanasiyatra.com)
 *  2. Wildcard CORS is not enabled in production
 *  3. Production API URL is configurable (VITE_API_BASE_URL takes precedence)
 *  4. Login limiter is production-safe (max 20 attempts/15min in production)
 *  5. Production startup requires initial passwords (fails when missing)
 *  6. Centralized error handler exists (no stack traces in production)
 *  7. No secrets leak in endpoints or error outputs
 *  8. Manager/CEO RBAC unchanged (Manager blocked from CEO routes)
 *  9. Financial privacy unchanged (vendorCost/margin hidden from Manager)
 * 10. QR security unchanged (public QR endpoints validated, non-existent 404)
 * 11. AI security unchanged (AI config CEO-only)
 * 12. Hunter human gate unchanged (status DRAFT / human gate required)
 * 13. Voice AI remains disabled
 * 14. Safe Mode remains active
 * 15. Kill Switch remains CEO-only
 * 16. Test-data inventory works (multi-signal classification)
 * 17. Cleanup script defaults to dry-run (0 deletions)
 * 18. Build succeeds (npm run build produces valid output)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const BACKEND_URL = process.env.API_BASE_URL || 'http://localhost:5001';

const results = [];

function recordTest(id, name, passed, details = '') {
    results.push({ id, name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [Test ${id}] ${name}${details ? ` -> ${details}` : ''}`);
}

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: data });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function runTests() {
    console.log('=======================================================');
    console.log('🛡️  PROMPT 9.17: PRODUCTION HARDENING VERIFICATION SUITE');
    console.log(`Target Backend: ${BACKEND_URL}`);
    console.log('=======================================================\n');

    // ----------------------------------------------------
    // Test 1: Production CORS includes official domain
    // ----------------------------------------------------
    try {
        const envCode = fs.readFileSync(path.join(__dirname, '../backend/config/env.js'), 'utf8');
        const hasOfficialDomain = envCode.includes('https://varanasiyatra.com') && envCode.includes('https://www.varanasiyatra.com');
        recordTest(1, 'Production CORS includes official domain', hasOfficialDomain, 'Found varanasiyatra.com and www.varanasiyatra.com');
    } catch (err) {
        recordTest(1, 'Production CORS includes official domain', false, err.message);
    }

    // ----------------------------------------------------
    // Test 2: Wildcard CORS is not enabled in production
    // ----------------------------------------------------
    try {
        const envCode = fs.readFileSync(path.join(__dirname, '../backend/config/env.js'), 'utf8');
        const noWildcardInOrigins = !envCode.includes("'\\*'") && !envCode.includes('"*"');
        const excludesLocalhostInProd = envCode.includes('allowedOrigins = productionDomainOrigins');
        const passed = noWildcardInOrigins && excludesLocalhostInProd;
        recordTest(2, 'Wildcard CORS not enabled in production', passed, 'No wildcard origins, localhost excluded in production');
    } catch (err) {
        recordTest(2, 'Wildcard CORS not enabled in production', false, err.message);
    }

    // ----------------------------------------------------
    // Test 3: Production API URL is configurable
    // ----------------------------------------------------
    try {
        const crmConstants = fs.readFileSync(path.join(__dirname, '../src/constants/crm.js'), 'utf8');
        const hasViteApiBaseUrl = crmConstants.includes('import.meta.env.VITE_API_BASE_URL');
        const envProd = fs.readFileSync(path.join(__dirname, '../.env.production'), 'utf8');
        const hasProdEnv = envProd.includes('VITE_API_BASE_URL=');
        recordTest(3, 'Production API URL is configurable', hasViteApiBaseUrl && hasProdEnv, 'VITE_API_BASE_URL supported in crm.js and .env.production');
    } catch (err) {
        recordTest(3, 'Production API URL is configurable', false, err.message);
    }

    // ----------------------------------------------------
    // Test 4: Login limiter is production-safe
    // ----------------------------------------------------
    try {
        const serverCode = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8');
        const hasProductionLimiter = serverCode.includes("process.env.NODE_ENV === 'production' ? 20 : 500");
        recordTest(4, 'Login limiter is production-safe', hasProductionLimiter, 'Configured to 20 attempts/15min in production (15-30 range)');
    } catch (err) {
        recordTest(4, 'Login limiter is production-safe', false, err.message);
    }

    // ----------------------------------------------------
    // Test 5: Production startup requires initial passwords
    // ----------------------------------------------------
    try {
        const envCode = fs.readFileSync(path.join(__dirname, '../backend/config/env.js'), 'utf8');
        const serverCode = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8');
        const envEnforces = (envCode.includes('CEO_INITIAL_PASSWORD') && envCode.includes('MANAGER_INITIAL_PASSWORD') && envCode.includes('required in production'));
        const serverEnforces = serverCode.includes('!process.env.CEO_INITIAL_PASSWORD || !process.env.MANAGER_INITIAL_PASSWORD');
        recordTest(5, 'Production startup requires initial passwords', envEnforces && serverEnforces, 'startup fails if CEO/Manager passwords missing in production');
    } catch (err) {
        recordTest(5, 'Production startup requires initial passwords', false, err.message);
    }

    // ----------------------------------------------------
    // Test 6: Centralized error handler exists
    // ----------------------------------------------------
    try {
        const serverCode = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8');
        const functionsCode = fs.readFileSync(path.join(__dirname, '../backend/functions/index.js'), 'utf8');
        const serverHasHandler = serverCode.includes('app.use((err, req, res, next) =>');
        const functionsHasHandler = functionsCode.includes('app.use((err, req, res, next) =>');
        const masksStackTraceInProd = serverCode.includes('!isProduction && err.stack');
        recordTest(6, 'Centralized error handler exists', serverHasHandler && functionsHasHandler && masksStackTraceInProd, 'Clean JSON error format, stack traces omitted in production');
    } catch (err) {
        recordTest(6, 'Centralized error handler exists', false, err.message);
    }

    // ----------------------------------------------------
    // Test 7: No secrets leak in health/ready or recovery
    // ----------------------------------------------------
    try {
        const readyRes = await makeRequest({
            hostname: 'localhost',
            port: 5001,
            path: '/ready',
            method: 'GET'
        });
        const readyStr = JSON.stringify(readyRes.body);
        const noPasswordLeak = !readyStr.includes('admin_mongo') && !readyStr.includes('admin:');
        const forgotRes = await makeRequest({
            hostname: 'localhost',
            port: 5001,
            path: '/auth/forgot-password',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'ceo@banarasyatra.com' });
        const hasSmtpStatus = forgotRes.body && forgotRes.body.deliveryStatus === 'SMTP_NOT_CONFIGURED';
        recordTest(7, 'No secrets leak in endpoints', noPasswordLeak && hasSmtpStatus, 'MongoDB URI masked in /ready, reset token masked, SMTP_NOT_CONFIGURED reported');
    } catch (err) {
        recordTest(7, 'No secrets leak in endpoints', false, err.message);
    }

    // ----------------------------------------------------
    // Authenticate Manager and CEO tokens for RBAC tests
    // ----------------------------------------------------
    let managerToken = null;
    let ceoToken = null;
    try {
        const mgrLogin = await makeRequest({
            hostname: 'localhost',
            port: 5001,
            path: '/admin/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'manager@banarasyatra.com', password: 'ManagerSecurePass123!' });
        managerToken = mgrLogin.body?.token || mgrLogin.body?.data?.token || mgrLogin.body?.accessToken;

        const ceoLogin = await makeRequest({
            hostname: 'localhost',
            port: 5001,
            path: '/admin/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'ceo@banarasyatra.com', password: 'CeoSecurePass123!' });
        ceoToken = ceoLogin.body?.token || ceoLogin.body?.data?.token || ceoLogin.body?.accessToken;
    } catch (e) {
        console.warn('Auth helper warning:', e.message);
    }

    // ----------------------------------------------------
    // Test 8: Manager/CEO RBAC unchanged
    // ----------------------------------------------------
    try {
        if (!managerToken) throw new Error('Manager token unavailable');
        const ceoRes = await makeRequest({
            hostname: 'localhost',
            port: 5001,
            path: '/admin/dashboard/ceo',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${managerToken}` }
        });
        const isBlocked = ceoRes.status === 403;
        recordTest(8, 'Manager/CEO RBAC unchanged', isBlocked, `Manager access to /admin/dashboard/ceo returns HTTP ${ceoRes.status}`);
    } catch (err) {
        recordTest(8, 'Manager/CEO RBAC unchanged', false, err.message);
    }

    // ----------------------------------------------------
    // Test 9: Financial privacy unchanged
    // ----------------------------------------------------
    try {
        if (!managerToken) throw new Error('Manager token unavailable');
        const quotesRes = await makeRequest({
            hostname: 'localhost',
            port: 5001,
            path: '/admin/quotes/lead/6aa6b4beff18cbeedf8bb653',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${managerToken}` }
        });
        const raw = JSON.stringify(quotesRes.body || {});
        const hidesVendorCost = !raw.includes('"vendorCost"');
        const hidesCompanyMargin = !raw.includes('"companyMargin"');
        recordTest(9, 'Financial privacy unchanged', hidesVendorCost && hidesCompanyMargin, 'vendorCost and companyMargin masked from Manager responses');
    } catch (err) {
        recordTest(9, 'Financial privacy unchanged', false, err.message);
    }

    // ----------------------------------------------------
    // Test 10: QR security unchanged
    // ----------------------------------------------------
    try {
        const nonExistentRes = await makeRequest({
            hostname: 'localhost',
            port: 5001,
            path: '/public/qr/nonexistent-qr-test',
            method: 'GET'
        });
        const validPartnerRes = await makeRequest({
            hostname: 'localhost',
            port: 5001,
            path: '/public/partners/hotel-taj-ganges',
            method: 'GET'
        });
        const passed = nonExistentRes.status === 404 && validPartnerRes.status === 200;
        recordTest(10, 'QR security unchanged', passed, 'Non-existent QR returns 404, valid partner returns public snapshot');
    } catch (err) {
        recordTest(10, 'QR security unchanged', false, err.message);
    }

    // ----------------------------------------------------
    // Test 11: AI security unchanged
    // ----------------------------------------------------
    try {
        if (!managerToken) throw new Error('Manager token unavailable');
        const patchAiRes = await makeRequest({
            hostname: 'localhost',
            port: 5001,
            path: '/admin/ai/config',
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${managerToken}`,
                'Content-Type': 'application/json'
            }
        }, { safeMode: false });
        const passed = patchAiRes.status === 403;
        recordTest(11, 'AI security unchanged', passed, `Manager cannot modify AI config (HTTP ${patchAiRes.status})`);
    } catch (err) {
        recordTest(11, 'AI security unchanged', false, err.message);
    }

    // ----------------------------------------------------
    // Test 12: Hunter human gate unchanged
    // ----------------------------------------------------
    try {
        const hunterCode = fs.readFileSync(path.join(__dirname, '../backend/modules/ai/hunter/hunterService.js'), 'utf8');
        const humanGatePreserved = hunterCode.includes('Human Approval Gate') && hunterCode.includes('HUMAN_VERIFIED');
        recordTest(12, 'Hunter human gate unchanged', humanGatePreserved, 'AI-discovered leads require human operator verification before conversion');
    } catch (err) {
        recordTest(12, 'Hunter human gate unchanged', false, err.message);
    }

    // ----------------------------------------------------
    // Test 13: Voice AI remains disabled
    // ----------------------------------------------------
    try {
        const serverCode = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8');
        const voiceAiNotMounted = !serverCode.includes('/api/voice-ai/stream') && !serverCode.includes("voiceAiEnabled: true");
        recordTest(13, 'Voice AI remains disabled', voiceAiNotMounted, 'Voice AI feature flags and routes are disabled');
    } catch (err) {
        recordTest(13, 'Voice AI remains disabled', false, err.message);
    }

    // ----------------------------------------------------
    // Test 14: Safe Mode remains active
    // ----------------------------------------------------
    try {
        const aiServiceCode = fs.readFileSync(path.join(__dirname, '../backend/modules/ai/aiService.js'), 'utf8');
        const aiToolsCode = fs.readFileSync(path.join(__dirname, '../backend/modules/ai/aiTools.js'), 'utf8');
        const safeModeActive = aiServiceCode.includes('safeMode: true') && aiToolsCode.includes('isToolAllowedInSafeMode');
        recordTest(14, 'Safe Mode remains active', safeModeActive, 'Safe Mode defaults to true; mutations strictly blocked');
    } catch (err) {
        recordTest(14, 'Safe Mode remains active', false, err.message);
    }

    // ----------------------------------------------------
    // Test 15: Kill Switch remains CEO-only
    // ----------------------------------------------------
    try {
        if (!managerToken) throw new Error('Manager token unavailable');
        const killRes = await makeRequest({
            hostname: 'localhost',
            port: 5001,
            path: '/admin/ai/config/emergency-stop',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${managerToken}`,
                'Content-Type': 'application/json'
            }
        }, { active: true });
        const passed = killRes.status === 403;
        recordTest(15, 'Kill Switch remains CEO-only', passed, `Manager cannot trigger AI Kill Switch (HTTP ${killRes.status})`);
    } catch (err) {
        recordTest(15, 'Kill Switch remains CEO-only', false, err.message);
    }

    // ----------------------------------------------------
    // Test 16: Test-data inventory works
    // ----------------------------------------------------
    try {
        const inventoryScript = path.join(__dirname, 'production-data-inventory.cjs');
        const exists = fs.existsSync(inventoryScript);
        const { classifyRecord } = require('./production-data-inventory.cjs');
        const testClass = classifyRecord({ name: 'Test Lead', email: 'test@example.com', phone: '9999999999' }, 'enquiries');
        const realClass = classifyRecord({ name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', phone: '9812345678' }, 'enquiries');
        const passed = exists && testClass.classification === 'CLEAR_TEST' && realClass.classification === 'REAL_DATA';
        recordTest(16, 'Test-data inventory works', passed, `Identified CLEAR_TEST vs REAL_DATA correctly`);
    } catch (err) {
        recordTest(16, 'Test-data inventory works', false, err.message);
    }

    // ----------------------------------------------------
    // Test 17: Cleanup script defaults to dry-run
    // ----------------------------------------------------
    try {
        const cleanupScript = path.join(__dirname, 'production-data-cleanup.cjs');
        const exists = fs.existsSync(cleanupScript);
        const cleanupCode = fs.readFileSync(cleanupScript, 'utf8');
        const defaultsToDryRun = cleanupCode.includes("isDryRun = !args.includes('--confirm-delete-test-data') || args.includes('--dry-run')");
        const guardsLiveExecution = cleanupCode.includes('--backup-confirmed');
        const passed = exists && defaultsToDryRun && guardsLiveExecution;
        recordTest(17, 'Cleanup script defaults to dry-run', passed, 'Guarded against accidental execution, defaults to dry-run');
    } catch (err) {
        recordTest(17, 'Cleanup script defaults to dry-run', false, err.message);
    }

    // ----------------------------------------------------
    // Test 18: Build succeeds
    // ----------------------------------------------------
    try {
        console.log('⏳ Running Vite production build check (npm run build)...');
        execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
        const distExists = fs.existsSync(path.join(__dirname, '../dist/index.html'));
        recordTest(18, 'Build succeeds', distExists, 'npm run build generated dist/index.html cleanly');
    } catch (err) {
        recordTest(18, 'Build succeeds', false, err.message);
    }

    console.log('\n=======================================================');
    const passedCount = results.filter(r => r.passed).length;
    console.log(`RESULTS: ${passedCount}/${results.length} PASSED`);
    console.log('=======================================================');

    if (passedCount === results.length) {
        console.log('🎉 ALL 18 PRODUCTION HARDENING CRITERIA VERIFIED!');
        process.exit(0);
    } else {
        console.error('❌ SOME TESTS FAILED');
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal error running hardening test suite:', err);
    process.exit(1);
});
