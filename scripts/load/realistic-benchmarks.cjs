'use strict';
// =========================================================================
// VARANASI YATRA TRAVEL OS — REALISTIC MULTI-TIER BENCHMARKS
// Separates In-Memory Health vs Auth Reads vs DB Writes vs Full Business Workflows
// =========================================================================

const http = require('http');
const path = require('path');
const fs = require('fs');

const BACKEND_ROOT = path.join(__dirname, '../../backend');
module.paths.push(path.join(BACKEND_ROOT, 'node_modules'));

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PROJECT_ARTIFACTS = path.join(__dirname, '../../artifacts');
if (!fs.existsSync(PROJECT_ARTIFACTS)) {
    fs.mkdirSync(PROJECT_ARTIFACTS, { recursive: true });
}

function makeRequest({ port, path: reqPath, method = 'GET', headers = {}, body = null, timeout = 5000 }) {
    return new Promise((resolve) => {
        const start = Date.now();
        const payload = body ? JSON.stringify(body) : null;

        const options = {
            hostname: '127.0.0.1',
            port,
            path: reqPath,
            method,
            timeout,
            headers: {
                ...headers,
                ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const latency = Date.now() - start;
                let json = null;
                try { json = JSON.parse(data); } catch {}
                resolve({
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    statusCode: res.statusCode,
                    latency,
                    body: json,
                    raw: data
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                success: false,
                statusCode: 0,
                latency: Date.now() - start,
                error: err.message
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                success: false,
                statusCode: 504,
                latency: Date.now() - start,
                error: 'TIMEOUT'
            });
        });

        if (payload) req.write(payload);
        req.end();
    });
}

function calculatePercentiles(latencies) {
    if (latencies.length === 0) return { avg: 0, p50: 0, p95: 0, p99: 0, max: 0 };
    const sorted = [...latencies].sort((a, b) => a - b);
    const avg = Number((sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2));
    const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    const max = sorted[sorted.length - 1] || 0;
    return { avg, p50, p95, p99, max };
}

