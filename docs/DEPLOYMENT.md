# Production Deployment Guide

The **Varanasi Yatra Travel Operating System** supports flexible, platform-agnostic deployment across standard cloud providers and self-hosted environments.

---

## 1. Supported Deployment Environments

```text
LOCAL DEVELOPMENT ➔ STAGING / TESTING ➔ PRODUCTION
```

- **Frontend**: Vercel, Firebase Hosting, AWS Amplify, Netlify, or Static Nginx.
- **Backend API**: Cloud Run, Render, Railway, VPS (Docker / PM2), or Firebase Functions.
- **Database**: Managed MongoDB Atlas or Self-Hosted MongoDB Container.
- **Storage**: Local Storage Provider or S3-compatible Cloud Object Storage.

---

## 2. Environment Setup & Configuration

Copy the production configuration template:

```bash
cp .env.production.example .env
```

Ensure the following variables are configured before deployment:
- `NODE_ENV=production`
- `PORT=5001`
- `JWT_SECRET` (minimum 32 characters)
- `JWT_REFRESH_SECRET` (minimum 32 characters)
- `MONGODB_URI` (MongoDB connection URI)
- `ALLOWED_ORIGINS` (Comma-separated production domains)

---

## 3. Pre-Flight Deployment Validation

Before deploying to staging or production, run the automated pre-flight checker:

```bash
node backend/scripts/preflightProduction.js
```

Ensure the preflight scanner reports **0 FAIL items**.

---

## 4. Docker Deployment Option (Self-Hosted / VPS)

### Building the Docker Container
```bash
docker build -t varanasi-yatra-app:latest .
```

### Running with Docker Compose
```bash
docker-compose up -d
```

The system will initiate the application on port `5001` and connect to the database container.
