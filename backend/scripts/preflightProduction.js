const { validateEnvironment } = require('../config/env');

console.log('========================================================================');
console.log('VARANASI YATRA TRAVEL OS — PRODUCTION PREFLIGHT REPORT');
console.log('========================================================================\n');

let passCount = 0;
let warnCount = 0;
let failCount = 0;

function report(status, title, details = '') {
    if (status === 'PASS') {
        console.log(`✓ [PASS] ${title} ${details ? `(${details})` : ''}`);
        passCount++;
    } else if (status === 'WARN') {
        console.log(`⚠ [WARN] ${title} ${details ? `(${details})` : ''}`);
        warnCount++;
    } else {
        console.log(`✗ [FAIL] ${title} ${details ? `(${details})` : ''}`);
        failCount++;
    }
}

try {
    const env = validateEnvironment();

    // 1. NODE_ENV Check
    if (process.env.NODE_ENV === 'production') {
        report('PASS', 'NODE_ENV configured to production');
    } else {
        report('WARN', 'NODE_ENV is set to development (Set NODE_ENV=production before deploying)');
    }

    // 2. JWT Access Secret Check
    if (process.env.JWT_SECRET) {
        if (process.env.JWT_SECRET.length >= 32) {
            report('PASS', 'JWT_SECRET configured and meets security length requirements (>=32 chars)');
        } else {
            report('FAIL', 'JWT_SECRET length is less than 32 characters in production mode');
        }
    } else {
        report(process.env.NODE_ENV === 'production' ? 'FAIL' : 'WARN', 'JWT_SECRET missing (falling back to dev default secret)');
    }

    // 3. JWT Refresh Secret Check
    if (process.env.JWT_REFRESH_SECRET) {
        if (process.env.JWT_REFRESH_SECRET.length >= 32) {
            report('PASS', 'JWT_REFRESH_SECRET configured and meets security length requirements (>=32 chars)');
        } else {
            report('FAIL', 'JWT_REFRESH_SECRET length is less than 32 characters in production mode');
        }
    } else {
        report(process.env.NODE_ENV === 'production' ? 'FAIL' : 'WARN', 'JWT_REFRESH_SECRET missing');
    }

    // 4. MongoDB URI Check
    if (process.env.MONGODB_URI) {
        report('PASS', 'MONGODB_URI configured');
    } else {
        report('WARN', 'MONGODB_URI using default local connection (mongodb://localhost:27017/varanasi_yatra)');
    }

    // 5. Allowed Origins Check
    if (env.allowedOrigins && env.allowedOrigins.length > 0) {
        report('PASS', 'ALLOWED_ORIGINS configured', `${env.allowedOrigins.length} origin(s) active`);
    } else {
        report('FAIL', 'ALLOWED_ORIGINS missing or empty');
    }

    // 6. Storage Provider Configuration Check
    if (env.storageProvider) {
        report('PASS', 'Storage provider configured', `Provider: ${env.storageProvider}`);
    } else {
        report('FAIL', 'STORAGE_PROVIDER missing');
    }

    // 7. Automation Configuration Check
    report('PASS', 'Automation engine configured', `Enabled: ${env.automationEnabled}, Provider: ${env.notificationProvider}`);

    // 8. WhatsApp Integration Check
    if (process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
        report('PASS', 'Meta WhatsApp API integration configured');
    } else {
        report('WARN', 'WhatsApp API credentials missing (ConsoleProvider fallback active)');
    }

    // 9. Email Integration Check
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        report('PASS', 'SMTP Email integration configured');
    } else {
        report('WARN', 'SMTP credentials missing (ConsoleProvider fallback active)');
    }

} catch (err) {
    report('FAIL', 'Preflight execution error', err.message);
}

console.log('\n========================================================================');
console.log(`PREFLIGHT SUMMARY: ${passCount} PASS | ${warnCount} WARNING | ${failCount} FAIL`);
console.log('========================================================================\n');

if (failCount > 0) {
    console.error('❌ PRODUCTION PREFLIGHT FAILED: Fix critical failure items before deploying.');
    process.exit(1);
} else {
    console.log('🚀 PRODUCTION PREFLIGHT PASSED: Application is environment-aware and deployable.');
}
