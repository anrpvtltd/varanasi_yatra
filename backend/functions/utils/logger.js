const crypto = require('crypto');

const SENSITIVE_KEYS = [
    'password', 'passwordhash', 'secret', 'jwtsecret',
    'token', 'authorization', 'creditcard', 'cvv', 'apikey',
    'smtp_password', 'smtp_user', 'meta_whatsapp_access_token',
    'cloud_storage_secret_key', 'bearer'
];

// Global request metric tracking for safe internal observability
const requestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    clientErrors: 0,
    serverErrors: 0,
    startedAt: new Date().toISOString()
};

/**
 * Recursively sanitize sensitive keys in objects & query params
 */
function sanitizePayload(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(sanitizePayload);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some(s => lowerKey.includes(s))) {
            sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizePayload(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Format structured log entry as JSON
 */
function formatLogEntry(level, message, metadata = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        service: 'VaranasiYatraBackend',
        environment: process.env.NODE_ENV || 'development',
        requestId: metadata.requestId || metadata.traceId || 'req-' + crypto.randomBytes(6).toString('hex'),
        message,
        path: metadata.path || null,
        method: metadata.method || null,
        statusCode: metadata.statusCode || null,
        durationMs: metadata.durationMs !== undefined ? metadata.durationMs : null,
        details: sanitizePayload(metadata.details || {})
    };

    return JSON.stringify(entry);
}

/**
 * Structured Logger utility
 */
const logger = {
    info: (msg, meta = {}) => {
        if (process.env.SILENT_LOGS !== 'true') console.log(formatLogEntry('INFO', msg, meta));
    },
    warn: (msg, meta = {}) => {
        if (process.env.SILENT_LOGS !== 'true') console.warn(formatLogEntry('WARN', msg, meta));
    },
    error: (msg, meta = {}) => {
        if (process.env.SILENT_LOGS !== 'true') console.error(formatLogEntry('ERROR', msg, meta));
    },
    debug: (msg, meta = {}) => {
        if (process.env.NODE_ENV !== 'production') {
            if (process.env.SILENT_LOGS !== 'true') {
                console.log(formatLogEntry('DEBUG', msg, meta));
            }
        }
    }
};

/**
 * Express HTTP Request Correlation & Structured Logging Middleware
 */
function requestCorrelationLogger(req, res, next) {
    // 1. Sanitize or generate correlation ID
    const rawRequestId = req.headers['x-request-id'] || req.headers['x-trace-id'];
    const sanitizedRequestId = (rawRequestId && typeof rawRequestId === 'string')
        ? rawRequestId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
        : 'req-' + crypto.randomBytes(6).toString('hex');

    req.requestId = sanitizedRequestId;
    req.traceId = sanitizedRequestId; // backward compatibility

    res.setHeader('X-Request-ID', sanitizedRequestId);
    res.setHeader('x-trace-id', sanitizedRequestId);

    requestMetrics.totalRequests++;
    const startTime = Date.now();

    res.on('finish', () => {
        const durationMs = Date.now() - startTime;
        if (res.statusCode >= 500) {
            requestMetrics.serverErrors++;
        } else if (res.statusCode >= 400) {
            requestMetrics.clientErrors++;
        } else {
            requestMetrics.successfulRequests++;
        }

        const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
        const msg = `${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} (${durationMs}ms)`;

        const meta = {
            requestId: sanitizedRequestId,
            traceId: sanitizedRequestId,
            path: req.originalUrl || req.url,
            method: req.method,
            statusCode: res.statusCode,
            durationMs,
            details: {
                query: sanitizePayload(req.query),
                ip: req.ip || req.socket.remoteAddress
            }
        };

        if (level === 'ERROR') logger.error(msg, meta);
        else if (level === 'WARN') logger.warn(msg, meta);
        else logger.info(msg, meta);
    });

    next();
}

/**
 * Returns safe internal request metrics (zero secrets exposed)
 */
function getRequestMetrics() {
    return {
        ...requestMetrics,
        errorRatePercent: requestMetrics.totalRequests > 0
            ? Number(((requestMetrics.serverErrors + requestMetrics.clientErrors) / requestMetrics.totalRequests * 100).toFixed(2))
            : 0
    };
}

module.exports = {
    logger,
    requestCorrelationLogger,
    requestLogger: requestCorrelationLogger, // alias
    sanitizePayload,
    formatLogEntry,
    getRequestMetrics
};
