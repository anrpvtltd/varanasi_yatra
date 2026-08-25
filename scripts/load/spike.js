const { runLoadProfile } = require('./runner');

async function runSpikeTest(port = 5001) {
    console.log('\n┌──────────────────────────────────────────────────┐');
    console.log('│  SPIKE LOAD PROFILE: Normal -> 50 Spike -> Normal │');
    console.log('└──────────────────────────────────────────────────┘');

    // Phase 1: Pre-spike normal
    const pre = await runLoadProfile({
        name: 'Spike Phase 1 (Pre-Spike Normal)',
        port,
        endpoint: '/health',
        concurrency: 5,
        durationMs: 2000
    });

    // Phase 2: Instant Spike
    const peak = await runLoadProfile({
        name: 'Spike Phase 2 (Peak 50 Concurrency)',
        port,
        endpoint: '/health',
        concurrency: 50,
        durationMs: 3000
    });

    // Phase 3: Post-spike Recovery
    const post = await runLoadProfile({
        name: 'Spike Phase 3 (Post-Spike Recovery)',
        port,
        endpoint: '/health',
        concurrency: 5,
        durationMs: 2000
    });

    const recovered = post.errorRatePercent === 0 && post.latencyMs.p50 <= pre.latencyMs.p50 * 2;
    console.log(`\n  Spike Recovery Result: ${recovered ? 'RECOVERED (PASS)' : 'DEGRADED'}`);

    return { pre, peak, post, recovered };
}

if (require.main === module) {
    runSpikeTest().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runSpikeTest };
