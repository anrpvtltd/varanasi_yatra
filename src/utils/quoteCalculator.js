import { DEFAULT_MARGIN_CONFIG, COMMERCIAL_MODELS } from '../constants/phase4Constants.js';

/**
 * Computes live financial breakdown for Quote Builder supporting finalized Commercial Models:
 * 1. SELLING_PRICE: CEO gives reference/base cost, Manager decides customer selling price.
 * 2. FIXED_VENDOR_RATE: Uses agreed vendor rate; customerCharge is derived or set.
 * 3. VENDOR_QUOTE_REQUIRED: Negotiated vendor cost + Manager customer selling price.
 * 4. CUSTOMER_DIRECT: Customer deals directly with provider (₹0 package charge).
 * 5. COMMISSION: Customer purchases directly from partner (₹0 package charge, commission to business).
 * 6. PASS_THROUGH: Statutory/temple pass fee (at-cost, 0% company margin, separate pass-through tracking).
 *
 * @param {Array} servicesList Array of service items
 * @param {String|Number} marginTypeOrDiscount 'FIXED'/'PERCENTAGE' in legacy mode, or discount in modern mode
 * @param {Number} marginValue Fixed amount in ₹ or % in legacy mode
 * @param {Number} discount Discount in ₹
 * @returns {Object} Comprehensive financial breakdown
 */
