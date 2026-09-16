/**
 * Performance Regression Guards Suite
 * Validates performance budgets, payload thresholds, pagination, and data sanitization.
 */

const fs = require('fs');
const path = require('path');


let passedCount = 0;
let failedCount = 0;

function check(name, condition, details = '') {
    if (condition) {
        console.log(`  ✅ [PASS] ${name} ${details ? `(${details})` : ''}`);
        passedCount++;
    } else {
        console.error(`  ❌ [FAIL] ${name} ${details ? `(${details})` : ''}`);
        failedCount++;
    }
}

async function runPerformanceGuards() {
    console.log('\n======================================================');
    console.log('⚡ VARANASI YATRA — PERFORMANCE REGRESSION GUARDS');
    console.log('======================================================\n');

    // 1. BRAND CONSTANTS INTEGRITY
    console.log('📦 GUARD 1: Centralized Brand Constants');
    const brandPath = path.join(__dirname, '../src/shared/config/brand.js');
    check('brand.js exists', fs.existsSync(brandPath));
    const brandContent = fs.readFileSync(brandPath, 'utf8');
    check('brand.js defines official phone', brandContent.includes('+91 84005 54029'));
    check('brand.js defines official whatsapp', brandContent.includes('+91 81497 83494'));
    check('brand.js defines official email', brandContent.includes('info.varanasi.yatra@gmail.com'));
    check('brand.js defines official website', brandContent.includes('varanasiyatra.com'));
    check('brand.js exports helper constants', brandContent.includes('export const PHONE_URL'));

    // 2. IMAGE SIZE BUDGETS (<15 kB logo, <450 kB homepage initial images)
    console.log('\n🖼️  GUARD 2: Image Size Budgets');
    const logoSrcPath = path.join(__dirname, '../src/assets/logo.png');
    if (fs.existsSync(logoSrcPath)) {
        const logoBytes = fs.statSync(logoSrcPath).size;
        const logoKb = (logoBytes / 1024).toFixed(2);
        check('Logo size < 15 kB', logoBytes < 15 * 1024, `Current: ${logoKb} kB (Target: <15 kB)`);
    } else {
        check('Logo file exists in src/assets', false, 'Missing src/assets/logo.png');
    }

    const distAssetsDir = path.join(__dirname, '../dist/assets');
    if (fs.existsSync(distAssetsDir)) {
        const distFiles = fs.readdirSync(distAssetsDir);
        let distLogoSize = 0;
        let homepageInitialImageBytes = 0;

        distFiles.forEach(f => {
            const fPath = path.join(distAssetsDir, f);
            const stats = fs.statSync(fPath);
            if (/logo.*\.png$/i.test(f)) {
                distLogoSize = stats.size;
            }
            // Above-fold critical homepage images: logo + hero background (AssiMorning)
            if (/logo.*\.png$/i.test(f) || /AssiMorning.*\.avif$/i.test(f)) {
                homepageInitialImageBytes += stats.size;
            }
        });

        if (distLogoSize > 0) {
            const dLogoKb = (distLogoSize / 1024).toFixed(2);
            check('Built dist logo < 15 kB', distLogoSize < 15 * 1024, `Built: ${dLogoKb} kB`);
        }
        const initialImgKb = (homepageInitialImageBytes / 1024).toFixed(2);
        check('Initial homepage image transfer < 450 kB', homepageInitialImageBytes < 450 * 1024, `Initial: ${initialImgKb} kB (Target: <450 kB)`);
    }

    // 3. DEAD CODE PRUNING VERIFICATION
    console.log('\n🧹 GUARD 3: Dead Code Cleanup Verification');
    const prunedFiles = [
        'src/components/AboutUs.jsx',
        'src/components/BookingForm.jsx',
        'src/components/CompanyValues.jsx',
        'src/components/ContactSection.jsx',
        'src/components/DestinationTemplate.jsx',
        'src/components/Destinations.jsx',
        'src/components/FAQ.jsx',
        'src/components/Footer.jsx',
        'src/components/FounderMessage.jsx',
        'src/components/Gallery.jsx',
        'src/components/Header.jsx',
        'src/components/Hero.jsx',
        'src/components/PackageTemplate.jsx',
        'src/components/Packages.jsx',
        'src/components/Testimonials.jsx',
        'src/components/Workflow.jsx',
        'src/components/Services.jsx',
        'src/components/TrustSection.jsx',
        'src/components/VaranasiDestination.jsx',
        'src/components/SEO.jsx',
        'src/components/ImageWithSkeleton.jsx',
        'src/App.css'
    ];

    let anyDeadFileRemains = false;
    prunedFiles.forEach(f => {
        const full = path.join(__dirname, '..', f);
        if (fs.existsSync(full)) {
            anyDeadFileRemains = true;
            console.error(`  ⚠️ Legacy file still exists: ${f}`);
        }
    });
    check('All 22 orphaned legacy files pruned', !anyDeadFileRemains, 'Verified zero legacy file presence');
    check('AdminCRM.jsx preserved', fs.existsSync(path.join(__dirname, '../src/components/AdminCRM.jsx')));

    // 4. STATIC ASSET CACHING CONFIGURATION
    console.log('\n⚡ GUARD 4: Static Asset Caching Headers');
    const vercelJsonPath = path.join(__dirname, '../vercel.json');
    if (fs.existsSync(vercelJsonPath)) {
        const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
        const assetHeaderRule = (vercelJson.headers || []).find(h => h.source && h.source.includes('assets'));
        const cacheControl = assetHeaderRule?.headers?.find(h => h.key === 'Cache-Control')?.value || '';
        check('Vercel immutable caching configured for /assets/*', cacheControl.includes('immutable') && cacheControl.includes('max-age=31536000'), `Value: ${cacheControl}`);
    }

    // 5. SERVER CODE OPTIMIZATIONS AUDIT
    console.log('\n🚀 GUARD 5: Server Architecture & API Optimization Audit');
    const serverCode = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8');
    check('Promise.all used in Manager Dashboard', serverCode.includes('Promise.all([') && serverCode.includes('fetchAllLeadsAcrossCollections()'));
    check('Hotel Partners N+1 query eliminated via $group aggregation', serverCode.includes('Enquiry.aggregate') && serverCode.includes('$partnerId'));
    check('/admin/enquiries implements pagination metadata', serverCode.includes('totalPages') && serverCode.includes('pagination'));
    check('/admin/bookings implements pagination metadata', serverCode.includes('pagination: {') && serverCode.includes('countDocuments()'));
    check('Dedicated /admin/customers aggregation endpoint implemented', serverCode.includes("app.get('/admin/customers'"));
    check('Customer endpoint includes role financial sanitization', serverCode.includes('delete leadObj.vendorCost') && serverCode.includes('delete qObj.totalVendorCost'));
    check('Database indexes configured on high-frequency schemas', serverCode.includes('EnquirySchema.index({ createdAt: -1 })') && serverCode.includes('BookingSchema.index({ createdAt: -1 })'));

    // 6. CLIENT HOOKS & DEDUPLICATION AUDIT
    console.log('\n🔄 GUARD 6: Client Request Deduplication & Optimization');
    const crmApiCode = fs.readFileSync(path.join(__dirname, '../src/services/crmApi.js'), 'utf8');
    check('In-flight request deduplication implemented in crmApi.js', crmApiCode.includes('deduplicatedFetch') && crmApiCode.includes('inFlightRequests'));
    const useLeadsCode = fs.readFileSync(path.join(__dirname, '../src/hooks/useCRMLeads.js'), 'utf8');
    check('Initial lead fetch deferred from dashboard in useCRMLeads.js', useLeadsCode.includes('isPipelineOrLeadView'));

    console.log('\n======================================================');
    console.log(`🏁 GUARD RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('======================================================\n');

    if (failedCount > 0) {
        process.exit(1);
    }
}

runPerformanceGuards().catch(err => {
    console.error('Guard failure:', err);
    process.exit(1);
});
