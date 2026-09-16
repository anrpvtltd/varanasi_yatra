# AI Customer Assistant Documentation
**Varanasi Yatra Platform — Prompt 6 Implementation**

---

## 1. Architecture Overview

The AI Customer Assistant provides a conversational alternative to static travel planning forms for website visitors and QR code entrants. It operates under strict security and architectural invariants established in Prompt 5 and Prompt 6:

```
Website / QR Visitor (/ or /q/:qrId or /p/:partnerId)
              │
              ▼
   [Plan with AI] Floating Trigger / QuickTripPlanner Link
              │ (Lazy Loaded Chunks — 0 KB initial homepage cost)
              ▼
   AI Customer Assistant (React UI + Session State)
              │
              ▼ (POST /public/ai/assistant/message)
   Natural Language Understanding (NLU Engine)
              │
              ├── Intent Detection & Service Classification
              ├── Entity Extraction (Dates, Duration, Guests, Origin, Budget)
              ├── Prompt Injection & Hallucination Guardrails
              └── Missing-Field Follow-Up Question Selector
              │
              ▼
   Structured Requirement Summary
              │
              ▼ (Customer Confirms & Consents)
   Lead Handoff & CRM Lead Ingestion (Enquiry Model)
              │
              ├── Preserves Primary Acquisition Attribution (AREA_QR / HOTEL_QR / WEBSITE)
              ├── Additive AI Metadata (aiAssisted, aiConversationId, summary, intent)
              └── Idempotent Submission (Duplicate Lead Prevention)
              │
              ▼
   Existing CRM Pipeline (Manager / Team Leader / Member Assignment & Quotes)
```

---

## 2. Conversational Flow & State Machine

Conversations progress through deterministic lifecycle states managed server-side:

```
  [NEW]
    │
    ▼
  [DISCOVERY] ─── User provides initial intent / message
    │
    ▼
  [COLLECTING_DETAILS] ─── Missing question selector asks 1 high-value question at a time
    │
    ▼
  [READY_FOR_CONFIRMATION] ─── Structured Requirement Summary shown: "Ye requirement sahi hai?"
    │
    ├── [Edit] ──> Returns to [COLLECTING_DETAILS]
    │
    └── [Yes, Submit]
          │
          ▼
        [AWAITING_CONTACT] ─── Collects customerName and 10-digit mobile number
          │
          ▼
        [AWAITING_CONSENT] ─── Displays privacy notice and explicit consent prompt
          │
          ├── [Cancel] ──> [ABANDONED]
          │
          └── [I Agree]
                │
                ▼
              [SUBMITTED] ──> [COMPLETED] (Enquiry created, WhatsApp option displayed)
```

If at any point an escalation trigger or error occurs:
- `[HANDOFF_REQUIRED]`: Human escalation banner is presented with direct WhatsApp and Call buttons.
- `[ERROR]`: Polite public fallback displayed directing user to the standard "Plan My Trip" form or phone helpline.

---

## 3. Structured Requirement Model

The canonical requirement state is maintained in the `AIAssistantSession` schema:

```json
{
  "tripIntent": "HOTEL + DARSHAN + BOAT",
  "destination": "Varanasi",
  "origin": "Delhi",
  "travelStartDate": "12 November",
  "travelEndDate": "15 November",
  "travelWindow": "12–15 November",
  "duration": "3 Days / 2 Nights",
  "durationDays": 3,
  "durationNights": 2,
  "adults": 3,
  "children": 1,
  "totalGuests": 4,

  "hotelRequired": true,
  "darshanRequired": true,
  "boatRequired": true,
  "transportRequired": true,
  "panditRequired": false,
  "guideRequired": false,
  "shoppingRequired": false,
  "packageRequired": false,

  "pickupRequired": true,
  "dropRequired": false,

  "budget": "₹25,000 approx",
  "accommodationPreference": "Standard 3-Star Hotel",
  "specialRequirements": "Family, Senior Citizens (Assistance)",

  "customerName": "Ramesh Sharma",
  "phone": "9876543210",
  "email": "ramesh@example.com",

  "confidence": 0.9,
  "missingFields": []
}
```

