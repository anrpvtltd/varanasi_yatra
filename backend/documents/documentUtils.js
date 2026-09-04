const crypto = require('crypto');

/**
 * Generate unique document identifier (e.g. VY-DOC-2026-0042)
 */
function generateDocumentId(typePrefix = 'DOC') {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `VY-${typePrefix}-${year}-${random}`;
}

/**
 * Hash string using SHA-256
 */
function hashString(input) {
    return crypto.createHash('sha256').update(String(input)).digest('hex');
}

/**
 * Sanitize filename to prevent directory traversal
 */
function sanitizeFileName(filename) {
    const cleaned = String(filename).replace(/[/\\\\]/g, '_').replace(/\.\./g, '_');
    return cleaned.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

/**
 * Sanitize data payload snapshot based on user role
 */
function sanitizeSnapshotByRole(data, role, documentType) {
    if (!data) return data;
    const sanitized = JSON.parse(JSON.stringify(data));

    const isCustomerDoc = !documentType || [
        'CUSTOMER_QUOTE',
        'BOOKING_CONFIRMATION',
        'TRAVEL_VOUCHER',
        'PAYMENT_RECEIPT',
        'CUSTOMER_INVOICE',
        'RECEIPT',
        'VOUCHER',
        'QUOTE'
    ].includes(documentType);

    // If role is CEO and it's explicitly an internal audit/record, keep intact
    if (role === 'CEO' && !isCustomerDoc) return sanitized;

    // Fields that must NEVER leak to customers or non-CEOs
    const internalFields = [
        'referenceCost',
        'baseCost',
        'negotiatedVendorCost',
        'negotiatedCost',
        'vendorCost',
        'plannedVendorCost',
        'actualVendorCost',
        'totalVendorCost',
        'vendorPayable',
        'vendorDue',
        'vendorAssignments',
        'vendorPayments',
        'margin',
        'expectedProfit',
        'actualProfit',
        'profitVariance',
        'internalNotes',
        'ceoNotes',
        'ceoOnlyNotes',
        'internalExpense',
        'commissionRate',
        'commissionTerms',
        'commissionAmount'
    ];

    internalFields.forEach(f => delete sanitized[f]);

    if (sanitized.booking) {
        internalFields.forEach(f => delete sanitized.booking[f]);
        delete sanitized.booking.costVariance;
        delete sanitized.booking.vendorPaymentSummary;
        delete sanitized.booking.profitSummary;
        if (sanitized.booking.vendorAssignments) {
            delete sanitized.booking.vendorAssignments;
        }
        if (Array.isArray(sanitized.booking.services)) {
            sanitized.booking.services = sanitized.booking.services.map(s => {
                const clean = { ...s };
                internalFields.forEach(f => delete clean[f]);
                delete clean.vendorCostSnapshot;
                return clean;
            });
        }
    }

    if (sanitized.quote) {
        internalFields.forEach(f => delete sanitized.quote[f]);
        if (Array.isArray(sanitized.quote.servicesList)) {
            sanitized.quote.servicesList = sanitized.quote.servicesList.map(s => {
                const clean = { ...s };
                internalFields.forEach(f => delete clean[f]);
                return clean;
            });
        }
    }

    if (Array.isArray(sanitized.servicesList)) {
        sanitized.servicesList = sanitized.servicesList.map(s => {
            const clean = { ...s };
            internalFields.forEach(f => delete clean[f]);
            return clean;
        });
    }

    if (Array.isArray(sanitized.items)) {
        sanitized.items = sanitized.items.map(s => {
            const clean = { ...s };
            internalFields.forEach(f => delete clean[f]);
            return clean;
        });
    }

    return sanitized;
}

module.exports = {
    generateDocumentId,
    hashString,
    sanitizeFileName,
    sanitizeSnapshotByRole
};
