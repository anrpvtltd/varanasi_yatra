# =========================================================================
# VARANASI YATRA TRAVEL OPERATING SYSTEM — PRODUCTION DEPLOYMENT RUNBOOK
# =========================================================================

## 1. Recommended Architecture

For a dedicated, cost-effective, and highly reliable deployment for Varanasi Yatra, the recommended production architecture is **Option B (Single VPS + Docker Compose + Managed MongoDB Atlas)**.

```
                            [ Public Internet ]
                                     │
                                     ▼
                      [ Domain + Automated HTTPS (443) ]
                                     │
                                     ▼
                     [ Caddy / Nginx Reverse Proxy ]
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
             [ React SPA ]                    [ Node.js API ]
           Production Static                Express Container
           (via Nginx/Caddy)                (Port 5001 inside)
                                                      │
                                                      ├─ Structured Logs (X-Request-ID)
                                                      ├─ JWT Auth & Role RBAC
                                                      ├─ PDF & Voucher Generator
                                                      └─ Automation Engine (WhatsApp/Email)
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                                    [ MongoDB Atlas ]                  [ Host Volume Mount ]
                                   (Managed ReplicaSet)                 /app/backend/uploads
                                            │                            (Documents & PDFs)
                                            ▼
                                   [ Automated Daily ]
                                   [ Backup Snapshots ]
```

### Why Option B over Option A or C:
* **Over Option A (PaaS like Render/Vercel):** Local PDF generation and file attachments need a persistent POSIX filesystem volume. Pure serverless platforms wipe ephemeral disk storage on container restarts or cold starts. Option B provides durable local volume mounts (`/app/backend/uploads`) without requiring complex cloud bucket configurations on Day 1.
* **Over Option C (Self-hosted MongoDB on VPS):** Self-hosting MongoDB on the same VPS risks database corruption if the server runs out of memory (OOM), and requires manual replica set configuration and oplog management. MongoDB Atlas M0 (Free) or M10 ($0.08/hr) offloads replication, automated daily snapshots, point-in-time recovery, and security patches to MongoDB's managed cloud infrastructure.

---

## 2. Infrastructure Required

| Resource | Recommended Provider | Specification | Estimated Monthly Cost |
|---|---|---|---|
| **VPS Server** | Hetzner Cloud / DigitalOcean / Linode | 2 vCPU, 4GB RAM, 40GB SSD (Ubuntu 24.04 LTS) | ~$6 – $12 / month (₹500 – ₹1,000) |
| **Database** | MongoDB Atlas | ReplicaSet Cluster (M0 Free Tier or M10 dedicated) | $0 (M0) or ~$57 (M10) |
| **Domain & DNS** | Cloudflare / Namecheap / GoDaddy | Standard DNS with Proxy or Direct CNAME/A Record | ~$10 / year (₹800/yr) |
| **Reverse Proxy / TLS** | Caddy Server (Built-in) or Nginx + Certbot | Automated Let's Encrypt TLS Issuance | $0 (Free) |
| **WhatsApp API** | Meta Graph Cloud API | Official WhatsApp Business Account | Free Tier (first 1,000 service conv/mo) |
| **Email SMTP** | SendGrid / AWS SES / Brevo / Gmail SMTP | Transactional Email Delivery | $0 (Free tier up to 100-300 emails/day) |

---

## 3. Environment Variables Matrix

### Backend Variables (`.env.production`)