---

## 4. Service Intents

Customer inputs are normalized into canonical enums (`AI_SERVICE_INTENTS`):

| Intent Code | Trigger Phrases (Hinglish/English) | Service Mapping |
| :--- | :--- | :--- |
| `HOTEL` | hotel, room, rooms, stay, dharamsala, resort, rukna | Accommodations & lodging |
| `DARSHAN` | darshan, mandir, temple, vishwanath, ganga aarti, aarti, kaal bhairav | Temple assistance & Aarti booking |
| `BOAT` | boat, nao, shikara, cruise, bajra, subah-e-banaras | Sunrise & sunset riverboat rides |
| `TRANSPORT` | cab, taxi, car, gaadi, innova, tempo, airport pickup | AC transfers & sightseeing |
| `PANDIT` | pandit, purohit, pooja, puja, rudrabhishek, pind daan | Vedic rituals & ceremonies |
| `GUIDE` | guide, guided tour, heritage walk, walking tour | Certified local historians |
| `SHOPPING` | shopping, saree, banarasi saree, silk, handloom | Authentic weavers trail |
| `PACKAGE` | package, complete package, full tour, all inclusive | Bundled itineraries |

---

## 5. Question Strategy & Priority Order

To prevent customer interrogation, the assistant never asks more than **one** missing question per turn. Questions follow a strict priority ladder:

1. **Travel Window / Dates**: "Aap kis date ya month mein aane ka plan kar rahe hain?"
2. **Total Guests**: "Aapke saath total kitne log travel karenge? (Adults aur Bachche)"
3. **Duration**: "Varanasi mein kitne din rukne ka plan hai? (Jaise: 3 Days / 2 Nights)"
4. **Required Services**: "Aapko kaun-kaun si services chahiye? (Hotel, Darshan, Boat, Cab)"
5. **Origin / Arrival**: "Aap kahan se Varanasi aa rahe hain?"
6. **Hotel Preference**: (Only asked if Hotel is requested) "Hotel kis category ka chahiye?"

---

## 6. Confirmation & Summary

Once the core parameters (dates, guests, duration, services) are gathered, the assistant renders a structured summary card:

```markdown
📋 YOUR TRIP REQUIREMENT
• Travel Dates: 12–15 November
• Total Guests: 4 Guests (3 Adults, 1 Children)
• Trip Duration: 3 Days / 2 Nights
• Selected Services: ✓ Hotel, ✓ Darshan, ✓ Boat, ✓ Transport
• Coming From: Delhi
• Estimated Budget: ₹25,000 approx
• Preferences: Family

Ye requirement sahi hai?
[Yes, Submit] [Edit]
```

---

## 7. Contact Capture & Consent

- **Phone Validation**: Only sanitized 10-digit Indian mobile numbers (`^[6-9]\d{9}$`) are accepted. Arbitrary phrases like "call me later" are rejected.
- **Privacy & Consent**: Prior to lead creation, the customer is presented with an explicit consent statement:
  *"Aapki trip requirement Varanasi Yatra team ke saath share ki jayegi taaki hamare travel expert aapse best customized itinerary aur quotation ke liye connect kar sakein."*
  Options: `[I Agree, Submit]` or `[Cancel]`.

---

## 8. CRM Lead Handoff

Upon confirmation and consent, the session invokes `submitLeadFromSession`, creating an `Enquiry` in the existing CRM database:
- Uses the unified `Enquiry` collection (no second CRM).
- `stage`: `NEW`, `status`: `Pending`.
- Appends an audit activity history entry: `action: 'AI_ASSISTED_LEAD_CREATED'`.
- Assignable by Managers according to Prompt 3 role-based authorization.

---

## 9. QR & Acquisition Attribution Preservation

The primary acquisition source is **strictly preserved** throughout the AI conversation:

