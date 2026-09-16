# AI Customer Hunter: Real Source Integration Layer (Prompt 9)

## 1. Architectural Overview

The **Real Hunter Source Integration Layer** bridges the Prompt 8 AI Customer Hunter engine with real-world signal sources through an extensible, provider-independent connector architecture.

```
                               ┌──────────────────────────────────────────────┐
                               │           CEO AI Control Center             │
                               │  (Sources Subtab, Stats, Test, Run All)      │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTP / JWT (CEO/Manager)
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │       Hunter Source REST Endpoints           │
                               │  GET /sources, POST /run, POST /test, etc.   │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │             Source Registry                  │
                               │   - Discovers & syncs connectors with DB     │
                               │   - Enforces sliding-window rate limiting    │
                               │   - Isolates failures (partial run status)   │
                               │   - AIAuditLog provenance on all runs        │
                               └──────────┬───────────────────────┬───────────┘
                                          │                       │
                 ┌────────────────────────┴────────┐              │
                 ▼                                 ▼              ▼
     ┌───────────────────────┐         ┌───────────────────────┐ ┌───────────────────────┐
     │   SearchApiConnector  │         │  PublicFeedConnector  │ │ PartnerFeedConnector  │
     │  (Google / SerpAPI)   │         │ (RSS / Atom / JSON)   │ │ (B2B Partner Feeds)   │
     └───────────────────────┘         └───────────────────────┘ └───────────────────────┘
                 │                                 │                         │
                 └────────────────────────┬────────┴─────────────────────────┘
                                          ▼
                               ┌──────────────────────────────────────────────┐
                               │            BaseSourceConnector               │
                               │  - Promise.race timeout (10s)                │
                               │  - Bounded exponential backoff (max 2)       │
                               │  - Sliding-window rate limiter               │
                               │  - Zero-secrets metadata sanitizer           │
                               └──────────────────┬───────────────────────────┘
                                                  ▼
                               ┌──────────────────────────────────────────────┐
                               │         Hunter Ingestion Pipeline            │
                               │  1. Text normalization & entity extraction   │
                               │  2. SHA-256 deterministic deduplication      │
                               │  3. Local / Outside classification           │
                               │  4. Intent confidence & qualification scoring│
                               │  5. AIOpportunity generation (Status: NEW)   │
                               └──────────────────┬───────────────────────────┘
                                                  ▼
                               ┌──────────────────────────────────────────────┐
                               │         Human Review Gate (Mandatory)        │
                               │     Discovery != Lead (No auto-conversion)   │
                               └──────────────────┬───────────────────────────┘
                                                  ▼
                               ┌──────────────────────────────────────────────┐
                               │            CRM Lead Conversion               │
                               │  - leadSource: 'AI_HUNTER'                   │
                               │  - aiHunter: true, aiHunterType preserved    │
                               │  - discoverySource, partnerId preserved      │
                               └──────────────────────────────────────────────┘
```

---

## 2. Connector Interface (`BaseSourceConnector`)

Every connector extends `BaseSourceConnector` located in `backend/modules/ai/hunter/connectors/baseSourceConnector.js`.

### Core Methods
- `getMetadata()`: Returns sanitized source metadata (`sourceId`, `name`, `type`, `mode`, `enabled`, `configurationStatus`, `rateLimit`, `credentialsConfigured`). **Never returns API keys or raw secrets.**
- `getConfigurationStatus()`: Dynamically verifies whether required server environment variables (`process.env.HUNTER_*`) are set. Returns `READY` if configured, `NOT_CONFIGURED` if missing.
- `healthCheck()`: Lightweight ping or configuration validation returning `{ status: 'HEALTHY' | 'DEGRADED' | 'DOWN', latencyMs, message }`.
- `fetchSignals(options)`: Fetches raw signals wrapped in `Promise.race` timeout (default 10,000ms) with bounded exponential retries (max 2 retries).
- `normalizeSignal(rawSignal)`: Normalizes signal into canonical schema with destination, inferredRegion, timestamp, and identityHash.
- `checkRateLimit()`: Sliding 60-second window tracking request count against configured `maxRequestsPerMinute`. Returns `{ allowed, current, limit, resetInMs }`.

---

## 3. Connector Taxonomy

| Type | Class | Description | Required Env Vars | Default State Without Keys |
|---|---|---|---|---|
| `SEARCH_API` | `SearchApiConnector` | Google Custom Search, SerpAPI, Bing Web Search for high-intent query monitoring | `HUNTER_SEARCH_API_KEY` | `NOT_CONFIGURED` |
| `PUBLIC_FEED` | `PublicFeedConnector` | Public RSS, Atom, JSON travel forum feeds and tourism alerts | None (URL configurable) | `READY` (uses public endpoints) |
| `PARTNER_FEED` | `PartnerFeedConnector` | B2B Travel partner API integrations (hotels, tour operators, booking portals) | `HUNTER_PARTNER_FEED_KEY`, `HUNTER_PARTNER_API_SECRET` | `NOT_CONFIGURED` |
| `FIRST_PARTY_SIGNAL` | `FirstPartyConnector` | Direct website inquiries, WhatsApp inquiries, and abandoned planner sessions | First-party CRM internal | `READY` |
| `PUBLIC_DATA_API` | Supported via taxonomy | Tourism bulletins, flight/train arrival patterns | Configurable | `NOT_CONFIGURED` |
| `MOCK` | `MockConnector` | Deterministic fixture generator for testing, development, and sandbox validation | None | `READY` |

