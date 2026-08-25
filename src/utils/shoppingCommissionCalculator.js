/**
 * Calculates shopping partner commission (Percentage or Fixed amount).
 *
 * @param {Number} shoppingAmount Customer shopping spend amount
 * @param {String} commissionType 'PERCENTAGE' or 'FIXED'
 * @param {Number} commissionValue Commission rate (%) or fixed amount (₹)
 * @returns {Object} Commission calculation details
 */
export function calculateShoppingCommission(shoppingAmount = 0, commissionType = 'PERCENTAGE', commissionValue = 0) {
    const amount = Number(shoppingAmount) || 0;
    const value = Number(commissionValue) || 0;

    let expectedCommission = 0;

    if (commissionType === 'PERCENTAGE') {
        expectedCommission = Math.round((amount * value) / 100);
    } else {
        expectedCommission = Math.round(value);
    }

    return {
        shoppingAmount: amount,
        commissionType,
        commissionValue: value,
        expectedCommission,
        formattedCommission: `₹${expectedCommission.toLocaleString('en-IN')}`
    };
}
