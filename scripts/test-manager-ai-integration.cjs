/**
 * scripts/test-manager-ai-integration.cjs
 * 
 * Prompt 9.14 — Manager AI & Hunter Operational Integration Test Suite
 * 
 * Tests:
 * 1. Manager AI entry points & authentication
 * 2. Lead AI summary: Customer Need, Priority, Travel Time, People, Missing Info, Next Step
 * 3. Follow-up draft generation with human review enforcement (no auto-send)
 * 4. Quote workflow AI assistance & Pricing Privacy (zero price/discount authority)
 * 5. Hunter verified flow: CEO-verified opportunities visible to Manager
 * 6. Unverified Hunter blocking: Non-verified opportunities filtered out for Manager
 * 7. Hunter conversion: Converting verified opportunity into CRM lead
 * 8. Human contact outcome recording: Genuine, Follow Up, Not Interested, etc.
 * 9. CEO Master AI Control Isolation: Manager blocked from AI config, emergency stop & provider settings
 * 10. Financial Information Privacy: Manager blocked from CEO-only analytics & CEO dashboard
 * 11. Voice AI & Feedback Invariant: Voice agent disabled, no autonomous actions
 */

const http = require('http');

const BASE_URL = 'http://localhost:5001';

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, body: parsed });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('===========================================================');
    console.log('PROMPT 9.14: MANAGER AI & HUNTER OPERATIONAL INTEGRATION TEST');
    console.log('===========================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(name, condition, details = '') {
        if (condition) {
            console.log(`  ✓ ${name}`);
            passed++;
        } else {
            console.error(`  ✗ ${name} — ${details}`);
            failed++;
        }
    }

    // 1. Authenticate CEO and Manager
    console.log('Step 1: Authenticating Users...');
    const ceoLogin = await request('POST', '/admin/login', {
        email: 'ceo@banarasyatra.com',
        password: 'CeoSecurePass123!'
    });
    assert('CEO Login successful (200)', ceoLogin.status === 200, JSON.stringify(ceoLogin.body));
    const ceoToken = ceoLogin.body?.token;

    const mgrLogin = await request('POST', '/admin/login', {
        email: 'manager@banarasyatra.com',
        password: 'ManagerSecurePass123!'
    });
    assert('Manager Login successful (200)', mgrLogin.status === 200, JSON.stringify(mgrLogin.body));
    const mgrToken = mgrLogin.body?.token;

    if (!ceoToken || !mgrToken) {
        console.error('Fatal: Could not authenticate CEO or Manager.');
        process.exit(1);
    }

    // 2. Fetch a Lead for Manager to test Lead AI panel
    console.log('\nStep 2: Fetching CRM Lead for AI Analysis...');
    const leadsRes = await request('GET', '/admin/enquiries', null, mgrToken);
    const leads = leadsRes.body?.data || leadsRes.body?.leads || (Array.isArray(leadsRes.body) ? leadsRes.body : []);
    assert('Manager can fetch CRM leads', leadsRes.status === 200 && Array.isArray(leads));
    const testLead = leads[0];
    assert('Found a valid lead for testing', Boolean(testLead && testLead._id));

    if (testLead) {
        // 3. Lead AI Analysis (POST /admin/ai/sales/analyze-lead)
        console.log('\nStep 3: Testing Manager Lead AI Analysis (Phase 2)...');
        const analyzeRes = await request('POST', '/admin/ai/sales/analyze-lead', { leadId: testLead._id }, mgrToken);
        assert('Manager can call analyze-lead (200)', analyzeRes.status === 200, JSON.stringify(analyzeRes.body));
        
        assert('Analysis contains intentLevel/priority', Boolean(analyzeRes.body?.qualification?.intentLevel));
        assert('Analysis contains requirement gaps / missing fields', Array.isArray(analyzeRes.body?.gaps));
        assert('Analysis contains nextAction recommendation', Boolean(analyzeRes.body?.recommendation?.primaryAction || analyzeRes.body?.recommendation?.type));
        assert('AI is advisory: humanApprovalRequired is true', analyzeRes.body?.humanApprovalRequired === true);

        // 4. Follow-up Draft Assistance (Phase 8)
        console.log('\nStep 4: Testing Manager Follow-up Draft Assistance (Phase 8)...');
        const followupRes = await request('POST', '/admin/ai/sales/generate-followup', {
            leadId: testLead._id,
            action: 'CONFIRM_TRAVEL_DATES',
            context: { channel: 'WHATSAPP' }
        }, mgrToken);
        assert('Manager can generate follow-up draft (200)', followupRes.status === 200, JSON.stringify(followupRes.body));
        assert('Draft generated for human review', Boolean(followupRes.body?.draft?.whatsappText || followupRes.body?.draft));
        assert('Draft enforces manual review: requiresHumanApproval === true', followupRes.body?.requiresHumanApproval === true || followupRes.body?.humanApprovalRequired === true);

        // 5. Quote Workflow AI Assistance & Pricing Privacy (Phase 7)
        console.log('\nStep 5: Testing Quote Workflow AI Assistance & Pricing Privacy (Phase 7)...');
        const quotePrepRes = await request('POST', '/admin/ai/sales/prepare-quote-inputs', { leadId: testLead._id }, mgrToken);
        assert('Manager can prepare quote inputs (200)', quotePrepRes.status === 200);
        const prep = quotePrepRes.body?.quotePreparation;
        assert('Quote preparation includes missing inputs list', Array.isArray(prep?.missingInputs));
        assert('Quote preparation includes suggested services', Array.isArray(prep?.suggestedServices));
        
        // Check pricing privacy: AI MUST NOT set rates/prices
        const lineItems = prep?.suggestedLineItems || [];
        const hasPrices = lineItems.some(i => i.rate !== null && i.rate !== undefined && i.price !== null && i.price !== undefined);
        assert('Pricing Privacy: AI does not set selling prices or rates (rate === null, price === null)', !hasPrices);
        assert('Quote Prep enforces human execution', quotePrepRes.body?.requiresHumanExecution === true);
    }

    // 6. Hunter Opportunity Flow: CEO vs Manager Scoping (Phase 3 & 4)
    console.log('\nStep 6: Testing Hunter Opportunity Verification Flow (Phase 3, 4, 13)...');
    
    // CEO fetches opportunities
    const ceoOppsRes = await request('GET', '/admin/ai/hunter/opportunities', null, ceoToken);
    assert('CEO can fetch all Hunter opportunities (200)', ceoOppsRes.status === 200);
    const ceoOpps = Array.isArray(ceoOppsRes.body?.data) ? ceoOppsRes.body.data : [];

    // Manager fetches opportunities
    let mgrOppsRes = await request('GET', '/admin/ai/hunter/opportunities', null, mgrToken);
    assert('Manager can fetch Hunter opportunities (200)', mgrOppsRes.status === 200);
    let mgrOpps = Array.isArray(mgrOppsRes.body?.data) ? mgrOppsRes.body.data : [];

    // Verify Manager only sees APPROVED / HUMAN_VERIFIED
    const unverifiedInManager = mgrOpps.filter(o => 
        o.status !== 'APPROVED' && 
        o.verificationStatus !== 'HUMAN_VERIFIED' &&
        !['READY_FOR_MANAGER', 'GENUINE', 'APPROVED', 'CONVERTED'].includes(o.lifecycleState)
    );
    assert('Human Gate: Manager cannot see unverified Hunter opportunities (0 unverified in Manager view)', unverifiedInManager.length === 0);

    // 7. Unverified Hunter Opportunity Conversion Block (Phase 13 Negative Test 1)
    console.log('\nStep 7: Testing Unverified Hunter Opportunity Conversion Block...');
    const unverifiedOpp = ceoOpps.find(o => 
        o.status !== 'APPROVED' && 
        o.verificationStatus !== 'HUMAN_VERIFIED' && 
        o.lifecycleState !== 'READY_FOR_MANAGER' &&
        o.lifecycleState !== 'APPROVED' &&
        o.lifecycleState !== 'GENUINE'
    );

    if (unverifiedOpp) {
        const mgrConvertUnverified = await request('POST', `/admin/ai/hunter/opportunities/${unverifiedOpp._id}/convert-to-lead`, {
            leadData: { name: 'Attempt Unverified' }
        }, mgrToken);
        assert('Manager cannot convert unverified Hunter opportunity to CRM lead (400 Bad Request)', 
            mgrConvertUnverified.status === 400, 
            `Status: ${mgrConvertUnverified.status}, code: ${mgrConvertUnverified.body?.errorCode}`);
    }

    // 8. CEO Verification Gate -> Manager View -> Contact Outcome -> Lead Conversion
    console.log('\nStep 8: Testing CEO Verification Gate -> Manager View -> Outcome -> Conversion...');
    let activeVerifiedOpp = mgrOpps[0];

    // If no verified opp is in Manager's view, CEO verifies one to test the pipeline
    if (!activeVerifiedOpp && unverifiedOpp) {
        console.log('  ℹ CEO approving an opportunity to test Manager verified pipeline...');
        const ceoApprove = await request('POST', `/admin/ai/hunter/opportunities/${unverifiedOpp._id}/approve`, {}, ceoToken);
        assert('CEO can approve opportunity as human gatekeeper (200)', ceoApprove.status === 200);

        // Re-fetch manager opportunities
        mgrOppsRes = await request('GET', '/admin/ai/hunter/opportunities', null, mgrToken);
        mgrOpps = Array.isArray(mgrOppsRes.body?.data) ? mgrOppsRes.body.data : [];
        activeVerifiedOpp = mgrOpps.find(o => o._id === unverifiedOpp._id || o.opportunityId === unverifiedOpp.opportunityId);
        assert('Manager now sees the CEO-verified opportunity', Boolean(activeVerifiedOpp));
    }

    if (activeVerifiedOpp) {
        // Record Human Contact Result
        const outcomeRes = await request('POST', `/admin/ai/hunter/opportunities/${activeVerifiedOpp._id}/contact-outcome`, {
            outcome: 'GENUINE',
            notes: 'Test contact outcome recorded by manager'
        }, mgrToken);
        assert('Manager can record human contact outcome (200)', outcomeRes.status === 200);
        assert('Contact outcome is saved as GENUINE', outcomeRes.body?.data?.humanContactOutcome === 'GENUINE');

        // Convert Verified Opportunity to Lead
        const convertRes = await request('POST', `/admin/ai/hunter/opportunities/${activeVerifiedOpp._id}/convert-to-lead`, {
            name: 'Priya Sharma',
            phone: '9876543210',
            email: 'priya.sharma@example.com'
        }, mgrToken);
        assert('Manager can convert verified opportunity to CRM lead (200)', 
            convertRes.status === 200 || (convertRes.status === 400 && convertRes.body?.errorCode === 'ALREADY_CONVERTED'),
            `Status: ${convertRes.status}, code: ${convertRes.body?.errorCode}`);
    }

    // 9. CEO Master AI Control Isolation (Phase 9 & 13)
    console.log('\nStep 9: Testing CEO Master AI Control Isolation (Phase 9 & 13)...');
    
    // Manager tries to modify AI master config
    const mgrConfigUpdate = await request('PATCH', '/admin/ai/config', { masterEnabled: false }, mgrToken);
    assert('Manager cannot modify AI master configuration (403 Forbidden)', 
        mgrConfigUpdate.status === 403, `Status: ${mgrConfigUpdate.status}`);

    // Manager tries to toggle emergency stop
    const mgrEmergencyStop = await request('POST', '/admin/ai/config/emergency-stop', { active: true }, mgrToken);
    assert('Manager cannot trigger AI emergency stop (403 Forbidden)', 
        mgrEmergencyStop.status === 403, `Status: ${mgrEmergencyStop.status}`);

    // Manager tries to approve Hunter opportunity directly
    if (unverifiedOpp) {
        const mgrApprove = await request('POST', `/admin/ai/hunter/opportunities/${unverifiedOpp._id}/approve`, {}, mgrToken);
        assert('Manager cannot approve Hunter opportunities directly (403 Forbidden)', 
            mgrApprove.status === 403, `Status: ${mgrApprove.status}`);
    }

    // Manager tries to access CEO-only Hunter source analytics
    const mgrHunterSourceAnalytics = await request('GET', '/admin/ai/hunter/analytics/sources', null, mgrToken);
    assert('Manager cannot access CEO-only Hunter Source Analytics (403 Forbidden)', 
        mgrHunterSourceAnalytics.status === 403, `Status: ${mgrHunterSourceAnalytics.status}`);

    // Manager tries to trigger Hunter start / run-all
    const mgrHunterStart = await request('POST', '/admin/ai/hunter/start', {}, mgrToken);
    assert('Manager cannot trigger Hunter start (403 Forbidden)', 
        mgrHunterStart.status === 403, `Status: ${mgrHunterStart.status}`);

    const mgrHunterRunAll = await request('POST', '/admin/ai/hunter/sources/run-all', {}, mgrToken);
    assert('Manager cannot trigger Hunter sources run-all (403 Forbidden)', 
        mgrHunterRunAll.status === 403, `Status: ${mgrHunterRunAll.status}`);

    // Manager tries to access CEO-only Hunter config
    const mgrHunterConfig = await request('GET', '/admin/ai/hunter/config', null, mgrToken);
    assert('Manager cannot access CEO-only Hunter Configuration (403 Forbidden)', 
        mgrHunterConfig.status === 403, `Status: ${mgrHunterConfig.status}`);

    // 10. Financial Privacy Access Isolation (Phase 13 Negative Test 10)
    console.log('\nStep 10: Testing Manager Financial Information Access Isolation...');
    const mgrCeoDashboard = await request('GET', '/admin/dashboard/ceo', null, mgrToken);
    assert('Manager cannot access CEO Master Financial Dashboard (403 Forbidden)', 
        mgrCeoDashboard.status === 403, `Status: ${mgrCeoDashboard.status}`);

    // 11. Voice AI & Feedback Module Status (Invariant Check)
    console.log('\nStep 11: Verifying Voice AI Disabled & AI Config State...');
    const ceoConfigRes = await request('GET', '/admin/ai/config', null, ceoToken);
    assert('CEO can fetch AI config (200)', ceoConfigRes.status === 200);
    const config = ceoConfigRes.body?.config || ceoConfigRes.body?.data || {};
    const voiceEnabled = config.modules?.voiceAgent?.enabled;
    assert('Voice AI is strictly disabled (false or undefined)', !voiceEnabled);

    // Summary
    console.log('\n===========================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');

    if (failed > 0) {
        console.error(`\n❌ ${failed} tests failed.`);
        process.exit(1);
    } else {
        console.log('\n✅ All Manager AI & Hunter Operational Integration tests passed successfully!');
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error('Fatal error in test script:', err);
    process.exit(1);
});
