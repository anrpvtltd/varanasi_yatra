const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Generates a SHA-256 hash of a raw token string for secure database storage.
 */
function hashToken(token) {
    if (!token || typeof token !== 'string') return '';
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validates password strength (minimum 8 characters, requiring uppercase, lowercase, and numbers).
 */
function validatePasswordStrength(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, message: "Password is required." };
    }
    if (password.length < 8) {
        return { valid: false, message: "Password must be at least 8 characters long." };
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit) {
        return { valid: false, message: "Password must contain at least one uppercase letter, one lowercase letter, and one number." };
    }

    return { valid: true };
}

/**
 * Validates whether a given string is a valid MongoDB ObjectId.
 */
function isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Sanitizes input values to prevent NoSQL operator injection attacks.
 * Rejects non-primitive objects containing keys starting with '$'.
 */
function sanitizeNoSQLInput(input) {
    if (input === null || input === undefined) return input;
    if (typeof input === 'object') {
        if (Array.isArray(input)) {
            return input.map(sanitizeNoSQLInput);
        }
        const sanitized = {};
        for (const key of Object.keys(input)) {
            if (key.startsWith('$')) {
                throw new Error(`Potential NoSQL Injection detected in field key: ${key}`);
            }
            sanitized[key] = sanitizeNoSQLInput(input[key]);
        }
        return sanitized;
    }
    return input;
}

module.exports = {
    hashToken,
    validatePasswordStrength,
    isValidObjectId,
    sanitizeNoSQLInput
};
