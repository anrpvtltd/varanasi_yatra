import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = '/Users/avaneeshkumar/.gemini/antigravity-ide/brain/6ee168e0-8464-45bd-b262-36664f697fbb';

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function runVisualQA() {
    console.log('🚀 Launching Visual QA Automation across 5 viewports...');

    const tempProfileDir = path.join('/tmp', `chrome_p5_qa_${Date.now()}`);
    fs.mkdirSync(tempProfileDir, { recursive: true });

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        userDataDir: tempProfileDir,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage'
        ]
    });

    try {
        const page = await browser.newPage();
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warn') {
                console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
            }
        });
        page.on('pageerror', err => console.log('[BROWSER PAGE ERROR]:', err.message));

        // -------------------------------------------------------------
        // SCREEN 1 & 2: Split-Screen Login (CEO vs Manager active)
        // -------------------------------------------------------------
        console.log('📸 1. Capturing Split-Screen Login (CEO active, 1440x900)...');
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto('http://127.0.0.1:5174/admin', { waitUntil: 'domcontentloaded' });
        await sleep(1500);

        // Click CEO role tab
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const ceoFill = btns.find(b => b.textContent.includes('Fill CEO'));
            if (ceoFill) ceoFill.click();
        });
        await sleep(600);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_login_ceo_active_1440x900.png') });
        console.log('  ✅ Saved 01_login_ceo_active_1440x900.png');

        console.log('📸 2. Capturing Split-Screen Login (Manager active, 1440x900)...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const mgrFill = btns.find(b => b.textContent.includes('Fill Manager'));
            if (mgrFill) mgrFill.click();
        });
        await sleep(600);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_login_manager_active_1440x900.png') });
        console.log('  ✅ Saved 02_login_manager_active_1440x900.png');

        // -------------------------------------------------------------
        // SCREEN 3: Mobile Stacked Login (390x844)
        // -------------------------------------------------------------
        console.log('📸 3. Capturing Mobile Stacked Login (390x844)...');
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        await sleep(500);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_login_mobile_stacked_390x844.png') });
        console.log('  ✅ Saved 03_login_mobile_stacked_390x844.png');

        // -------------------------------------------------------------
        // AUTHENTICATE AS MANAGER (1440x900)
        // -------------------------------------------------------------
        console.log('🔑 Authenticating as Manager for operational workspace visual audit...');
        await page.setViewport({ width: 1440, height: 900 });
        await sleep(300);

        // Authenticate as Manager using Fill Manager
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const mgrFill = btns.find(b => b.textContent.includes('Fill Manager'));
            if (mgrFill) mgrFill.click();
        });
        await sleep(500);

        const submitBtn = await page.$('button[type="submit"]');
        await submitBtn.click();

        // Wait for CRM shell to load
        await page.waitForSelector('aside', { timeout: 15000 });
        await sleep(2000);
        console.log('  ✅ Manager workspace fully loaded!');

        // -------------------------------------------------------------
        // SCREEN 4: Manager Action Center (1440x900)
        // -------------------------------------------------------------
        console.log('📸 4. Capturing Manager Action Center (Desktop 1440x900)...');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_manager_action_center_desktop_1440x900.png') });
        console.log('  ✅ Saved 04_manager_action_center_desktop_1440x900.png');

        // -------------------------------------------------------------
        // SCREEN 5: Manager Action Center (Laptop 1280x800)
        // -------------------------------------------------------------
        console.log('📸 5. Capturing Manager Action Center (Laptop 1280x800)...');
        await page.setViewport({ width: 1280, height: 800 });
        await sleep(600);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_manager_action_center_laptop_1280x800.png') });
        console.log('  ✅ Saved 05_manager_action_center_laptop_1280x800.png');

        // -------------------------------------------------------------
        // SCREEN 6: Manager Action Center (Tablet Portrait 768x1024)
        // -------------------------------------------------------------
        console.log('📸 6. Capturing Manager Action Center (Tablet 768x1024)...');
        await page.setViewport({ width: 768, height: 1024 });
        await sleep(600);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_manager_action_center_tablet_768x1024.png') });
        console.log('  ✅ Saved 06_manager_action_center_tablet_768x1024.png');

        // -------------------------------------------------------------
        // SCREEN 7: Manager Action Center (Mobile 390x844)
        // -------------------------------------------------------------
        console.log('📸 7. Capturing Manager Action Center (Mobile 390x844)...');
        await page.setViewport({ width: 390, height: 844, isMobile: true });
        await sleep(600);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_manager_action_center_mobile_390x844.png') });
        console.log('  ✅ Saved 07_manager_action_center_mobile_390x844.png');

        // Reset to Desktop 1440x900
        await page.setViewport({ width: 1440, height: 900 });
        await sleep(500);

        // -------------------------------------------------------------
        // SCREEN 8: Payment History Drawer
        // -------------------------------------------------------------
        console.log('📸 8. Opening Payment History Drawer...');
        // Switch to PAYMENT stage filter
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const payTab = btns.find(b => b.textContent.trim().toUpperCase() === 'PAYMENTS' || b.textContent.trim().toUpperCase() === 'PAYMENT');
            if (payTab) payTab.click();
        });
        await sleep(800);

        // Click "Payment History" button
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const histBtn = btns.find(b => b.textContent.includes('Payment History'));
            if (histBtn) histBtn.click();
        });
        await sleep(1000);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_manager_payment_history_drawer_1440x900.png') });
        console.log('  ✅ Saved 08_manager_payment_history_drawer_1440x900.png');

        // Close Drawer
        await page.evaluate(() => {
            const closeBtn = document.querySelector('button[aria-label="Close drawer"]') || document.querySelector('button[title="Close"]');
            if (closeBtn) closeBtn.click();
            else {
                // Click backdrop
                const backdrop = document.querySelector('.fixed.inset-0.bg-slate-950\\/80');
                if (backdrop) backdrop.click();
            }
        });
        await sleep(500);

        // -------------------------------------------------------------
        // SCREEN 9 & 10: Customer 360 Workspace
        // -------------------------------------------------------------
        console.log('📸 9. Navigating to Customer 360 Workspace (1440x900)...');
        await page.evaluate(() => {
            const navButtons = Array.from(document.querySelectorAll('aside nav button'));
            const custNav = navButtons.find(b => b.textContent.includes('Customer 360') || b.textContent.includes('Customers'));
            if (custNav) custNav.click();
        });
        await page.waitForFunction(() => {
            return !document.querySelector('.animate-pulse') && (document.querySelectorAll('table tbody tr').length > 0 || document.body.innerText.includes('No customers found'));
        }, { timeout: 8000 }).catch(() => {});
        await sleep(1000);
        // Select first customer if present to show details pane
        await page.evaluate(() => {
            const firstRow = document.querySelector('table tbody tr');
            if (firstRow) firstRow.click();
        });
        await sleep(600);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_customer_360_workspace_1440x900.png') });
        console.log('  ✅ Saved 09_customer_360_workspace_1440x900.png');

        console.log('📸 10. Capturing Customer 360 Workspace on Mobile (390x844)...');
        await page.setViewport({ width: 390, height: 844, isMobile: true });
        await sleep(600);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_customer_360_workspace_mobile_390x844.png') });
        console.log('  ✅ Saved 10_customer_360_workspace_mobile_390x844.png');

        // Reset to Desktop 1440x900
        await page.setViewport({ width: 1440, height: 900 });
        await sleep(500);

        // -------------------------------------------------------------
        // SCREEN 11: Customer Communication Center
        // -------------------------------------------------------------
        console.log('📸 11. Navigating to Customer Communication Center...');
        await page.evaluate(() => {
            const navButtons = Array.from(document.querySelectorAll('aside nav button'));
            const commNav = navButtons.find(b => b.textContent.includes('Communications') || b.textContent.includes('Comms'));
            if (commNav) commNav.click();
        });
        await page.waitForFunction(() => {
            return !document.body.innerText.includes('Loading contacts...');
        }, { timeout: 8000 }).catch(() => {});
        await sleep(1200);
        // Select first contact card
        await page.evaluate(() => {
            const contactCards = Array.from(document.querySelectorAll('div[class*="cursor-pointer"]'));
            const firstContact = contactCards.find(c => c.textContent.includes('+91') || c.textContent.includes('91') || c.querySelector('span'));
            if (firstContact) firstContact.click();
        });
        await sleep(800);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_customer_communication_workspace_1440x900.png') });
        console.log('  ✅ Saved 11_customer_communication_workspace_1440x900.png');

        // -------------------------------------------------------------
        // SCREEN 12: Operational Reporting Center
        // -------------------------------------------------------------
        console.log('📸 12. Navigating to Operational Reporting Center...');
        await page.evaluate(() => {
            const navButtons = Array.from(document.querySelectorAll('aside nav button'));
            const repNav = navButtons.find(b => b.textContent.includes('Reports') || b.textContent.includes('Analytics'));
            if (repNav) repNav.click();
        });
        await sleep(1500);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '12_operational_reporting_workspace_1440x900.png') });
        console.log('  ✅ Saved 12_operational_reporting_workspace_1440x900.png');

        // -------------------------------------------------------------
        // SCREEN 15: Notification Bell Popover
        // -------------------------------------------------------------
        console.log('📸 15. Opening Real System Notification Popover...');
        await page.evaluate(() => {
            const bellBtn = document.querySelector('button[title="Alerts & System Notifications"]') ||
                            document.querySelector('button[aria-label="Operational Notifications"]') ||
                            Array.from(document.querySelectorAll('header button')).find(b => b.querySelector('svg'));
            if (bellBtn) bellBtn.click();
        });
        await sleep(800);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '15_notification_bell_popover_1440x900.png') });
        console.log('  ✅ Saved 15_notification_bell_popover_1440x900.png');

        // Close notifications by clicking bell again
        await page.evaluate(() => {
            const bellBtn = document.querySelector('button[title="Alerts & System Notifications"]');
            if (bellBtn) bellBtn.click();
        });
        await sleep(400);

        // -------------------------------------------------------------
        // SCREEN 16: Change Password Modal
        // -------------------------------------------------------------
        console.log('📸 16. Opening Change Password Modal...');
        await page.evaluate(() => {
            const profileBtn = document.querySelector('button[title="User Account Menu"]') ||
                               Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Manager') || b.textContent.includes('KY'));
            if (profileBtn) profileBtn.click();
        });
        await sleep(500);
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const changePassBtn = btns.find(b => b.textContent.includes('Change Password'));
            if (changePassBtn) changePassBtn.click();
        });
        await sleep(800);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '16_change_password_modal_1440x900.png') });
        console.log('  ✅ Saved 16_change_password_modal_1440x900.png');

        // Close modal
        await page.evaluate(() => {
            const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cancel'));
            if (cancelBtn) cancelBtn.click();
        });
        await sleep(500);

        // -------------------------------------------------------------
        // SWITCH TO CEO & CAPTURE CEO DASHBOARD WITH TRENDCURVES
        // -------------------------------------------------------------
        console.log('🔑 Logging out and authenticating as CEO for executive audit...');
        await page.evaluate(() => {
            const profileBtn = document.querySelector('button[title="User Account Menu"]') ||
                               Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Manager') || b.textContent.includes('KY'));
            if (profileBtn) profileBtn.click();
        });
        await sleep(400);
        await page.evaluate(() => {
            const logoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Log Out') || b.textContent.includes('Logout') || b.textContent.includes('Sign Out'));
            if (logoutBtn) logoutBtn.click();
        });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await sleep(500);

        // CEO Login via Fill CEO
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const ceoFill = btns.find(b => b.textContent.includes('Fill CEO'));
            if (ceoFill) ceoFill.click();
        });
        await sleep(500);

        const ceoSubmitBtn = await page.$('button[type="submit"]');
        await ceoSubmitBtn.click();

        await page.waitForSelector('aside', { timeout: 15000 });
        await sleep(1500);
        console.log('  ✅ CEO workspace fully loaded!');

        // Ensure CEO is on Dashboard
        await page.evaluate(() => {
            const navButtons = Array.from(document.querySelectorAll('aside nav button'));
            const dashNav = navButtons.find(b => b.textContent.includes('Dashboard'));
            if (dashNav) dashNav.click();
        });
        await sleep(1500);

        // -------------------------------------------------------------
        // SCREEN 13: CEO Dashboard with TrendCurves & Labeled KPIs (1440x900)
        // -------------------------------------------------------------
        console.log('📸 13. Capturing CEO Dashboard with TrendCurves (1440x900)...');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '13_ceo_dashboard_trendcurves_1440x900.png') });
        console.log('  ✅ Saved 13_ceo_dashboard_trendcurves_1440x900.png');

        // -------------------------------------------------------------
        // SCREEN 14: CEO Dashboard on Mobile (390x844)
        // -------------------------------------------------------------
        console.log('📸 14. Capturing CEO Dashboard on Mobile (390x844)...');
        await page.setViewport({ width: 390, height: 844, isMobile: true });
        await sleep(600);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '14_ceo_dashboard_mobile_390x844.png') });
        console.log('  ✅ Saved 14_ceo_dashboard_mobile_390x844.png');

        console.log('\n🎉 ALL VISUAL QA SCREENSHOTS CAPTURED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Visual QA execution error:', err);
        throw err;
    } finally {
        await browser.close();
    }
}

runVisualQA().catch(() => process.exit(1));
