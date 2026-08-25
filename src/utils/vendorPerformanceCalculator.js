/**
 * Calculates transparent vendor reliability score and performance summary.
 *
 * @param {Object} performance Performance statistics object from Vendor schema
 * @returns {Object} Reliability score & status label
 */
export function calculateVendorPerformance(performance = {}) {
    const {
        totalAssignments = 0,
        successfulAssignments = 0,
        cancelledAssignments = 0,
        issueCount = 0,
        onTimeCount = 0
    } = performance;

    if (!totalAssignments || totalAssignments === 0) {
        return {
            reliabilityScore: null,
            isNewVendor: true,
            label: 'NEW VENDOR · Not enough performance data',
            successRate: 0,
            totalAssignments: 0
        };
    }

    const effectiveSuccess = Math.max(0, successfulAssignments - issueCount);
    const reliabilityScore = Math.min(100, Math.max(0, Math.round((effectiveSuccess / totalAssignments) * 100)));
    const successRate = Math.round((successfulAssignments / totalAssignments) * 100);

    let statusTag = 'Reliable Partner';
    if (reliabilityScore >= 90) statusTag = '⭐ Top Tier Partner';
    else if (reliabilityScore >= 75) statusTag = '👍 Good Reliability';
    else if (reliabilityScore >= 50) statusTag = '⚠️ Needs Improvement';
    else statusTag = '🔴 Poor Performance';

    return {
        reliabilityScore,
        isNewVendor: false,
        label: `${reliabilityScore} / 100 (${statusTag})`,
        successRate,
        totalAssignments,
        successfulAssignments,
        cancelledAssignments,
        issueCount,
        onTimeCount
    };
}
