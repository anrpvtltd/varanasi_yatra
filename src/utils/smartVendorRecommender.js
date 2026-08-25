import { calculateVendorPerformance } from './vendorPerformanceCalculator.js';

/**
 * Ranks and recommends vendors for a given service category.
 *
 * Ranking criteria:
 * 1. Active status ('ACTIVE')
 * 2. Category match
 * 3. Reliability score (highest first; new vendors placed neutral)
 * 4. Base rate / cost (lowest suitable price)
 * 5. Low issue history
 *
 * @param {Array} vendors List of vendor objects
 * @param {String} category Target service category (HOTEL, TRANSPORT, DRIVER, etc.)
 * @returns {Array} Sorted & annotated list of vendors
 */
export function recommendVendors(vendors = [], category = '') {
    if (!vendors || !Array.isArray(vendors)) return [];

    const targetCategory = (category || '').toUpperCase();

    const filtered = vendors.filter(v => {
        const isActive = v.status === 'ACTIVE' || v.availabilityStatus === 'Active';
        const matchesCat = !targetCategory || (v.category || '').toUpperCase() === targetCategory;
        return isActive && matchesCat;
    });

    return filtered.sort((a, b) => {
        const perfA = calculateVendorPerformance(a.performance);
        const perfB = calculateVendorPerformance(b.performance);

        const scoreA = perfA.reliabilityScore !== null ? perfA.reliabilityScore : 75; // Neutral baseline for new vendors
        const scoreB = perfB.reliabilityScore !== null ? perfB.reliabilityScore : 75;

        // 1. Reliability Score Descending
        if (scoreB !== scoreA) return scoreB - scoreA;

        // 2. Base Rate Ascending
        const rateA = Number(a.baseRate) || 0;
        const rateB = Number(b.baseRate) || 0;
        if (rateA !== rateB) return rateA - rateB;

        // 3. Issue Count Ascending
        const issuesA = a.performance?.issueCount || 0;
        const issuesB = b.performance?.issueCount || 0;
        return issuesA - issuesB;
    }).map((v, index) => {
        const perf = calculateVendorPerformance(v.performance);
        return {
            ...v,
            isRecommended: index === 0,
            reliabilityLabel: perf.label,
            recommendationBadge: index === 0 ? '⭐ Recommended Partner' : null
        };
    });
}
