import { execSync } from 'child_process';

const suites = [
    'scripts/test-prompt5-core-suite.js',
    'scripts/test-prompt4-ceo-suite.js',
    'scripts/test-ceo-financial-semantics.js',
    'scripts/test-manager-quote-workflow.js',
    'scripts/test-final-crm-integration.js',
    'scripts/test-commercial-models.js',
    'scripts/test-customer-payment-flow.js',
    'scripts/test-quote-to-receipt-flow.js',
    'scripts/test-phase6-lifecycle-flow.js',
    'scripts/test-resource-master.js',
    'scripts/test-auth-session.js',
    'scripts/test-e2e-master-crm-flow.js'
];

console.log('================================================================');
console.log('🧪 RUNNING ALL 12 VERIFICATION & REGRESSION TEST SUITES');
console.log('================================================================\n');

const results = [];

for (const suite of suites) {
    process.stdout.write(`▶️  Running ${suite}... `);
    try {
        const out = execSync(`node ${suite}`, { encoding: 'utf8', env: process.env });
        // Extract pass summary if available
        const lines = out.split('\n');
        const passLine = lines.find(l => l.includes('Passed') || l.includes('PASSED') || l.includes('All tests passed') || l.includes('complete'));
        console.log('✅ PASS');
        results.push({ suite, status: 'PASS', summary: passLine ? passLine.trim() : 'Passed without errors' });
    } catch (err) {
        console.log('❌ FAIL');
        console.error(err.stdout || err.message);
        results.push({ suite, status: 'FAIL', error: (err.stdout || err.message).substring(0, 300) });
    }
}

console.log('\n================================================================');
console.log('📋 TEST SUITES EXECUTION SUMMARY');
console.log('================================================================');
let totalPass = 0;
let totalFail = 0;
for (const r of results) {
    if (r.status === 'PASS') totalPass++;
    else totalFail++;
    console.log(`${r.status === 'PASS' ? '✅' : '❌'} ${r.suite}: ${r.status} (${r.summary || r.error})`);
}
console.log(`\nTOTAL SUITES: ${totalPass} PASSED, ${totalFail} FAILED`);
if (totalFail > 0) {
    process.exit(1);
}
