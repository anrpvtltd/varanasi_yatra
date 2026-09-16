# Varanasi Yatra — AI Foundation & CEO AI Control Center Architecture

> **Document Version:** 1.0.0  
> **Phase:** Prompt 5 Implementation  
> **Scope:** AI Foundation, Gateway, Tool Security Boundaries, CEO AI Control Center & Auditability  
> **Status:** Production-Ready Architecture (Foundation Only; Autonomous Discovery Disabled)

---

## 1. AI Architecture Overview

The Varanasi Yatra AI architecture is constructed upon strict security boundaries, defense-in-depth authorization, and total database isolation.

```
React CRM (Frontend)
       │ (No API keys or provider secrets in client bundle)
       ▼
Node.js / Express CRM API (Port 5001)
       │ (Server-Side Session Verification, Role Normalization, Permissions)
       ▼
AI Gateway & Orchestrator (backend/modules/ai/)
       │ (Master AI Switch, Safe Mode Guard, Emergency Stop, Daily Throttle)
       ▼
AI Tool Registry & Policy Layer
       │ (Permission check, Risk level validation, Financial redaction)
       ├── In-Process Deterministic Mock / Python FastAPI AI Service (ai-service/)
       │   └── Provider Abstraction (Deterministic / OpenAI / Gemini / Anthropic)
       ▼
Authenticated Internal CRM Tool Endpoints (/internal/ai/tools/execute)
       │ (X-AI-Service-Key verification)
       ▼
MongoDB Database (Enquiry, Customer, Booking, Quote, AIConfig, AIRun, AIAuditLog, AIOpportunity)
```

### Critical Architectural Invariants
1. **Zero Direct Database Access for AI Service**: The AI runtime (`ai-service/`) has **no MongoDB connection strings**, drivers (`pymongo`, `motor`), or raw database privileges. All access to CRM data occurs exclusively through authenticated, allowlisted tool dispatches via Node's internal API.
2. **Authoritative Identity Flow**: The AI layer never trusts identity or role claims sent from browser payloads. Identity is verified server-side from signed JWT sessions, resolving user roles and permissions before tool execution.
3. **Executive Oversight**: The CEO possesses sole administrative authority over the Master AI Switch, Safe Mode policies, module activation flags, and the Emergency Kill Switch.

---

## 2. AI Gateway

The AI Gateway acts as the trusted perimeter between CRM operators, AI intelligence routines, and internal CRM business data.

### Gateway Endpoints
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/admin/ai/health` | `GET` | Public/Auth | System health status, version, safe mode, and provider readiness. |
| `/admin/ai/config` | `GET` | `CEO`, `MANAGER` | Fetches operational AI settings (secrets redacted for non-CEO). |
| `/admin/ai/config` | `PATCH` | `CEO` | Updates operational limits, feature flags, and AI provider settings. |
| `/admin/ai/config/master-toggle` | `POST` | `CEO` | Toggles Master AI switch (ON/OFF). |
| `/admin/ai/config/safe-mode` | `POST` | `CEO` | Toggles Safe Mode enforcement (ON/OFF). |
| `/admin/ai/config/emergency-stop` | `POST` | `CEO` | Immediate global cutoff for all active and queued AI operations. |
| `/admin/ai/run` | `POST` | `CEO`, `MANAGER` | Executes a permitted AI analysis run with tool instrumentation. |
| `/admin/ai/runs` | `GET` | `CEO`, `MANAGER` | Lists paginated historical AI runs. |
| `/admin/ai/runs/:id` | `GET` | `CEO`, `MANAGER` | Retrieves granular run execution trace, tool calls, and results. |
| `/admin/ai/audit` | `GET` | `CEO`, `MANAGER` | Immutable audit log viewer with filtering by decision and module. |
| `/admin/ai/opportunities` | `GET` | `CEO`, `MANAGER` | View queue of future Hunter opportunities (foundation fixtures). |
| `/admin/ai/opportunities/:id` | `PATCH` | `CEO` | Human review update for opportunity status (`APPROVED`, `REJECTED`). |
| `/internal/ai/tools/execute` | `POST` | Service Secret | Loopback endpoint for isolated AI service to invoke permitted tools. |

---

## 3. Authentication & Service-to-Service Security

1. **Client to CRM Backend**: Authenticated via standard HS256 JWT tokens containing `id`, `userId`, `role`, and `email`. Tokens are verified against server-side secret keys (`JWT_SECRET`).
2. **CRM Backend to AI Service**: Service-to-service calls use dedicated internal shared secrets (`AI_SERVICE_SECRET`) passed in the `X-AI-Service-Key` header. Requests lacking or presenting invalid service keys are rejected immediately with HTTP 401.
3. **Frontend Secret Isolation**: No third-party provider API keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`, etc.) or database credentials exist in frontend code, localStorage, URLs, or client bundles.

