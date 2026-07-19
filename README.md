# Banaras Yatra 🚩

A premium, SEO-optimized spiritual tourism and travel agency portal designed for **Banaras Yatra**, a local startup coordinating customized pilgrimages and cab services across Varanasi, Ayodhya, Bodh Gaya, Chunar, Mirzapur, and Nepal.

---

## 🚀 Key Features

*   **World-Class Varanasi Destination Page:** A comprehensive sightseeing guide detailing 10 key attractions, 1-day sample timelines, food & shopping guides, travel guidelines, and 20 detailed FAQs.
*   **Scalable Routing & Layouts:** Built with `react-router-dom` to support dynamic multi-page hierarchies (`/destinations/:id`, `/packages/:id`) while preserving the custom home landing design.
*   **React 19 Native SEO Hoisting:** Dynamically updates page titles, canonical URLs, meta descriptions, Open Graph parameters, and JSON-LD structured schemas (`BreadcrumbList` & `TouristTrip` data).
*   **Reusable Component Design:** Includes custom loading skeletons (`ImageWithSkeleton.jsx`), modal package drawers (`Packages.jsx`), and a reusable secure leads collector (`BookingForm.jsx`).
*   **Conversion Rate Optimized (CRO):** Form validations scroll automatically to errors, trigger auto-redirection to WhatsApp with pre-filled itineraries, and render multi-line feedback alerts.
*   **Admin CRM Dashboard:** Toggled via a secret portal parameter (`?view=admin`) using passcode verification (`1234` by default) to let coordinators trace, update, log notes, and log transaction balances (total, advance, remaining).
*   **Static Search Indexes:** Equipped with `sitemap.xml`, `robots.txt`, and HTML fallback pages (`404.html`, `500.html`) to maximize crawlability.
*   **0-Warning Codebase:** Audited completely through `oxlint` to enforce standard React hooks dependencies and code cleanups.

---

## 🛠️ Technology Stack

*   **Frontend:** React 19, Vite, React Router 6, Tailwind CSS/PostCSS
*   **Backend Server:** Node.js, Express, Cors
*   **Cloud Stack:** Firebase Functions (Serverless endpoints), Firebase Firestore (NoSQL database)

---

## 📂 Project Architecture

```bash
├── backend/
│   ├── functions/             # Firebase Cloud Functions entry
│   │   ├── index.js           # Serverless API routes
│   │   └── package.json
│   ├── server.js              # Local Express development server
│   └── database.json          # Local file-based mock database fallback
├── public/
│   ├── 404.html               # Fallback error page
│   ├── sitemap.xml            # Dynamic search routing sitemap
│   ├── robots.txt             # Crawler allowance guidelines
│   └── *.html                 # Static legal policy frames (privacy, terms, refund)
└── src/
    ├── assets/                # Local landscape and branding images
    ├── components/
    │   ├── SEO.jsx            # React 19 Document Metadata Hoister
    │   ├── BookingForm.jsx    # Secure CRO lead submission form
    │   ├── AboutUs.jsx        # Local-focused startup narrative block
    │   ├── VaranasiDestination.jsx # World-class Varanasi sightseeing resource
    │   ├── AdminCRM.jsx       # Auth-guarded transaction manager portal
    │   └── ImageWithSkeleton.jsx # Shimmer lazy-loading layout
    ├── App.jsx                # Layout Shell & React Router routes mapping
    └── main.jsx
```

---

## 💻 Local Development Setup

### 1. Backend Engine
Run the local database and API server:
```bash
cd backend
npm install
node server.js
```
The server will run on `http://localhost:5001`.

### 2. Frontend Portal
Run the React development server:
```bash
# In the root directory
npm install
npm run dev
```
Open `http://localhost:5173` to explore. To test the CRM admin dashboard, access `http://localhost:5173/?view=admin`.

---

## 📦 Production Bundling & Linting
Run code audits and compile optimized client assets:
```bash
# Code linter check
npm run lint

# Production compiler build
npm run build
```
Compiled assets will generate inside `/dist`.
