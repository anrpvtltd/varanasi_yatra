const { runLoadProfile } = require('./runner.cjs');

async function runSmokeTest(port = 5001) {
    return runLoadProfile({
        name: 'Smoke Load Profile',
        port,
        endpoint: '/health',
        concurrency: 5,
        durationMs: 3000
    });
}

if (require.main === module) {
    runSmokeTest().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runSmokeTest };
