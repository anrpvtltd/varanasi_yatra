import { DEFAULT_MARGIN_CONFIG } from '../constants/phase4Constants.js';

/**
 * Computes live financial breakdown for Quote Builder.
 * 
 * @param {Array} servicesList Array of { vendorCost, quantity }
 * @param {String} marginType 'FIXED' or 'PERCENTAGE'
 * @param {Number} marginValue Fixed amount in ₹ or Percentage in %
 * @param {Number} discount Discount in ₹
 * @returns {Object} Financial metrics breakdown
 */
export function calculateQuoteFinancials(servicesList = [], marginType = 'FIXED', marginValue = 2500, discount = 0) {
    const totalVendorCost = servicesList.reduce((sum, item) => {
        const cost = Number(item.vendorCost) || 0;
        const qty = Number(item.quantity) || 1;
        return sum + (cost * qty);
    }, 0);

    const numericMarginVal = Number(marginValue) || 0;
    let companyMargin = 0;

    if (marginType === 'PERCENTAGE') {
        companyMargin = Math.round((totalVendorCost * numericMarginVal) / 100);
    } else {
        companyMargin = numericMarginVal;
    }

    const suggestedCustomerPrice = totalVendorCost + companyMargin;
    const numericDiscount = Number(discount) || 0;
    const finalCustomerPrice = Math.max(0, suggestedCustomerPrice - numericDiscount);
    const expectedProfit = finalCustomerPrice - totalVendorCost;

    const isLowProfitWarning = expectedProfit < DEFAULT_MARGIN_CONFIG.MIN_RECOMMENDED_MARGIN;

    return {
        totalVendorCost,
        companyMargin,
        suggestedCustomerPrice,
        discount: numericDiscount,
        finalCustomerPrice,
        expectedProfit,
        isLowProfitWarning,
        minRecommendedMargin: DEFAULT_MARGIN_CONFIG.MIN_RECOMMENDED_MARGIN
    };
}

/**
 * Formats a clean, professional customer-facing WhatsApp text summary.
 */
export function formatWhatsAppQuoteText(quote, lead) {
    if (!quote) return '';

    const customerName = lead?.name || 'Valued Guest';
    const travelDate = quote.travelDate || lead?.date || 'Flexible Date';
    const pax = quote.travelers || lead?.travelers || '1';
    const duration = quote.tripDuration || '3 Days / 2 Nights';

    const itemsStr = (quote.servicesList || []).map(item => {
        const name = item.customerDisplayName || item.serviceName || item.category;
        return `✓ ${name}`;
    }).join('\n');

    return `*VARANASI YATRA — TRAVEL ITINERARY & QUOTE* 🚩
    
Hello *${customerName}*,

Here is your customized travel package proposal for Varanasi:

📅 *Travel Date:* ${travelDate}
👥 *Travelers:* ${pax} Person(s)
⏱️ *Trip Duration:* ${duration}

*INCLUDED SERVICES & FACILITATION:*
${itemsStr || '✓ Complete Customized Itinerary Services'}

*SPECIAL PACKAGE PRICE:*
₹${(quote.finalCustomerPrice || 0).toLocaleString('en-IN')} All-Inclusive

📌 *Why Book With Us:*
• 24/7 Dedicated Trip Coordinator
• Verified Heritage Hotels & Drivers
• Fast-Track VIP Kashi Vishwanath Darshan

Reply *YES* to lock your dates or call us at 📞 +91 9876543210.
www.banarasyatra.com`;
}
