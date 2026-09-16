# Production Environment & Database Deployment Guide

## 1. Overview & Architecture

The Varanasi Yatra project uses a dedicated, isolated production database architecture to guarantee zero data contamination, absolute privacy, and uncompromised security.

### Dedicated Production MongoDB Cluster
- **Atlas Project:** Kashi-Vashi Production
- **Cluster Name:** `kashi-vashi-prod`
- **Database Name:** `kashiVashiDB_prod`
- **Database User:** `kashivashi_app`
- **Connection Format:**
  ```bash
  mongodb+srv://kashivashi_app:<db_password>@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod?appName=kashi-vashi-prod
  ```
- **Isolation Policy:** 
  - The development / staging cluster (`Cluster0 / varanasiYatraDB`) remains active for local developer testing and automated integration tests.
  - The production cluster (`kashi-vashi-prod / kashiVashiDB_prod`) starts 100% clean with zero mock or test records.
  - Automated test suites contain strict safety guards preventing execution against `kashi-vashi-prod` or `kashiVashiDB_prod`.

---

## 2. Required Production Environment Variables

### A. Backend Variables (Configure in Google Cloud Run Console)

| Variable Name | Required? | Example / Format | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **YES** | `production` | Enforces production mode, rate limits, error masking, CORS lockdown |
| `PORT` | **YES** | `8080` (or `5001`) | Listening port for Cloud Run container |
| `MONGODB_URI` | **YES** | `mongodb+srv://kashivashi_app:<db_password>@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod?appName=kashi-vashi-prod` | Dedicated production database connection string |
| `JWT_SECRET` | **YES** | Minimum 32 random characters | HMAC signing key for user access tokens |
| `JWT_REFRESH_SECRET` | **YES** | Minimum 32 random characters | HMAC signing key for user refresh tokens |
| `CEO_INITIAL_PASSWORD` | **YES** | Strong random password | Initial password for the seeded CEO account (`ceo@banarasyatra.com`) |
| `MANAGER_INITIAL_PASSWORD` | **YES** | Strong random password | Initial password for the seeded Manager account (`manager@banarasyatra.com`) |
| `ALLOWED_ORIGINS` | **YES** | `https://varanasiyatra.com,https://www.varanasiyatra.com,https://admin.varanasiyatra.com,https://varanasi-yatra.vercel.app` | Comma-separated list of authorized domains |
| `LOG_LEVEL` | NO | `info` | Logging verbosity (`info` or `warn`) |
| `EMAIL_USER` | NO | `info.varanasi.yatra@gmail.com` | SMTP email dispatch user (optional at launch) |
| `EMAIL_PASS` | NO | App-specific password | SMTP email dispatch secret (optional at launch) |
| `HUNTER_SEARCH_API_KEY` | NO | SerpApi / Search API key | Required only when live AI Hunter prospect search is used |

### B. Frontend Variables (Configure in Vercel Project Settings)

| Variable Name | Required? | Value | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **YES** | `https://api-gzo7qrxiuq-uc.a.run.app` (or custom API domain) | Target backend API endpoint for all CRM and public queries |

---

## 3. Production Safety Invariants

1. **No Hardcoded Secrets:** Connection strings and passwords must never be added to code repositories, commits, or frontend bundles.
2. **Strict Startup Validation:** The backend automatically aborts startup if `NODE_ENV=production` and any of `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CEO_INITIAL_PASSWORD`, or `MANAGER_INITIAL_PASSWORD` are missing.
3. **CORS Guarantee:** Requests from `https://varanasiyatra.com` and `https://www.varanasiyatra.com` are guaranteed to be permitted. Wildcards (`*`) and localhost are strictly blocked in production.
4. **Zero Test Data Seeding:** The production database will only seed the initial administrative accounts (`CEO` and `Manager`) upon initial boot. No test leads, fake vendors, mock bookings, or test quotes are created.

---

## 4. Step-by-Step Manual Deployment Guide (Execute When Ready to Deploy)

### Step 1: MongoDB Atlas User Setup
1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com).
2. Open Project **Kashi-Vashi Production** and Cluster **kashi-vashi-prod**.
3. Under **Database Access**, verify Database User `kashivashi_app` exists with read/write access to `kashiVashiDB_prod`.
4. Generate a strong password for `kashivashi_app`.
5. Under **Network Access**, ensure Cloud Run outbound IP addresses (or `0.0.0.0/0` with Atlas password authentication) are allowed.

### Step 2: Cloud Run Configuration
1. Open Google Cloud Console -> **Cloud Run** -> Select your backend service.
2. Click **Edit & Deploy New Revision**.
3. Navigate to **Variables & Secrets** and add the required environment variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://kashivashi_app:<your_password>@kashi-vashi-prod.omlaknp.mongodb.net/kashiVashiDB_prod?appName=kashi-vashi-prod`
   - `JWT_SECRET`: `<32_char_random_secret>`
   - `JWT_REFRESH_SECRET`: `<32_char_random_secret>`
   - `CEO_INITIAL_PASSWORD`: `<strong_random_password>`
   - `MANAGER_INITIAL_PASSWORD`: `<strong_random_password>`
   - `ALLOWED_ORIGINS`: `https://varanasiyatra.com,https://www.varanasiyatra.com,https://admin.varanasiyatra.com,https://varanasi-yatra.vercel.app`
4. Deploy the revision. Check Cloud Run logs to confirm successful startup:
   ```
   ✅ [Database] MongoDB Connected Successfully: .../kashiVashiDB_prod
   🚩 Database Seed: CEO User initialized successfully!
   🚩 Database Seed: Manager User initialized successfully!
   🚀 Production Operating System active on port 8080
   ```

### Step 3: Vercel Project Configuration
1. Open Vercel Dashboard -> Select `varanasi-yatra` project.
2. Go to **Settings** -> **Environment Variables**.
3. Add `VITE_API_BASE_URL` with value `https://api-gzo7qrxiuq-uc.a.run.app` for Production, Preview, and Development.
4. Trigger a new deployment or push a production release tag.