---

## 4. Configuration Lifecycle & States

Connectors strictly adhere to the 6-state lifecycle:

1. **`NOT_CONFIGURED`**: Credentials or required environment variables are missing. Connector cannot be run. The system never fakes live connection status.
2. **`READY`**: Credentials verified, health check passes, ready for manual or scheduled ingestion.
3. **`ERROR`**: Last execution threw an unhandled provider error or network failure.
4. **`DISABLED`**: Source disabled by CEO or Manager via admin controls.
5. **`RATE_LIMITED`**: Provider or internal sliding-window rate limit reached; calls temporarily throttled until window expires.
6. **`AUTH_FAILED`**: Provider rejected credentials (HTTP 401/403).

---

## 5. Security & Zero-Secrets Guarantee

1. **Server-Side Only Credentials:** All API credentials (`HUNTER_SEARCH_API_KEY`, `HUNTER_PARTNER_FEED_KEY`, etc.) are read exclusively from server-side `process.env`.
2. **Sanitized REST Responses:** The `GET /api/v1/hunter/sources` endpoint returns only `credentialsConfigured: boolean`, masked source IDs, and sanitized settings. No token or secret is ever serialized.
3. **No Database Plaintext Secrets:** `HunterSource` MongoDB model does not store raw secrets or passwords.
4. **Zero Frontend Secrets:** No secrets exist in client-side bundles, Vite environment variables, or local storage.
5. **AI Safe Mode & Prompt Injection Defense:** Signal ingestion passes all raw text through Prompt 5 / Prompt 8 prompt injection detection and sanitizer regexes before opportunity scoring.

---

## 6. End-to-End Discovery, Deduplication & Attribution Flow

1. **Signal Ingestion:** Connector fetches raw payload; text is trimmed and normalized.
2. **Identity Hashing:** Deterministic SHA-256 hash computed from normalized `text + source + externalId`. Repeated signals match the exact hash.
3. **Opportunity Deduplication:** Existing opportunities or leads with identical `signalHash` within a 7-day window are recognized and dropped (`duplicateCount` incremented).
4. **Classification:**
   - In-destination immediate signals (e.g., "stranded at ghat", "need boat now") classified as `AI_LOCAL`.
   - Forward planning signals (e.g., "visiting Varanasi next month", "looking for 3-day itinerary") classified as `AI_OUTSIDE`.
5. **Qualification & Intent Scoring:** Signals are scored (0–100) based on detected travel dates, guest count, canonical services (`HOTEL`, `DARSHAN`, `BOAT`, `PANDIT`), and budget indicators.
6. **Human Review Gate:** Opportunities are created with status `NEW` and `humanVerified: false`.
   - `Discovery != Lead`: The system strictly prohibits automated lead creation.
   - Manager or CEO must review and approve (`APPROVED`) before triggering conversion.
7. **CRM Lead Conversion:** Converting an approved opportunity generates a standard CRM `Enquiry` lead with immutable provenance:
   - `leadSource: 'AI_HUNTER'`
   - `aiHunter: true`
   - `aiHunterType: 'LOCAL' | 'OUTSIDE'`
   - `discoverySource`: e.g. `mock-local-signals`, `search-google-varanasi`, `partner-feed-network`
   - `discoverySourceId`: Source ID string
   - `partnerId` / `partnerName`: Preserved if sourced from partner feed
   - `aiOpportunityId`: Linked directly to the originating `AIOpportunity`

---

## 7. REST API Endpoints