---

## 4. Authorization & Permission Boundary

Every AI operation must successfully pass a 7-stage sequential authorization pipeline:

```
1. Master Switch (config.masterEnabled === true)
   ↓
2. Emergency Stop Check (config.emergencyStop === false)
   ↓
3. Module Authorization (config.modules[moduleKey].enabled === true)
   ↓
4. Safe Mode Policy (tool.safeModeAllowed === true if safeMode is ON)
   ↓
5. Tool Registry Allowlist (tool exists and tool.enabled === true)
   ↓
6. User CRM Permission (user holds tool.permission OR role === CEO)
   ↓
7. Financial Privacy & Field Shielding Guard
   ↓
Execution & Audit Logging
```

---

## 5. Tool Registry & Allowlist

Every tool in the system is explicitly defined in `backend/modules/ai/aiTools.js` and `ai-service/app/tools/registry.py`:

| Tool Identifier | Module | Permission | Scope | Risk Level | Safe Mode Allowed | Status (Prompt 5) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `crm.getLead` | `CUSTOMER_ASSISTANT` | `LEADS_VIEW` | `LEAD_READ` | `LOW` | `true` | **Active** |
| `crm.getCustomer` | `CUSTOMER_ASSISTANT` | `CUSTOMERS_VIEW` | `CUSTOMER_READ` | `LOW` | `true` | **Active** |
| `crm.getBooking` | `SALES_ASSISTANT` | `BOOKINGS_VIEW` | `BOOKING_READ` | `LOW` | `true` | **Active** |
| `crm.getQuote` | `SALES_ASSISTANT` | `QUOTES_VIEW` | `QUOTE_READ` | `LOW` | `true` | **Active** |
| `crm.getTrip` | `CUSTOMER_ASSISTANT` | `TRIPS_VIEW` | `TRIP_READ` | `LOW` | `true` | **Active** |
| `crm.updateLead` | `SALES_ASSISTANT` | `LEADS_EDIT` | `LEAD_WRITE` | `MEDIUM` | `false` | Human Approval Required |
| `crm.createLead` | `CUSTOMER_ASSISTANT` | `LEADS_CREATE` | `LEAD_WRITE` | `HIGH` | `false` | Blocked in Safe Mode |
| `crm.sendCustomerMessage` | `CUSTOMER_ASSISTANT` | `COMMUNICATION_CREATE` | `COMMUNICATION_WRITE` | `HIGH` | `false` | Blocked in Safe Mode |
| `crm.createBooking` | `SALES_ASSISTANT` | `BOOKINGS_CREATE` | `BOOKING_WRITE` | `CRITICAL` | `false` | Blocked in Safe Mode |
| `crm.modifyFinancialData` | `SYSTEM_ANALYSIS` | `FINANCIALS_MANAGE` | `FINANCIAL_WRITE` | `CRITICAL` | `false` | Blocked in Safe Mode |
| `hunter.searchPublicSignals`| `CUSTOMER_HUNTER` | `AI_MANAGE` | `PUBLIC_SIGNALS` | `HIGH` | `false` | **DISABLED (OFF)** |
| `hunter.qualifySignal` | `CUSTOMER_HUNTER` | `AI_MANAGE` | `SIGNAL_QUALIFY` | `MEDIUM` | `false` | **DISABLED (OFF)** |
| `hunter.createOpportunity` | `CUSTOMER_HUNTER` | `AI_MANAGE` | `OPPORTUNITY_WRITE` | `MEDIUM` | `false` | **DISABLED (OFF)** |

---

## 6. Guardrails & Sensitive Data Protection

The AI foundation establishes automated data protection mechanisms:
- **Proprietary Financial Shielding**: When `crm.getLead`, `crm.getBooking`, or `crm.getQuote` are invoked by non-CEO actors, sensitive commercial fields (`vendorCost`, `companyMargin`, `margin`, `expectedProfit`, `realizedProfit`, `ceoNotes`) are deleted from the data payload before reaching the AI context.
- **Unregistered Tool Prevention**: Any call referencing an unknown or arbitrary tool string (e.g. `os.system`, `mongo.eval`) is rejected with `TOOL_DISABLED`.
- **Data Minimization**: AI runs only retrieve records explicitly required for the given task. No bulk database dumps or unrestricted queries are permitted.