async function runRealisticBenchmarkSuite() {
    console.log('╔══════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║        VARANASI YATRA TRAVEL OS — REALISTIC MULTI-TIER BENCHMARKS                ║');
    console.log('║  Accurate comparison: Health Check vs Auth Read vs DB Write vs Full Workflow     ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════════╝\n');

    process.env.NODE_ENV = 'test';
    process.env.SILENT_LOGS = 'true';

    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const { connectDatabase, disconnectDatabase } = require(path.join(BACKEND_ROOT, 'config/database'));
    const { env } = require(path.join(BACKEND_ROOT, 'config/env'));
    const app = require(path.join(BACKEND_ROOT, 'server'));

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;

    await connectDatabase(mongoUri);

    // Create CEO user in DB & generate valid JWT
    const db = mongoose.connection.db;
    const ceoUserId = new mongoose.Types.ObjectId();
    await db.collection('users').insertOne({
        _id: ceoUserId,
        email: 'ceo@varanasiyatra.com',
        role: 'CEO',
        name: 'Chief Executive'
    });

    const ceoToken = jwt.sign(
        { userId: ceoUserId.toString(), role: 'CEO', name: 'Chief Executive', email: 'ceo@varanasiyatra.com' },
        env.jwtSecret,
        { algorithm: 'HS256', issuer: env.jwtIssuer, audience: env.jwtAudience, expiresIn: '2h' }
    );

    const authHeaders = {
        Authorization: `Bearer ${ceoToken}`
    };

    // Pre-populate 50 leads for realistic authenticated read benchmark
    for (let i = 1; i <= 50; i++) {
        await db.collection('enquiries').insertOne({
            name: `Seeded Traveler ${i}`,
            mobile: `9198765432${String(i).padStart(2, '0')}`,
            pickup: 'Varanasi Junction',
            destination: 'Kashi Vishwanath Temple',
            tripDuration: '3 Days',
            travelers: '4',
            stage: 'PROPOSAL_SENT',
            status: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    const benchmarkResults = [];

    // ─────────────────────────────────────────────────────────────────────────
    // TIER A: Infrastructure Benchmark (GET /health)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('┌───────────────────────────────────────────────────────────────┐');
    console.log('│  TIER A: Infrastructure / Process Liveness (GET /health)      │');
    console.log('│  Profile: Pure in-memory route, zero DB I/O, zero auth crypto │');
    console.log('└───────────────────────────────────────────────────────────────┘');
    {
        const memStart = process.memoryUsage().heapUsed / (1024 * 1024);
        const durationMs = 3000;
        const concurrency = 10;
        const latencies = [];
        let success = 0, failed = 0;
        const start = Date.now();
        let running = true;

        const worker = async () => {
            while (running && (Date.now() - start) < durationMs) {
                const res = await makeRequest({ port, path: '/health', method: 'GET' });
                latencies.push(res.latency);
                if (res.success) success++; else failed++;
            }
        };
        await Promise.all(Array.from({ length: concurrency }, () => worker()));
        running = false;

        const memEnd = process.memoryUsage().heapUsed / (1024 * 1024);
        const memDelta = Number((memEnd - memStart).toFixed(2));
        const totalDuration = (Date.now() - start) / 1000;
        const total = success + failed;
        const rps = Number((total / totalDuration).toFixed(2));
        const percentiles = calculatePercentiles(latencies);

        benchmarkResults.push({
            tier: 'Tier A: Infrastructure',
            name: 'Health Check (/health)',
            nature: 'In-Memory, Zero DB, Zero Crypto',
            concurrency,
            durationSec: Number(totalDuration.toFixed(2)),
            totalRequests: total,
            success,
            failed,
            errorRatePercent: total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0,
            throughput: `${rps} req/sec`,
            rps,
            latencyMs: percentiles,
            memoryDeltaMb: memDelta
        });
        console.log(`  ✔ Completed: ${total} requests in ${totalDuration.toFixed(1)}s (${rps} req/sec) | P50=${percentiles.p50}ms, P95=${percentiles.p95}ms, P99=${percentiles.p99}ms | Heap Δ: ${memDelta > 0 ? '+' : ''}${memDelta}MB\n`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIER B: Authenticated API Read Benchmark (GET /admin/enquiries)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('┌───────────────────────────────────────────────────────────────┐');
    console.log('│  TIER B: Authenticated Database Read (GET /admin/enquiries)   │');
    console.log('│  Profile: JWT Verification (HS256) + MongoDB Query + Mongoose │');
    console.log('└───────────────────────────────────────────────────────────────┘');
    {
        const memStart = process.memoryUsage().heapUsed / (1024 * 1024);
        const durationMs = 3000;
        const concurrency = 10;
        const latencies = [];
        let success = 0, failed = 0;
        const start = Date.now();
        let running = true;

        const worker = async () => {
            while (running && (Date.now() - start) < durationMs) {
                const res = await makeRequest({
                    port,
                    path: '/admin/enquiries',
                    method: 'GET',
                    headers: authHeaders
                });
                latencies.push(res.latency);
                if (res.success) success++; else failed++;
            }
        };
        await Promise.all(Array.from({ length: concurrency }, () => worker()));
        running = false;

        const memEnd = process.memoryUsage().heapUsed / (1024 * 1024);
        const memDelta = Number((memEnd - memStart).toFixed(2));
        const totalDuration = (Date.now() - start) / 1000;
        const total = success + failed;
        const rps = Number((total / totalDuration).toFixed(2));
        const percentiles = calculatePercentiles(latencies);

        benchmarkResults.push({
            tier: 'Tier B: Authenticated Read',
            name: 'Admin Enquiries (/admin/enquiries)',
            nature: 'JWT Auth + MongoDB Find 50 Docs',
            concurrency,
            durationSec: Number(totalDuration.toFixed(2)),
            totalRequests: total,
            success,
            failed,
            errorRatePercent: total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0,
            throughput: `${rps} req/sec`,
            rps,
            latencyMs: percentiles,
            memoryDeltaMb: memDelta
        });
        console.log(`  ✔ Completed: ${total} requests in ${totalDuration.toFixed(1)}s (${rps} req/sec) | P50=${percentiles.p50}ms, P95=${percentiles.p95}ms, P99=${percentiles.p99}ms | Heap Δ: ${memDelta > 0 ? '+' : ''}${memDelta}MB\n`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIER C: Database Write Benchmark (POST /api/enquiry)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('┌───────────────────────────────────────────────────────────────┐');
    console.log('│  TIER C: Database Write & Lead Creation (POST /api/enquiry)   │');
    console.log('│  Profile: Input Validation + MongoDB Insert + Activity Audit  │');
    console.log('└───────────────────────────────────────────────────────────────┘');
    {
        const memStart = process.memoryUsage().heapUsed / (1024 * 1024);
        const durationMs = 3000;
        const concurrency = 8;
        const latencies = [];
        let success = 0, failed = 0;
        const start = Date.now();
        let running = true;
        let counter = 0;

        const worker = async () => {
            while (running && (Date.now() - start) < durationMs) {
                counter++;
                const res = await makeRequest({
                    port,
                    path: '/api/enquiry',
                    method: 'POST',
                    body: {
                        name: `Bench Lead ${counter}`,
                        mobile: `919811${String(counter % 900000 + 100000)}`,
                        pickup: 'Varanasi Cantt',
                        destination: 'Assi Ghat',
                        travelers: '2',
                        tripDuration: '2 Days'
                    }
                });
                latencies.push(res.latency);
                if (res.success) success++; else failed++;
            }
        };
        await Promise.all(Array.from({ length: concurrency }, () => worker()));
        running = false;

        const memEnd = process.memoryUsage().heapUsed / (1024 * 1024);
        const memDelta = Number((memEnd - memStart).toFixed(2));
        const totalDuration = (Date.now() - start) / 1000;
        const total = success + failed;
        const rps = Number((total / totalDuration).toFixed(2));
        const percentiles = calculatePercentiles(latencies);

        benchmarkResults.push({
            tier: 'Tier C: Database Write',
            name: 'Lead Registration (/api/enquiry)',
            nature: 'Validation + MongoDB Document Insert',
            concurrency,
            durationSec: Number(totalDuration.toFixed(2)),
            totalRequests: total,
            success,
            failed,
            errorRatePercent: total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0,
            throughput: `${rps} writes/sec`,
            rps,
            latencyMs: percentiles,
            memoryDeltaMb: memDelta
        });
        console.log(`  ✔ Completed: ${total} writes in ${totalDuration.toFixed(1)}s (${rps} writes/sec) | P50=${percentiles.p50}ms, P95=${percentiles.p95}ms, P99=${percentiles.p99}ms | Heap Δ: ${memDelta > 0 ? '+' : ''}${memDelta}MB\n`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIER D: Real Business Workflow Benchmark
    // (Lead -> Quote -> Accept -> Booking -> Payment Receipt)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('┌───────────────────────────────────────────────────────────────┐');
    console.log('│  TIER D: Real Business Workflow (4 Sequential DB Transactions)│');
    console.log('│  Flow: Lead -> Quote -> Accept -> Booking -> Payment Receipt  │');
    console.log('└───────────────────────────────────────────────────────────────┘');
    {
        const memStart = process.memoryUsage().heapUsed / (1024 * 1024);
        const durationMs = 4000;
        const concurrency = 4;
        const workflowLatencies = [];
        let completedWorkflows = 0;
        let failedWorkflows = 0;
        const start = Date.now();
        let running = true;
        let wfCounter = 0;

        const workflowWorker = async () => {
            while (running && (Date.now() - start) < durationMs) {
                wfCounter++;
                const currentWfNum = wfCounter;
                const wfStart = Date.now();
                let wfSuccess = true;

                try {
                    // Step 1: Create Lead
                    const leadRes = await makeRequest({
                        port,
                        path: '/api/enquiry',
                        method: 'POST',
                        body: {
                            name: `Workflow Customer ${currentWfNum}`,
                            mobile: `919922${String(currentWfNum % 900000 + 100000)}`,
                            pickup: 'Airport',
                            destination: 'Kashi Vishwanath',
                            travelers: '3',
                            tripDuration: '3 Days'
                        }
                    });
                    if (!leadRes.success || !leadRes.body?.data?._id) {
                        wfSuccess = false;
                    }
                    const leadId = leadRes.body?.data?._id;

                    // Step 2: Create Quote
                    let quoteId = null;
                    if (wfSuccess) {
                        const quoteRes = await makeRequest({
                            port,
                            path: '/admin/quote/create',
                            method: 'POST',
                            headers: authHeaders,
                            body: {
                                leadId,
                                clientName: `Workflow Customer ${currentWfNum}`,
                                clientPhone: `919922${String(currentWfNum % 900000 + 100000)}`,
                                totalAmount: 32000,
                                advanceRequired: 10000,
                                duration: '3 Days',
                                hotelCategory: '3 Star Deluxe',
                                inclusions: ['AC Cab', 'Breakfast', 'Temple Pass'],
                                validityDays: 7
                            }
                        });
                        if (!quoteRes.success || !quoteRes.body?.quote?._id) {
                            wfSuccess = false;
                        } else {
                            quoteId = quoteRes.body.quote._id;
                            // Step 2b: Accept Quote
                            const acceptRes = await makeRequest({
                                port,
                                path: `/admin/quote/update/${quoteId}`,
                                method: 'PUT',
                                headers: authHeaders,
                                body: { status: 'ACCEPTED' }
                            });
                            if (!acceptRes.success) {
                                wfSuccess = false;
                            }
                        }
                    }

                    // Step 3: Create Booking from Accepted Quote
                    let bookingId = null;
                    if (wfSuccess && quoteId) {
                        const bookingRes = await makeRequest({
                            port,
                            path: '/admin/booking/create',
                            method: 'POST',
                            headers: authHeaders,
                            body: {
                                quoteId,
                                customerName: `Workflow Customer ${currentWfNum}`,
                                customerPhone: `919922${String(currentWfNum % 900000 + 100000)}`,
                                totalAmount: 32000,
                                advanceAmount: 10000,
                                travelDate: '2026-11-15'
                            }
                        });
                        if (!bookingRes.success || !bookingRes.body?.booking?._id) {
                            wfSuccess = false;
                        } else {
                            bookingId = bookingRes.body.booking._id;
                        }
                    }

                    // Step 4: Record Customer Payment
                    if (wfSuccess && bookingId) {
                        const payRes = await makeRequest({
                            port,
                            path: '/admin/booking/customer-payment',
                            method: 'POST',
                            headers: authHeaders,
                            body: {
                                bookingId: String(bookingId),
                                amount: 10000,
                                paymentMethod: 'UPI',
                                referenceNumber: `UPI-WF-${currentWfNum}-${Date.now()}`,
                                paymentType: 'ADVANCE'
                            }
                        });
                        if (!payRes.success) {
                            wfSuccess = false;
                        }
                    }

                    const wfLatency = Date.now() - wfStart;
                    workflowLatencies.push(wfLatency);

                    if (wfSuccess) completedWorkflows++;
                    else failedWorkflows++;

                } catch {
                    failedWorkflows++;
                }
            }
        };

        await Promise.all(Array.from({ length: concurrency }, () => workflowWorker()));
        running = false;

        const memEnd = process.memoryUsage().heapUsed / (1024 * 1024);
        const memDelta = Number((memEnd - memStart).toFixed(2));
        const totalDuration = (Date.now() - start) / 1000;
        const totalWf = completedWorkflows + failedWorkflows;
        const wps = Number((completedWorkflows / totalDuration).toFixed(2));
        const percentiles = calculatePercentiles(workflowLatencies);

        benchmarkResults.push({
            tier: 'Tier D: Business Workflow',
            name: 'Lead -> Quote -> Booking -> Payment',
            nature: '4 Sequential Multi-Collection DB Transactions',
            concurrency,
            durationSec: Number(totalDuration.toFixed(2)),
            totalRequests: totalWf * 4,
            completedWorkflows,
            failedWorkflows,
            errorRatePercent: totalWf > 0 ? Number(((failedWorkflows / totalWf) * 100).toFixed(2)) : 0,
            throughput: `${wps} workflows/sec (${(wps * 4).toFixed(1)} writes/sec)`,
            wps,
            latencyMs: percentiles,
            memoryDeltaMb: memDelta
        });
        console.log(`  ✔ Completed: ${completedWorkflows} full 4-step workflows in ${totalDuration.toFixed(1)}s (${wps} workflows/sec) | P50=${percentiles.p50}ms, P95=${percentiles.p95}ms, P99=${percentiles.p99}ms, Errors=${failedWorkflows} | Heap Δ: ${memDelta > 0 ? '+' : ''}${memDelta}MB\n`);
    }

    process.env.SILENT_LOGS = 'false';

    await new Promise(r => server.close(r));
    await disconnectDatabase();
    await mongoServer.stop();

    // ─────────────────────────────────────────────────────────────────────────
    // Save Results & Display Final Comparison Table
    // ─────────────────────────────────────────────────────────────────────────
    const outputReport = {
        environment: 'test',
        timestamp: new Date().toISOString(),
        description: 'Realistic Multi-Tier Performance Benchmarks separating in-memory health checks from true business workflows',
        benchmarks: benchmarkResults
    };

    const outPath = path.join(PROJECT_ARTIFACTS, 'realistic-benchmark-results.json');
    fs.writeFileSync(outPath, JSON.stringify(outputReport, null, 2), 'utf-8');
    console.log(`💾 Machine-readable realistic benchmarks saved to: ${outPath}\n`);

    console.log('╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                     REALISTIC MULTI-TIER PERFORMANCE AUDIT TABLE                                      ║');
    console.log('╠══════════════════════════════╦═════════════════════════════════════╦═════════════════════╦════════════╦════════════════╣');
    console.log('║ Tier & Operation             ║ Nature & Complexity                 ║ Real Throughput     ║ Latency P50║ Latency P99    ║');
    console.log('╠══════════════════════════════╬═════════════════════════════════════╬═════════════════════╬════════════╬════════════════╣');
    for (const b of benchmarkResults) {
        const tier = (b.name || '').slice(0, 28).padEnd(28);
        const nature = (b.nature || '').slice(0, 35).padEnd(35);
        const tp = (b.throughput || '').slice(0, 19).padStart(19);
        const p50 = (b.latencyMs?.p50 !== undefined ? `${b.latencyMs.p50}ms` : 'N/A').padStart(10);
        const p99 = (b.latencyMs?.p99 !== undefined ? `${b.latencyMs.p99}ms` : 'N/A').padStart(14);
        console.log(`║ ${tier} ║ ${nature} ║ ${tp} ║ ${p50} ║ ${p99} ║`);
    }
    console.log('╚══════════════════════════════╩═════════════════════════════════════╩═════════════════════╩════════════╩════════════════╝\n');

    return outputReport;
}

if (require.main === module) {
    runRealisticBenchmarkSuite()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Fatal realistic benchmark error:', err);
            process.exit(1);
        });
}

module.exports = { runRealisticBenchmarkSuite };
