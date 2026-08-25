# 🚀 Varanasi Yatra Travel OS — Staging & Production Deployment Runbook

## 1. System Architecture

The Varanasi Yatra Travel Operating System follows a decoupled, cloud-ready architecture:

```
[ Client Browser / Admin Dashboard ]
                │
                │ HTTPS / JSON Web Tokens
                ▼
      ┌──────────────────┐
      │  Vite + React    │ (Static Frontend SPA on Vercel / Cloudflare Pages)
      └─────────┬────────┘
                │ API Requests (CORS Guarded)
                ▼
      ┌──────────────────┐
      │  Express API     │ (Node.js 18+ Backend / Google Cloud Run / Container)
      └─────────┬────────┘
                │
      ┌─────────┴──────────────┬────────────────────────┬─────────────────────┐
      ▼                        ▼                        ▼                     ▼
┌──────────────┐     ┌───────────────────┐    ┌──────────────────┐   ┌───────────────────┐
│ MongoDB Atlas│     │  Storage Manager  │    │ Automation Engine│   │ Document Engine   │
│ (Replica Set)│     │  (Local / GCS/S3) │    │ (WhatsApp/Email) │   │ (PDFKit Invoices) │
└──────────────┘     └───────────────────┘    └──────────────────┘   └───────────────────┘
```

---

## 2. Environment Architecture & Configuration Variables

The system supports 4 distinct execution tiers:
- **`development`**: Local development with auto-reloading and optional fallbacks for third-party integrations.
- **`test`**: Completely isolated in-memory test runner (`MongoMemoryServer`) that blocks calls to production databases and real external messaging providers.
- **`staging`**: Mirror of production topology with sandbox messaging accounts, staging Atlas database, and strict credential verification.
- **`production`**: Live production environment with enforced 32+ character secrets, strict origin lists, and automated observability.

### Required Environment Variables

| Variable | Tier | Description | Example / Required Format |
|---|---|---|---|
| `NODE_ENV` | All | Application runtime environment | `development` \| `test` \| `staging` \| `production` |
| `PORT` | All | HTTP server listening port | `5001` |
| `API_BASE_URL` | All | Public backend API URL | `https://staging-api.varanasiyatra.com` |
| `FRONTEND_URL` | All | Client web application URL | `https://staging.varanasiyatra.com` |
| `ALLOWED_ORIGINS` | Staging/Prod | Comma-separated list of allowed CORS domains | `https://staging.varanasiyatra.com,https://varanasi-yatra.vercel.app` |
| `JWT_SECRET` | Staging/Prod | HMAC SHA-256 access token signing key (>= 32 chars) | `staging_secret_key_minimum_32_characters_long` |
| `JWT_REFRESH_SECRET` | Staging/Prod | Refresh token signing key (>= 32 chars) | `staging_refresh_secret_key_minimum_32_chars` |
| `JWT_ACCESS_EXPIRES_IN` | All | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | All | Refresh token lifespan | `7d` |
| `MONGODB_URI` | All | MongoDB connection string (Replica set / Atlas) | `mongodb+srv://user:pass@cluster.mongodb.net/varanasi_yatra_staging` |
| `MONGO_MAX_POOL_SIZE` | Staging/Prod | Mongoose connection pool maximum size | `10` |
| `MONGO_MIN_POOL_SIZE` | Staging/Prod | Mongoose connection pool minimum idle size | `2` |
| `AUTOMATION_ENABLED` | All | Master switch for event-driven workflows | `true` \| `false` |
| `NOTIFICATION_PROVIDER` | All | Provider class for notifications | `ConsoleProvider` \| `ProductionProvider` |
| `STORAGE_PROVIDER` | All | Document and file storage backend | `LocalStorageProvider` \| `CloudStorageProvider` |
| `CLOUD_STORAGE_BUCKET` | Prod (Opt) | Cloud storage bucket name (if using CloudStorage) | `varanasi-yatra-staging-documents` |
| `META_WHATSAPP_ACCESS_TOKEN` | Staging/Prod | Meta WhatsApp Cloud API access token | `EAAG...` (Sandbox token for staging) |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Staging/Prod | Meta WhatsApp phone number ID | `100111222333444` |
| `SMTP_HOST` | Staging/Prod | SMTP mail server hostname | `smtp.mailtrap.io` (Staging) \| `smtp.sendgrid.net` (Prod) |
| `SMTP_PORT` | Staging/Prod | SMTP mail server port | `2525` (Mailtrap) \| `587` (TLS) |
| `SMTP_USER` | Staging/Prod | SMTP authentication username | `apikey` \| `username` |
| `SMTP_PASSWORD` | Staging/Prod | SMTP authentication password / API key | `secret_password` |
| `LOG_LEVEL` | All | Application logging verbosity | `info` \| `debug` \| `warn` |

---

## 3. Local Development Guidelines

