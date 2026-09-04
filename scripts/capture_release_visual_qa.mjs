import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/Users/avaneeshkumar/.gemini/antigravity-ide/brain/6ee168e0-8464-45bd-b262-36664f697fbb';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://127.0.0.1:5174';

async function runVisualQA() {
    console.log('🚀 Starting Visual QA for Final Release...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });

    // 1. Select CEO Tab
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const ceoTab = btns.find(b => b.textContent.includes('CEO') && !b.textContent.includes('Fill'));
        if (ceoTab) ceoTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Clear and type CEO credentials
    await page.click('input[type="email"]', { clickCount: 3 });
    await page.type('input[type="email"]', 'ceo@banarasyatra.com');
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.type('input[type="password"]', 'CeoSecurePass123!');

    await new Promise(r => setTimeout(r, 300));
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();

    await page.waitForSelector('aside', { timeout: 12000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('✓ Logged in as CEO');

    // 2. Click Team Management in Sidebar
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const teamBtn = btns.find(b => b.textContent.includes('Team Management'));
        if (teamBtn) teamBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Capture CEO Team Management workspace
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_ceo_team_management_1440.png'), fullPage: false });
    console.log('📸 Captured 01_ceo_team_management_1440.png');

    // 3. Open Provision New User Modal
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const provBtn = btns.find(b => b.textContent.includes('Provision New User'));
        if (provBtn) provBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_provision_user_modal_1440.png'), fullPage: false });
    console.log('📸 Captured 02_provision_user_modal_1440.png');

    await browser.close();
    console.log('✅ Visual QA complete!');
}

runVisualQA().catch(err => {
    console.error('Visual QA error:', err);
    process.exit(1);
});
