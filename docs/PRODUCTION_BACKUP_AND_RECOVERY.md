# Production Backup & Disaster Recovery Guide

## 1. Overview & Strategy

The **Varanasi Yatra Travel Operating System** data layer consists of:
1. **Primary Database**: MongoDB database containing Customers, Leads, Quotes, Bookings, Vendor Assignments, Payments, Expenses, and Automation Logs.
2. **File Attachments & Documents**: Generated PDF invoices, travel vouchers, identity proofs, and customer document files.

---

## 2. Backup Targets & Frequency

| Target Component | Storage Location | Recommended Frequency | Tool / Method |
| :--- | :--- | :--- | :--- |
| **MongoDB Database** | Local / MongoDB Atlas | Daily Automated Dump | `node scripts/backup-db.js` / Automated Atlas Snapshot |
| **Document Files** | `./uploads/documents` or Object Storage | Daily Sync | `rsync` / Cloud Storage Bucket Replication |

---

## 3. Creating Database Backups

### Development & Local Verification
To execute a database dump manually:

```bash
node scripts/backup-db.js
```

> **Note**: If `mongodump` CLI is not installed on your system PATH, the script will output `MONGODUMP_NOT_AVAILABLE` and exit safely without writing corrupted metadata.

### Verification of Backups
To verify backup folder integrity:

```bash
node scripts/verify-backup.js
```

---

## 4. Disaster Recovery & Restore Procedure

### Step 1: Prepare Database Instance
Ensure your target MongoDB database instance is active and accessible.

### Step 2: Restore MongoDB Dump
Execute the `mongorestore` CLI command pointing to your backup timestamp folder:

```bash
mongorestore --uri="mongodb+srv://<username>:<password>@cluster.mongodb.net/varanasi_yatra" --drop ./backups/mongodb-backup-2026-08-25T00-00-00-000Z
```

### Step 3: Verify Data Integrity
1. Run preflight checklist: `node backend/scripts/preflightProduction.js`
2. Run automated scenario tests: `node scratch/test_prompt8_integration.js`
3. Verify Customer, Lead, Booking, and Payment financial calculations match pre-disaster metrics.
