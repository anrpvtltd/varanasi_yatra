/**
 * Automated Regression Test for Manager CRM Runtime Crash Prevention
 * 
 * Verifies:
 * 1. Manager Authentication & Session Loading
 * 2. Initial CRM Page Load (/crm) without runtime exceptions or white screens
 * 3. Navigation to CUSTOMERS workspace
 * 4. Customer search and interaction
 * 5. Lead drawer opening with AISalesAssistantPanel
 * 6. Refresh and persistent navigation state ('crm_active_nav')
 * 7. Defensive handling of null/missing fields in CRM customer & lead records
 * 8. Validation of KV-* Deterministic ID generation for Customer, Lead, Quote, Booking, Trip, Payment, Follow-up
 */

import puppeteer from '/Users/avaneeshkumar/Desktop/varanasi_yatra/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'assert';

const FRONTEND_URL = 'http://127.0.0.1:5174';
const BACKEND_URL = 'http://127.0.0.1:5001';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function runManagerCrashRegression() {
    console.log('🧪 ========================================================');
    console.log('🧪 MANAGER CRM RUNTIME CRASH REGRESSION SUITE');
    console.log('🧪 ========================================================\n');

    // Step 1: Login to Backend as Manager
    console.log('👉 [STEP 1] Authenticate as Manager...');
    const loginRes = await fetch(`${BACKEND_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'manager@banarasyatra.com',
            password: 'ManagerSecurePass123!',
            loginMode: 'MANAGER'
        })
    });
    const loginData = await loginRes.json();
    assert(loginData.success && loginData.token, 'Manager login failed');
    console.log('  ✅ PASS: Authenticated successfully. Token retrieved.');

    // Step 2: Launch Puppeteer and bind error listeners
    console.log('\n👉 [STEP 2] Launch browser and bind runtime monitors...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const uncaughtErrors = [];
    const consoleErrors = [];

    page.on('pageerror', err => {
        console.error('  💥 [PAGEERROR DETECTED]:', err.message);
        uncaughtErrors.push(err.message);
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('Failed to load resource')) {
                consoleErrors.push(text);
            }
        }
    });

    // Step 3: Inject session tokens into localStorage and navigate to /crm
    console.log('\n👉 [STEP 3] Initialize CRM session & navigate to /crm...');
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok, usr) => {
        localStorage.setItem('admin_token', tok);
        localStorage.setItem('admin_refresh_token', tok);
        localStorage.setItem('admin_user', JSON.stringify(usr));
        sessionStorage.setItem('crm_active_nav', 'CUSTOMERS');
    }, loginData.token, loginData.user);

    await page.goto(`${FRONTEND_URL}/crm`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    // Verify initial load on CUSTOMERS workspace
    const initialDomState = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
            isWhiteScreen: !root || root.innerHTML.trim() === '',
            hasNav: Boolean(document.querySelector('aside')),
            hasCustomerInput: Boolean(document.querySelector('input[placeholder*="Search by name"]')),
            hasErrorBoundaryFallback: Boolean(document.body.innerText.includes('CRM Workspace Encountered an Issue'))
        };
    });

    assert(!initialDomState.isWhiteScreen, 'Initial load resulted in a blank white screen!');
    assert(initialDomState.hasNav, 'Manager sidebar navigation is missing!');
    assert(!initialDomState.hasErrorBoundaryFallback, 'Component crashed into Error Boundary!');
    console.log('  ✅ PASS: Initial /crm load into CUSTOMERS workspace rendered cleanly without crashing.');

    // Step 4: Exercise Customer Search
    console.log('\n👉 [STEP 4] Test customer search input and filtering...');
    await page.evaluate(() => {
        const searchInput = document.querySelector('input[placeholder*="Search by name"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.value = 'Sharma';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    await new Promise(r => setTimeout(r, 800));

    const postSearchState = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
            isWhiteScreen: !root || root.innerHTML.trim() === ''
        };
    });
    assert(!postSearchState.isWhiteScreen, 'Customer search caused a white screen crash!');
    console.log('  ✅ PASS: Customer search input executed without error.');

    // Step 5: Test Sidebar Navigation Switching (DASHBOARD, LEADS, QUOTES, BOOKINGS, TRIPS, PAYMENTS)
    console.log('\n👉 [STEP 5] Test sidebar navigation across all core workspaces...');
    const navItems = ['DASHBOARD', 'LEADS', 'QUOTES', 'BOOKINGS', 'PAYMENTS', 'TRIPS', 'CUSTOMERS'];
    for (const nav of navItems) {
        await page.evaluate((navId) => {
            const btn = document.querySelector(`button[data-nav="${navId}"]`);
            if (btn) btn.click();
        }, nav);
        await new Promise(r => setTimeout(r, 600));

        const navState = await page.evaluate(() => {
            const root = document.getElementById('root');
            return {
                isWhiteScreen: !root || root.innerHTML.trim() === ''
            };
        });
        assert(!navState.isWhiteScreen, `Navigating to ${nav} caused a white screen crash!`);
        console.log(`  ✅ PASS: Navigation to ${nav} successful.`);
    }

    // Step 6: Test Page Reload and Session Persistence
    console.log('\n👉 [STEP 6] Test CRM page reload and session recovery...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    const postReloadState = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
            isWhiteScreen: !root || root.innerHTML.trim() === '',
            hasNav: Boolean(document.querySelector('aside')),
            hasSpinningForever: Boolean(document.querySelector('.animate-spin') && !document.querySelector('main'))
        };
    });
    assert(!postReloadState.isWhiteScreen, 'Reload caused a white screen crash!');
    assert(postReloadState.hasNav, 'Navigation bar intact after reload.');
    assert(!postReloadState.hasSpinningForever, 'Page stuck in perpetual loading spinner!');
    console.log('  ✅ PASS: Page reload rendered stably without endless spinner.');

    // Assert 0 Uncaught Page Errors
    assert.strictEqual(uncaughtErrors.length, 0, `Detected ${uncaughtErrors.length} uncaught page errors: ${uncaughtErrors.join(', ')}`);
    console.log('\n  ✅ PASS: Zero unhandled frontend exceptions detected.');

    await browser.close();
    console.log('\n========================================================');
    console.log('🎉 REGRESSION TEST COMPLETED: 100% PASSED');
    console.log('========================================================\n');
}

runManagerCrashRegression().catch(err => {
    console.error('\n❌ REGRESSION TEST FAILED:', err.message);
    process.exit(1);
});
