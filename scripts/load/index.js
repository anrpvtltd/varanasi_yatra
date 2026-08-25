const fs = require('fs');
const path = require('path');
const { runSmokeTest } = require('./smoke');
const { runBaselineTest } = require('./baseline');
const { runStressTest } = require('./stress');
const { runSpikeTest } = require('./spike');
const { runSoakTest } = require('./soak');

const PROJECT_ARTIFACTS = path.join(__dirname, '../../artifacts');
if (!fs.existsSync(PROJECT_ARTIFACTS)) {
    fs.mkdirSync(PROJECT_ARTIFACTS, { recursive: true });
}

async function runAllLoadTests(port = 5001) {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  VARANASI YATRA TRAVEL OS — LOAD & STRESS TEST MASTER        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const smoke = await runSmokeTest(port);
    const baseline = await runBaselineTest(port);
    const stress = await runStressTest(port);
    const spike = await runSpikeTest(port);
    const soak = await runSoakTest(port);

    const stressFlattened = Array.isArray(stress) ? stress : [stress];
    const allProfiles = [smoke, baseline, ...stressFlattened, spike.peak, soak];

    const resultsOutput = {
        environment: process.env.NODE_ENV || 'test',
        timestamp: new Date().toISOString(),
        profiles: allProfiles
    };

    const outPath = path.join(PROJECT_ARTIFACTS, 'load-test-results.json');
    fs.writeFileSync(outPath, JSON.stringify(resultsOutput, null, 2), 'utf-8');
    console.log(`\n💾 Saved machine-readable metrics to: ${outPath}`);

    // Print summary table
    console.log('\n╔════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                LOAD TEST METRIC SUMMARY                                    ║');
    console.log('╠═════════════════════════════════╦═════════════╦══════════╦═════════╦════════╦════════╦═════════╣');
    console.log('║ Profile Name                    ║ Concurrency ║ Requests ║   RPS   ║ Error% ║ P50 ms ║ P99 ms  ║');
    console.log('╠═════════════════════════════════╬═════════════╬══════════╬═════════╬════════╬════════╬═════════╣');

    for (const p of allProfiles) {
        const name = (p.name || 'Profile').slice(0, 31).padEnd(31);
        const conc = String(p.concurrency).padStart(11);
        const reqs = String(p.totalRequests).padStart(8);
        const rps = String(p.rps).padStart(7);
        const err = (p.errorRatePercent + '%').padStart(6);
        const p50 = (p.latencyMs?.p50 + 'ms').padStart(6);
        const p99 = (p.latencyMs?.p99 + 'ms').padStart(7);
        console.log(`║ ${name} ║ ${conc} ║ ${reqs} ║ ${rps} ║ ${err} ║ ${p50} ║ ${p99} ║`);
    }
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════════╝\n');

    return resultsOutput;
}

if (require.main === module) {
    runAllLoadTests(Number(process.env.PORT) || 5001)
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Fatal load test error:', err);
            process.exit(1);
        });
}

module.exports = { runAllLoadTests };
