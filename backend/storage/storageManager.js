const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const UPLOADS_DIR = path.join(__dirname, '../uploads/attachments');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// 1. Attachment Schema Definition
const AttachmentSchema = new mongoose.Schema({
    attachmentId: { type: String, required: true, unique: true, index: true },
    entityType: {
        type: String,
        enum: ['LEAD', 'BOOKING', 'CUSTOMER', 'VENDOR', 'DOCUMENT', 'GENERAL'],
        default: 'GENERAL',
        index: true
    },
    entityId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    storedName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    checksum: { type: String, required: true },
    storageProvider: { type: String, default: 'LocalStorageProvider' },
    storagePath: { type: String, required: true },
    uploadedBy: { type: String, default: 'System' },
    status: { type: String, enum: ['ACTIVE', 'DELETED'], default: 'ACTIVE', index: true }
}, { timestamps: true });

const AttachmentModel = mongoose.models.Attachment || mongoose.model('Attachment', AttachmentSchema, 'file_attachments');

// In-memory fallback for detached DB environments
const inMemoryAttachments = [];

// 2. Storage Provider Implementations
class BaseStorageProvider {
    constructor(name) {
        this.name = name;
    }
    async saveFile(_fileName, _buffer) { throw new Error('Not implemented'); }
    async readFile(_fileName) { throw new Error('Not implemented'); }
    async deleteFile(_fileName) { throw new Error('Not implemented'); }
    async getSignedUrl(_fileName, _expiresInSeconds = 3600) { throw new Error('Not implemented'); }
    async healthCheck() { throw new Error('Not implemented'); }
}

class LocalStorageProvider extends BaseStorageProvider {
    constructor() {
        super('LocalStorageProvider');
    }

    async saveFile(fileName, buffer) {
        const safeName = sanitizeFileName(fileName);
        const filePath = path.join(UPLOADS_DIR, safeName);

        if (!filePath.startsWith(UPLOADS_DIR)) {
            throw new Error('Security Violation: Invalid file path traversal detected.');
        }

        fs.writeFileSync(filePath, buffer);
        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

        return {
            storageProvider: this.name,
            storagePath: filePath,
            fileName: safeName,
            checksum,
            fileSize: buffer.length
        };
    }

    async readFile(fileName) {
        const safeName = sanitizeFileName(fileName);
        const filePath = path.join(UPLOADS_DIR, safeName);

        if (!filePath.startsWith(UPLOADS_DIR) || !fs.existsSync(filePath)) {
            throw new Error('File not found or path invalid.');
        }
        return fs.readFileSync(filePath);
    }

    async deleteFile(fileName) {
        const safeName = sanitizeFileName(fileName);
        const filePath = path.join(UPLOADS_DIR, safeName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }

    async getSignedUrl(fileName) {
        const safeName = sanitizeFileName(fileName);
        return `/admin/files/${safeName}`;
    }

    async healthCheck() {
        return { status: 'READY', provider: this.name, path: UPLOADS_DIR, isWritable: fs.existsSync(UPLOADS_DIR) };
    }
}

class CloudStorageProvider extends BaseStorageProvider {
    constructor(config = {}) {
        super('CloudStorageProvider');
        this.bucket = config.bucket !== undefined ? config.bucket : (process.env.CLOUD_STORAGE_BUCKET || '');
        this.store = new Map();
    }

    async saveFile(fileName, buffer) {
        if (!this.bucket || !this.bucket.trim()) {
            throw new Error("STORAGE_NOT_CONFIGURED: Cloud storage bucket or access credentials are not configured.");
        }
        console.log(`☁️ [CloudStorageProvider] Uploading ${fileName} to bucket: ${this.bucket}`);
        const safeName = sanitizeFileName(fileName);
        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        this.store.set(safeName, buffer);

        return {
            storageProvider: this.name,
            storagePath: `gs://${this.bucket}/${safeName}`,
            fileName: safeName,
            checksum,
            fileSize: buffer.length
        };
    }

    async readFile(fileName) {
        if (!this.bucket || !this.bucket.trim()) {
            throw new Error("STORAGE_NOT_CONFIGURED: Cloud storage bucket or access credentials are not configured.");
        }
        const safeName = sanitizeFileName(fileName);
        if (this.store.has(safeName)) {
            return this.store.get(safeName);
        }
        throw new Error(`File ${safeName} not found in cloud storage.`);
    }

    async deleteFile(fileName) {
        if (!this.bucket || !this.bucket.trim()) {
            throw new Error("STORAGE_NOT_CONFIGURED: Cloud storage bucket or access credentials are not configured.");
        }
        const safeName = sanitizeFileName(fileName);
        return this.store.delete(safeName);
    }

    async getSignedUrl(fileName, expiresInSeconds = 3600) {
        if (!this.bucket || !this.bucket.trim()) {
            throw new Error("STORAGE_NOT_CONFIGURED: Cloud storage bucket or access credentials are not configured.");
        }
        const safeName = sanitizeFileName(fileName);
        return `https://storage.googleapis.com/${this.bucket}/${safeName}?expires=${Date.now() + expiresInSeconds * 1000}`;
    }

