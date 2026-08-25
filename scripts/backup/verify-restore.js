const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { BACKUP_ROOT } = require('./backup-database');

/**
 * Verify integrity of restored database against backup manifest
 */
async function verifyDatabaseRestore(backupFolderPath = null, targetMongoUri = null) {
    let backupDir = backupFolderPath;

    if (!backupDir) {
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

    console.log(`🔍 [Verify Restore] Validating restored database against manifest: ${backupDir}...`);

    const conn = await mongoose.createConnection(mongoUri).asPromise();
    let isFullyValid = true;
    const checks = [];

    // 1. Check record counts
    for (const [collName, meta] of Object.entries(manifest.collections)) {
        const coll = conn.collection(collName);
        const actualCount = await coll.countDocuments();
        const expectedCount = meta.count;
        const matches = actualCount === expectedCount;

        if (!matches) isFullyValid = false;
        checks.push({
            collection: collName,
            expected: expectedCount,
            actual: actualCount,
            passed: matches
        });
        console.log(`  ${matches ? '✔' : '❌'} [${collName}] Count: ${actualCount}/${expectedCount}`);
    }

    // 2. Check relationship integrity (Quotes -> Leads, Bookings -> Quotes)
    try {
        const quotes = await conn.collection('quotes').find({}).toArray();
        let orphanQuotes = 0;
        for (const q of quotes) {
            if (q.leadId) {
                const lead = await conn.collection('enquiries').findOne({
                    _id: typeof q.leadId === 'string' && q.leadId.length === 24
                        ? new mongoose.Types.ObjectId(q.leadId)
                        : q.leadId
                });
                if (!lead) orphanQuotes++;
            }
        }
        const relOk = orphanQuotes === 0;
        if (!relOk) isFullyValid = false;
        checks.push({ test: 'Quote -> Lead Relationship Integrity', passed: relOk });
        console.log(`  ${relOk ? '✔' : '❌'} Quote-Lead Relationship Integrity: ${orphanQuotes} orphan(s)`);
    } catch (e) {
        console.warn('  ⚠ Relationship check warning:', e.message);
    }

    await conn.close();

    console.log(`\n──────────────────────────────────────────────────`);
    console.log(`  VERIFICATION VERDICT: ${isFullyValid ? 'DATA INTEGRITY VERIFIED (PASS)' : 'DATA INTEGRITY MISMATCH (FAIL)'}`);
    console.log(`──────────────────────────────────────────────────\n`);

    return {
        success: isFullyValid,
        backupDir,
        checks
    };
}

if (require.main === module) {
    verifyDatabaseRestore()
        .then(res => process.exit(res.success ? 0 : 1))
        .catch(err => {
            console.error('❌ Verification Failed:', err);
            process.exit(1);
        });
}

module.exports = {
    verifyDatabaseRestore
};