| Variable | Required | Environment | Purpose | Secret? | Example Value |
|---|---|---|---|---|---|
| `NODE_ENV` | **YES** | Backend | Runtime mode | No | `production` |
| `PORT` | **YES** | Backend | Internal listening port | No | `5001` |
| `API_BASE_URL` | **YES** | Backend | Canonical backend URL | No | `https://api.varanasiyatra.com` |
| `FRONTEND_URL` | **YES** | Backend | Canonical frontend URL | No | `https://admin.varanasiyatra.com` |
| `ALLOWED_ORIGINS` | **YES** | Backend | Strict CORS allowed origins | No | `https://admin.varanasiyatra.com,https://varanasiyatra.com` |
| `MONGODB_URI` | **YES** | Backend | MongoDB Atlas connection string | **YES** | `mongodb+srv://admin:pass@cluster0.mongodb.net/varanasi_yatra_prod?retryWrites=true&w=majority` |
| `JWT_SECRET` | **YES** | Backend | HS256 Access Token Secret (min 32 chars) | **YES** | `super_secure_production_access_secret_32_chars_min` |
| `JWT_REFRESH_SECRET` | **YES** | Backend | HS256 Refresh Token Secret (min 32 chars) | **YES** | `super_secure_production_refresh_secret_32_chars_min` |
| `JWT_ACCESS_EXPIRES_IN` | NO | Backend | Access token lifespan | No | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | NO | Backend | Refresh token lifespan | No | `7d` |
| `AUTOMATION_ENABLED` | **YES** | Backend | Enable event-driven automation | No | `true` |
| `NOTIFICATION_PROVIDER` | **YES** | Backend | Provider driver (`ProductionProvider`) | No | `ProductionProvider` |
| `META_WHATSAPP_ACCESS_TOKEN` | OPTIONAL | Backend | Meta Graph API access token | **YES** | `EAAG...` |
| `META_WHATSAPP_PHONE_NUMBER_ID`| OPTIONAL | Backend | WhatsApp Phone Number ID | No | `1006543210` |
| `EMAIL_PROVIDER` | **YES** | Backend | Email driver (`SMTP`) | No | `SMTP` |
| `SMTP_HOST` | **YES** | Backend | SMTP Server Host | No | `smtp.sendgrid.net` |
| `SMTP_PORT` | **YES** | Backend | SMTP Port | No | `587` |
| `SMTP_USER` | **YES** | Backend | SMTP Username / API Key | **YES** | `apikey` |
| `SMTP_PASSWORD` | **YES** | Backend | SMTP Password / Key Secret | **YES** | `SG.production_key` |
| `EMAIL_FROM` | **YES** | Backend | Sender Email Address | No | `support@varanasiyatra.com` |
| `STORAGE_PROVIDER` | **YES** | Backend | Storage engine (`LocalStorageProvider`) | No | `LocalStorageProvider` |
| `STORAGE_LOCAL_PATH` | **YES** | Backend | Path to document upload folder | No | `/app/backend/uploads/documents` |
| `LOG_LEVEL` | NO | Backend | Logging verbosity | No | `info` |

### Frontend Variables (`.env.production` in root before build)

| Variable | Required | Environment | Purpose | Secret? | Example Value |
|---|---|---|---|---|---|
| `VITE_API_BASE_URL` | **YES** | Frontend | Base URL for REST API requests | No | `https://api.varanasiyatra.com` |

---

## 4. Database Setup (MongoDB Atlas)

### Manual Operator Prerequisites:
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a new Project: `Varanasi Yatra Production`.
3. Deploy a Database:
   - **Cluster Tier:** `M0` (Free for staging/testing) or `M10` (Dedicated for production).
   - **Region:** `aws / ap-south-1 (Mumbai)` for minimal latency in India.
4. Security Configuration:
   - **Database Access:** Create user `vy_admin` with password and role `readWriteAnyDatabase`.
   - **Network Access:** Add the VPS Public IP (e.g. `203.0.113.50/32`) to the IP Access List.
5. Retrieve Connection String:
   ```
   mongodb+srv://vy_admin:<PASSWORD>@cluster0.abcde.mongodb.net/varanasi_yatra_prod?retryWrites=true&w=majority
   ```

### Automated Database Verification:
Once the connection string is pasted into `.env.production`:
```bash
node scripts/backup/backup-database.cjs
```
This verifies connection and creates the baseline collections and indexes.

---

## 5. Docker Deployment

### Automated Deployment Commands on VPS:

```bash
# 1. Clone or pull the repository on the VPS
git clone https://github.com/avaneeshkumar/varanasi_yatra.git /opt/varanasi_yatra
cd /opt/varanasi_yatra

# 2. Copy the production environment file
cp .env.production.example .env.production
nano .env.production # Fill in real secrets

# 3. Build and launch with Docker Compose
docker compose -f docker-compose.production.yml up -d --build

# 4. Verify running container and healthcheck
docker compose -f docker-compose.production.yml ps
docker logs -f varanasi_yatra_production_app
```

---

## 6. Reverse Proxy Setup (Caddy / Nginx)

### Method A: Caddy (Recommended — Automatic HTTPS)

```bash
# 1. Install Caddy on Ubuntu
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# 2. Copy Caddyfile to /etc/caddy/Caddyfile
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile

# 3. Reload Caddy
sudo systemctl reload caddy
```

### Method B: Nginx + Certbot

```bash
# 1. Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Copy Nginx configuration
sudo cp deploy/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx

# 3. Obtain TLS Certificates
sudo certbot --nginx -d api.varanasiyatra.com -d admin.varanasiyatra.com -d varanasiyatra.com
```

---

## 7. Domain Connection

### Manual Operator DNS Configuration:

In your DNS manager (Cloudflare / Namecheap / GoDaddy), configure these records:

| Record Type | Host / Name | Value / Destination | TTL | Proxy Status |
|---|---|---|---|---|
| **A** | `api` | `YOUR_VPS_PUBLIC_IP` | Auto / 300 | DNS Only (or Proxied) |
| **A** | `admin` | `YOUR_VPS_PUBLIC_IP` | Auto / 300 | DNS Only (or Proxied) |
| **A** | `@` (root) | `YOUR_VPS_PUBLIC_IP` | Auto / 300 | DNS Only (or Proxied) |

