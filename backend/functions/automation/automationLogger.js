const mongoose = require('mongoose');

const AutomationLogSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    eventKey: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    channel: { type: String, enum: ['WHATSAPP', 'EMAIL', 'BOTH'], required: true },
    recipient: { type: String, required: true },
    templateId: { type: String, required: true },
    renderedSubject: { type: String, default: '' },
    renderedBody: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'RETRYING', 'PERMANENT_FAILURE'],
        default: 'PENDING',
        index: true
    },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    errorMessage: { type: String, default: '' },
    provider: { type: String, default: 'ConsoleProvider' },
    messageId: { type: String, default: '' },
    sentAt: { type: Date, default: null }
}, { timestamps: true });

const AutomationLog = mongoose.models.AutomationLog || mongoose.model('AutomationLog', AutomationLogSchema, 'automation_logs');

// In-memory fallback array for testing/development environments when DB is detached
const inMemoryLogs = [];

/**
 * Database-backed idempotency check
 */
async function isDuplicateEventKey(eventKey) {
    if (!eventKey) return false;
    try {
        if (mongoose.connection.readyState === 1) {
            const existing = await AutomationLog.findOne({ eventKey });
            if (existing) return true;
        }
    } catch (e) {
        console.warn("⚠️ Idempotency check DB query fallback:", e.message);
    }
    return inMemoryLogs.some(l => l.eventKey === eventKey);
}

async function logAutomationEvent(logData) {
    try {
        if (mongoose.connection.readyState === 1) {
            const entry = new AutomationLog(logData);
            return await entry.save();
        }
    } catch (e) {
        // Duplicate key code 11000 means event was already logged
        if (e.code === 11000) {
            console.log(`ℹ️ [Database Idempotency] Suppressed duplicate event key: ${logData.eventKey}`);
            throw new Error(`DUPLICATE_EVENT_KEY: ${logData.eventKey}`);
        }
        console.warn("⚠️ Database log error, falling back to memory log:", e.message);
    }

    if (inMemoryLogs.some(l => l.eventKey === logData.eventKey)) {
        throw new Error(`DUPLICATE_EVENT_KEY: ${logData.eventKey}`);
    }

    const memEntry = {
        _id: `mem_log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...logData,
        createdAt: new Date()
    };
    inMemoryLogs.push(memEntry);
    return memEntry;
}

async function updateLogStatus(logId, status, extra = {}) {
    try {
        if (mongoose.connection.readyState === 1 && !String(logId).startsWith('mem_log_')) {
            return await AutomationLog.findByIdAndUpdate(logId, { status, ...extra }, { new: true });
        }
    } catch (e) {
        console.warn("⚠️ Database log update fallback to memory log:", e.message);
    }
    const memEntry = inMemoryLogs.find(l => String(l._id) === String(logId));
    if (memEntry) {
        memEntry.status = status;
        Object.assign(memEntry, extra);
        return memEntry;
    }
    return null;
}

async function getAutomationLogs(filter = {}) {
    try {
        if (mongoose.connection.readyState === 1) {
            return await AutomationLog.find(filter).sort({ createdAt: -1 }).limit(100);
        }
    } catch (e) {
        console.warn("⚠️ Database log query error, reading memory logs:", e.message);
    }
    return inMemoryLogs.filter(l => {
        if (filter.status && l.status !== filter.status) return false;
        if (filter.eventType && l.eventType !== filter.eventType) return false;
        return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
    AutomationLogSchema,
    AutomationLog,
    isDuplicateEventKey,
    logAutomationEvent,
    updateLogStatus,
    getAutomationLogs,
    inMemoryLogs
};
