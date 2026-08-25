const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const BACKUP_ROOT = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_ROOT)) {
    fs.mkdirSync(BACKUP_ROOT, { recursive: true });
}

const CRITICAL_COLLECTIONS = [
    'users',
    'enquiries',
    'quotes',
    'bookings',
    'customer_payments',
    'vendor_payments',
    'automation_logs',
    'file_attachments',
    'documents'
];

/**
 * Execute native MongoDB document backup
 */
async function performDatabaseBackup(customMongoUri = null) {
    const mongoUri = customMongoUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/varanasi_yatra';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(BACKUP_ROOT, `backup-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    console.log(`📦 [Backup] Starting database backup to: ${backupDir}...`);
    const startTime = Date.now();

    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const manifest = {
        timestamp: new Date().toISOString(),
        backupDir,
        databaseName: conn.name,
        collections: {},
        totalRecords: 0
    };

    for (const collName of CRITICAL_COLLECTIONS) {
        try {
            const coll = conn.collection(collName);
            const docs = await coll.find({}).toArray();
            const jsonPath = path.join(backupDir, `${collName}.json`);
            
            fs.writeFileSync(jsonPath, JSON.stringify(docs, null, 2), 'utf-8');

            const checksum = crypto.createHash('sha256').update(JSON.stringify(docs)).digest('hex');
            manifest.collections[collName] = {
                count: docs.length,
                file: `${collName}.json`,
                checksum
            };
            manifest.totalRecords += docs.length;
            console.log(`  ✔ [${collName}] Exported ${docs.length} record(s)`);
        } catch (err) {
            console.warn(`  ⚠ [${collName}] Skipped or empty: ${err.message}`);
            manifest.collections[collName] = { count: 0, file: null, error: err.message };
        }
    }

    const manifestPath = path.join(backupDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    await conn.close();
    const durationMs = Date.now() - startTime;

    console.log(`✅ [Backup Complete] ${manifest.totalRecords} records backed up in ${durationMs}ms.`);
    return {
        success: true,
        backupDir,
        manifest,
        durationMs
    };
}

if (require.main === module) {
    performDatabaseBackup()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('❌ Backup Failed:', err);
            process.exit(1);
        });
}

module.exports = {
    performDatabaseBackup,
    CRITICAL_COLLECTIONS,
    BACKUP_ROOT
};
