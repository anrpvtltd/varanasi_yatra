/**
 * Calculates planned vs actual cost variance for bookings and vendor assignments.
 *
 * @param {Array} vendorAssignments Array of vendor assignment objects with plannedCost and actualCost
 * @param {Number} plannedTotal Total planned cost from Quote
 * @returns {Object} Cost variance summary
 */
export function calculateCostVariance(vendorAssignments = [], plannedTotal = 0) {
    const plannedFromAssignments = vendorAssignments.reduce((acc, item) => acc + (Number(item.plannedCost) || 0), 0);
    const effectivePlannedCost = plannedTotal || plannedFromAssignments;
    const actualTotalCost = vendorAssignments.reduce((acc, item) => acc + (Number(item.actualCost) || Number(item.plannedCost) || 0), 0);

    const costVariance = actualTotalCost - effectivePlannedCost;
    const isOverBudget = costVariance > 0;
    const percentageVariance = effectivePlannedCost > 0
        ? Math.round((costVariance / effectivePlannedCost) * 100)
        : 0;

    return {
        plannedTotalCost: effectivePlannedCost,
        actualTotalCost,
        costVariance,
        isOverBudget,
        percentageVariance,
        formattedVariance: `${isOverBudget ? '+' : ''}₹${costVariance.toLocaleString('en-IN')}`
    };
}