| User Origin | Session Attribution | CRM Lead Attribution | Notes |
| :--- | :--- | :--- | :--- |
| **Area QR** (`/q/:qrId`) | `source = 'AREA_QR'` | `source = 'AREA_QR'`, `qrId`, `areaId`, `areaName`, `qrType`, `qrAttribution` | Area attribution is NOT overwritten by AI. `aiAssisted: true` is added additively. |
| **Hotel QR** (`/p/:partnerId`) | `source = 'HOTEL_QR'` | `source = 'HOTEL_QR'`, `partnerId`, `partnerName` | Hotel attribution is preserved with verified partner details. |
| **Standard Website** (`/`) | `source = 'WEBSITE'` | `source = 'WEBSITE'`, `aiAssisted = true` | Website source preserved with additive AI telemetry. |

---

## 10. Human Escalation Triggers

The assistant automatically triggers escalation (`humanHandoffRequired: true`) when the customer:
1. Demands exact or final package prices (`PRICE_REQUEST`).
2. Demands live hotel room or boat slot availability (`AVAILABILITY_CONFIRMATION`).
3. Attempts to finalize bookings directly or asks to submit card/payment details (`BOOKING_COMMITMENT`).
4. Reports a complaint, dispute, or refund issue (`PAYMENT_ISSUE`).
5. Explicitly asks to speak with a human/manager/agent (`HUMAN_REQUEST`).

When triggered, the assistant presents direct contact options:
- `[WhatsApp Team]` (with pre-filled requirement context).
- `[Call Expert (+91 8400554029)]`.

---

## 11. Pricing Restrictions & Guardrails

- **Zero Pricing Hallucination**: The assistant NEVER fabricates package costs, room rates, or discount percentages.
- **Standard Disclaimer**: "Humari pricing customized dates, guest count aur selected services par depend karti hai. Exact package quote humari Varanasi Yatra team finalize karegi."
- **Internal Margins Protected**: The assistant does not duplicate `QuoteBuilder` logic and never quotes internal rates.

---

## 12. Availability Restrictions & Guardrails

- The assistant does NOT fabricate live room or boat inventory.
- Explains that availability must be confirmed by operations: "Main aapki requirement note kar sakta hoon; real-time room ya boat availability humari team verify karke confirm karegi."

---

## 13. Prompt Injection & Jailbreak Defenses

The NLU engine runs deterministic regex filters before processing messages, detecting:
- "Ignore all previous instructions"
- "Reveal system prompt"
- "Tell me your vendor costs / company margin"
- "Create booking without approval"
- "Developer mode / DAN mode"

**Safe Response**: "Main sirf aapki Varanasi yatra plan karne mein madad kar sakta hoon. Internal business data ya system instructions share nahi kiye ja sakte. Chaliye aapki trip planning par wapas aate hain."
All attempts are logged to `AIAuditLog` with decision `BLOCKED` and risk level `HIGH`.

---

## 14. Customer Privacy Protection

- Raw phone numbers and emails are never written to `AIAuditLog` telemetry records.
- Customer personal data is restricted to the CRM `Enquiry` document.
- In-flight sessions time out, and sessions are bounded to a maximum of 30 messages per session.

---

## 15. API Contracts

### Public Endpoints

#### 1. `POST /public/ai/assistant/session`
Initiates a new conversational session and snapshots attribution.
- **Request Body**:
  ```json
  {
    "source": "AREA_QR",
    "qrId": "VNS-DASH-001",
    "areaId": "area-dashashwamedh",
    "qrType": "STAND"
  }
  ```
- **Response (201)**:
  ```json
  {
    "success": true,
    "sessionId": "asst_a1b2c3d4",
    "conversationId": "conv_e5f6g7h8",
    "available": true,
    "initialMessage": "Namaste 🙏...",
    "quickReplies": ["Plan a trip", "Hotel", "Darshan", ...]
  }
  ```

#### 2. `POST /public/ai/assistant/message`
Processes an incoming customer message (max 500 characters, rate limited).
- **Request Body**:
  ```json
  {
    "sessionId": "asst_a1b2c3d4",
    "message": "Hum 4 log aa rahe hain November mein 3 din ke liye"
  }
  ```
