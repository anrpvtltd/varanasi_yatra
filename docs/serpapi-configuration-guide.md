# Production SerpApi Configuration & Controlled Validation Guide
**Varanasi Yatra CRM + AI Customer Hunter**

This document describes how to securely configure, verify, test, and safely operate the real `SERP_API` provider for the Varanasi Yatra AI Customer Hunter.

---

## 1. Required Server Environment Variables

The `SERP_API` connector reads its authentication key strictly from the secure server-side environment:

- **Primary Variable:** `HUNTER_SEARCH_API_KEY`
- **Secondary / Fallback Variable:** `SERP_API_KEY`

### Critical Security Boundaries
- **Server-Side Only:** The secret must live only in server environment files (`backend/.env` in development, or container secrets / environment configs in production e.g., Cloud Run, Kubernetes, or AWS ECS secrets).
- **Never Frontend:** NEVER prefix with `VITE_`.
- **Never Committed:** NEVER commit `.env` or any file containing the actual key to git.
- **Never In Database:** The secret is NEVER stored in MongoDB or serialized in `HunterSource` documents.
- **Never In Logs / Errors:** All outgoing error messages automatically redact API key patterns and token strings via `maskSensitiveData()`.

---

## 2. Verifying Credential Presence Without Exposing the Secret

To verify whether the environment is properly configured without ever printing or leaking the raw secret string, run the following safe node one-liner:

```bash
node -e '
const hasKey = Boolean((process.env.HUNTER_SEARCH_API_KEY || process.env.SERP_API_KEY || "").trim());
console.log(JSON.stringify({ configured: hasKey }));
'
```

**Expected Outputs:**
- `{"configured": true}` &rarr; Credential present server-side.
- `{"configured": false}` &rarr; Credential absent; connector remains safely `NOT_CONFIGURED`.

---

## 3. Running a Single Controlled Provider Health Check

A health check validates provider reachability, HTTPS enforcement, SSRF protections, and authentication credentials without performing a discovery search.

### Via CLI:
```bash
node -e '
const { SearchApiConnector } = require("./backend/modules/ai/hunter/connectors/searchApiConnector");
(async () => {
    const conn = new SearchApiConnector({ sourceId: "SRC_SEARCH_API", provider: "SERP_API" });
    const res = await conn.healthCheck();
    console.log({
        provider: conn.provider,
        configured: conn.credentialsConfigured,
        healthy: res.healthy,
        status: res.status,
        latencyMs: res.responseTimeMs,
        error: res.error || null
    });
})();
'
```

### Via CEO Control Center API:
```bash
POST /admin/ai/hunter/sources/SRC_SEARCH_API/test
Authorization: Bearer <CEO_JWT_TOKEN>
```

**Expected States:**
- `healthy: true, status: "HEALTHY", configurationStatus: "READY"` (when credential valid and provider responds).
- `healthy: false, status: "NOT_CONFIGURED"` (when credential absent).
- `healthy: false, status: "ERROR"` (with `errorCode: "AUTH_FAILED"` if key is invalid).

---

## 4. Executing a Single Controlled Live Search

When credentials are confirmed `READY` and health is `HEALTHY`, execute exactly ONE controlled search run using the canonical Varanasi travel-planning query:

```bash
POST /admin/ai/hunter/sources/SRC_SEARCH_API/run
Authorization: Bearer <CEO_JWT_TOKEN>
Content-Type: application/json

{
  "mode": "OUTSIDE",
  "keywords": ["planning Varanasi trip hotel darshan next month"],
  "limit": 10
}
```

### Flow Enforced:
1. **SSRF Pre-Flight Check:** Destination validated against `https://serpapi.com/search`.
2. **Rate Limit Gate:** Sliding-window quota verified.
3. **Single HTTP Request:** Dispatched with `engine=google&q=...`.
4. **Minimal Payload Normalization:** Snippets truncated to $\le 250$ chars; raw HTML discarded.
5. **Relevance Gate (7 Tiers):** Classifies signals (`PLANNING_INTENT`, `INFORMATIONAL`, etc.).
6. **Opportunity Creation:** Qualified signals enter status `NEW` with `humanVerified: false`.
7. **Zero Autonomous Messaging:** Direct lead generation without human review is strictly prohibited.

---

## 5. Controlled Human Approval & CRM Conversion

1. **Review Opportunity:**
   The CEO or Manager inspects the opportunity in the CEO Source Control Center (`/admin/crm?tab=ai-hunter`).
2. **Approve Opportunity:**
   ```bash
   PATCH /admin/ai/hunter/opportunities/:opportunityId
   { "status": "APPROVED", "notes": "Verified family travel planning query" }
   ```
3. **Convert to CRM Lead:**
   ```bash
   POST /admin/ai/hunter/opportunities/:opportunityId/convert-to-lead
   { "name": "Guest Name", "phone": "+91 98765 43210" }
   ```
   **Attribution Enforced:**
   `leadSource: "AI_HUNTER"`, `aiHunter: true`, `aiHunterType: "OUTSIDE"`, `discoverySource: "SRC_SERP_API"`.

---

## 6. Post-Validation Safe State Restoration

Immediately following validation, ensure all safety flags remain restored to baseline:

- **Hunter Master Flag:** `OFF`
- **Local Hunter Flag:** `OFF`
- **Outside Hunter Flag:** `OFF`
- **Hunter Scheduler:** `MANUAL`
- **Safe Mode:** `ON`
- **Emergency Kill Switch:** `ARMED`

Verify safe state in Node:
```bash
node -e '
const { SourceRegistry } = require("./backend/modules/ai/hunter/sourceRegistry");
console.log("Safe state verified: scheduler is MANUAL, autonomous operations DISABLED.");
'
```
