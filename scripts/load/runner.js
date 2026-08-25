const http = require('http');

/**
 * Lightweight Concurrent HTTP Load Testing Engine
 * Accurately measures RPS, Latency Percentiles (P50, P95, P99), Errors & Memory.
 */

function makeSingleRequest({ hostname = '127.0.0.1', port, path = '/health', method = 'GET', headers = {}, body = null, timeout = 3000 }) {
    return new Promise((resolve) => {
        const start = Date.now();
        const payload = body ? JSON.stringify(body) : null;

        const options = {
            hostname,
            port,
            path,
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
                resolve({
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    statusCode: res.statusCode,
                    latency
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                success: false,
                statusCode: 0,
                error: err.message,
                latency: Date.now() - start
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                success: false,
                statusCode: 504,
                error: 'TIMEOUT',
                latency: Date.now() - start
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

async function runLoadProfile({
    name = 'LoadProfile',
    port = 5001,
    endpoint = '/health',
    method = 'GET',
    headers = {},
    body = null,
    concurrency = 10,
    durationMs = 5000
}) {
    console.log(`\n🚀 [Load Test: ${name}] Running with Concurrency=${concurrency} for ${(durationMs/1000).toFixed(1)}s on ${endpoint}...`);

    const latencies = [];
    let successfulRequests = 0;
    let failedRequests = 0;
    const startTime = Date.now();
    let isRunning = true;

    const memBefore = process.memoryUsage();

    const worker = async () => {
        while (isRunning && (Date.now() - startTime) < durationMs) {
            const res = await makeSingleRequest({ port, path: endpoint, method, headers, body });
            latencies.push(res.latency);
            if (res.success) successfulRequests++;
            else failedRequests++;
        }
    };

    // Spawn concurrent worker promises
    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);
    isRunning = false;

    const totalDurationSec = (Date.now() - startTime) / 1000;
    const totalRequests = successfulRequests + failedRequests;
    const rps = Number((totalRequests / totalDurationSec).toFixed(2));
    const errorRate = totalRequests > 0 ? Number(((failedRequests / totalRequests) * 100).toFixed(2)) : 0;
    const percentiles = calculatePercentiles(latencies);
    const memAfter = process.memoryUsage();

    const result = {
        name,
        endpoint,
        concurrency,
        durationSeconds: Number(totalDurationSec.toFixed(2)),
        totalRequests,
        successfulRequests,
        failedRequests,
        errorRatePercent: errorRate,
        rps,
        latencyMs: percentiles,
        memoryMb: {
            heapUsedDelta: Number(((memAfter.heapUsed - memBefore.heapUsed) / (1024 * 1024)).toFixed(2)),
            heapTotalMb: Number((memAfter.heapTotal / (1024 * 1024)).toFixed(2)),
            rssMb: Number((memAfter.rss / (1024 * 1024)).toFixed(2))
        }
    };

    console.log(`  ✔ Requests: ${totalRequests} (${rps} req/sec) | Errors: ${failedRequests} (${errorRate}%)`);
    console.log(`  ✔ Latency : Avg=${percentiles.avg}ms | P50=${percentiles.p50}ms | P95=${percentiles.p95}ms | P99=${percentiles.p99}ms | Max=${percentiles.max}ms`);

    return result;
}

module.exports = {
    runLoadProfile,
    makeSingleRequest,
    calculatePercentiles
};