1. **Install Dependencies**:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```
2. **Setup Local Environment**:
   ```bash
   cp .env.example .env
   ```
3. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
4. **Start Frontend Client**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 4. Test Environment Isolation

To ensure tests never affect staging or production:
1. All automated integration tests run with `NODE_ENV=test`.
2. Master certification runner dynamically provisions an ephemeral `MongoMemoryServer`.
3. The environment validator (`backend/config/env.js`) actively blocks connection attempts to `mongodb+srv` or production database names during test runs.
4. Notifications in test default to `ConsoleProvider` without sending live WhatsApp or Email dispatches.

---

## 5. Staging Deployment: Step-by-Step Runbook

### Step 1: Provision Staging Infrastructure
1. Create a dedicated **MongoDB Atlas Staging Cluster** (M0/M10 Tier).
2. Create database user with `readWrite` permissions on database `varanasi_yatra_staging`.
3. Configure IP access list / VPC peering for your staging compute environment.

### Step 2: Configure Staging Environment Variables
1. In your cloud deployment platform (e.g. Cloud Run, Vercel, Render, Railway, or VM):
   ```bash
   NODE_ENV=staging
   PORT=5001
   API_BASE_URL=https://staging-api.varanasiyatra.com
   FRONTEND_URL=https://staging.varanasiyatra.com
   ALLOWED_ORIGINS=https://staging.varanasiyatra.com,https://varanasi-yatra.vercel.app
   JWT_SECRET=<32+ Character Staging Secret>
   JWT_REFRESH_SECRET=<32+ Character Staging Refresh Secret>
   MONGODB_URI=mongodb+srv://staging_user:<pass>@staging-cluster.mongodb.net/varanasi_yatra_staging?retryWrites=true&w=majority
   AUTOMATION_ENABLED=true
   NOTIFICATION_PROVIDER=ConsoleProvider
   STORAGE_PROVIDER=LocalStorageProvider
   ```

### Step 3: Run Pre-Flight Readiness Validation
Execute the automated staging and deployment check:
```bash
node scripts/deploy-check.js
node backend/scripts/preflightProduction.js
```

### Step 4: Build and Deploy Backend Container / Process
```bash
# Verify backend syntax
node --check backend/server.js
node --check backend/functions/index.js

# Start backend service
npm start --prefix backend
```

### Step 5: Build and Deploy Frontend Client
```bash
# Build frontend with staging API base URL
VITE_API_BASE_URL=https://staging-api.varanasiyatra.com npm run build
```

### Step 6: Post-Deployment Smoke Verification
1. **Liveness Check**:
   ```bash
   curl -i https://staging-api.varanasiyatra.com/health
   # Expected: HTTP 200 {"status":"ok"}
   ```
2. **Readiness Check**:
   ```bash
   curl -i https://staging-api.varanasiyatra.com/ready
   # Expected: HTTP 200 {"status":"READY","database":"CONNECTED","environment":"staging","storage":"READY"}
   ```
3. **Database Index Audit**:
   Execute the non-destructive index creator on the staging database:
   ```bash
   node -e "require('./backend/config/indexes').ensureProductionIndexes()"
   ```

---

## 6. Production Preparation Checklist

Before promoting from Staging to Production:
- [ ] Ensure `NODE_ENV=production`.
- [ ] Provision MongoDB Atlas multi-node replica set with automated daily backups enabled.
- [ ] Configure live Meta WhatsApp Business API credentials (`META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`).
- [ ] Configure live SMTP credentials (e.g. SendGrid / AWS SES with SPF/DKIM verified).
- [ ] Generate distinct, cryptographically strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (>= 64 chars recommended).
- [ ] Lock down `ALLOWED_ORIGINS` to the exact production domain(s).
- [ ] Configure Cloud Storage bucket (GCS / S3) if using `CloudStorageProvider`.
- [ ] Enable SSL/TLS termination with HTTP Strict Transport Security (`HSTS`).

---

## 7. Rollback Strategy

If an unexpected regression or infrastructure failure occurs post-deployment:

```
Step 1: Identify Failure & Trigger Incident
                  ↓
Step 2: Revert to Previous Release Artifact / Git Tag
                  ↓
Step 3: Redeploy Previous Backend & Frontend Versions
                  ↓
Step 4: Verify Liveness (/health) and Readiness (/ready)
                  ↓
Step 5: Verify Database State & Compatibility
                  ↓
Step 6: Confirm Smoke Tests Pass & Resume Traffic
```

### Execution Steps:
1. **Frontend Rollback**:
   - In Vercel / CDN provider: Promote the previous successful deployment instantly via Instant Rollback.
2. **Backend Rollback**:
   - Re-deploy the previous container image tag or release commit.
   - Verify health: `curl -f https://api.varanasiyatra.com/ready`.
3. **Database Verification**:
   - The database schema additions are non-destructive and backward-compatible with previous versions.
   - If data corruption occurred, restore from the latest snapshot using `node scripts/backup-db.js` / Atlas automated backup restore point.
4. **Post-Rollback Audit**:
   - Inspect `/admin/system/health` telemetry as CEO.
   - Check error logs for lingering connection rejections.
