const { runLoadProfile } = require('./runner');

async function runBaselineTest(port = 5001) {
    return runLoadProfile({
        name: 'Baseline Operational Load',
        port,
        endpoint: '/ready',
        concurrency: 15,
        durationMs: 4000
    });
}

if (require.main === module) {
    runBaselineTest().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runBaselineTest };
