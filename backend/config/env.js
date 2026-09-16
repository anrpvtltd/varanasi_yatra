require('dotenv').config();

/**
 * Sanitize MongoDB URI to mask credentials in logs & telemetry
 * e.g. mongodb+srv://admin:secret123@cluster.mongodb.net -> mongodb+srv://***:***@cluster.mongodb.net
 */
function sanitizeMongoUri(uri) {
    if (!uri || typeof uri !== 'string') return 'N/A';
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
}

function validateEnvironment(customEnv = null) {
    const envSource = customEnv || process.env;
    const nodeEnv = envSource.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    const isStaging = nodeEnv === 'staging';
    const isTest = nodeEnv === 'test';
    const isProductionOrStaging = isProduction || isStaging;

    // 1. JWT Access Secret Check
    let jwtSecret = envSource.JWT_SECRET;
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
    let jwtRefreshSecret = envSource.JWT_REFRESH_SECRET;
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

    // 3. Initial Passwords Check (Production Safety: Predictable defaults forbidden)
    if (isProduction) {
        if (!envSource.CEO_INITIAL_PASSWORD || !envSource.MANAGER_INITIAL_PASSWORD) {
            console.error(`❌ CRITICAL SECURITY ERROR: CEO_INITIAL_PASSWORD and MANAGER_INITIAL_PASSWORD are required in production!`);
            process.exit(1);
        }
    }

    // 4. Allowed Origins
    const productionDomainOrigins = [
        'https://varanasiyatra.com',
        'https://www.varanasiyatra.com',
        'https://admin.varanasiyatra.com',
        'https://varanasi-yatra.vercel.app',
        'https://varanasiyatra-5z9orkhkw-avaneesh-kumars-projects-a6a2b18d.vercel.app',
        'https://varanasiyatra-q1e1vq4op-avaneesh-kumars-projects-a6a2b18d.vercel.app',
        'https://varanasiyatra-ebji3kvne-avaneesh-kumars-projects-a6a2b18d.vercel.app'
    ];

    const developmentOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://localhost:5001'
    ];

    let allowedOrigins;
    if (envSource.ALLOWED_ORIGINS) {
        const configured = envSource.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
        allowedOrigins = Array.from(new Set([...configured, 'https://varanasiyatra.com', 'https://www.varanasiyatra.com']));
    } else if (isProduction) {
        allowedOrigins = productionDomainOrigins;
    } else {
        allowedOrigins = [...productionDomainOrigins, ...developmentOrigins];
    }

    // 5. Database Connection URI Validation
    const rawMongoUri = envSource.MONGODB_URI || envSource.MONGO_URI;
    if (isProduction) {
        if (!rawMongoUri) {
            console.error('❌ CRITICAL SECURITY ERROR: MONGODB_URI environment variable is required in production!');
            process.exit(1);
        }
        if (rawMongoUri.includes('localhost') || rawMongoUri.includes('127.0.0.1')) {
            console.error('❌ CRITICAL SECURITY ERROR: Production MONGODB_URI cannot point to localhost/127.0.0.1!');
            process.exit(1);
        }
        if (!envSource.MONGODB_URI && envSource.MONGO_URI) {
            console.warn('⚠️ [Config] Using legacy MONGO_URI. Please configure MONGODB_URI in production.');
        }
        if (rawMongoUri.includes('cluster0') || rawMongoUri.includes('varanasiYatraDB')) {
            console.warn('⚠️ [Config] Detected legacy/dev database in production URI. Ensure target is kashi-vashi-prod/kashiVashiDB_prod.');
        }
    }
    const mongoUri = rawMongoUri || 'mongodb://localhost:27017/varanasi_yatra';

    // Test safety guard: prevent accidental live production DB connection during tests
    if (isTest && (mongoUri.includes('varanasi_yatra_prod') || mongoUri.includes('kashi-vashi-prod') || mongoUri.includes('kashiVashiDB_prod') || (mongoUri.includes('mongodb+srv') && !envSource.ALLOW_PROD_IN_TEST))) {
        console.error('❌ SAFETY GUARD: Automated test cannot connect to production MongoDB URI!');
        process.exit(1);
    }

    const storageProvider = envSource.STORAGE_PROVIDER || 'LocalStorageProvider';
    const maxFileSizeMb = Number(envSource.MAX_FILE_SIZE_MB) || 10;
    const logLevel = envSource.LOG_LEVEL || (isProduction ? 'info' : 'debug');
    const apiBaseUrl = envSource.API_BASE_URL || `http://localhost:${envSource.PORT || 5001}`;
    const frontendUrl = envSource.FRONTEND_URL || 'http://localhost:5173';

    return {
        isProduction,
        isStaging,
        isTest,
        isProductionOrStaging,
        nodeEnv,
        port: Number(envSource.PORT) || 5001,
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
        jwtAccessExpiresIn: envSource.JWT_ACCESS_EXPIRES_IN || '15m',
        jwtRefreshExpiresIn: envSource.JWT_REFRESH_EXPIRES_IN || '7d',
        allowedOrigins,
        automationEnabled: envSource.AUTOMATION_ENABLED !== 'false',
        notificationProvider: envSource.NOTIFICATION_PROVIDER || (isProductionOrStaging ? 'ProductionProvider' : 'ConsoleProvider')
    };
}

const env = validateEnvironment();

module.exports = {
    validateEnvironment,
    sanitizeMongoUri,
    env
};
