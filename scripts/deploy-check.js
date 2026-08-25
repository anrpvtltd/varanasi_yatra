import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { validateEnvironment } from '../backend/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================================================');
console.log('VARANASI YATRA TRAVEL OS — PRE-FLIGHT DEPLOYMENT CHECKLIST');
console.log('========================================================================\n');

let checksPassed = 0;
let totalChecks = 0;

function runCheck(title, checkFn) {
    totalChecks++;
    try {
        const result = checkFn();
        if (result !== false) {
            console.log(`✅ [PASS] ${title}`);
            checksPassed++;
        } else {
            console.log(`❌ [FAIL] ${title}`);
        }
    } catch (err) {
        console.log(`❌ [FAIL] ${title}: ${err.message}`);
    }
}

// 1. Check Node & Environment Files
runCheck('Node.js Environment Version (>= 18.0.0)', () => {
    const versionMajor = parseInt(process.versions.node.split('.')[0], 10);
    return versionMajor >= 18;
});

runCheck('Environment File Template (.env.example)', () => {
    return fs.existsSync(path.join(__dirname, '../.env.example'));
});

runCheck('Backend Environment Validator (env.js)', () => {
    const env = validateEnvironment();
    return Boolean(env.jwtSecret && env.jwtRefreshSecret && env.allowedOrigins.length > 0);
});

// 2. Check Backend Server & Cloud Functions Syntax
runCheck('Backend server.js Node Syntax', () => {
    execSync('node --check backend/server.js', { stdio: 'ignore' });
    return true;
});

runCheck('Backend functions/index.js Node Syntax', () => {
    execSync('node --check backend/functions/index.js', { stdio: 'ignore' });
    return true;
});

// 3. Check Frontend Production Build & Code Quality
runCheck('Frontend Client Production Build (vite build)', () => {
    execSync('npm run build', { stdio: 'ignore' });
    return fs.existsSync(path.join(__dirname, '../dist/index.html'));
});

runCheck('Code Quality & Linter Audit (oxlint 0 errors)', () => {
    execSync('npm run lint', { stdio: 'ignore' });
    return true;
});

// 4. Check Deployment Container Definitions
runCheck('Production Dockerfile Readiness', () => {
    return fs.existsSync(path.join(__dirname, '../Dockerfile'));
});

runCheck('Production docker-compose.yml Readiness', () => {
    return fs.existsSync(path.join(__dirname, '../docker-compose.yml'));
});

console.log('\n========================================================================');
console.log(`PRE-FLIGHT VERDICT: ${checksPassed} / ${totalChecks} Deployment Checks Passed.`);
console.log('========================================================================\n');

if (checksPassed < totalChecks) {
    console.error('❌ Deployment pre-flight checks failed! Resolve issues before deploying to production.');
    process.exit(1);
} else {
    console.log('🚀 SYSTEM IS FULLY READY FOR PRODUCTION DEPLOYMENT!');
}
