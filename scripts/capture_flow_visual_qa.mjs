import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/Users/avaneeshkumar/.gemini/antigravity-ide/brain/6ee168e0-8464-45bd-b262-36664f697fbb';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://127.0.0.1:5174';

async function runFlowQA() {
    console.log('🚀 Starting Flow Visual QA (Provision -> Single Reveal -> First Login Intercept)...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });

    // 1. Log in as CEO
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const ceoTab = btns.find(b => b.textContent.includes('CEO') && !b.textContent.includes('Fill'));
        if (ceoTab) ceoTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    await page.click('input[type="email"]', { clickCount: 3 });
    await page.type('input[type="email"]', 'ceo@banarasyatra.com');
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.type('input[type="password"]', 'CeoSecurePass123!');

    await new Promise(r => setTimeout(r, 300));
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();

    await page.waitForSelector('aside', { timeout: 12000 });
    await new Promise(r => setTimeout(r, 1500));

    // 2. Open Team Management
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const teamBtn = btns.find(b => b.textContent.includes('Team Management'));
        if (teamBtn) teamBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // 3. Open Provision Modal
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const provBtn = btns.find(b => b.textContent.includes('Provision New User'));
        if (provBtn) provBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const newEmpName = 'Arjun Verma';
    const newEmpEmail = `arjun_${Date.now()}@banarasyatra.com`;

    // Target modal form inputs directly
    await page.waitForSelector('form input[type="text"]', { timeout: 5000 });
    const nameInput = await page.$('form input[type="text"]');
    await nameInput.click({ clickCount: 3 });
    await nameInput.type(newEmpName);

    const emailInput = await page.$('form input[type="email"]');
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(newEmpEmail);

    await new Promise(r => setTimeout(r, 400));

    // Submit Provision User form
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('form button'));
        const createBtn = buttons.find(b => b.textContent.includes('Provision User'));
        if (createBtn) createBtn.click();
    });

    // Wait for single-reveal modal
    await page.waitForSelector('#single-reveal-temp-password', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_single_reveal_modal_1440.png'), fullPage: false });
    console.log('📸 Captured 03_single_reveal_modal_1440.png');

    // Extract the generated password displayed in single-reveal modal
    const generatedPassword = await page.evaluate(() => {
        const span = document.getElementById('single-reveal-temp-password');
        return span ? span.textContent.trim() : '';
    });
    console.log(`Extracted single-reveal password for ${newEmpEmail}:`, generatedPassword ? '[SUCCESS]' : '[FAILED]');

    // Dismiss single-reveal modal
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const dismissBtn = buttons.find(b => b.textContent.includes('I Have Copied') || b.textContent.includes('Dismiss'));
        if (dismissBtn) dismissBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Log out CEO
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // 4. New User Logs In with Temporary Password
    console.log(`Testing login for newly created user: ${newEmpEmail}...`);
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const mgrTab = btns.find(b => b.textContent.includes('MANAGER') && !b.textContent.includes('Fill'));
        if (mgrTab) mgrTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    await page.click('input[type="email"]', { clickCount: 3 });
    await page.type('input[type="email"]', newEmpEmail);
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.type('input[type="password"]', generatedPassword);

    await new Promise(r => setTimeout(r, 300));
    const newSubmitBtn = await page.$('button[type="submit"]');
    if (newSubmitBtn) await newSubmitBtn.click();

    // Wait for forced password change modal interception
    await page.waitForSelector('form input[type="password"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_first_login_forced_change_password_1440.png'), fullPage: false });
    console.log('📸 Captured 04_first_login_forced_change_password_1440.png');

    await browser.close();
    console.log('✅ Flow Visual QA complete!');
}

runFlowQA().catch(err => {
    console.error('Flow Visual QA error:', err);
    process.exit(1);
});