export function calculateQuoteFinancials(servicesList = [], marginType = 'FIXED', marginValue = 2500, discount = 0) {
    const validServices = Array.isArray(servicesList) ? servicesList : [];
    const numericDiscount = Number(discount) || 0;

    // Detect if items are using the modern Commercial Models or have explicit customerSellingPrice
    const hasModernCommercialModel = validServices.some(s => 
        s.commercialModel !== undefined || 
        s.customerSellingPrice !== undefined || 
        s.negotiatedVendorCost !== undefined ||
        s.passThroughAmount !== undefined
    );

    if (hasModernCommercialModel) {
        let totalCustomerCharge = 0;
        let totalVendorCost = 0;
        let passThroughTotal = 0;
        let commissionTotal = 0;

        const computedItems = validServices.map(item => {
            const qty = Number(item.quantity) || 1;
            const model = item.commercialModel || COMMERCIAL_MODELS.SELLING_PRICE;
            let itemCustomerCharge = 0;
            let itemVendorCost = 0;
            let itemMargin = 0;

            switch (model) {
                case COMMERCIAL_MODELS.SELLING_PRICE: {
                    const refCost = Number(item.referenceCost !== undefined ? item.referenceCost : (item.vendorCost || 0));
                    const sellingPrice = Number(
                        item.customerSellingPrice !== undefined 
                            ? item.customerSellingPrice 
                            : (item.customerCharge !== undefined ? item.customerCharge : (refCost > 0 ? refCost : (Number(item.vendorCost) || 0)))
                    );
                    itemVendorCost = refCost * qty;
                    itemCustomerCharge = sellingPrice * qty;
                    itemMargin = itemCustomerCharge - itemVendorCost;
                    totalVendorCost += itemVendorCost;
                    totalCustomerCharge += itemCustomerCharge;
                    break;
                }

                case COMMERCIAL_MODELS.FIXED_VENDOR_RATE: {
                    const fixedRate = Number(item.referenceCost !== undefined ? item.referenceCost : (item.vendorCost || 0));
                    const sellingPrice = Number(
                        item.customerSellingPrice !== undefined && item.customerSellingPrice > 0 
                            ? item.customerSellingPrice 
                            : fixedRate
                    );
                    itemVendorCost = fixedRate * qty;
                    itemCustomerCharge = sellingPrice * qty;
                    itemMargin = itemCustomerCharge - itemVendorCost;
                    totalVendorCost += itemVendorCost;
                    totalCustomerCharge += itemCustomerCharge;
                    break;
                }

                case COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED: {
                    const negotiated = Number(item.negotiatedVendorCost !== undefined ? item.negotiatedVendorCost : (item.vendorCost || 0));
                    const sellingPrice = Number(
                        item.customerSellingPrice !== undefined 
                            ? item.customerSellingPrice 
                            : (item.customerCharge !== undefined ? item.customerCharge : negotiated)
                    );
                    itemVendorCost = negotiated * qty;
                    itemCustomerCharge = sellingPrice * qty;
                    itemMargin = itemCustomerCharge - itemVendorCost;
                    totalVendorCost += itemVendorCost;
                    totalCustomerCharge += itemCustomerCharge;
                    break;
                }

                case COMMERCIAL_MODELS.CUSTOMER_DIRECT: {
                    // Customer coordinates and settles directly with provider
                    itemVendorCost = 0;
                    itemCustomerCharge = 0;
                    itemMargin = 0;
                    break;
                }

                case COMMERCIAL_MODELS.COMMISSION: {
                    // Customer purchases directly; business earns referral commission
                    itemVendorCost = 0;
                    itemCustomerCharge = 0;
                    const comm = Number(item.commissionAmount) || 0;
                    itemMargin = comm;
                    commissionTotal += comm;
                    break;
                }

                case COMMERCIAL_MODELS.PASS_THROUGH: {
                    // Government / Temple trust pass - zero company margin
                    const passAmount = Number(
                        item.passThroughAmount !== undefined 
                            ? item.passThroughAmount 
                            : (item.customerSellingPrice !== undefined 
                                ? item.customerSellingPrice 
                                : (item.referenceCost !== undefined ? item.referenceCost : (item.vendorCost || 0)))
                    );
                    itemVendorCost = passAmount * qty;
                    itemCustomerCharge = passAmount * qty;
                    itemMargin = 0;
                    passThroughTotal += itemCustomerCharge;
                    totalVendorCost += itemVendorCost;
                    totalCustomerCharge += itemCustomerCharge;
                    break;
                }

                default: {
                    const c = Number(item.vendorCost) || 0;
                    const sp = Number(item.customerSellingPrice !== undefined ? item.customerSellingPrice : c);
                    itemVendorCost = c * qty;
                    itemCustomerCharge = sp * qty;
                    itemMargin = itemCustomerCharge - itemVendorCost;
                    totalVendorCost += itemVendorCost;
                    totalCustomerCharge += itemCustomerCharge;
                    break;
                }
            }

            return {
                ...item,
                commercialModel: model,
                quantity: qty,
                vendorCost: (model === COMMERCIAL_MODELS.CUSTOMER_DIRECT || model === COMMERCIAL_MODELS.COMMISSION) ? 0 : (item.negotiatedVendorCost || item.referenceCost || item.vendorCost || 0),
                customerCharge: itemCustomerCharge,
                margin: itemMargin
            };
        });

        const finalCustomerPrice = Math.max(0, totalCustomerCharge - numericDiscount);
        // Real profit: (Final Revenue - PassThrough) - (Vendor Cost - PassThrough) + Commission
        // simplifies to: finalCustomerPrice - totalVendorCost + commissionTotal
        const expectedProfit = finalCustomerPrice - totalVendorCost + commissionTotal;

        return {
            totalCustomerCharge,
            totalVendorCost,
            companyMargin: expectedProfit, // for backward compatibility where consumers read companyMargin
            suggestedCustomerPrice: totalCustomerCharge,
            discount: numericDiscount,
            finalCustomerPrice,
            expectedProfit,
            passThroughTotal,
            commissionTotal,
            items: computedItems,
            isLowProfitWarning: expectedProfit < (DEFAULT_MARGIN_CONFIG?.MIN_RECOMMENDED_MARGIN || 1500),
            minRecommendedMargin: (DEFAULT_MARGIN_CONFIG?.MIN_RECOMMENDED_MARGIN || 1500)
        };
    }

    // -------------------------------------------------------------------------
    // Legacy Fallback for older tests / unmigrated quotes
    // -------------------------------------------------------------------------
    const totalVendorCost = validServices.reduce((sum, item) => {
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
    const finalCustomerPrice = Math.max(0, suggestedCustomerPrice - numericDiscount);
    const expectedProfit = finalCustomerPrice - totalVendorCost;

    return {
        totalCustomerCharge: suggestedCustomerPrice,
        totalVendorCost,
        companyMargin,
        suggestedCustomerPrice,
        discount: numericDiscount,
        finalCustomerPrice,
        expectedProfit,
        passThroughTotal: 0,
        commissionTotal: 0,
        items: validServices,
        isLowProfitWarning: expectedProfit < (DEFAULT_MARGIN_CONFIG?.MIN_RECOMMENDED_MARGIN || 1500),
        minRecommendedMargin: (DEFAULT_MARGIN_CONFIG?.MIN_RECOMMENDED_MARGIN || 1500)
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
        const model = item.commercialModel;
        let suffix = '';
        if (model === COMMERCIAL_MODELS.CUSTOMER_DIRECT) {
            suffix = ' *(Direct Customer Coordination)*';
        } else if (model === COMMERCIAL_MODELS.COMMISSION) {
            suffix = ' *(Complimentary Visit)*';
        } else if (model === COMMERCIAL_MODELS.PASS_THROUGH) {
            suffix = ' *(Govt / Temple Pass Included)*';
        }
        return `✓ ${name}${suffix}`;
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

Reply *YES* to lock your dates, WhatsApp us at 💬 +91 81497 83494, or call 📞 +91 84005 54029.
Email: info.varanasi.yatra@gmail.com | https://varanasiyatra.com | Instagram: @info.varanasi.yatra`;
}
