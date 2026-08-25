const crypto = require('crypto');
const mongoose = require('mongoose');
const { hashString } = require('./documentUtils');

const DocumentAccessTokenSchema = new mongoose.Schema({
    tokenHash: { type: String, required: true, unique: true, index: true },
    documentId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    maxDownloads: { type: Number, default: 5 },
    downloadCount: { type: Number, default: 0 },
    revoked: { type: Boolean, default: false }
}, { timestamps: true });

const DocumentAccessToken = mongoose.models.DocumentAccessToken || mongoose.model('DocumentAccessToken', DocumentAccessTokenSchema, 'document_access_tokens');

// In-Memory store for fast testing/fallback
const inMemoryTokens = [];

/**
 * Generate temporary secure document download token
 */
async function createDocumentToken(documentId, { expiresInHours = 24, maxDownloads = 5 } = {}) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashString(rawToken);
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    try {
        if (mongoose.connection.readyState === 1) {
            const tokenDoc = new DocumentAccessToken({
                tokenHash,
                documentId,
                expiresAt,
                maxDownloads,
                downloadCount: 0,
                revoked: false
            });
            await tokenDoc.save();
            return { rawToken, expiresAt, maxDownloads };
        }
    } catch {
        // Fallback
    }

    inMemoryTokens.push({ tokenHash, documentId, expiresAt, maxDownloads, downloadCount: 0, revoked: false });
    return { rawToken, expiresAt, maxDownloads };
}

/**
 * Validate token and increment download count
 */
async function validateAccessToken(rawToken) {
    if (!rawToken) throw new Error('Token is required.');
    const tokenHash = hashString(rawToken);

    let tokenDoc = null;
    try {
        if (mongoose.connection.readyState === 1) {
            tokenDoc = await DocumentAccessToken.findOne({ tokenHash });
        }
    } catch {
        // Fallback
    }
    if (!tokenDoc) {
        tokenDoc = inMemoryTokens.find(t => t.tokenHash === tokenHash);
    }

    if (!tokenDoc) throw new Error('Invalid or expired document access token.');
    if (tokenDoc.revoked) throw new Error('Document access token has been revoked.');
    if (new Date() > new Date(tokenDoc.expiresAt)) throw new Error('Document access token has expired.');
    if (tokenDoc.maxDownloads > 0 && tokenDoc.downloadCount >= tokenDoc.maxDownloads) {
        throw new Error('Document download limit exceeded.');
    }

    // Increment download count
    tokenDoc.downloadCount = (tokenDoc.downloadCount || 0) + 1;
    if (typeof tokenDoc.save === 'function') {
        await tokenDoc.save();
    }

    return tokenDoc.documentId;
}

/**
 * Revoke document token
 */
async function revokeDocumentToken(rawToken) {
    if (!rawToken) return false;
    const tokenHash = hashString(rawToken);

    try {
        if (mongoose.connection.readyState === 1) {
            await DocumentAccessToken.updateOne({ tokenHash }, { revoked: true });
        }
    } catch {
        // Fallback
    }

    const found = inMemoryTokens.find(t => t.tokenHash === tokenHash);
    if (found) found.revoked = true;
    return true;
}

module.exports = {
    DocumentAccessTokenSchema,
    DocumentAccessToken,
    createDocumentToken,
    validateAccessToken,
    revokeDocumentToken,
    inMemoryTokens
};
