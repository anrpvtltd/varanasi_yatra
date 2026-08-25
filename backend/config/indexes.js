/**
 * Database Index Initializer & Production Index Auditor
 * Safe, non-destructive index creation for high-frequency query paths.
 */

const mongoose = require('mongoose');

const INDEX_DEFINITIONS = [
    { collection: 'users', spec: { email: 1 }, options: { unique: true, sparse: true, background: true } },
    { collection: 'users', spec: { role: 1 }, options: { background: true } },

    { collection: 'enquiries', spec: { mobile: 1 }, options: { background: true } },
    { collection: 'enquiries', spec: { status: 1 }, options: { background: true } },
    { collection: 'enquiries', spec: { stage: 1 }, options: { background: true } },
    { collection: 'enquiries', spec: { createdAt: -1 }, options: { background: true } },

    { collection: 'quotes', spec: { leadId: 1 }, options: { background: true } },
    { collection: 'quotes', spec: { quoteNumber: 1 }, options: { background: true } },
    { collection: 'quotes', spec: { status: 1 }, options: { background: true } },

    { collection: 'bookings', spec: { quoteId: 1 }, options: { background: true } },
    { collection: 'bookings', spec: { bookingNumber: 1 }, options: { unique: true, sparse: true, background: true } },
    { collection: 'bookings', spec: { status: 1 }, options: { background: true } },
    { collection: 'bookings', spec: { createdAt: -1 }, options: { background: true } },

    { collection: 'customer_payments', spec: { paymentId: 1 }, options: { unique: true, sparse: true, background: true } },
    { collection: 'customer_payments', spec: { bookingId: 1 }, options: { background: true } },
    { collection: 'customer_payments', spec: { paymentDate: -1 }, options: { background: true } },

    { collection: 'vendor_payments', spec: { paymentId: 1 }, options: { unique: true, sparse: true, background: true } },
    { collection: 'vendor_payments', spec: { bookingId: 1 }, options: { background: true } },
    { collection: 'vendor_payments', spec: { vendorId: 1 }, options: { background: true } },

    { collection: 'automation_logs', spec: { eventKey: 1 }, options: { background: true } },
    { collection: 'automation_logs', spec: { status: 1 }, options: { background: true } },
    { collection: 'automation_logs', spec: { createdAt: -1 }, options: { background: true } },

    { collection: 'file_attachments', spec: { attachmentId: 1 }, options: { unique: true, sparse: true, background: true } },
    { collection: 'file_attachments', spec: { entityType: 1, entityId: 1 }, options: { background: true } },
    { collection: 'file_attachments', spec: { status: 1 }, options: { background: true } },

    { collection: 'documents', spec: { documentId: 1 }, options: { unique: true, sparse: true, background: true } },
    { collection: 'documents', spec: { bookingId: 1 }, options: { background: true } },
    { collection: 'documents', spec: { documentType: 1 }, options: { background: true } },
    { collection: 'documents', spec: { status: 1 }, options: { background: true } }
];

async function ensureProductionIndexes(db = null) {
    const targetDb = db || (mongoose.connection && mongoose.connection.db);
    if (!targetDb) {
        console.warn('⚠️ [Indexes] Database connection unavailable. Skipping index creation.');
        return { success: false, reason: 'DB_UNAVAILABLE', created: 0 };
    }

    let createdCount = 0;
    const results = [];

    for (const item of INDEX_DEFINITIONS) {
        try {
            const coll = targetDb.collection(item.collection);
            const indexName = await coll.createIndex(item.spec, item.options);
            createdCount++;
            results.push({ collection: item.collection, indexName, status: 'OK' });
        } catch (err) {
            // Non-fatal if index exists with differing options
            results.push({ collection: item.collection, error: err.message, status: 'SKIPPED' });
        }
    }

    console.log(`📑 [Indexes] Production Index Audit: ${createdCount}/${INDEX_DEFINITIONS.length} indexes verified/created.`);
    return { success: true, total: INDEX_DEFINITIONS.length, created: createdCount, results };
}

module.exports = {
    ensureProductionIndexes,
    INDEX_DEFINITIONS
};
