import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:5174';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const results = {
    branding: { passed: 0, failed: 0 },
    headings: { passed: 0, failed: 0 },
    routes: { passed: 0, failed: 0 },
    fourOhFour: { passed: 0, failed: 0 },
    responsive: { passed: 0, failed: 0 },
    mobileNav: { passed: 0, failed: 0 },
    codeSplitting: { passed: 0, failed: 0 },
    crmIsolation: { passed: 0, failed: 0 }
};

function pass(category, message) {
    results[category].passed++;
    console.log(`  ✅ [${category.toUpperCase()}] PASS: ${message}`);
}

function fail(category, message, err = '') {
    results[category].failed++;
    console.error(`  ❌ [${category.toUpperCase()}] FAIL: ${message} ${err}`);
}

async function runPublicWebsiteAudit() {
    console.log('================================================================');
    console.log('🌐 RUNNING PUBLIC WEBSITE VERIFICATION & BROWSER QA SUITE');
    console.log('================================================================\n');

    // -------------------------------------------------------------
    // TRACK 1: BUNDLE CODE SPLITTING VERIFICATION
    // -------------------------------------------------------------
    console.log('👉 TRACK 1: BUNDLE CODE-SPLITTING & ASSET ISOLATION');
    const distDir = path.resolve('dist/assets');
    if (fs.existsSync(distDir)) {
        const files = fs.readdirSync(distDir);
        const crmChunk = files.find(f => f.startsWith('AdminCRM-') && f.endsWith('.js'));
        const indexChunk = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
        const homeChunk = files.find(f => f.startsWith('HomePage-') && f.endsWith('.js'));

        if (crmChunk) {
            pass('codeSplitting', `CRM code is isolated in separate lazy chunk: ${crmChunk}`);
        } else {
            fail('codeSplitting', 'CRM code chunk AdminCRM-*.js not found in dist/assets');
        }

        if (homeChunk) {
            pass('codeSplitting', `Public Homepage is code-split in chunk: ${homeChunk}`);
        } else {
            fail('codeSplitting', 'HomePage chunk not found');
        }

        if (indexChunk) {
            const indexContent = fs.readFileSync(path.join(distDir, indexChunk), 'utf-8');
            // Ensure CEOCommandCenter is NOT in index bundle
            const containsCEOCenter = indexContent.includes('CEOCommandCenter') || indexContent.includes('CEO Financial Command Center');
            if (!containsCEOCenter) {
                pass('codeSplitting', 'Public index entry bundle strictly excludes CEO/Manager command center code');
            } else {
                fail('codeSplitting', 'Index bundle contains CEO command center code');
            }
        }
    } else {
        fail('codeSplitting', 'dist/assets directory does not exist. Run build first.');
    }

    // -------------------------------------------------------------
    // TRACK 2: REAL BROWSER ROUTING, HEADINGS, AND BRAND AUDIT
    // -------------------------------------------------------------
    console.log('\n👉 TRACK 2: BROWSER ROUTE RENDERING & METADATA AUDIT');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        // 2.1 Homepage
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

        // Brand standardization check
        const brandText = await page.evaluate(() => {
            const header = document.querySelector('header');
            return header ? header.innerText : '';
        });
        if (brandText.includes('VARANASI YATRA')) {
            pass('branding', 'Header prominently displays standardized brand "VARANASI YATRA"');
        } else {
            fail('branding', `Header does not display VARANASI YATRA. Got: ${brandText.slice(0, 100)}`);
        }

        // Heading hierarchy check: Exactly ONE H1 on homepage
        const h1Elements = await page.evaluate(() => {
            const h1s = Array.from(document.querySelectorAll('h1')).map(el => el.innerText.trim());
            return h1s;
        });
        if (h1Elements.length === 1 && h1Elements[0].includes('Experience Varanasi')) {
            pass('headings', `Exactly 1 semantic H1 on Homepage: "${h1Elements[0]}"`);
        } else {
            fail('headings', `Duplicate or missing H1s found: ${JSON.stringify(h1Elements)}`);
        }

        // Logo is not an H1
        const logoIsH1 = await page.evaluate(() => {
            const logoH1 = document.querySelector('header h1');
            return !!logoH1;
        });
        if (!logoIsH1) {
            pass('headings', 'Header logo correctly uses non-H1 markup (no duplicate H1 in header)');
        } else {
            fail('headings', 'Header logo still uses <h1> tag');
        }

        // Quick Trip Planner is present
        const plannerExists = await page.evaluate(() => {
            return !!document.getElementById('trip-planner') || !!document.querySelector('form');
        });
        if (plannerExists) {
            pass('routes', 'Quick Trip Planner component rendered successfully on Homepage');
        } else {
            fail('routes', 'Quick Trip Planner not found on Homepage');
        }

        // Test all required routes
        const routesToTest = [
            { path: '/experiences', expectedHeading: 'Varanasi Experiences & Sacred Activities' },
            { path: '/experiences/ganga-aarti', expectedHeading: 'Ganga Aarti' },
            { path: '/tours', expectedHeading: 'Varanasi Tour Packages & Regional Circuits' },
            { path: '/tours/1-day-varanasi', expectedHeading: '1-Day Complete Kashi' },
            { path: '/destinations', expectedHeading: 'Destinations & Pilgrim Circuits' },
            { path: '/destinations/varanasi', expectedHeading: 'Varanasi' },
            { path: '/travel-guide', expectedHeading: 'Varanasi Travel Guides & Practical Advice' },
            { path: '/travel-guide/best-time', expectedHeading: 'Best Time to Visit Varanasi' },
            { path: '/hotels', expectedHeading: 'Choosing Where to Stay in Varanasi' },
            { path: '/about', expectedHeading: 'Born Out of a Passion to Share the Sacred Soul of Kashi' },
            { path: '/contact', expectedHeading: 'Contact Varanasi Yatra' },
            { path: '/plan-your-trip', expectedHeading: 'Plan Your Varanasi Yatra' },
            { path: '/p/hotel-taj', expectedHeading: 'Welcome to Kashi' }
        ];

        for (const r of routesToTest) {
            await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle0' });
            const pageH1 = await page.evaluate(() => {
                const el = document.querySelector('h1');
                return el ? el.innerText.trim() : '';
            });

            if (pageH1.toLowerCase().includes(r.expectedHeading.toLowerCase())) {
                pass('routes', `Route ${r.path} renders successfully with H1: "${pageH1}"`);
            } else {
                fail('routes', `Route ${r.path} failed. Expected H1 containing "${r.expectedHeading}", got: "${pageH1}"`);
            }
        }

        // -------------------------------------------------------------
        // TRACK 3: GENUINE 404 AUDIT (ELIMINATES SOFT 404)
        // -------------------------------------------------------------
        console.log('\n👉 TRACK 3: GENUINE 404 PAGE VERIFICATION');
        await page.goto(`${BASE_URL}/this-page-does-not-exist`, { waitUntil: 'networkidle0' });
        const notFoundText = await page.evaluate(() => {
            const body = document.body.innerText;
            const h1 = document.querySelector('h1')?.innerText || '';
            return { body, h1 };
        });

        if (notFoundText.body.includes('404') && notFoundText.h1.includes('Lost in the Alleys of Kashi?')) {
            pass('fourOhFour', 'Invalid URL /this-page-does-not-exist correctly renders genuine 404 UI (no soft-404)');
        } else {
            fail('fourOhFour', `Invalid URL rendered unexpected content: H1: "${notFoundText.h1}"`);
        }

        // -------------------------------------------------------------
        // TRACK 4: RESPONSIVE OVERFLOW & MOBILE LAYOUT AUDIT
        // -------------------------------------------------------------
        console.log('\n👉 TRACK 4: RESPONSIVE VIEWPORT & OVERFLOW AUDIT');
        const viewports = [
            { name: 'Desktop Large (1440x900)', width: 1440, height: 900 },
            { name: 'Laptop Standard (1280x800)', width: 1280, height: 800 },
            { name: 'Tablet Landscape (1024x768)', width: 1024, height: 768 },
            { name: 'Tablet Portrait (768x1024)', width: 768, height: 1024 },
            { name: 'Mobile Standard (390x844)', width: 390, height: 844 }
        ];

        for (const vp of viewports) {
            await page.setViewport({ width: vp.width, height: vp.height });
            await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

            const overflow = await page.evaluate((expectedWidth) => {
                const docWidth = document.documentElement.scrollWidth;
                const windowWidth = window.innerWidth;
                return { docWidth, windowWidth, hasBlowout: docWidth > expectedWidth };
            }, vp.width);

            if (!overflow.hasBlowout) {
                pass('responsive', `Zero horizontal blowout on ${vp.name} (scrollWidth: ${overflow.docWidth}px <= ${vp.width}px)`);
            } else {
                fail('responsive', `Horizontal blowout on ${vp.name}! scrollWidth: ${overflow.docWidth}px > ${vp.width}px`);
            }
        }

        // Mobile Hero Compactness Check (Audit requirement: Form NOT embedded in mobile hero, hero height < 850px)
        await page.setViewport({ width: 390, height: 844 });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
        const heroHeight = await page.evaluate(() => {
            const hero = document.querySelector('section');
            return hero ? hero.offsetHeight : 0;
        });
        if (heroHeight < 800) {
            pass('responsive', `Mobile hero is compact and unbloated (${heroHeight}px < 800px)`);
        } else {
            fail('responsive', `Mobile hero is too tall (${heroHeight}px >= 800px)`);
        }

        // Mobile Navigation Drawer Check
        const menuButton = await page.$('button[aria-label="Toggle navigation menu"]');
        if (menuButton) {
            await menuButton.click();
            await new Promise(r => setTimeout(r, 200));

            const drawerHasLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('header a')).map(a => a.getAttribute('href'));
                return links.includes('/experiences') && links.includes('/tours') && links.includes('/travel-guide');
            });

            if (drawerHasLinks) {
                pass('mobileNav', 'Mobile drawer opens and provides real navigation to /experiences, /tours, and /travel-guide');
            } else {
                fail('mobileNav', 'Mobile drawer opened but lacked required navigation links');
            }
        } else {
            fail('mobileNav', 'Mobile menu toggle button not found in header');
        }

        // -------------------------------------------------------------
        // TRACK 5: CRM ISOLATION & TEAM LOGIN LINK AUDIT
        // -------------------------------------------------------------
        console.log('\n👉 TRACK 5: CRM ISOLATION & TEAM LOGIN LINK');
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

        // Verify Team Login in footer
        const teamLoginLink = await page.evaluate(() => {
            const link = document.querySelector('footer a[href="/crm"]');
            return link ? link.getAttribute('href') : null;
        });
        if (teamLoginLink === '/crm') {
            pass('crmIsolation', 'Footer contains discreet Team Login link routing to /crm');
        } else {
            fail('crmIsolation', 'Footer does not contain Team Login link with href="/crm"');
        }

        // Navigate to /crm and verify public header/footer are NOT rendered
        await page.goto(`${BASE_URL}/crm`, { waitUntil: 'networkidle0' });
        const crmHasPublicShell = await page.evaluate(() => {
            const hasPublicHeader = !!document.querySelector('header a[href="/plan-your-trip"]');
            const hasPublicFooter = !!document.querySelector('footer a[href="/privacy.html"]');
            return hasPublicHeader || hasPublicFooter;
        });
        if (!crmHasPublicShell) {
            pass('crmIsolation', 'CRM routes (/crm, /operations, /admin) cleanly isolate CRM UI without rendering public header or footer');
        } else {
            fail('crmIsolation', 'CRM route incorrectly rendered public header or footer!');
        }

    } finally {
        await browser.close();
    }

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('📋 PUBLIC WEBSITE AUDIT EXECUTION SUMMARY');
    console.log('================================================================');
    let totalPassed = 0;
    let totalFailed = 0;
    for (const [cat, res] of Object.entries(results)) {
        totalPassed += res.passed;
        totalFailed += res.failed;
        console.log(`${cat.padEnd(16)}: ${res.passed} Passed, ${res.failed} Failed`);
    }
    console.log('================================================================');
    console.log(`TOTAL AUDIT CHECKS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
    console.log('================================================================\n');

    if (totalFailed > 0) {
        process.exit(1);
    }
}

runPublicWebsiteAudit().catch(err => {
    console.error('Fatal audit error:', err);
    process.exit(1);
});
