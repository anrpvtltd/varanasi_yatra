/**
 * Dynamic QR Network Constants & Canonical Specifications
 * Varanasi Yatra Platform — Prompt 4
 */

// Canonical QR Types (Broad operational categories)
const QR_TYPES = Object.freeze({
    HOTEL: 'HOTEL',
    PAID_PLACEMENT: 'PAID_PLACEMENT',
    PUBLIC_PLACE: 'PUBLIC_PLACE',
    ROADSIDE: 'ROADSIDE'
});

const ALL_QR_TYPES = Object.freeze(Object.values(QR_TYPES));

// Short codes for deterministic QR ID generation (e.g. GOD-HOT-001)
const QR_TYPE_CODES = Object.freeze({
    [QR_TYPES.HOTEL]: 'HOT',
    [QR_TYPES.PAID_PLACEMENT]: 'PAID',
    [QR_TYPES.PUBLIC_PLACE]: 'PUB',
    [QR_TYPES.ROADSIDE]: 'ROAD'
});

// QR Lifecycle Statuses
const QR_STATUSES = Object.freeze({
    DRAFT: 'DRAFT',
    GENERATED: 'GENERATED',
    INSTALLED: 'INSTALLED',
    ACTIVE: 'ACTIVE',
    DAMAGED: 'DAMAGED',
    MISSING: 'MISSING',
    REPLACEMENT_PENDING: 'REPLACEMENT_PENDING',
    REPLACED: 'REPLACED',
    INACTIVE: 'INACTIVE'
});

const ALL_QR_STATUSES = Object.freeze(Object.values(QR_STATUSES));

// Physical Installation Statuses
const INSTALLATION_STATUSES = Object.freeze({
    PENDING: 'PENDING',
    INSTALLED: 'INSTALLED',
    REMOVED: 'REMOVED'
});

const ALL_INSTALLATION_STATUSES = Object.freeze(Object.values(INSTALLATION_STATUSES));

// Location Permission Statuses (crucial for Public Place and Roadside)
const PERMISSION_STATUSES = Object.freeze({
    PENDING: 'PENDING',
    REQUESTED: 'REQUESTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    NOT_REQUIRED: 'NOT_REQUIRED'
});

const ALL_PERMISSION_STATUSES = Object.freeze(Object.values(PERMISSION_STATUSES));

// Area Statuses
const AREA_STATUSES = Object.freeze({
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
});

/**
 * Normalizes QR type string
 */
function normalizeQrType(type) {
    if (!type) return '';
    const upper = String(type).toUpperCase().trim().replace(/[\s-]+/g, '_');
    if (ALL_QR_TYPES.includes(upper)) return upper;
    return '';
}

/**
 * Returns 3-4 letter code for sequence formatting
 */
function getQrTypeCode(type) {
    const norm = normalizeQrType(type);
    return QR_TYPE_CODES[norm] || 'GEN';
}

/**
 * Validates if a QR type is allowed in a specific area
 */
function isQrTypeAllowedInArea(qrType, area) {
    if (!area || !Array.isArray(area.allowedQrTypes)) return false;
    const norm = normalizeQrType(qrType);
    return area.allowedQrTypes.map(normalizeQrType).includes(norm);
}

/**
 * Validates lifecycle transition
 */
function isValidQrTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) return true;
    
    const validTransitions = {
        [QR_STATUSES.DRAFT]: [QR_STATUSES.GENERATED, QR_STATUSES.INACTIVE],
        [QR_STATUSES.GENERATED]: [QR_STATUSES.INSTALLED, QR_STATUSES.ACTIVE, QR_STATUSES.INACTIVE],
        [QR_STATUSES.INSTALLED]: [QR_STATUSES.ACTIVE, QR_STATUSES.DAMAGED, QR_STATUSES.MISSING, QR_STATUSES.INACTIVE],
        [QR_STATUSES.ACTIVE]: [QR_STATUSES.DAMAGED, QR_STATUSES.MISSING, QR_STATUSES.REPLACEMENT_PENDING, QR_STATUSES.INACTIVE],
        [QR_STATUSES.DAMAGED]: [QR_STATUSES.REPLACEMENT_PENDING, QR_STATUSES.INACTIVE],
        [QR_STATUSES.MISSING]: [QR_STATUSES.REPLACEMENT_PENDING, QR_STATUSES.INACTIVE],
        [QR_STATUSES.REPLACEMENT_PENDING]: [QR_STATUSES.INACTIVE, QR_STATUSES.DAMAGED],
        [QR_STATUSES.INACTIVE]: [QR_STATUSES.DRAFT, QR_STATUSES.ACTIVE]
    };

    return (validTransitions[currentStatus] || []).includes(nextStatus);
}

module.exports = {
    QR_TYPES,
    ALL_QR_TYPES,
    QR_TYPE_CODES,
    QR_STATUSES,
    ALL_QR_STATUSES,
    INSTALLATION_STATUSES,
    ALL_INSTALLATION_STATUSES,
    PERMISSION_STATUSES,
    ALL_PERMISSION_STATUSES,
    AREA_STATUSES,
    normalizeQrType,
    getQrTypeCode,
    isQrTypeAllowedInArea,
    isValidQrTransition
};