---

## 7. Safe Mode Policy

Safe Mode is the default operating policy (`safeMode: true`):
- **Permitted Operations**: Read-only queries, data classification, summarization, itinerary recommendations, and diagnostics checks.
- **Prohibited Operations**: Automatic lead creation, customer message dispatch, automated quote generation, price modifications, booking creation, and financial updates.
- **Enforcement**: Any tool tagged with `safeModeAllowed: false` is blocked with `SAFE_MODE_BLOCKED` and records an `APPROVAL_REQUIRED` or `BLOCKED` audit log entry.

---

## 8. Emergency Stop (Kill Switch)

The CEO has access to a zero-latency global Kill Switch:
- **Effect**: Instantly blocks all incoming `/admin/ai/run` requests, tool executions, and loopback operations with error code `EMERGENCY_STOP`.
- **State Preservation**: Ongoing runs are halted, and audit log history remains fully queryable for forensic inspection.
- **Authority**: Only an authenticated user with the `CEO` role can activate or reset the Emergency Stop.

---

## 9. AI Module Feature Flags

Six discrete module flags are maintained in `AIConfig`:
1. `customerAssistant` (Allowed Roles: `CEO`, `MANAGER` | Status: Controlled Testing)
2. `salesAssistant` (Allowed Roles: `CEO`, `MANAGER` | Status: Controlled Testing)
3. `customerHunter` (Allowed Roles: `CEO` | Status: **OFF**)
4. `localHunter` (Allowed Roles: `CEO` | Status: **OFF**)
5. `outsideHunter` (Allowed Roles: `CEO` | Status: **OFF**)
6. `voiceAi` (Allowed Roles: `CEO` | Status: **OFF**)

In Prompt 5, all autonomous customer discovery and outreach modules (`customerHunter`, `localHunter`, `outsideHunter`, and `voiceAi`) remain strictly disabled.

---

## 10. AI Run Tracking Model (`AIRun`)

Every AI invocation generates an immutable run record:

```javascript
{
  runId: "RUN-1788786958-AB12CD",
  userId: ObjectId("..."),
  userRole: "CEO",
  module: "SALES_ASSISTANT",
  taskType: "lead_summary",
  status: "COMPLETED", // QUEUED | RUNNING | COMPLETED | FAILED | CANCELLED | BLOCKED
  safeMode: true,
  startedAt: ISODate("2026-09-07T18:40:00Z"),
  completedAt: ISODate("2026-09-07T18:40:00.120Z"),
  latencyMs: 120,
  toolCallCount: 1,
  toolCalls: [
    {
      tool: "crm.getLead",
      input: { leadId: "lead_12345" },
      output: { found: true, lead: { ... } },
      riskLevel: "LOW",
      decision: "ALLOWED",
      executedAt: ISODate("2026-09-07T18:40:00.050Z")
    }
  ],
  tokenUsage: { promptTokens: 120, completionTokens: 85, totalTokens: 205 },
  requiresApproval: false,
  approvalDetails: null,
  errorCode: null,
  result: {
    summary: "...",
    recommendations: [...],
    blockedActions: []
  },
  createdAt: ISODate("2026-09-07T18:40:00Z")
}
```

---

## 11. AI Audit Log Model (`AIAuditLog`)

The system records immutable audit log records for compliance and forensic verification:

```javascript
{
  runId: "RUN-1788786958-AB12CD",
  userId: ObjectId("..."),
  actorRole: "CEO",
  module: "SALES_ASSISTANT",
  action: "tool_execution:crm.getLead",
  tool: "crm.getLead",
  targetType: "lead",
  targetId: "lead_12345",
  decision: "ALLOWED", // ALLOWED | BLOCKED | APPROVAL_REQUIRED | FAILED
  reason: "Tool executed successfully within permitted scope",
  riskLevel: "LOW", // LOW | MEDIUM | HIGH | CRITICAL
  metadata: { ... },
  timestamp: ISODate("2026-09-07T18:40:00.050Z")
}
```

Audit entries cannot be updated or deleted through the CRM UI or standard API endpoints.

---

## 12. AI Opportunity Model (`AIOpportunity`)

The future Hunter Opportunity model is established as a data foundation without autonomous generation:

