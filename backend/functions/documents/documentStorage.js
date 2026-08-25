const fs = require('fs');
const path = require('path');
const { hashString, sanitizeFileName } = require('./documentUtils');

const LOCAL_STORAGE_DIR = path.join(__dirname, '../uploads/documents');

if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

class BaseStorageProvider {
    constructor(name) {
        this.name = name;
    }

    async saveFile(_fileName, _buffer) {
        throw new Error(`saveFile not implemented in ${this.name}`);
    }

    async readFile(_fileName) {
        throw new Error(`readFile not implemented in ${this.name}`);
    }
}

class LocalStorageProvider extends BaseStorageProvider {
    constructor() {
        super('LocalStorageProvider');
    }

    async saveFile(fileName, buffer) {
        const safeName = sanitizeFileName(fileName);
        const filePath = path.join(LOCAL_STORAGE_DIR, safeName);

        if (!filePath.startsWith(LOCAL_STORAGE_DIR)) {
            throw new Error('Security Violation: Invalid file path traversal detected.');
        }

        fs.writeFileSync(filePath, buffer);
        const checksum = hashString(buffer);

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
        const filePath = path.join(LOCAL_STORAGE_DIR, safeName);

        if (!filePath.startsWith(LOCAL_STORAGE_DIR) || !fs.existsSync(filePath)) {
            throw new Error('Document file not found or path invalid.');
        }

        return fs.readFileSync(filePath);
    }
}

class CloudStorageProvider extends BaseStorageProvider {
    constructor(config = {}) {
        super('CloudStorageProvider');
        this.bucket = config.bucket || 'banaras-yatra-docs';
        this.inMemoryCloudStore = new Map();
    }

    async saveFile(fileName, buffer) {
        const safeName = sanitizeFileName(fileName);
        const checksum = hashString(buffer);
        
        // Mock cloud object storage write
        this.inMemoryCloudStore.set(safeName, buffer);

        return {
            storageProvider: this.name,
            storagePath: `gs://${this.bucket}/${safeName}`,
            fileName: safeName,
            checksum,
            fileSize: buffer.length
        };
    }

    async readFile(fileName) {
        const safeName = sanitizeFileName(fileName);
        if (this.inMemoryCloudStore.has(safeName)) {
            return this.inMemoryCloudStore.get(safeName);
        }
        throw new Error(`File ${safeName} not found in Cloud Storage bucket ${this.bucket}.`);
    }
}

let activeStorageProvider = new LocalStorageProvider();

function setStorageProvider(provider) {
    activeStorageProvider = provider;
}

function getStorageProvider() {
    return activeStorageProvider;
}

// Helper functions for backward compatibility
async function saveDocumentFile(fileName, buffer) {
    return await activeStorageProvider.saveFile(fileName, buffer);
}

function readDocumentFile(fileName) {
    const safeName = sanitizeFileName(fileName);
    const filePath = path.join(LOCAL_STORAGE_DIR, safeName);
    if (filePath.startsWith(LOCAL_STORAGE_DIR) && fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
    }
    return activeStorageProvider.readFile(fileName);
}

module.exports = {
    BaseStorageProvider,
    LocalStorageProvider,
    CloudStorageProvider,
    setStorageProvider,
    getStorageProvider,
    saveDocumentFile,
    readDocumentFile,
    LOCAL_STORAGE_DIR
};
