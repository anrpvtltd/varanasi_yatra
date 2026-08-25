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
function sanitizeSnapshotByRole(data, role) {
    if (role === 'CEO') return data;

    // Remove internal financial metrics for Manager/Public
    const sanitized = JSON.parse(JSON.stringify(data));
    delete sanitized.vendorCost;
    delete sanitized.plannedVendorCost;
    delete sanitized.actualVendorCost;
    delete sanitized.margin;
    delete sanitized.expectedProfit;
    delete sanitized.actualProfit;
    delete sanitized.profitVariance;
    delete sanitized.internalNotes;

    if (sanitized.booking) {
        delete sanitized.booking.plannedVendorCost;
        delete sanitized.booking.actualVendorCost;
        delete sanitized.booking.expectedProfit;
        delete sanitized.booking.actualProfit;
        delete sanitized.booking.costVariance;
    }

    return sanitized;
}

module.exports = {
    generateDocumentId,
    hashString,
    sanitizeFileName,
    sanitizeSnapshotByRole
};
