const mongoose = require('mongoose');
const { generateDocumentId, sanitizeSnapshotByRole } = require('./documentUtils');
const { saveDocumentFile, readDocumentFile } = require('./documentStorage');
const { getDocumentProvider } = require('./LocalPDFProvider');
const { createDocumentToken, validateAccessToken, revokeDocumentToken } = require('./documentAccess');

const DocumentSchema = new mongoose.Schema({
    documentId: { type: String, required: true, unique: true, index: true },
    documentType: {
        type: String,
        required: true,
        enum: [
            'QUOTE_PDF', 'BOOKING_CONFIRMATION', 'TRAVEL_VOUCHER',
            'PAYMENT_RECEIPT', 'CUSTOMER_INVOICE', 'DRIVER_OPERATIONS_SHEET',
            'VENDOR_OPERATIONS_SHEET', 'INTERNAL_FINANCIAL_REPORT'
        ]
    },
    bookingId: { type: String, default: '' },
    quoteId: { type: String, default: '' },
    customerId: { type: String, default: '' },
    generatedBy: { type: String, default: 'System' },
    generatedByRole: { type: String, default: 'Manager' },
    fileName: { type: String, required: true },
    storageProvider: { type: String, default: 'LocalPDFProvider' },
    storagePath: { type: String, default: '' },
    downloadUrl: { type: String, default: '' },
    status: { type: String, default: 'READY', enum: ['CREATED', 'GENERATING', 'READY', 'FAILED', 'ARCHIVED'] },
    dataSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    checksum: { type: String, default: '' },
    version: { type: Number, default: 1 },
    previousDocumentId: { type: String, default: null },
    isLatest: { type: Boolean, default: true }
}, { timestamps: true });

const DocumentModel = mongoose.models.Document || mongoose.model('Document', DocumentSchema, 'generated_documents');

// In-Memory store for fast testing/fallback
const inMemoryDocs = [];

/**
 * Generate a production document
 */
async function generateDocument({ documentType, bookingId, quoteId, customerId, user = { name: 'System', role: 'CEO' }, customData = null, taxMode = 'NO_TAX' }) {
    // 0. Document type whitelist validation
    const VALID_DOCUMENT_TYPES = [
        'QUOTE_PDF', 'BOOKING_CONFIRMATION', 'TRAVEL_VOUCHER',
        'PAYMENT_RECEIPT', 'CUSTOMER_INVOICE', 'DRIVER_OPERATIONS_SHEET',
        'VENDOR_OPERATIONS_SHEET', 'INTERNAL_FINANCIAL_REPORT',
        // Alias types accepted by the HTTP route:
        'QUOTE', 'TAX_INVOICE', 'DRIVER_SHEET', 'PAYMENT_RECEIPT'
    ];
    if (!documentType || !VALID_DOCUMENT_TYPES.includes(documentType)) {
        const err = new Error(`Invalid documentType: "${documentType}". Must be one of: ${VALID_DOCUMENT_TYPES.filter((v, i, a) => a.indexOf(v) === i).join(', ')}`);
        err.statusCode = 400;
        throw err;
    }

    // 1. Role Permission Security Check
    if (documentType === 'INTERNAL_FINANCIAL_REPORT' && user.role !== 'CEO') {
        const err = new Error('Access Denied: Financial Reports are strictly CEO-only.');
        err.statusCode = 403;
        throw err;
    }

    const docId = generateDocumentId(documentType.split('_')[0]);

    // 2. Data Collection Snapshot
    let payload = customData || {
        bookingId: bookingId || 'VY-B-2026-0001',
        quoteId: quoteId || 'VY-Q-001',
        customerId: customerId || 'cust_101',
        customerName: 'Rahul Sharma',
        mobile: '+919876543210',
        packageName: 'Kashi Vishwanath Special Yatra',
        tripDate: '2026-09-15',
        travelers: '2',
        totalAmount: 40000,
        paidAmount: 15000,
        remainingAmount: 25000,
        plannedVendorCost: 21000,
        actualVendorCost: 23000,
        expenses: 1500,
        commission: 2000,
        expectedProfit: 19000,
        actualProfit: 17500,
        taxMode
    };

    payload.documentId = docId;

    // 3. Role-Based Snapshot Sanitization
    const sanitizedSnapshot = sanitizeSnapshotByRole(payload, user.role, documentType);

    // 4. Generate PDF via Active Provider
    const provider = getDocumentProvider();
    const pdfRes = await provider.generatePDF(documentType, sanitizedSnapshot);

    // 5. Store File & Compute Checksum
    const fileRes = await saveDocumentFile(pdfRes.fileName, pdfRes.buffer);

    // 6. Build Document Record
    const docData = {
        documentId: docId,
        documentType,
        bookingId: bookingId || payload.bookingId || '',
        quoteId: quoteId || payload.quoteId || '',
        customerId: customerId || payload.customerId || '',
        generatedBy: user.name || 'System',
        generatedByRole: user.role || 'Manager',
        fileName: fileRes.fileName,
        storageProvider: provider.name,
        storagePath: fileRes.storagePath,
        downloadUrl: `/admin/documents/${docId}`,
        status: 'READY',
        dataSnapshot: sanitizedSnapshot,
        checksum: fileRes.checksum,
        version: 1,
        previousDocumentId: null,
        isLatest: true
    };

    try {
        if (mongoose.connection.readyState === 1) {
            const saved = new DocumentModel(docData);
            await saved.save();
            return saved.toObject();
        }
    } catch (e) {
        console.warn("⚠️ Document DB save fallback:", e.message);
    }
    inMemoryDocs.push(docData);
    return docData;
}