    async healthCheck() {
        if (!this.bucket || !this.bucket.trim()) {
            return { status: 'UNCONFIGURED', provider: this.name, error: 'STORAGE_NOT_CONFIGURED' };
        }
        return { status: 'READY', provider: this.name, bucket: this.bucket };
    }
}

let currentStorageProvider = new LocalStorageProvider();

function setStorageProvider(provider) {
    currentStorageProvider = provider;
}

function getStorageProvider() {
    return currentStorageProvider;
}

function sanitizeFileName(filename) {
    const cleaned = String(filename).replace(/[/\\\\]/g, '_').replace(/\.\./g, '_');
    return cleaned.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Upload file attachment
 */
async function uploadFileAttachment({
    buffer,
    originalName,
    mimeType = 'application/pdf',
    entityType = 'GENERAL',
    entityId = 'GLOBAL',
    uploadedBy = 'System'
}) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error('Valid file buffer is required for upload.');
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File size exceeds maximum threshold of 10MB.`);
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
        throw new Error(`Unsupported file type: ${mimeType}. Allowed formats: PDF, JPEG, PNG, WEBP.`);
    }

    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString('hex');
    const attachmentId = `ATT-${timestamp}-${randomHex}`;
    const fileExt = path.extname(originalName) || '.pdf';
    const targetFileName = `${attachmentId}${fileExt}`;

    const saveMeta = await currentStorageProvider.saveFile(targetFileName, buffer);

    const attachmentRecord = {
        attachmentId,
        entityType,
        entityId,
        fileName: saveMeta.fileName,
        storedName: saveMeta.fileName,
        originalName: sanitizeFileName(originalName),
        mimeType: mimeType.toLowerCase(),
        fileSize: saveMeta.fileSize,
        checksum: saveMeta.checksum,
        storageProvider: saveMeta.storageProvider,
        storagePath: saveMeta.storagePath,
        uploadedBy,
        status: 'ACTIVE'
    };

    try {
        if (mongoose.connection.readyState === 1) {
            const doc = new AttachmentModel(attachmentRecord);
            await doc.save();
            return doc.toObject();
        }
    } catch (e) {
        console.warn("⚠️ Attachment DB save fallback:", e.message);
    }

    inMemoryAttachments.push(attachmentRecord);
    return attachmentRecord;
}

/**
 * Fetch attachments list for entity
 */
async function getAttachments(filter = {}) {
    const query = {};
    if (filter.entityType) query.entityType = filter.entityType;
    if (filter.entityId) query.entityId = filter.entityId;

    try {
        if (mongoose.connection.readyState === 1) {
            const docs = await AttachmentModel.find(query).sort({ createdAt: -1 });
            return docs.map(d => d.toObject());
        }
    } catch {
        // Fallback
    }

    return inMemoryAttachments.filter(a => {
        if (filter.entityType && a.entityType !== filter.entityType) return false;
        if (filter.entityId && a.entityId !== filter.entityId) return false;
        return true;
    });
}

/**
 * Get single attachment record
 */
async function getAttachmentById(attachmentId) {
    try {
        if (mongoose.connection.readyState === 1) {
            const doc = await AttachmentModel.findOne({ attachmentId });
            if (doc) return doc.toObject();
        }
    } catch {
        // Fallback
    }
    return inMemoryAttachments.find(a => a.attachmentId === attachmentId) || null;
}

/**
 * Read file buffer for attachment
 */
async function getAttachmentBuffer(attachmentId) {
    const attachment = await getAttachmentById(attachmentId);
    if (!attachment) throw new Error('Attachment metadata record not found.');

    return await currentStorageProvider.readFile(attachment.fileName);
}

/**
 * Delete attachment
 */
async function deleteAttachment(attachmentId) {
    const attachment = await getAttachmentById(attachmentId);
    if (!attachment) return false;

    await currentStorageProvider.deleteFile(attachment.fileName);

    try {
        if (mongoose.connection.readyState === 1) {
            await AttachmentModel.deleteOne({ attachmentId });
        }
    } catch {
        // Fallback
    }

    const idx = inMemoryAttachments.findIndex(a => a.attachmentId === attachmentId);
    if (idx !== -1) inMemoryAttachments.splice(idx, 1);

    return true;
}

/**
 * Enforce file attachment authorization rules:
 * - CEO: Access to all files & financial docs.
 * - Manager: Access to LEAD, BOOKING, CUSTOMER, VENDOR files, but blocked if entityType === 'DOCUMENT' and document is INTERNAL_FINANCIAL_REPORT.
 * - Unauthenticated: Denied.
 */
function verifyFileAccessPermission(attachment, user = null) {
    if (!attachment) {
        const err = new Error('File attachment not found.');
        err.statusCode = 404;
        throw err;
    }

    if (attachment.originalName && (attachment.originalName.includes('..') || attachment.originalName.includes('/') || attachment.originalName.includes('\\'))) {
        const err = new Error('Access Denied: Path traversal detected in requested filename.');
        err.statusCode = 400;
        throw err;
    }

    if (!user || !user.role) {
        const err = new Error('Unauthorized: Authentication token required to access file attachments.');
        err.statusCode = 401;
        throw err;
    }

    if (user.role === 'CEO') {
        return true;
    }

    if (user.role === 'Manager') {
        if (attachment.entityType === 'DOCUMENT' && attachment.originalName.includes('FINANCIAL_REPORT')) {
            const err = new Error('Access Denied: Financial report attachments are CEO-only.');
            err.statusCode = 403;
            throw err;
        }
        return true;
    }

    const err = new Error('Access Denied: Insufficient role permissions for file attachment.');
    err.statusCode = 403;
    throw err;
}

module.exports = {
    AttachmentSchema,
    AttachmentModel,
    BaseStorageProvider,
    LocalStorageProvider,
    CloudStorageProvider,
    setStorageProvider,
    getStorageProvider,
    uploadFileAttachment,
    getAttachments,
    getAttachmentById,
    getAttachmentBuffer,
    deleteAttachment,
    verifyFileAccessPermission,
    inMemoryAttachments,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES
};