All endpoints require authentication (`verifyToken`) and RBAC (`requireRole`):

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/hunter/sources` | CEO, Manager | List all registered sources with status, rate limits, and stats |
| `GET` | `/api/v1/hunter/sources/:sourceId` | CEO, Manager | Retrieve specific source details |
| `POST` | `/api/v1/hunter/sources/:sourceId/test` | CEO, Manager | Execute dry-run health check & signal sample (no DB writes) |
| `POST` | `/api/v1/hunter/sources/:sourceId/run` | CEO | Trigger manual signal ingestion run for a single source |
| `POST` | `/api/v1/hunter/sources/run-all` | CEO | Trigger manual run across all enabled & configured sources |
| `PATCH` | `/api/v1/hunter/sources/:sourceId` | CEO | Update source settings (enable/disable, rate limits, tags) |
| `GET` | `/api/v1/hunter/sources/:sourceId/health` | CEO, Manager | Run live health check on connector |
| `GET` | `/api/v1/hunter/sources/:sourceId/stats` | CEO, Manager | Retrieve run history and performance metrics |

---

## 8. Audit Logging & Provenance (AIAuditLog)

Every source run is logged immutably to `AIAuditLog`:
- **Action:** `SOURCE_RUN` (success or partial) or `SOURCE_FAILED` (fatal)
- **Actor:** Authoritative `userId` and `actorRole` from verified JWT
- **Source Details:** `sourceId`, `sourceType`, `signalsFetched`, `opportunitiesCreated`, `duplicatesSkipped`, `durationMs`
- **Error Tracking:** `errorMessage`, `errorCode`, stack trace for audit and diagnostics

---

## 9. 23-Point Production Readiness Check Report (Section 34)

| # | Check Item | Status | Verification Detail |
|---|---|:---:|---|
| 1 | **Provider-Independent Connector Interface** | **PASS** | `BaseSourceConnector` defines all 6 canonical methods; tested across all subclasses. |
| 2 | **Connector Taxonomy Implementation** | **PASS** | `SEARCH_API`, `PUBLIC_FEED`, `PARTNER_FEED`, `FIRST_PARTY_SIGNAL`, `MOCK` implemented. |
| 3 | **Source Registry Orchestration** | **PASS** | `SourceRegistry` manages registration, DB sync, health checks, single run, and batch run. |
| 4 | **Six Configuration States Enforced** | **PASS** | `NOT_CONFIGURED`, `READY`, `ERROR`, `DISABLED`, `RATE_LIMITED`, `AUTH_FAILED` verified. |
| 5 | **Zero Plain-Text Secrets in Frontend** | **PASS** | Frontend receives only boolean `credentialsConfigured`; no secrets serialized or logged. |
| 6 | **Zero Plain-Text Secrets in Database** | **PASS** | `HunterSource` schema does not store plain-text API credentials. |
| 7 | **Safe Uncredentialed Default** | **PASS** | Uncredentialed connectors show `NOT_CONFIGURED` without spoofing live status. |
| 8 | **Sliding-Window Rate Limiting** | **PASS** | Sliding 60-second window enforces per-minute rate limit; blocks excess calls with `RATE_LIMITED`. |
| 9 | **Promise.race Timeout Enforcement** | **PASS** | 10,000ms timeout wraps all external HTTP requests; aborts hanging connections. |
| 10 | **Bounded Exponential Retry Policy** | **PASS** | Max 2 retries with exponential backoff; verified by unit test Category D. |
| 11 | **Deterministic SHA-256 Deduplication** | **PASS** | Whitespace-normalized text hash prevents duplicate signals across 7-day window. |
| 12 | **Local vs Outside Hunter Classification** | **PASS** | Correctly segregates immediate local requests from future travel planning signals. |
| 13 | **Intent Confidence & Qualification** | **PASS** | Explainable scoring (0–100) with clear business reasons based on detected parameters. |
| 14 | **Mandatory Human Review Gate** | **PASS** | `Discovery != Lead`. New opportunities start in `NEW` state; cannot convert without approval. |
| 15 | **Controlled CRM Lead Conversion** | **PASS** | Converts approved opportunity to CRM `Enquiry` preserving full hunter attribution. |
| 16 | **Attribution Preservation** | **PASS** | `leadSource: 'AI_HUNTER'`, `aiHunter: true`, `aiHunterType`, `discoverySource` intact on lead. |
| 17 | **RBAC Authorization Matrix** | **PASS** | CEO has full configure/run; Manager has view/test; Team Leader/Member blocked with 403. |
| 18 | **Financial Data Privacy** | **PASS** | Margins, costs, and profit metrics stripped from non-CEO roles in API payloads. |
| 19 | **AI Safe Mode Defense** | **PASS** | Blocks prompt injections and malicious signal content before processing. |
| 20 | **Emergency Kill Switch** | **PASS** | Emergency kill switch immediately halts all Hunter executions across the engine. |
| 21 | **Malformed Data Resilience** | **PASS** | Safely handles null feeds, broken JSON, and invalid schemas without server crash. |
| 22 | **Provider Failure Isolation** | **PASS** | One failing source yields `PARTIAL` status; healthy sources continue executing unimpeded. |
| 23 | **Audit Log Provenance** | **PASS** | All source runs logged to `AIAuditLog` with latency, counts, errors, and user attribution. |

---

## 10. Verification Test Results

- **`test-prompt9-hunter-sources.js`**: **79 PASSED, 0 FAILED** (Covering categories A through W).
- **`test-prompt8-ai-customer-hunter.js`**: **50 PASSED, 0 FAILED** (Full Prompt 8 regression).
- **`run_all_12_suites.mjs`**: **12 SUITES PASSED, 0 FAILED** (Complete CRM regression).
- **`test-performance-guards.cjs`**: **21 PASSED, 0 FAILED**.
- **ESLint & Vite Build**: **0 errors, 0 warnings**.
