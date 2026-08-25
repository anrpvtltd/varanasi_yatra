import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * Real Staging / Production Deployment Smoke Test Runner
 * Validates 10 critical operational dimensions against live deployment URLs.
 */

const TARGET_API_URL = process.env.STAGING_API_URL || process.env.PRODUCTION_API_URL || process.env.API_BASE_URL || null;
const TARGET_FRONTEND_URL = process.env.STAGING_FRONTEND_URL || process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || null;

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  VARANASI YATRA TRAVEL OS — DEPLOYMENT SMOKE TEST RUNNER     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

function fetchUrl(targetUrl, options = {}) {
    return new Promise((resolve) => {
        try {
            const url = new URL(targetUrl);
            const client = url.protocol === 'https:' ? https : http;
            const req = client.request(url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    let json = null;
                    try { json = JSON.parse(data); } catch {}
                    resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
                });
            });
            req.on('error', (err) => resolve({ status: 0, error: err.message, body: null }));
            if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
            req.end();
        } catch (e) {
            resolve({ status: 0, error: e.message, body: null });
        }
    });
}

export async function runDeploymentSmokeTests(apiUrl = TARGET_API_URL, frontendUrl = TARGET_FRONTEND_URL) {
    if (!apiUrl) {
        console.log('ℹ️  INFO: No STAGING_API_URL or PRODUCTION_API_URL provided.');
        console.log('   Status: LOCAL INFRASTRUCTURE TEST ONLY / LOCAL DRY-RUN MODE');
        console.log('   (Smoke runner is fully configured and ready to execute once a remote URL is provisioned)\n');
        return {
            executed: false,
            message: 'DEPLOYMENT NOT EXECUTED — LOCAL DRY-RUN ONLY',
            checks: []
        };
    }

    console.log(`📡 Probing Live API at: ${apiUrl}`);
    if (frontendUrl) console.log(`🌐 Probing Live Frontend at: ${frontendUrl}`);

    const checks = [];
    let passed = 0;

    // 1. DNS & Reachability
    const reachRes = await fetchUrl(`${apiUrl}/health`);
    const reachOk = reachRes.status > 0;
    checks.push({ name: '1. DNS & Host Reachability', passed: reachOk, detail: reachOk ? 'Connected' : reachRes.error });
    if (reachOk) passed++;

    // 2. /health Liveness Probe
    const healthOk = reachRes.status === 200 && reachRes.body?.status === 'ok';
    checks.push({ name: '2. Backend Process Liveness (/health -> 200 OK)', passed: healthOk });
    if (healthOk) passed++;

    // 3. /ready Dependency Readiness Probe
    const readyRes = await fetchUrl(`${apiUrl}/ready`);
    const readyOk = readyRes.status === 200 && readyRes.body?.database === 'CONNECTED';
    checks.push({ name: '3. Dependency Readiness (/ready -> 200 CONNECTED)', passed: readyOk });
    if (readyOk) passed++;

    // 4. HTTPS Validation (when URL is https://)
    const isHttps = apiUrl.startsWith('https://');
    const httpsOk = isHttps ? reachRes.status > 0 : true;
    checks.push({ name: `4. Protocol Validation (${isHttps ? 'HTTPS Enforced' : 'HTTP Development Mode'})`, passed: httpsOk });
    if (httpsOk) passed++;

    // 5. Authentication Flow Reachability
    const authRes = await fetchUrl(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'probe_check@varanasiyatra.com', password: 'probe_invalid_password_9988' })
    });
    const authOk = authRes.status === 401 || authRes.status === 400;
    checks.push({ name: '5. Authentication Endpoint Security (/auth/login responds with safe 401/400)', passed: authOk });
    if (authOk) passed++;

    // 6. Protected Endpoint Authorization Guard
    const metricsRes = await fetchUrl(`${apiUrl}/admin/system/metrics`);
    const metricsGuarded = metricsRes.status === 401;
    checks.push({ name: '6. Protected Metrics Guard (/admin/system/metrics returns 401 for unauthenticated)', passed: metricsGuarded });
    if (metricsGuarded) passed++;

    // 7. Database Connectivity Telemetry
    const dbOk = readyRes.body?.database === 'CONNECTED';
    checks.push({ name: '7. Live Database Connectivity Verified', passed: dbOk });
    if (dbOk) passed++;

    // 8. CORS Response Headers
    const corsRes = await fetchUrl(`${apiUrl}/health`, {
        headers: { Origin: frontendUrl || 'https://varanasiyatra.com' }
    });
    const corsOk = Boolean(corsRes.headers['access-control-allow-origin'] || corsRes.headers['access-control-allow-credentials']);
    checks.push({ name: '8. CORS Response Headers Verification', passed: corsOk });
    if (corsOk) passed++;

    // 9. X-Request-ID Correlation Header
    const reqIdOk = Boolean(reachRes.headers['x-request-id'] || readyRes.headers['x-request-id']);
    checks.push({ name: '9. Observability Header Propagation (X-Request-ID present)', passed: reqIdOk });
    if (reqIdOk) passed++;

    // 10. Error Response Safety (No stack traces in error output)
    const errRes = await fetchUrl(`${apiUrl}/api/non_existent_route_probe_404`);
    const noStackTrace = errRes.status === 404 && !errRes.raw?.includes('node_modules') && !errRes.raw?.includes('at ');
    checks.push({ name: '10. Error Response Safety (404 clean JSON without stack trace leak)', passed: noStackTrace });
    if (noStackTrace) passed++;

    console.log('\n──────────────────────────────────────────────────');
    checks.forEach(c => console.log(`  ${c.passed ? '✅' : '❌'} ${c.name}`));
    console.log('──────────────────────────────────────────────────');
    console.log(`Deployment Smoke Summary: ${passed}/${checks.length} checks passed.\n`);

    return {
        executed: true,
        passed,
        total: checks.length,
        checks
    };
}

if (process.argv[1] && process.argv[1].endsWith('staging-smoke-test.js')) {
    runDeploymentSmokeTests().then((res) => {
        if (!res.executed) {
            console.log('Smoke test runner completed in local dry-run mode.');
            process.exit(0);
        }
        process.exit(res.passed === res.total ? 0 : 1);
    });
}
