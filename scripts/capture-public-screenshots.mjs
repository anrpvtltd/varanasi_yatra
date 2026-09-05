import puppeteer from 'puppeteer-core';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:5174';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACTS_DIR = '/Users/avaneeshkumar/.gemini/antigravity-ide/brain/6ee168e0-8464-45bd-b262-36664f697fbb';

async function captureScreenshots() {
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        // 1. Desktop Homepage
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_public_homepage_desktop_1440.png'), fullPage: false });
        console.log('Captured: 01_public_homepage_desktop_1440.png');

        // 2. Mobile Homepage (compact hero + planner)
        await page.setViewport({ width: 390, height: 844 });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_public_homepage_mobile_390.png'), fullPage: false });
        console.log('Captured: 02_public_homepage_mobile_390.png');

        // 3. Mobile Drawer Open
        const menuBtn = await page.$('button[aria-label="Toggle navigation menu"]');
        if (menuBtn) {
            await menuBtn.click();
            await new Promise(r => setTimeout(r, 300));
            await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_public_mobile_drawer_390.png'), fullPage: false });
            console.log('Captured: 03_public_mobile_drawer_390.png');
        }

        // 4. Experiences Hub (Desktop)
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto(`${BASE_URL}/experiences`, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_public_experiences_desktop_1440.png'), fullPage: false });
        console.log('Captured: 04_public_experiences_desktop_1440.png');

        // 5. Experience Detail (Desktop)
        await page.goto(`${BASE_URL}/experiences/ganga-aarti`, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '05_public_experience_detail_1440.png'), fullPage: false });
        console.log('Captured: 05_public_experience_detail_1440.png');

        // 6. Tours Hub (Desktop)
        await page.goto(`${BASE_URL}/tours`, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '06_public_tours_desktop_1440.png'), fullPage: false });
        console.log('Captured: 06_public_tours_desktop_1440.png');

        // 7. Tour Detail (Desktop)
        await page.goto(`${BASE_URL}/tours/1-day-varanasi`, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '07_public_tour_detail_1440.png'), fullPage: false });
        console.log('Captured: 07_public_tour_detail_1440.png');

        // 8. Hotels Guidance (Desktop)
        await page.goto(`${BASE_URL}/hotels`, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '08_public_hotels_guidance_1440.png'), fullPage: false });
        console.log('Captured: 08_public_hotels_guidance_1440.png');

        // 9. Genuine 404 (Desktop)
        await page.goto(`${BASE_URL}/invalid-route-test`, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '09_public_genuine_404_1440.png'), fullPage: false });
        console.log('Captured: 09_public_genuine_404_1440.png');

    } finally {
        await browser.close();
    }
}

captureScreenshots().catch(err => {
    console.error('Screenshot capture failed:', err);
    process.exit(1);
});
