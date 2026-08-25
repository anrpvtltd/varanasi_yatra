const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { BACKUP_ROOT } = require('./backup-database');

/**
 * Execute native MongoDB document restore into target database
 */
async function performDatabaseRestore(backupFolderPath = null, targetMongoUri = null) {
    let backupDir = backupFolderPath;

    if (!backupDir) {
        if (!fs.existsSync(BACKUP_ROOT)) {
            throw new Error('BACKUP_DIR_NOT_FOUND: No backups directory found.');
        }

        const folders = fs.readdirSync(BACKUP_ROOT)
            .filter(f => f.startsWith('backup-'))
            .map(f => path.join(BACKUP_ROOT, f))
            .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

        if (folders.length === 0) {
            throw new Error('NO_BACKUP_AVAILABLE: No backup snapshot folders found.');
        }
        backupDir = folders[0];
    }

    const manifestPath = path.join(backupDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`INVALID_BACKUP: manifest.json missing in ${backupDir}`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const mongoUri = targetMongoUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/varanasi_yatra';

    console.log(`📥 [Restore] Restoring from ${backupDir} into database...`);
    const startTime = Date.now();

    const conn = await mongoose.createConnection(mongoUri).asPromise();
    const restoredSummary = {
        restoredCollections: {},
        totalRestoredRecords: 0
    };

    for (const [collName, meta] of Object.entries(manifest.collections)) {
        if (!meta.file) continue;
        const filePath = path.join(backupDir, meta.file);
        if (!fs.existsSync(filePath)) continue;

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const docs = JSON.parse(rawData);

        const coll = conn.collection(collName);
        // Clear target collection before restoring
        await coll.deleteMany({});

        if (docs.length > 0) {
            // Restore ObjectId instances
            const processedDocs = docs.map(doc => {
                if (doc._id && typeof doc._id === 'string' && doc._id.length === 24) {
                    try { doc._id = new mongoose.Types.ObjectId(doc._id); } catch {}
                }
                return doc;
            });
            await coll.insertMany(processedDocs);
        }

        restoredSummary.restoredCollections[collName] = docs.length;
        restoredSummary.totalRestoredRecords += docs.length;
        console.log(`  ✔ [${collName}] Restored ${docs.length} record(s)`);
    }

    await conn.close();
    const durationMs = Date.now() - startTime;

    console.log(`✅ [Restore Complete] Restored ${restoredSummary.totalRestoredRecords} record(s) in ${durationMs}ms.`);
    return {
        success: true,
        backupDir,
        restoredSummary,
        durationMs
    };
}

if (require.main === module) {
    performDatabaseRestore()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('❌ Restore Failed:', err);
            process.exit(1);
        });
}

module.exports = {
    performDatabaseRestore
};