---

## 8. HTTPS Setup

* If using **Caddy**: HTTPS is 100% automated upon pointing DNS records to the server. Caddy automatically requests, verifies, and renews TLS certificates.
* If using **Nginx**: Let's Encrypt certificates are automatically renewed via systemd timer `certbot.timer`.

---

## 9. Production Smoke Test

Once the domain and reverse proxy are active, execute the automated 10-point staging smoke test against the live URL:

```bash
# Run smoke test against the live production endpoint
STAGING_API_URL="https://api.varanasiyatra.com" \
STAGING_FRONTEND_URL="https://admin.varanasiyatra.com" \
node scripts/staging-smoke-test.js
```

### Expected Output:
```
==================================================
  STAGING & PRODUCTION SMOKE TEST RUNNER
==================================================
  [Probe 1/10] DNS & Network Reachability       : PASS (142ms)
  [Probe 2/10] /health Public Liveness          : PASS (200 OK)
  [Probe 3/10] /ready Dependency Readiness      : PASS (200 READY)
  [Probe 4/10] HTTPS & TLS Handshake            : PASS (Valid TLS)
  [Probe 5/10] Authentication Route Guard       : PASS (401/400 Handled)
  [Probe 6/10] Protected Metrics Security       : PASS (401 Unauthorized)
  [Probe 7/10] Live Database Connectivity       : PASS (MongoDB Connected)
  [Probe 8/10] Strict CORS Header Enforcement   : PASS (Matched Origin)
  [Probe 9/10] Correlation ID Propagation       : PASS (X-Request-ID Present)
  [Probe 10/10] Error Stack Trace Leak Guard    : PASS (Zero Leaks)
==================================================
  VERDICT: PRODUCTION DEPLOYMENT VERIFIED (10/10 PASS)
==================================================
```

---

## 10. Backup Schedule

### Automated Cron Backup Configuration:

Add to VPS crontab (`crontab -e`):

```bash
# Daily MongoDB Backup at 02:00 AM UTC with 14-day retention
0 2 * * * cd /opt/varanasi_yatra && NODE_ENV=production node scripts/backup/backup-database.cjs >> /var/log/vy_backup.log 2>&1

# Weekly Backup Restoration Drill Verification every Sunday at 04:00 AM UTC
0 4 * * 0 cd /opt/varanasi_yatra && NODE_ENV=production node scripts/backup/verify-restore.cjs >> /var/log/vy_restore_verify.log 2>&1
```

---

## 11. Rollback Procedure

If a deployed build introduces an operational regression:

```bash
# Step 1: Revert Git repository to the previous verified commit
cd /opt/varanasi_yatra
git log --oneline -n 5
git checkout <PREVIOUS_STABLE_COMMIT_HASH>

# Step 2: Rebuild and restart the container
docker compose -f docker-compose.production.yml up -d --build

# Step 3: Run the smoke test immediately
STAGING_API_URL="https://api.varanasiyatra.com" node scripts/staging-smoke-test.js
```

---

## 12. Monitoring Checklist

* **Process Health:** Monitor `GET https://api.varanasiyatra.com/health` (Expect HTTP 200).
* **Dependency Health:** Monitor `GET https://api.varanasiyatra.com/ready` (Expect HTTP 200 `{"status":"READY","database":"CONNECTED"}`).
* **CEO Telemetry:** Inspect `GET https://api.varanasiyatra.com/admin/system/metrics` with CEO bearer token.
* **Server Disk Space:** Ensure `/app/backend/uploads` does not exceed 80% disk capacity (`df -h`).
* **Container Logs:** Inspect real-time structured logs:
  ```bash
  docker logs --tail 100 -f varanasi_yatra_production_app
  ```

---

## 13. Emergency Recovery

### Scenario: Complete Database Loss / Corruption
```bash
# 1. Locate the latest backup manifest in /opt/varanasi_yatra/backups/
ls -lt /opt/varanasi_yatra/backups/

# 2. Execute restore script pointing to the snapshot directory
node scripts/backup/restore-database.cjs /opt/varanasi_yatra/backups/backup-YYYY-MM-DDTHH-MM-SS

# 3. Verify restored data and relationship integrity
node scripts/backup/verify-restore.cjs /opt/varanasi_yatra/backups/backup-YYYY-MM-DDTHH-MM-SS
```

### Scenario: Container Crash Loop / Unresponsive Server
```bash
# 1. Restart container
docker compose -f docker-compose.production.yml restart app

# 2. Check health logs
curl -i http://localhost:5001/ready
```