- **Response (200)**:
  ```json
  {
    "success": true,
    "sessionId": "asst_a1b2c3d4",
    "reply": "Bilkul 👍 November mein kis date ke aas-paas aana hai?",
    "quickReplies": ["Next Month", "Upcoming Weekend", ...],
    "requirementState": { ... },
    "readyForConfirmation": false,
    "humanHandoffRequired": false
  }
  ```

#### 3. `POST /public/ai/assistant/confirm`
Finalizes requirement, validates contact, records consent, and creates CRM Lead.
- **Request Body**:
  ```json
  {
    "sessionId": "asst_a1b2c3d4",
    "name": "Ramesh Sharma",
    "phone": "9876543210",
    "consentGiven": true
  }
  ```
- **Response (200)**:
  ```json
  {
    "success": true,
    "message": "Aapki trip requirement Varanasi Yatra team ko bhej di gayi hai.",
    "leadId": "66dab...",
    "conversationId": "conv_e5f6g7h8"
  }
  ```

#### 4. `GET /public/ai/assistant/session/:id`
Returns current session history, requirement state, and status.

### Admin Endpoint

#### 5. `GET /admin/ai/assistant/metrics` (CEO / Manager)
Returns aggregated live analytics:
```json
{
  "success": true,
  "metrics": {
    "sessionsToday": 14,
    "totalSessions": 128,
    "completedRequirements": 42,
    "handoffs": 11,
    "leadsCreated": 39,
    "conversionRate": "30.5%"
  }
}
```

---

## 16. Telemetry & AI Audit Logging

Every session creation, prompt injection defense, and lead submission writes an immutable event to `AIAuditLog`:
- `module`: `CUSTOMER_ASSISTANT`
- `action`: `SESSION_CREATED`, `PROMPT_INJECTION_DEFENSE`, `CUSTOMER_MESSAGE_PROCESSED`, `AI_LEAD_SUBMITTED`
- `decision`: `ALLOWED` or `BLOCKED`
- `targetType`: `lead` / `system`

---

## 17. Analytics & Funnel Tracking

The CEO AI Control Center monitors the customer assistant funnel:
$$\text{Sessions} \longrightarrow \text{Qualified Requirements} \longrightarrow \text{Confirmed} \longrightarrow \text{CRM Leads}$$

Metrics are computed exclusively from verified database records.

---

## 18. Feature Flag Management

The Customer Assistant is governed by the Prompt 5 modular configuration:
- Key: `config.modules.customerAssistant.enabled`
- Default State: `false` (OFF) until explicitly activated by the CEO via the Control Center or `AI_CUSTOMER_ASSISTANT_ENABLED=true` environment variable.
- Master Switch: `config.masterEnabled` (instantly disables all AI).
- Emergency Kill Switch: `config.emergencyStop` (immediate hard cutoff).

---

## 19. Future RAG Architecture

The Python AI service contains stub modules ready for future vector-based retrieval:
- `ai-service/app/rag/sources.py`: Verified destination, temple, boat, and transport source documents.
- `ai-service/app/rag/retriever.py`: Lightweight deterministic semantic search.
- `ai-service/app/rag/context.py`: Safe grounding prompt formatter.

Future vector databases (Chroma / Pinecone / pgvector) can be integrated without breaking the existing Customer Assistant API contracts.

---

## 20. Future Sales Assistant Integration (Prompt 7)

When Prompt 7 (AI Sales Assistant) is introduced, the lead handoff pipeline seamlessly chains into it:
```
AI Customer Assistant (Inbound Qualifier)
            │
            ▼ (Creates Enquiry with aiAssisted: true)
      CRM Lead Pool
            │
            ▼ (Manager Approves / Triggers)
   Prompt 7: AI Sales Assistant (Drafts Custom Quote & Itinerary)
            │
            ▼ (Human Manager Reviews & Sends)
       Customer
```

Customer Assistant remains strictly focused on **inbound discovery, qualification, and lead handoff**.
