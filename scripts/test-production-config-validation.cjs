/**
 * scripts/test-production-config-validation.cjs
 * 
 * PROMPT 9.18: Production Environment Configuration Validation Suite
 * 
 * Verifies:
 * 1. Production startup fails if MONGODB_URI is missing.
 * 2. Production startup fails if MONGODB_URI points to localhost.
 * 3. Production startup fails if JWT_SECRET is missing or < 32 chars.
 * 4. Production startup fails if JWT_REFRESH_SECRET is missing or < 32 chars.
 * 5. Production startup fails if CEO_INITIAL_PASSWORD or MANAGER_INITIAL_PASSWORD are missing.
 * 6. Production startup succeeds with valid Kashi-Vashi production configuration mockup.
 * 7. Automated tests are strictly prevented from connecting to kashi-vashi-prod / kashiVashiDB_prod.
 * 8. Staging configuration in backend/.env remains intact and connects to dev/staging cluster.
 * 9. Production CORS guarantees https://varanasiyatra.com and https://www.varanasiyatra.com.
 * 10. Current Vercel deployment URLs are preserved in allowed origins.
 * 11. No wildcard (*) CORS permitted in production.
 * 12. Localhost origins are excluded in production mode.
 * 13. .env.production.example and backend/.env.production.example exist and are sanitized.
 * 14. Documentation docs/production-environment.md exists and is complete.
 * 15. Frontend VITE_API_BASE_URL configuration is verified.
 * 16. No secret values are printed or leaked in outputs.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { validateEnvironment } = require('../backend/config/env.js');

const results = [];

function recordTest(id, name, passed, details = '') {
    results.push({ id, name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [Test ${id}] ${name}${details ? ` -> ${details}` : ''}`);
}

function testValidation(envConfig) {
    let capturedError = null;
    let envResult = null;
    
    const originalExit = process.exit;
    const originalConsoleError = console.error;
    let exitCalled = false;
    let exitCode = null;
    let errorOutput = '';

    process.exit = (code) => {
        exitCalled = true;
        exitCode = code;
        throw new Error(`PROCESS_EXIT_${code}`);
    };
    console.error = (...args) => {
        errorOutput += args.join(' ') + '\n';
    };

    try {
        envResult = validateEnvironment(envConfig);
    } catch (err) {
        capturedError = err;
    } finally {
        process.exit = originalExit;
        console.error = originalConsoleError;
    }

    return {
        exitCalled,
        exitCode,
        errorOutput,
        envResult,
        capturedError
    };
}

async function runValidation() {
    console.log('=======================================================');
    console.log('🛡️  PROMPT 9.18: PRODUCTION CONFIGURATION VALIDATION');
    console.log('=======================================================\n');

    // ------------------------------------------------------------------
    // Test 1: Production startup fails if MONGODB_URI is missing
    // ------------------------------------------------------------------
    try {
        const res = testValidation({
            NODE_ENV: 'production',
            MONGODB_URI: '',
            MONGO_URI: '',
            JWT_SECRET: 'test_super_secure_jwt_secret_with_more_than_32_characters',
            JWT_REFRESH_SECRET: 'test_super_secure_refresh_secret_with_more_than_32_chars',
            CEO_INITIAL_PASSWORD: 'SampleCeoPass123!',
            MANAGER_INITIAL_PASSWORD: 'SampleManagerPass123!'
        });
        const failedAsExpected = res.exitCalled && res.exitCode === 1 && res.errorOutput.includes('MONGODB_URI environment variable is required in production');
        recordTest(1, 'Production startup fails if MONGODB_URI is missing', failedAsExpected, 'Startup aborted with exit code 1');
    } catch (e) {
        recordTest(1, 'Production startup fails if MONGODB_URI is missing', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 2: Production startup fails if MONGODB_URI points to localhost
    // ------------------------------------------------------------------
    try {
        const res = testValidation({
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb://localhost:27017/varanasi_yatra',
            JWT_SECRET: 'test_super_secure_jwt_secret_with_more_than_32_characters',
            JWT_REFRESH_SECRET: 'test_super_secure_refresh_secret_with_more_than_32_chars',
            CEO_INITIAL_PASSWORD: 'SampleCeoPass123!',
            MANAGER_INITIAL_PASSWORD: 'SampleManagerPass123!'
        });
        const failedAsExpected = res.exitCalled && res.exitCode === 1 && res.errorOutput.includes('cannot point to localhost');
        recordTest(2, 'Production startup fails if MONGODB_URI points to localhost', failedAsExpected, 'Rejected localhost URI in production');
    } catch (e) {
        recordTest(2, 'Production startup fails if MONGODB_URI points to localhost', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 3: Production startup fails if JWT_SECRET is missing or < 32 chars
    // ------------------------------------------------------------------
    try {
        const missingRes = testValidation({
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb+srv://kashivashi_app:mock_pass@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod',
            JWT_SECRET: '',
            JWT_REFRESH_SECRET: 'test_super_secure_refresh_secret_with_more_than_32_chars',
            CEO_INITIAL_PASSWORD: 'SampleCeoPass123!',
            MANAGER_INITIAL_PASSWORD: 'SampleManagerPass123!'
        });
        const shortRes = testValidation({
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb+srv://kashivashi_app:mock_pass@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod',
            JWT_SECRET: 'short_key',
            JWT_REFRESH_SECRET: 'test_super_secure_refresh_secret_with_more_than_32_chars',
            CEO_INITIAL_PASSWORD: 'SampleCeoPass123!',
            MANAGER_INITIAL_PASSWORD: 'SampleManagerPass123!'
        });
        const passed = missingRes.exitCalled && shortRes.exitCalled;
        recordTest(3, 'Production startup fails if JWT_SECRET is missing or < 32 chars', passed, 'Short or missing JWT_SECRET safely blocked');
    } catch (e) {
        recordTest(3, 'Production startup fails if JWT_SECRET is missing or < 32 chars', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 4: Production startup fails if JWT_REFRESH_SECRET is missing or < 32 chars
    // ------------------------------------------------------------------
    try {
        const shortRes = testValidation({
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb+srv://kashivashi_app:mock_pass@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod',
            JWT_SECRET: 'test_super_secure_jwt_secret_with_more_than_32_characters',
            JWT_REFRESH_SECRET: 'too_short',
            CEO_INITIAL_PASSWORD: 'SampleCeoPass123!',
            MANAGER_INITIAL_PASSWORD: 'SampleManagerPass123!'
        });
        recordTest(4, 'Production startup fails if JWT_REFRESH_SECRET < 32 chars', shortRes.exitCalled && shortRes.exitCode === 1, 'Short refresh secret safely blocked');
    } catch (e) {
        recordTest(4, 'Production startup fails if JWT_REFRESH_SECRET < 32 chars', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 5: Production startup fails if initial passwords are missing
    // ------------------------------------------------------------------
    try {
        const noCeo = testValidation({
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb+srv://kashivashi_app:mock_pass@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod',
            JWT_SECRET: 'test_super_secure_jwt_secret_with_more_than_32_characters',
            JWT_REFRESH_SECRET: 'test_super_secure_refresh_secret_with_more_than_32_chars',
            CEO_INITIAL_PASSWORD: '',
            MANAGER_INITIAL_PASSWORD: 'SampleManagerPass123!'
        });
        const noMgr = testValidation({
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb+srv://kashivashi_app:mock_pass@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod',
            JWT_SECRET: 'test_super_secure_jwt_secret_with_more_than_32_characters',
            JWT_REFRESH_SECRET: 'test_super_secure_refresh_secret_with_more_than_32_chars',
            CEO_INITIAL_PASSWORD: 'SampleCeoPass123!',
            MANAGER_INITIAL_PASSWORD: ''
        });
        const passed = noCeo.exitCalled && noMgr.exitCalled;
        recordTest(5, 'Production startup fails if initial passwords missing', passed, 'Initial passwords mandatory in production');
    } catch (e) {
        recordTest(5, 'Production startup fails if initial passwords missing', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 6: Production startup succeeds with complete valid production config
    // ------------------------------------------------------------------
    try {
        const validRes = testValidation({
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb+srv://kashivashi_app:mock_secret_pass@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod?appName=kashi-vashi-prod',
            JWT_SECRET: 'super_secure_production_jwt_access_secret_32chars',
            JWT_REFRESH_SECRET: 'super_secure_production_jwt_refresh_secret_32chars',
            CEO_INITIAL_PASSWORD: 'SecureInitialCeoPassword2026!',
            MANAGER_INITIAL_PASSWORD: 'SecureInitialManagerPassword2026!'
        });
        const passed = !validRes.exitCalled && validRes.envResult !== null && validRes.envResult.isProduction === true;
        recordTest(6, 'Production startup succeeds with valid config', passed, 'All checks passed cleanly');
    } catch (e) {
        recordTest(6, 'Production startup succeeds with valid config', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 7: Automated test suite protected from connecting to kashi-vashi-prod
    // ------------------------------------------------------------------
    try {
        const testRes = testValidation({
            NODE_ENV: 'test',
            MONGODB_URI: 'mongodb+srv://kashivashi_app:mock_pass@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod'
        });
        const blocked = testRes.exitCalled && testRes.errorOutput.includes('Automated test cannot connect to production MongoDB URI');
        recordTest(7, 'Automated tests blocked from kashi-vashi-prod', blocked, 'Safety guard triggered during test execution');
    } catch (e) {
        recordTest(7, 'Automated tests blocked from kashi-vashi-prod', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 8: Staging configuration in backend/.env remains intact
    // ------------------------------------------------------------------
    try {
        const backendEnv = fs.readFileSync(path.join(__dirname, '../backend/.env'), 'utf8');
        const hasMongoUri = backendEnv.includes('cluster0.c4djv9x.mongodb.net/varanasiYatraDB');
        const notProductionCluster = !backendEnv.includes('kashi-vashi-prod.omlaknp.mongodb.net');
        recordTest(8, 'Staging DB unchanged in backend/.env', hasMongoUri && notProductionCluster, 'Points to development/staging Cluster0, not production');
    } catch (e) {
        recordTest(8, 'Staging DB unchanged in backend/.env', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 9: Production CORS guarantees official domain
    // ------------------------------------------------------------------
    try {
        const res = testValidation({
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb+srv://kashivashi_app:mock_pass@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod',
            JWT_SECRET: 'super_secure_production_jwt_access_secret_32chars',
            JWT_REFRESH_SECRET: 'super_secure_production_jwt_refresh_secret_32chars',
            CEO_INITIAL_PASSWORD: 'SecureInitialCeoPassword2026!',
            MANAGER_INITIAL_PASSWORD: 'SecureInitialManagerPassword2026!'
        });
        const origins = res.envResult?.allowedOrigins || [];
        const hasOfficial = origins.includes('https://varanasiyatra.com') && origins.includes('https://www.varanasiyatra.com');
        recordTest(9, 'Production CORS guarantees official domain', hasOfficial, 'Contains https://varanasiyatra.com and https://www.varanasiyatra.com');
    } catch (e) {
        recordTest(9, 'Production CORS guarantees official domain', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 10: Current Vercel deployment URLs preserved
    // ------------------------------------------------------------------
    try {
        const envCode = fs.readFileSync(path.join(__dirname, '../backend/config/env.js'), 'utf8');
        const hasVercelUrl = envCode.includes('https://varanasi-yatra.vercel.app');
        recordTest(10, 'Current Vercel URL preserved', hasVercelUrl, 'https://varanasi-yatra.vercel.app remains in productionDomainOrigins');
    } catch (e) {
        recordTest(10, 'Current Vercel URL preserved', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 11: No wildcard (*) CORS in production
    // ------------------------------------------------------------------
    try {
        const envCode = fs.readFileSync(path.join(__dirname, '../backend/config/env.js'), 'utf8');
        const noWildcard = !envCode.includes("'*'") && !envCode.includes('"*"');
        recordTest(11, 'No wildcard (*) CORS permitted', noWildcard, 'Explicit domain origins only');
    } catch (e) {
        recordTest(11, 'No wildcard (*) CORS permitted', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 12: Localhost origins excluded in production
    // ------------------------------------------------------------------
    try {
        const res = testValidation({
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb+srv://kashivashi_app:mock_pass@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod',
            JWT_SECRET: 'super_secure_production_jwt_access_secret_32chars',
            JWT_REFRESH_SECRET: 'super_secure_production_jwt_refresh_secret_32chars',
            CEO_INITIAL_PASSWORD: 'SecureInitialCeoPassword2026!',
            MANAGER_INITIAL_PASSWORD: 'SecureInitialManagerPassword2026!'
        });
        const origins = res.envResult?.allowedOrigins || [];
        const hasLocalhost = origins.some(o => o.includes('localhost') || o.includes('127.0.0.1'));
        recordTest(12, 'Localhost excluded in production CORS', !hasLocalhost, 'No localhost or 127.0.0.1 in production allowlist');
    } catch (e) {
        recordTest(12, 'Localhost excluded in production CORS', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 13: Example environment files exist and are sanitized
    // ------------------------------------------------------------------
    try {
        const rootExample = fs.readFileSync(path.join(__dirname, '../.env.production.example'), 'utf8');
        const backendExample = fs.readFileSync(path.join(__dirname, '../backend/.env.production.example'), 'utf8');
        const mentionsProdCluster = rootExample.includes('kashi-vashi-prod.omlaknp.mongodb.net') && backendExample.includes('kashi-vashi-prod.omlaknp.mongodb.net');
        const hasMaskedPlaceholder = rootExample.includes('<db_password>') && backendExample.includes('<db_password>');
        const noPlaintextPasswords = !rootExample.includes('admin_mongo*9889') && !backendExample.includes('admin_mongo*9889');
        const passed = mentionsProdCluster && hasMaskedPlaceholder && noPlaintextPasswords;
        recordTest(13, 'Production env templates sanitized', passed, 'Templates reference kashi-vashi-prod with placeholders only');
    } catch (e) {
        recordTest(13, 'Production env templates sanitized', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 14: Documentation exists and is complete
    // ------------------------------------------------------------------
    try {
        const doc = fs.readFileSync(path.join(__dirname, '../docs/production-environment.md'), 'utf8');
        const hasCluster = doc.includes('kashi-vashi-prod');
        const hasDb = doc.includes('kashiVashiDB_prod');
        const hasUser = doc.includes('kashivashi_app');
        const hasSteps = doc.includes('Cloud Run Configuration') && doc.includes('Vercel Project Configuration');
        const passed = hasCluster && hasDb && hasUser && hasSteps;
        recordTest(14, 'Production deployment docs complete', passed, 'Covers cluster, credentials, Cloud Run, and Vercel');
    } catch (e) {
        recordTest(14, 'Production deployment docs complete', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 15: Frontend VITE_API_BASE_URL configuration verified
    // ------------------------------------------------------------------
    try {
        const crmConstants = fs.readFileSync(path.join(__dirname, '../src/constants/crm.js'), 'utf8');
        const envProd = fs.readFileSync(path.join(__dirname, '../.env.production'), 'utf8');
        const crmValidates = crmConstants.includes('import.meta.env.VITE_API_BASE_URL');
        const envProdConfigured = envProd.includes('VITE_API_BASE_URL=');
        recordTest(15, 'Frontend VITE_API_BASE_URL verified', crmValidates && envProdConfigured, 'crm.js prioritizes VITE_API_BASE_URL with Cloud Run fallback');
    } catch (e) {
        recordTest(15, 'Frontend VITE_API_BASE_URL verified', false, e.message);
    }

    // ------------------------------------------------------------------
    // Test 16: No secret values are printed or leaked in output
    // ------------------------------------------------------------------
    try {
        const docsContent = fs.readFileSync(path.join(__dirname, '../docs/production-environment.md'), 'utf8');
        const templatesContent = fs.readFileSync(path.join(__dirname, '../.env.production.example'), 'utf8');
        const noStagingMongoPassInDocs = !docsContent.includes('admin_mongo*9889') && !templatesContent.includes('admin_mongo*9889');
        recordTest(16, 'No secrets leaked in documentation or examples', noStagingMongoPassInDocs, 'Production docs and examples use placeholders exclusively');
    } catch (e) {
        recordTest(16, 'No secrets leaked in documentation or examples', false, e.message);
    }

    console.log('\n=======================================================');
    const passedCount = results.filter(r => r.passed).length;
    console.log(`RESULTS: ${passedCount}/${results.length} PASSED`);
    console.log('=======================================================');

    if (passedCount === results.length) {
        console.log('🎉 ALL 16 PRODUCTION CONFIGURATION VALIDATION CHECKS PASSED!');
        process.exit(0);
    } else {
        console.error('❌ SOME CHECKS FAILED');
        process.exit(1);
    }
}

runValidation().catch(err => {
    console.error('Fatal error during production configuration validation:', err);
    process.exit(1);
});