/**
 * Regenerate Document (Increments Version V1 -> V2)
 */
async function regenerateDocument(documentId, user = { name: 'System', role: 'CEO' }) {
    const existing = await getDocumentById(documentId, user.role);
    if (!existing) throw new Error('Document not found.');

    if (existing.documentType === 'INTERNAL_FINANCIAL_REPORT' && user.role !== 'CEO') {
        const err = new Error('Access Denied: Financial Reports are strictly CEO-only.');
        err.statusCode = 403;
        throw err;
    }

    // Mark previous version as non-latest
    try {
        if (mongoose.connection.readyState === 1) {
            await DocumentModel.updateOne({ documentId }, { isLatest: false });
        }
    } catch {
        // Fallback
    }
    const found = inMemoryDocs.find(d => d.documentId === documentId);
    if (found) found.isLatest = false;

    // Generate new document version
    const newDoc = await generateDocument({
        documentType: existing.documentType,
        bookingId: existing.bookingId,
        quoteId: existing.quoteId,
        customerId: existing.customerId,
        user,
        customData: existing.dataSnapshot
    });

    newDoc.version = (existing.version || 1) + 1;
    newDoc.previousDocumentId = existing.documentId;
    newDoc.isLatest = true;

    try {
        if (mongoose.connection.readyState === 1) {
            await DocumentModel.updateOne({ documentId: newDoc.documentId }, {
                version: newDoc.version,
                previousDocumentId: newDoc.previousDocumentId,
                isLatest: true
            });
        }
    } catch {
        // Fallback
    }
    const target = inMemoryDocs.find(d => d.documentId === newDoc.documentId);
    if (target) {
        target.version = newDoc.version;
        target.previousDocumentId = newDoc.previousDocumentId;
        target.isLatest = true;
    }

    return newDoc;
}

/**
 * Fetch documents with filters
 */
async function getDocuments(filter = {}) {
    const query = {};
    if (filter.bookingId) query.bookingId = filter.bookingId;
    if (filter.quoteId) query.quoteId = filter.quoteId;
    if (filter.documentType) query.documentType = filter.documentType;
    if (filter.status) query.status = filter.status;
    else query.status = { $ne: 'ARCHIVED' };

    try {
        if (mongoose.connection.readyState === 1) {
            const docs = await DocumentModel.find(query).sort({ createdAt: -1 });
            return docs.map(d => d.toObject());
        }
    } catch {
        // Fallback
    }
    return inMemoryDocs.filter(d => {
        if (filter.bookingId && d.bookingId !== filter.bookingId) return false;
        if (filter.documentType && d.documentType !== filter.documentType) return false;
        if (filter.status && d.status !== filter.status) return false;
        if (!filter.status && d.status === 'ARCHIVED') return false;
        return true;
    });
}

/**
 * Fetch document by ID with role check
 */
async function getDocumentById(documentId, userRole = 'Manager') {
    let doc = null;
    try {
        if (mongoose.connection.readyState === 1) {
            doc = await DocumentModel.findOne({ documentId });
            if (doc) doc = doc.toObject();
        }
    } catch {
        // Fallback
    }
    if (!doc) {
        doc = inMemoryDocs.find(d => d.documentId === documentId);
    }

    if (!doc) return null;

    if (doc.documentType === 'INTERNAL_FINANCIAL_REPORT' && userRole !== 'CEO') {
        const err = new Error('Access Denied: Financial Reports are strictly CEO-only.');
        err.statusCode = 403;
        throw err;
    }

    return doc;
}

/**
 * Soft Archive Document (CEO Role Only)
 */
async function archiveDocument(documentId, userRole = 'CEO') {
    if (userRole !== 'CEO') {
        const err = new Error('Access Denied: Only CEO can archive official documents.');
        err.statusCode = 403;
        throw err;
    }

    try {
        if (mongoose.connection.readyState === 1) {
            const updated = await DocumentModel.findOneAndUpdate(
                { documentId },
                { status: 'ARCHIVED' },
                { new: true }
            );
            if (updated) return updated.toObject();
        }
    } catch {
        // Fallback
    }
    const found = inMemoryDocs.find(d => d.documentId === documentId);
    if (found) found.status = 'ARCHIVED';
    return found || null;
}

module.exports = {
    DocumentSchema,
    DocumentModel,
    generateDocument,
    regenerateDocument,
    getDocuments,
    getDocumentById,
    archiveDocument,
    createDocumentToken,
    validateAccessToken,
    revokeDocumentToken,
    readDocumentFile,
    inMemoryDocs
};
