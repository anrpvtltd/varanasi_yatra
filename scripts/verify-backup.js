import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BACKUP_DIR } from './backup-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verify integrity of MongoDB backup folder
 */
export function verifyBackup(backupFolderPath = null) {
    let targetFolder = backupFolderPath;

    if (!targetFolder) {
        if (!fs.existsSync(BACKUP_DIR)) {
            console.error('❌ [Verify Backup] Backup directory does not exist.');
            return false;
        }

        const folders = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('mongodb-backup-'))
            .map(f => path.join(BACKUP_DIR, f))
            .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

        if (folders.length === 0) {
            console.error('❌ [Verify Backup] No MongoDB backup folders found.');
            return false;
        }

        targetFolder = folders[0];
    }

    console.log(`🔍 [Verify Backup] Inspecting backup target: ${targetFolder}...`);

    if (!fs.existsSync(targetFolder)) {
        console.error(`❌ [Verify Backup] Target backup folder does not exist: ${targetFolder}`);
        return false;
    }

    const files = fs.readdirSync(targetFolder, { recursive: true });
    if (files.length === 0) {
        console.error('❌ [Verify Backup] Backup folder is empty.');
        return false;
    }

    console.log(`✅ [Verify Backup PASS] Backup folder valid. Contains ${files.length} BSON/metadata file(s).`);
    return true;
}

if (process.argv[1] && process.argv[1].endsWith('verify-backup.js')) {
    const isValid = verifyBackup();
    process.exit(isValid ? 0 : 1);
}
