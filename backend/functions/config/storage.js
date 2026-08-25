const { validateEnvironment } = require('./env');
const env = validateEnvironment();

const storageConfig = {
    provider: env.storageProvider,
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads/documents',
    maxFileSizeMb: env.maxFileSizeMb,
    maxSizeBytes: env.maxFileSizeMb * 1024 * 1024,
    allowedMimeTypes: [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp'
    ],
    cloud: {
        bucket: process.env.CLOUD_STORAGE_BUCKET || '',
        region: process.env.CLOUD_STORAGE_REGION || 'ap-south-1',
        accessKey: process.env.CLOUD_STORAGE_ACCESS_KEY || '',
        secretKey: process.env.CLOUD_STORAGE_SECRET_KEY || ''
    }
};

module.exports = {
    storageConfig
};
