require('dotenv').config();

/**
 * Sanitize MongoDB URI to mask credentials in logs & telemetry
 * e.g. mongodb+srv://admin:secret123@cluster.mongodb.net -> mongodb+srv://***:***@cluster.mongodb.net
 */
function sanitizeMongoUri(uri) {
    if (!uri || typeof uri !== 'string') return 'N/A';
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
}

function validateEnvironment() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    const isStaging = nodeEnv === 'staging';
    const isTest = nodeEnv === 'test';
    const isProductionOrStaging = isProduction || isStaging;

    // 1. JWT Access Secret Check
    let jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        if (isProductionOrStaging) {
            console.error(`❌ CRITICAL SECURITY ERROR: JWT_SECRET is required in ${nodeEnv}!`);
            process.exit(1);
        } else {
            jwtSecret = 'dev_jwt_access_secret_banaras_yatra_2026_super_secure_key';
        }
    } else if (isProductionOrStaging && jwtSecret.length < 32) {
        console.error(`❌ CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long in ${nodeEnv}!`);
        process.exit(1);
    }

    // 2. JWT Refresh Secret Check
    let jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
        if (isProductionOrStaging) {
            console.error(`❌ CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET is required in ${nodeEnv}!`);
            process.exit(1);
        } else {
            jwtRefreshSecret = 'dev_jwt_refresh_secret_banaras_yatra_2026_super_secure_key';
        }
    } else if (isProductionOrStaging && jwtRefreshSecret.length < 32) {
        console.error(`❌ CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET must be at least 32 characters long in ${nodeEnv}!`);
        process.exit(1);
    }

    // 3. Allowed Origins
    const defaultOrigins = [
        'https://varanasi-yatra.vercel.app',
        'https://varanasiyatra-5z9orkhkw-avaneesh-kumars-projects-a6a2b18d.vercel.app',
        'https://varanasiyatra-q1e1vq4op-avaneesh-kumars-projects-a6a2b18d.vercel.app',
        'https://varanasiyatra-ebji3kvne-avaneesh-kumars-projects-a6a2b18d.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://localhost:5001'
    ];

    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
        : defaultOrigins;

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/varanasi_yatra';

    // Test safety guard: prevent accidental live production DB connection during tests
    if (isTest && (mongoUri.includes('varanasi_yatra_prod') || (mongoUri.includes('mongodb+srv') && !process.env.ALLOW_PROD_IN_TEST))) {
        console.error('❌ SAFETY GUARD: Automated test cannot connect to production MongoDB URI!');
        process.exit(1);
    }

    const storageProvider = process.env.STORAGE_PROVIDER || 'LocalStorageProvider';
    const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB) || 10;
    const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');
    const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return {
        isProduction,
        isStaging,
        isTest,
        isProductionOrStaging,
        nodeEnv,
        port: Number(process.env.PORT) || 5001,
        apiBaseUrl,
        frontendUrl,
        mongoUri,
        sanitizedMongoUri: sanitizeMongoUri(mongoUri),
        storageProvider,
        maxFileSizeMb,
        logLevel,
        jwtSecret,
        jwtRefreshSecret,
        jwtIssuer: 'VaranasiYatraCRM',
        jwtAudience: 'VaranasiYatraUsers',
        jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        allowedOrigins,
        automationEnabled: process.env.AUTOMATION_ENABLED !== 'false',
        notificationProvider: process.env.NOTIFICATION_PROVIDER || (isProductionOrStaging ? 'ProductionProvider' : 'ConsoleProvider')
    };
}

const env = validateEnvironment();

module.exports = {
    validateEnvironment,
    sanitizeMongoUri,
    env
};
