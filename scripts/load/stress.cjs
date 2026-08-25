const { runLoadProfile } = require('./runner.cjs');

async function runStressTest(port = 5001) {
    const levels = [10, 25, 50, 100];
    const results = [];

    console.log('\n┌──────────────────────────────────────────────────┐');
    console.log('│  STRESS TEST ESCALATION: 10 -> 25 -> 50 -> 100    │');
    console.log('└──────────────────────────────────────────────────┘');

    for (const concurrency of levels) {
        const res = await runLoadProfile({
            name: `Stress Level (${concurrency} users)`,
            port,
            endpoint: '/health',
            concurrency,
            durationMs: 3000
        });
        results.push(res);

        if (res.errorRatePercent > 25) {
            console.warn(`⚠️ [Stress Gate] Error threshold reached at concurrency=${concurrency}. Halting further escalation.`);
            break;
        }
    }

    return results;
}

if (require.main === module) {
    runStressTest().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runStressTest };
