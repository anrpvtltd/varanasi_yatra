# Varanasi Yatra — Team Role Foundation & Authorization Architecture

**Document Version:** 1.0.0  
**Phase:** Prompt 3 Implementation Complete  
**Date:** September 7, 2026  
**Status:** Canonical & Active

---

## 1. Executive Summary

Prompt 3 establishes a future-proof, enterprise-grade organizational hierarchy and authorization foundation for the Varanasi Yatra platform. It seamlessly introduces **Team Leader** and **Team Member** operational roles alongside existing **CEO** and **Manager** roles, enforces server-side role and permission boundaries, institutes reporting and lead assignment structures, and initiates safe modularization of the backend without altering any existing commercial formulas, financial privacy, or public website behavior.

---

## 2. Canonical Role Model

The platform enforces a single canonical role enumeration defined in [`backend/auth/roles.js`](file:///Users/avaneeshkumar/Desktop/varanasi_yatra/backend/auth/roles.js):

| Role | Canonical Enum | Description | Creation Channel |
| :--- | :--- | :--- | :--- |
| **CEO** | `CEO` | Executive command, full financial visibility, rate master, system configuration, team provisioning. | Protected system bootstrap only. Cannot be created via normal UI/API. |
| **Manager** | `MANAGER` | Operational command, lead qualification, quote creation, customer negotiations, supplier booking, payment recording. | Provisioned by CEO. |
| **Team Leader** | `TEAM_LEADER` | Area/team operational lead, team member coordination, scoped lead assignment, SLA tracking. Zero internal financial access. | Provisioned by CEO. |
| **Team Member** | `TEAM_MEMBER` | Frontline sales & customer service, lead follow-ups, customer communication, operational status updates. Zero internal financial access. | Provisioned by CEO. |

### Role Normalization & Case Insensitivity
Incoming role claims and database entries are passed through `normalizeRole(role)` which supports legacy and lowercase variations (`admin`, `ceo` → `CEO`; `manager` → `MANAGER`; `tl`, `leader`, `team_leader` → `TEAM_LEADER`; `tm`, `agent`, `team_member` → `TEAM_MEMBER`). Unrecognized roles default safely to `TEAM_MEMBER`.

---

## 3. Reporting Hierarchy & Validation Rules

Reporting structures are tracked on the `User` schema via `reportsTo` (Mongoose `ObjectId -> User`, nullable).

### Valid Reporting Invariants
1. **CEO Reports to Nobody:** `reportsTo` for a CEO must always be `null`.
2. **Self-Reporting Prohibited:** A user cannot report to themselves (`reportsTo !== userId`).
3. **Manager Reports to CEO:** Managers report directly to a `CEO`.
4. **Team Leader Reports to Manager or CEO:** Team Leaders report to an operational `MANAGER` or directly to `CEO`.
5. **Team Member Reports to Team Leader:** Frontline Team Members report to their respective `TEAM_LEADER`.
6. **Last Active CEO Protection:** The backend strictly blocks the deactivation, deletion, or demotion of the final remaining active CEO account to guarantee system availability.

Hierarchy constraints are enforced server-side via `validateHierarchy(userRole, reportsToUser)` in [`backend/auth/authorization.js`](file:///Users/avaneeshkumar/Desktop/varanasi_yatra/backend/auth/authorization.js) during user creation and profile patching.

---

## 4. Canonical Permissions & Capability Matrix

The authorization layer establishes **25 canonical granular permissions** in [`backend/auth/permissions.js`](file:///Users/avaneeshkumar/Desktop/varanasi_yatra/backend/auth/permissions.js):

```
LEADS_VIEW, LEADS_CREATE, LEADS_ASSIGN, LEADS_EDIT
CUSTOMERS_VIEW, CUSTOMERS_CREATE, CUSTOMERS_EDIT
QUOTES_VIEW, QUOTES_CREATE, QUOTES_EDIT, QUOTES_SEND
BOOKINGS_VIEW, BOOKINGS_CREATE, BOOKINGS_EDIT
PAYMENTS_VIEW, PAYMENTS_CREATE, PAYMENTS_EDIT
TRIPS_VIEW, TRIPS_EDIT
COMMUNICATION_VIEW, COMMUNICATION_CREATE
RESOURCES_VIEW, RESOURCES_MANAGE
PARTNERS_VIEW, PARTNERS_MANAGE
TEAM_VIEW, TEAM_MANAGE
FINANCIALS_VIEW, FINANCIALS_MANAGE
ANALYTICS_VIEW, SYSTEM_MANAGE
```

### Role Capability Matrix

| Permission Category | CEO | Manager | Team Leader | Team Member |
| :--- | :---: | :---: | :---: | :---: |
| **Leads (View / Create / Edit)** | ✅ | ✅ | ✅ | ✅ (Assigned) |
| **Leads (Assign / Reassign)** | ✅ | ✅ (Broad) | ✅ (Team Scoped) | ❌ |
| **Customers (View / Create / Edit)** | ✅ | ✅ | ✅ | ✅ (Assigned) |
| **Quotes (View / Create / Edit / Send)** | ✅ | ✅ | ❌ | ❌ |
| **Bookings (View / Create / Edit)** | ✅ | ✅ | ✅ (Ops status) | ✅ (Ops status) |
| **Payments (View / Record / Ledger)** | ✅ | ✅ | ❌ | ❌ |
| **Trips & Operational Readiness** | ✅ | ✅ | ✅ | ✅ (Assigned) |
| **Communication (WhatsApp / Email)** | ✅ | ✅ | ✅ | ✅ |
| **Resource Master & Baseline Rates** | ✅ (Manage) | ✅ (View only) | ❌ | ❌ |
| **Hotel / Cab Partners** | ✅ (Manage) | ✅ (View/Ops) | ❌ | ❌ |
| **Team Management & User Provisioning**| ✅ | ❌ | ❌ | ❌ |
| **Vendor Costs & Profit Calculation** | ✅ | ❌ (Redacted) | ❌ (Redacted) | ❌ (Redacted) |
| **Company Margin & CEO Notes** | ✅ | ❌ (Redacted) | ❌ (Redacted) | ❌ (Redacted) |
| **Executive Financials & Expenses** | ✅ | ❌ | ❌ | ❌ |
| **System Settings & Backups** | ✅ | ❌ | ❌ | ❌ |

---

## 5. Scoped Lead Assignment Model

Lead assignment semantics are tracked directly on enquiry/lead documents:
- `assignedTo`: `ObjectId -> User` (The frontline owner executing the lead).
- `assignedBy`: `ObjectId -> User` (The user who delegated the lead).
- `assignedAt`: `Date` (Timestamp of assignment).
- `teamLeaderId`: `ObjectId -> User` (The supervisory Team Leader responsible for SLA).

### Assignment Authorization Logic
Implemented in `canAssignLead(actor, targetUser, targetLead)`:
- **CEO:** Authorized to assign any lead to any user across all teams.
- **Manager:** Authorized to assign leads across operational teams.
- **Team Leader:** Authorized to assign leads **only** to team members reporting to them or belonging to the identical `assignment.teamName`.
- **Team Member:** Forbidden from reassigning leads or stealing leads from peers.

---

## 6. Server-Enforced Security & Financial Sanitization

1. **Zero Client Trust:** Permissions and roles are never trusted from client payloads, URLs, headers, or localStorage. Authenticated user documents are loaded server-side via `authenticateToken`.
2. **Server-Side Financial Sanitization:** When queries for leads or customers are executed by `TEAM_LEADER` or `TEAM_MEMBER`, `sanitizeLeadForRole(lead, role)` removes:
   - `vendorCost`, `vendorCosts`
   - `companyMargin`
   - `expectedProfit`, `realizedProfit`
   - `ceoNotes`, `ceoOnlyNotes`
   - `internalNotes`
3. **Strict Escalation Blockers:**
   - Any attempt by a non-CEO to provision users via `POST /admin/users` returns `403 Forbidden`.
   - Normal users cannot alter their own `role` or `permissions` via `PATCH /admin/users/:id`.
   - `POST /admin/users` rejects any request body attempting `role: 'CEO'`.

---

## 7. Backend Modularization Architecture

The backend organization has transitioned from a monolithic `server.js` toward clean domain modules:

```
backend/
  auth/
    roles.js               # Canonical roles & normalization predicates
    permissions.js         # 25 canonical permissions & default matrices
    authorization.js       # Hierarchy validator & assignment rules
    authMiddleware.js      # authenticateToken, requireRole, requirePermission
  modules/
    users/
      userRoutes.js        # User lifecycle, password reset, activation
    team/
      teamRoutes.js        # Team overview, team leads, scoped assignment
  server.js                # Express app entry & modular route mounting
  functions/index.js       # Firebase Functions cloud entry & parity mounting
```

---

## 8. Extended User Schema Specifications

```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['CEO', 'MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER', 'admin', 'ceo', 'manager', 'tl', 'leader', 'tm', 'agent'], 
    default: 'MANAGER' 
  },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignment: {
    teamName: { type: String, default: '', trim: true },
    assignedAreas: [{ type: String, trim: true }],
    maxActiveLeads: { type: Number, default: 50 }
  },
  permissions: [{ type: String }],
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'], 
    default: 'ACTIVE' 
  },
  isActive: { type: Boolean, default: true },
  passwordChangeRequired: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: null }
}
```

---

## 9. API Endpoint Reference

### User Management (`backend/modules/users/userRoutes.js`)
- `GET /admin/users` — Full directory with populated `reportsTo` and active lead counts (CEO only).
- `POST /admin/users` — Provision new `MANAGER`, `TEAM_LEADER`, or `TEAM_MEMBER` (CEO only; rejects `CEO`).
- `GET /admin/users/:id` — User profile details and hierarchy position (CEO only).
- `PATCH /admin/users/:id` — Update user details, role, reportsTo, assignment, or status (CEO only; blocks self-escalation and last CEO deactivation).
- `POST /admin/users/:id/activate` — Set user status to `ACTIVE` and `isActive: true` (CEO only).
- `POST /admin/users/:id/deactivate` — Set user status to `INACTIVE` and `isActive: false` (CEO only; protected against last CEO).
- `POST /admin/users/:id/reset-password` — Issue temporary password and enforce `passwordChangeRequired: true` (CEO only).
- `PATCH /admin/users/:id/status` — Backward compatibility alias for status updates.

### Team Operations (`backend/modules/team/teamRoutes.js`)
- `GET /admin/team/overview` — Team operational dashboard showing subordinate members, open leads, and area coverage.
- `GET /admin/team/leads` — Returns scoped leads sanitized for role privacy.
- `POST /admin/team/leads/assign` — Scoped lead assignment and delegation.

---

## 10. Frontend Workspaces & Integration

- **Role Routing (`src/components/AdminCRM.jsx`):** Distinguishes user role upon authenticated login and routes directly to the designated role workspace while preserving the universal CRM shell, notifications, and top navigation.
- **CEO Team Workspace (`src/components/crm/ceo/CEOTeamWorkspace.jsx`):** Interactive organization hierarchy tree (`CEO ➔ Managers ➔ Team Leaders ➔ Team Members`), directory table with search, user provisioning modal (excluding CEO, dynamic reporting dropdown), user editing modal, single-reveal temporary password security modal, and activation/deactivation controls.
- **Team Leader Workspace (`src/components/crm/team-leader/TeamLeaderWorkspace.jsx`):** Operational oversight workspace displaying subordinate team members, open team leads, and a reassignment modal with complete financial confidentiality.
- **Team Member Workspace (`src/components/crm/team-member/TeamMemberWorkspace.jsx`):** Focused frontline workspace showing assigned leads, quick follow-up actions, and status updates without exposing vendor pricing or company margins.
- **Adaptive Sidebar (`src/components/crm/shell/CRMSidebar.jsx`):** Dynamically filters visible navigation items matching role capabilities.

---

## 11. Backward Compatibility & Migration Guarantee

1. **Zero Database Destructive Migration:** Existing CEO and Manager accounts without `reportsTo`, `assignment`, or `status` fields default gracefully in memory and during queries.
2. **Existing Commercial Models Intact:** Selling prices, vendor cost calculation, margin calculations, customer payment schedules, and PDF quote generation remain untouched.
3. **Public Website & QR Preservation:** Public lead capture routes, hotel partner QR attribution, and trip planner flows operate with zero interruption.
