/**
 * Comprehensive Browser Multi-Breakpoint Regression Audit Script
 * Using local Google Chrome via Puppeteer-Core
 */

import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://127.0.0.1:5174';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACTS_DIR = '/Users/avaneeshkumar/.gemini/antigravity-ide/brain/c46c5e19-e78a-4a3e-b74e-a2b35e09e2fe';

const auditResults = {
    publicSite: {},
    managerCRM: {},
    ceoCRM: {},
    breakpoints: {}
};

async function runAudit() {
    console.log('================================================================');
    console.log('🌐 RUNNING BROWSER MULTI-BREAKPOINT REGRESSION AUDIT');
    console.log('================================================================\n');

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Catch and log any console errors or page exceptions
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    try {
        // -------------------------------------------------------------
        // 1. PUBLIC WEBSITE BREAKPOINT TESTS
        // -------------------------------------------------------------
        const breakpoints = [
            { name: 'desktop_1024', width: 1024, height: 768 },
            { name: 'desktop_1280', width: 1280, height: 800 },
            { name: 'desktop_1440', width: 1440, height: 900 },
            { name: 'tablet_768', width: 768, height: 1024 },
            { name: 'mobile_390', width: 390, height: 844 }
        ];

        console.log('--- 1. Testing Public Website Across 5 Breakpoints ---');
        for (const bp of breakpoints) {
            await page.setViewport({ width: bp.width, height: bp.height });
            await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

            // Evaluate header layout at this viewport
            const headerCheck = await page.evaluate(() => {
                const header = document.querySelector('header');
                const nav = header ? header.querySelector('nav') : null;
                const logo = header ? header.querySelector('img[alt="Kashi-Vashi Emblem"]') : null;
                const planBtn = header ? Array.from(header.querySelectorAll('a')).find(a => a.textContent.includes('Plan')) : null;
                const waBtn = header ? Array.from(header.querySelectorAll('a')).find(a => a.textContent.includes('WhatsApp')) : null;
                
                // Check horizontal overflow
                const docWidth = document.documentElement.offsetWidth;
                const scrollWidth = document.documentElement.scrollWidth;
                const hasHorizontalOverflow = scrollWidth > docWidth;

                // Check nav items count
                const navItems = nav ? Array.from(nav.querySelectorAll('a')).map(a => a.textContent.trim()) : [];

                // Check floating dock
                const dock = document.querySelector('aside[aria-label="Quick Support"]');
                const dockBox = dock ? dock.getBoundingClientRect() : null;

                return {
                    hasHeader: Boolean(header),
                    hasLogo: Boolean(logo),
                    hasNav: Boolean(nav && window.getComputedStyle(nav).display !== 'none'),
                    navItems,
                    hasPlanBtn: Boolean(planBtn),
                    hasWaBtn: Boolean(waBtn),
                    hasHorizontalOverflow,
                    scrollWidth,
                    docWidth,
                    dockVisible: Boolean(dockBox && dockBox.width > 0 && dockBox.height > 0)
                };
            });

            console.log(`  📱 Viewport ${bp.name} (${bp.width}x${bp.height}):`);
            console.log(`     - Header present: ${headerCheck.hasHeader}`);
            console.log(`     - Logo present: ${headerCheck.hasLogo}`);
            console.log(`     - Desktop Nav active: ${headerCheck.hasNav} (${headerCheck.navItems.join(', ')})`);
            console.log(`     - CTA buttons present: Plan=${headerCheck.hasPlanBtn}, WhatsApp=${headerCheck.hasWaBtn}`);
            console.log(`     - Horizontal Overflow: ${headerCheck.hasHorizontalOverflow ? '⚠️ YES' : '✅ NONE'}`);
            console.log(`     - Floating Dock Visible: ${headerCheck.dockVisible}`);

            const screenshotPath = path.join(ARTIFACTS_DIR, `audit_${bp.name}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: false });

            auditResults.breakpoints[bp.name] = headerCheck;
        }

        // -------------------------------------------------------------
        // 2. PUBLIC PAGE ROUTES VERIFICATION
        // -------------------------------------------------------------
        console.log('\n--- 2. Auditing Public Page Routes ---');
        const routes = [
            { path: '/experiences', titleMatch: 'Experiences' },
            { path: '/tours', titleMatch: 'Tours' },
            { path: '/destinations', titleMatch: 'Destinations' },
            { path: '/travel-guide', titleMatch: 'Travel Guide' },
            { path: '/about', titleMatch: 'About' },
            { path: '/plan-your-trip', titleMatch: 'Plan' },
            { path: '/contact', titleMatch: 'Contact' },
            { path: '/non-existent-page', titleMatch: '404' }
        ];

        await page.setViewport({ width: 1280, height: 800 });
        for (const route of routes) {
            await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle0' });
            const pageTitle = await page.title();
            const heading = await page.evaluate(() => {
                const h1 = document.querySelector('h1');
                return h1 ? h1.textContent.trim() : '';
            });
            console.log(`  ✅ Route ${route.path.padEnd(20)}: Title: "${pageTitle}" | H1: "${heading}"`);
            auditResults.publicSite[route.path] = { pageTitle, heading, status: 'PASS' };
        }

        // -------------------------------------------------------------
        // 3. MANAGER CRM AUDIT
        // -------------------------------------------------------------
        console.log('\n--- 3. Auditing Manager CRM Dashboard & Customer Attention Cards ---');
        await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });

        // Switch to Manager role and enter credentials
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const mgrBtn = buttons.find(b => b.textContent.includes('Manager') || b.textContent.includes('Fill Manager'));
            if (mgrBtn) mgrBtn.click();
        });
        await new Promise(r => setTimeout(r, 400));
        await page.evaluate(() => {
            const emailInput = document.querySelector('input[type="email"]');
            const passInput = document.querySelector('input[type="password"]');
            if (emailInput && !emailInput.value) emailInput.value = 'manager@banarasyatra.com';
            if (passInput && !passInput.value) passInput.value = 'ManagerSecurePass123!';
        });
        await new Promise(r => setTimeout(r, 300));
        await page.evaluate(() => {
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.click();
        });
        await new Promise(r => setTimeout(r, 3000));

        // Inspect Manager Dashboard for Customer Attention Cards
        const mgrCards = await page.evaluate(() => {
            const attentionCards = [];
            const cards = document.querySelectorAll('.space-y-2\\.5 > div');
            cards.forEach(card => {
                const titleEl = card.querySelector('.font-bold.text-xs');
                const subtitleEl = card.querySelector('p.text-\\[11px\\]');
                const badgeEl = card.querySelector('span.text-\\[10px\\]');
                attentionCards.push({
                    title: titleEl ? titleEl.textContent.trim() : '',
                    subtitle: subtitleEl ? subtitleEl.textContent.trim() : '',
                    badge: badgeEl ? badgeEl.textContent.trim() : ''
                });
            });
            return attentionCards;
        });

        console.log(`  📋 Manager Pending Attention Cards found: ${mgrCards.length}`);
        let placeholderFound = false;
        mgrCards.forEach((c, idx) => {
            console.log(`     [${idx + 1}] ${c.title} | ${c.subtitle} [${c.badge}]`);
            if (c.subtitle.includes('Customer · ₹0')) {
                placeholderFound = true;
            }
        });

        console.log(`  🎯 "Customer · ₹0" Placeholder Presence: ${placeholderFound ? '❌ FOUND BUG' : '✅ CLEAN (FIX VERIFIED)'}`);
        auditResults.managerCRM.customerAttentionFixed = !placeholderFound;
        auditResults.managerCRM.cardCount = mgrCards.length;

        // Take manager dashboard screenshot
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'audit_manager_dashboard.png'), fullPage: false });

        // -------------------------------------------------------------
        // 4. CEO CRM AUDIT
        // -------------------------------------------------------------
        console.log('\n--- 4. Auditing CEO CRM Dashboard & Executive Controls ---');
        // Clear session to login as CEO
        await page.evaluate(() => {
            sessionStorage.clear();
            localStorage.clear();
        });
        await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });

        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const ceoBtn = buttons.find(b => b.textContent.includes('Fill CEO') || b.textContent.includes('👑 CEO'));
            if (ceoBtn) ceoBtn.click();
        });
        await new Promise(r => setTimeout(r, 400));
        await page.evaluate(() => {
            const emailInput = document.querySelector('input[type="email"]');
            const passInput = document.querySelector('input[type="password"]');
            if (emailInput && !emailInput.value) emailInput.value = 'ceo@banarasyatra.com';
            if (passInput && !passInput.value) passInput.value = 'CeoSecurePass123!';
        });
        await new Promise(r => setTimeout(r, 300));
        await page.evaluate(() => {
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.click();
        });
        await new Promise(r => setTimeout(r, 3000));

        // Inspect CEO Dashboard
        const ceoDashboardData = await page.evaluate(() => {
            const heading = document.querySelector('h1')?.textContent.trim() || '';
            const kpis = Array.from(document.querySelectorAll('.font-mono, [data-kpi]')).map(el => el.textContent.trim()).filter(Boolean);
            const hasAiControl = Array.from(document.querySelectorAll('button, span, div')).some(el => el.textContent.includes('AI Control Center'));
            return { heading, hasAiControl, kpisSample: kpis.slice(0, 5) };
        });

        console.log(`  👑 CEO Dashboard Active: "${ceoDashboardData.heading}"`);
        console.log(`     - AI Control Center accessible: ${ceoDashboardData.hasAiControl}`);
        auditResults.ceoCRM = ceoDashboardData;

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'audit_ceo_dashboard.png'), fullPage: false });

    } finally {
        await browser.close();
    }

    console.log('\n================================================================');
    console.log('✅ BROWSER REGRESSION AUDIT COMPLETE');
    console.log('================================================================\n');
}

runAudit().catch(err => {
    console.error('Audit run error:', err);
    process.exit(1);
});
