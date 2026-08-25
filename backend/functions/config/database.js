const mongoose = require('mongoose');
const { sanitizeMongoUri } = require('./env');

let isConnected = false;
let connectionAttempts = 0;

const RETRY_INTERVAL_MS = 2000;

/**
 * Connect to MongoDB with production-ready options & retry mechanism
 */
async function connectDatabase(customUri = null) {
    connectionAttempts = 0;

    if (isConnected && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (mongoose.connection.readyState !== 0) {
        try {
            await mongoose.disconnect();
        } catch { /* ignore */ }
    }

    const mongoUri = customUri || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/varanasi_yatra';
    const sanitizedUri = sanitizeMongoUri(mongoUri);
    const isProduction = process.env.NODE_ENV === 'production';
    const isStaging = process.env.NODE_ENV === 'staging';
    const isTest = process.env.NODE_ENV === 'test';
    const maxRetries = (isProduction || isStaging) ? 5 : 1;
    const timeoutMs = (isProduction || isStaging) ? 5000 : (isTest ? 2000 : 1000);

    const mongooseOptions = {
        maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
        minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 2,
        serverSelectionTimeoutMS: timeoutMs,
        socketTimeoutMS: 45000,
        autoIndex: !(isProduction || isStaging)
    };

    while (connectionAttempts < maxRetries) {
        try {
            connectionAttempts++;
            console.log(`🔌 [Database] Connecting to MongoDB (Attempt ${connectionAttempts}/${maxRetries}): ${sanitizedUri}...`);
            
            const conn = await mongoose.connect(mongoUri, mongooseOptions);
            isConnected = true;
            console.log(`✅ [Database] MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
            
            // Set up connection event listeners
            mongoose.connection.on('error', (err) => {
                console.error('❌ [Database] MongoDB Connection Error:', err.message);
                isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️ [Database] MongoDB Disconnected. Ready state changed.');
                isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                console.log('🔄 [Database] MongoDB Reconnected Successfully.');
                isConnected = true;
            });

            return conn.connection;
        } catch (error) {
            console.error(`❌ [Database] Failed connection attempt ${connectionAttempts}: ${error.message}`);
            if (connectionAttempts >= maxRetries) {
                if (isProduction || isStaging) {
                    console.error('💥 [Database] Max database connection retries reached. Shutting down in production/staging.');
                    process.exit(1);
                } else {
                    console.warn('⚠️ [Database] Could not connect to MongoDB in development/test. Continuing without active DB.');
                    return null;
                }
            }
            await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
        }
    }
    return null;
}

/**
 * Get current DB connection health status & metrics
 */
async function getDatabaseHealth() {
    const readyStateMap = {
        0: 'DISCONNECTED',
        1: 'CONNECTED',
        2: 'CONNECTING',
        3: 'DISCONNECTING'
    };

    const state = mongoose.connection.readyState;
    const status = readyStateMap[state] || 'UNKNOWN';

    let pingLatencyMs = null;
    if (state === 1 && mongoose.connection.db) {
        const start = Date.now();
        try {
            await mongoose.connection.db.admin().ping();
            pingLatencyMs = Date.now() - start;
        } catch {
            pingLatencyMs = -1;
        }
    }

    return {
        isConnected: state === 1,
        status,
        readyState: state,
        pingLatencyMs,
        host: mongoose.connection.host || 'N/A',
        name: mongoose.connection.name || 'N/A'
    };
}

/**
 * Disconnect MongoDB cleanly on application shutdown
 */
async function disconnectDatabase() {
    if (mongoose.connection.readyState !== 0) {
        console.log('🔌 [Database] Closing MongoDB connection gracefully...');
        await mongoose.connection.close();
        isConnected = false;
        console.log('✅ [Database] MongoDB connection closed.');
    }
}

module.exports = {
    connectDatabase,
    getDatabaseHealth,
    disconnectDatabase,
    sanitizeMongoUri
};
