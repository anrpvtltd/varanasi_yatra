import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Execute MongoDB Backup via mongodump CLI
 * Throws explicit MONGODUMP_NOT_AVAILABLE error if tooling is missing
 */
function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFolder = path.join(BACKUP_DIR, `mongodb-backup-${timestamp}`);
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/varanasi_yatra';

    console.log(`📦 [Backup] Initiating MongoDB dump to: ${backupFolder}...`);

    try {
        execSync(`mongodump --version`, { stdio: 'ignore' });
    } catch {
        const errorMsg = 'MONGODUMP_NOT_AVAILABLE: mongodump CLI utility is not installed in the host system PATH. Cannot create database backup.';
        console.error(`❌ [Backup Failed] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    try {
        execSync(`mongodump --uri="${mongoUri}" --out="${backupFolder}"`, { stdio: 'inherit' });
        console.log(`✅ [Backup Success] MongoDB dump created at: ${backupFolder}`);
        return { success: true, path: backupFolder, timestamp };
    } catch (err) {
        console.error(`❌ [Backup Failure] Executing mongodump failed: ${err.message}`);
        throw err;
    }
}

if (process.argv[1] && process.argv[1].endsWith('backup-db.js')) {
    try {
        createBackup();
    } catch (e) {
        console.error('Backup CLI process exited with error:', e.message);
        process.exit(1);
    }
}

export {
    createBackup,
    BACKUP_DIR
};