```javascript
{
  opportunityId: "OPP-2026-0001",
  source: "AI_LOCAL", // AI_LOCAL | AI_OUTSIDE
  publicReference: "inbound_inquiry_kashi",
  detectedIntent: "Temple Darshan Inquiry",
  serviceInterest: ["TEMPLE_DARSHAN", "BOAT_RIDE"],
  location: "Varanasi",
  travelWindow: {
    startDate: ISODate("2026-10-10"),
    endDate: ISODate("2026-10-14")
  },
  duration: 4,
  confidence: 0.88,
  reasoningSummary: "Guest explicitly inquired about VIP Darshan and morning boat tour during October Navratri.",
  status: "NEW", // NEW | UNDER_REVIEW | APPROVED | REJECTED | EXPIRED | CONVERTED
  verificationStatus: "UNVERIFIED", // UNVERIFIED | PENDING_REVIEW | HUMAN_VERIFIED | CONSENT_CONFIRMED | REJECTED
  assignedTo: null,
  reviewNotes: null,
  reviewedBy: null,
  reviewedAt: null,
  convertedLeadId: null,
  convertedAt: null,
  createdAt: ISODate("2026-09-07T18:40:00Z"),
  updatedAt: ISODate("2026-09-07T18:40:00Z")
}
```

---

## 13. Future Hunter Architecture & Source Policies

Future phases will introduce customer discovery under strict ethical and technical boundaries:
- **Local Hunter**: Detects signals from travellers already present in Varanasi needing real-time services (Darshan, boat rides, pandit, local transport, guide).
- **Outside Hunter**: Identifies early planning signals from travelers preparing trips to Varanasi (hotels, custom packages, temple circuits).

### Source Policy & Ethical Invariants
Future Hunter modules will operate exclusively on:
1. Permitted and consented public APIs.
2. Verified inbound inquiries and partner referrals.
3. Consented first-party user submissions.

**Strict Prohibitions**:
- No scraping of private accounts or personal social profiles.
- No mass-spamming or unsolicited automated WhatsApp/email messaging.
- No automated lead injection into the active CRM pipeline without human review.

---

## 14. Human Approval Workflow Foundation

The transition from AI detection to actionable CRM records requires human intervention:

```
AI Opportunity Detected (Status: NEW, Verification: UNVERIFIED)
                 │
                 ▼
CEO / Manager Review Queue (src/components/crm/ceo/ai/AIOpportunityQueue.jsx)
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
    [Approve]           [Reject]
       │                   │
       ▼                   ▼
Status: APPROVED       Status: REJECTED
Verification:          Verification: REJECTED
HUMAN_VERIFIED
       │
       ▼ (Explicit Human Lead Conversion Action)
CRM Lead Created (source: 'AI_LOCAL', opportunityId linked)
```

No AI process can convert an opportunity to a lead autonomously in Prompt 5.

---

## 15. Data Privacy & Customer Protection

- **Role-Based Redaction**: Non-executive roles never receive internal commercial metrics through AI tools.
- **Short-Term Session Memory**: Memory stores contain only ephemeral session identifiers, user ID, module key, and conversation summaries. No permanent storage of raw conversational PII occurs in AI memory layers.
- **Zero Third-Party Model Training**: AI prompts and tool outputs use configurations that prevent third-party providers from training on Varanasi Yatra customer data.

---

## 16. Secret Management

- API keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_SERVICE_SECRET`) are stored exclusively in server-side environment configurations.
- The CEO AI Control Center displays only masked configurations (`CONFIGURED` / `PROTECTED`), never exposing plaintext keys.
- Frontend builds contain zero `VITE_` prefixed AI secrets.

---

## 17. Operational Limits & Safety Controls

To prevent runaway costs and rate limit exhaustion, the AI gateway enforces configurable caps:
- **`maxConcurrentRuns`**: Default 5 concurrent runs.
- **`maxToolCallsPerRun`**: Default 10 tool calls per invocation.
- **`dailyRunLimit`**: Default 200 runs per 24-hour UTC day.
- **Rate Limit Response**: When thresholds are exceeded, the gateway responds with HTTP 403 and `RATE_LIMITED`, logging an audit record.

---

## 18. Roadmap & Future Expansion

- **Prompt 6**: Controlled Customer Assistant for inbound WhatsApp/web inquiries with predefined human-in-the-loop escalation.
- **Prompt 7**: Sales Assistant for package quote recommendations with manager review.
- **Prompt 8**: Ethical Hunter Prototype using authorized public APIs with strict human verification loops.
- **Prompt 9**: Voice AI Receptionist with live agent handoff.
