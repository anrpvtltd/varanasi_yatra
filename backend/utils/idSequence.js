const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 }
}, { timestamps: true });

let Counter;
try {
    Counter = mongoose.model('Counter');
} catch {
    Counter = mongoose.model('Counter', CounterSchema, 'counters');
}

const PREFIX_MAP = {
    CUSTOMER: 'KV-C',
    LEAD: 'KV-L',
    QUOTE: 'KV-Q',
    BOOKING: 'KV-B',
    TRIP: 'KV-T',
    PAYMENT: 'KV-P',
    FOLLOWUP: 'KV-F'
};

const inMemoryCounters = new Map();
let memoryMutex = Promise.resolve();

/**
 * Deterministic, sequential, concurrency-safe Kashi-Vashi ID generator.
 * Guaranteed atomic via MongoDB findOneAndUpdate with $inc and upsert when connected,
 * with atomic promise-mutex in-memory fallback for isolated/test execution.
 * 
 * Format: KV-<TYPE>-<YY>-<0001>
 * Example: KV-B-26-0001, KV-Q-26-0001, KV-L-26-0001
 * 
 * @param {string} entityType - CUSTOMER, LEAD, QUOTE, BOOKING, TRIP, PAYMENT, FOLLOWUP
 * @param {number|string} [year] - Year (e.g. 2026 or 26)
 * @param {mongoose.Model} [modelOverride] - Optional model override for multi-connection environments
 * @returns {Promise<string>} Generated sequential ID
 */
async function getNextSequence(entityType, year = null, modelOverride = null) {
    const cleanType = String(entityType || '').trim().toUpperCase();
    const prefix = PREFIX_MAP[cleanType];
    if (!prefix) {
        throw new Error(`Invalid entity type for KV ID sequence: "${entityType}". Supported types: ${Object.keys(PREFIX_MAP).join(', ')}`);
    }

    const currentYear = year ? String(year) : String(new Date().getFullYear());
    const yr = currentYear.length === 4 ? currentYear.slice(-2) : currentYear.padStart(2, '0');
    const counterKey = `${cleanType}_${yr}`;

    const Model = modelOverride || Counter;

    // If Model exists and Mongoose is connected to a live database, use atomic MongoDB findOneAndUpdate
    if (Model && (modelOverride || (mongoose.connection && mongoose.connection.readyState === 1))) {
        const result = await Model.findOneAndUpdate(
            { key: counterKey },
            { $inc: { seq: 1 } },
            { new: true, returnDocument: 'after', upsert: true }
        );
        const seqPadded = String(result.seq).padStart(4, '0');
        return `${prefix}-${yr}-${seqPadded}`;
    }

    // Atomic in-memory fallback (used when offline or running in sandbox/test without DB)
    // Concurrency-safe via promise chaining mutex
    return new Promise((resolve, reject) => {
        memoryMutex = memoryMutex.then(async () => {
            try {
                const currentSeq = inMemoryCounters.get(counterKey) || 0;
                const nextSeq = currentSeq + 1;
                inMemoryCounters.set(counterKey, nextSeq);
                const seqPadded = String(nextSeq).padStart(4, '0');
                resolve(`${prefix}-${yr}-${seqPadded}`);
            } catch (err) {
                reject(err);
            }
        });
    });
}

module.exports = {
    CounterSchema,
    Counter,
    PREFIX_MAP,
    getNextSequence
};
