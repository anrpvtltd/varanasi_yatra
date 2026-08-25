const { runLoadProfile } = require('./runner.cjs');

async function runSoakTest(port = 5001) {
    console.log('\n┌──────────────────────────────────────────────────┐');
    console.log('│  SOAK & STABILITY PROFILE: Extended Steady Load  │');
    console.log('└──────────────────────────────────────────────────┘');

    return runLoadProfile({
        name: 'Extended Soak Load',
        port,
        endpoint: '/health',
        concurrency: 12,
        durationMs: 8000
    });
}

if (require.main === module) {
    runSoakTest().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runSoakTest };
