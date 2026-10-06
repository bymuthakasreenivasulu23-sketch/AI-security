# TrustLens AI — AI-Powered Dark Pattern & Privacy Trap Detector

> **An explainable consumer protection layer for the modern web.**  
> Real-time local DOM signal extraction, Google Gemini AI reasoning, deterministic risk scoring, and zero-compromise privacy protection.

---

## 1. Problem

Every day, billions of web users encounter manipulative interface designs known as **dark patterns**:

- **Fake Urgency & Artificial Countdowns**: Timers that reset on refresh, pressuring users into rushed purchasing decisions.
- **Hidden Fees & Drip Pricing**: Sneaking mandatory handling charges and service fees into checkout at the final confirmation step.
- **Pre-Selected Consent**: Pre-ticked checkboxes that quietly enroll consumers into marketing blasts and ad networks.
- **Confirmshaming**: Emotionally coercive opt-out buttons like *"No thanks, I prefer paying full price and wasting money"*.
- **Subscription Traps (Roach Motel)**: Frictionless 1-click "Free Trial" signups paired with phone-call-only or mail-in cancellation barriers.
- **Invasive Behavioral Tracking**: Vague privacy policies and pre-selected tracking cookies harvesting personal data across websites.

These practices exploit cognitive biases, distort consumer autonomy, and inflict financial and privacy harm.

---

## 2. Solution

**TrustLens AI** is an intelligent browser extension and consumer cyber-hygiene platform that exposes deceptive design patterns in real time. 

Operating directly inside the user's browser:
1. **Extracts Local Signals**: Inspects visible buttons, links, pricing tables, checkboxes, and timers.
2. **Strict Privacy Scrubbing**: Never reads typed form inputs, passwords, credit cards, or session tokens.
3. **Dual Analysis Pipeline**: Evaluates signals with **Google Gemini (`gemini-2.5-flash`)** or an autonomous **Local Heuristics Rule Engine** if external AI keys are unavailable.
4. **Deterministic Risk Scoring**: Generates an explainable **0–100 risk score** with transparent evidence, plain-language impact breakdowns, and empowering recommendations.

---

## 3. Key Features

- **Real-Time DOM Signal Extraction**: Throttled MutationObserver captures live elements without sending full HTML trees over the network.
- **AI & Deterministic Rule Dual Pipeline**: Deep qualitative reasoning via Google Gemini, coupled with a 100% offline rule-based fallback when API credentials are not provided.
- **Transparent Analysis Mode**: Visually distinguishes whether findings were produced by **AI Analysis** or **Rule-Based Analysis**.
- **Evidence-Based Explainability**: Separates directly *Observed Evidence* from *Inferred Intent* so users understand exactly why an alert was triggered.
- **Deterministic 0–100 Risk Score**: Transparent formula weighting finding severity and confidence.
- **Privacy Policy Auditor**: Converts dense, legalistic privacy policies into clear disclosures (what is collected, who it is shared with, data retention, and user opt-out rights).
- **Sensitive Page Protection**: Automatically pauses analysis on banking, healthcare, authentication, and government portals.
- **Zero-Telemetry Default**: Browsing history and personal documents are never stored or monetized.

---

## 4. Architecture

```text
       User Visits Webpage
                │
                ▼
     [Chrome Content Script]
       • Local DOM Extraction (buttons, prices, checkboxes, timers)
       • Sensitive Input Scrubbing (passwords & card values excluded)
                │
                ▼
     [TrustLens Express API Server]
       • Input Sanitization & XSS Disarming
       • Prompt Injection Filtering
       • Zod Schema Validation
                │
         ───────┴───────
        │               │
 [Google Gemini API]   [Local Rule Engine]
 (gemini-2.5-flash)    (Autonomous Heuristic Fallback)
        │               │
         ───────┬───────
                ▼
   [Deterministic Risk Engine]
     • 0–100 Mathematical Score
     • Severity & Confidence Weighting
                │
                ▼
   [PostgreSQL or In-Memory Store]
     • Strict Tenant Data Isolation
                │
                ▼
   [Chrome Extension Popup & Dashboard]
     • Risk Level Badge
     • Observed Evidence & Why It Matters
     • Actionable Recommendations
```

---

## 5. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, React Router
- **Browser Extension**: Chrome Manifest V3, TypeScript, Content Scripts, Service Worker, Popup UI
- **Backend API**: Node.js, Express.js, TypeScript
- **AI Engine**: Google Gemini via official `@google/genai` SDK (`gemini-2.5-flash`)
- **Data Layer**: PostgreSQL (connection pool with resilient in-memory session fallback)
- **Validation**: Zod 3.24
- **Security**: Helmet, CORS, express-rate-limit, input sanitizers, XSS disarmers

---

## 6. Monorepo Structure

```text
trustlens-ai/
├── client/          # Web Application (Dashboard, Scanner, Studio, Demo Lab)
├── extension/       # Manifest V3 Chrome Extension (Service Worker, Content Script, Popup)
├── server/          # Express API server (Controllers, Routes, AI engine, DB)
├── shared/          # Shared Zod schemas, TypeScript types, and Constants
├── migrations/      # PostgreSQL migrations (001_init.sql with UUID keys)
├── tests/           # Unit, Integration, and Security test suites (22 tests)
├── package.json     # Workspace management & orchestrating scripts
└── .env.example     # Environment configuration template
```

---

## 7. Installation & Setup

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Google Chrome**: For running the Manifest V3 browser extension

### Step 1: Install Dependencies
```bash
# Clone the repository
git clone <repo-url>
cd "HACKATHON 2"

# Install all workspace dependencies
npm install
```

### Step 2: Environment Configuration
Copy the template to create `.env`:
```bash
cp .env.example .env
```

| Variable | Requirement | Purpose | Default |
|---|---|---|---|
| `PORT` | Optional | API server port | `5000` |
| `NODE_ENV` | Optional | Node environment | `development` |
| `GEMINI_API_KEY` | Optional | Google Gemini API key | *(empty = local rule fallback)* |
| `GEMINI_MODEL` | Optional | Model identifier | `gemini-2.5-flash` |
| `DATABASE_URL` | Optional | PostgreSQL connection string | *(empty = in-memory store)* |
| `CORS_ORIGIN` | Optional | Allowed origins | `http://localhost:5173,http://localhost:5000` |

---

## 8. Running Locally

### Start Both Backend and Frontend
```bash
npm run dev:all
```
- **Web Dashboard & Demo Lab**: [http://localhost:5173](http://localhost:5173)
- **Interactive Controlled Testbed**: [http://localhost:5173/demo](http://localhost:5173/demo)
- **API Health Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Standalone Service Commands
```bash
# Start backend server only
npm run dev -w server

# Start frontend client only
npm run dev -w client

# Run all unit, integration, and security tests
npm run test

# Run TypeScript checks across all 4 packages
npm run typecheck

# Build all packages for production
npm run build
```

---

## 9. Loading the Chrome Extension

1. Build the extension package:
   ```bash
   npm run extension:build
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** (toggle in upper right corner).
4. Click **Load unpacked** (button in top left).
5. Select the built directory:
   ```text
   <project-path>/extension/dist
   ```
6. The **TrustLens AI** shield icon will appear in Chrome. Pin it to your extensions bar.
7. Navigate to [http://localhost:5173/demo](http://localhost:5173/demo) and click the extension icon to test live scanning.

---

## 10. Interactive Demo Lab (`/demo`)

The Demo Lab is a controlled testbed featuring 6 live, interactive DOM test cases:

1. **Urgency & Fake Countdown**: Flash deal timer ticking with artificial stock claims.
2. **Hidden Fees & Drip Pricing**: ₹199 mandatory handling charge revealed at checkout.
3. **Pre-Selected Advertising Consent**: Pre-ticked checkbox agreeing to share data with marketing affiliates.
4. **Confirmshaming**: Opt-out button labeled *"No, I prefer paying more and wasting my money"*.
5. **Subscription Trap (Roach Motel)**: 7-day free trial auto-renewing into a recurring ₹999/mo plan.
6. **Pre-Selected Tracking Consent**: Pre-ticked checkbox enabling cross-site tracking cookies.

### Clean Mode Before/After Demo
- Each card has an **individual toggle** to demonstrate safe vs manipulative states.
- Click **"Clean Mode (All Safe)"** to turn off all 6 deceptive patterns.
- Click **"Scan Live DOM"** (or click "Scan Again" in the Chrome extension) to watch the risk score drop to **0 (Low Risk)** with a verified clean page.

---

## 11. Security Model

- **Untrusted Input Guarantee**: All text from webpages is treated as untrusted data.
- **XSS & Pseudo-Protocol Disarming**: Embedded `<script>` tags, inline event handlers (`onerror`), and `javascript:` URIs are sanitized before ingestion.
- **Adversarial Prompt Injection Defense**: System prompts use strict role delineation; adversarial strings like *"Ignore previous instructions"* are neutralized before AI reasoning.
- **Server-Side Credentials**: `GEMINI_API_KEY` is strictly confined to the backend server environment. It is never bundled into client or extension builds.
- **Tenant Isolation**: All database queries enforce user-level scoping; cross-tenant scan access and deletion attempts return `403/404`.
- **SQL Injection Defense**: Parameterized SQL queries throughout PostgreSQL and sanitized in-memory filtering.

---

## 12. Privacy Guarantees

| Data Type | TrustLens Behavior |
|---|---|
| **Passwords & Credentials** | **NEVER extracted or collected.** `<input type="password">` is completely ignored. |
| **Credit Cards & SSNs** | **NEVER collected.** Regex scrubbers redact payment cards and identification numbers. |
| **Typed Form Inputs** | **NEVER collected.** Only button labels, placeholders, and structure are inspected. |
| **Browsing History** | **NEVER tracked or sold.** Extension only scans on explicit user request or active tab inspection. |
| **Session Storage** | Scans and findings can be purged at any time via **Settings > Clear History**. |

---

## 13. Limitations & Honest Scope

- **Asynchronous SPAs**: Dynamic single-page apps that inject charges late in multi-step checkouts require clicking "Scan Again" as new DOM nodes appear.
- **Storage Mode**: When PostgreSQL is not connected, the application runs in resilient in-memory mode. Data persists during the active server session and resets upon server restart.
- **Heuristic Interpretation**: While the AI and rules are tuned for high precision, legitimate countdowns (e.g., ticket seat reservations) may occasionally trigger advisory alerts.

---

## 14. Future Improvements

- **Local WebAssembly Model**: In-browser small language models (e.g., Gemma 2B via WebGPU) for completely offline on-device AI reasoning.
- **Cross-Browser Manifest Support**: Firefox and Safari extension ports.
- **Automated FTC/EU DSA Compliance Reports**: One-click generation of regulatory complaints for unlawful drip pricing.

---

## 15. Evaluator Questions & Answers

### 1. What problem does TrustLens solve?
Manipulative user interface designs (dark patterns) mislead consumers into unintended purchases, recurring subscriptions, and unwanted tracking. TrustLens detects these patterns in real time and explains them in simple language.

### 2. Why are dark patterns difficult to detect?
Dark patterns exploit semantics and design hierarchy rather than traditional malware signatures. A button that says *"No, I prefer paying full price"* is syntactically valid HTML, but psychologically manipulative.

### 3. Why use AI?
Large Language Models like Google Gemini excel at qualitative nuance, understanding manipulative phrasing, semantic ambiguity in consent terms, and complex privacy policy disclaimers that rigid regular expressions miss.

### 4. Why use rule-based detection?
Rules are instantaneous, cost zero tokens, function completely offline, and provide predictable baseline coverage for deterministic patterns like countdown timers and pre-checked checkboxes.

### 5. Why combine AI and deterministic rules?
Rules extract and structure the initial evidence; Gemini analyzes semantic nuances; deterministic formulas calculate the 0–100 score. This ensures explainability, zero API key dependency for core demos, and eliminates arbitrary LLM hallucinations.

### 6. How do you prevent prompt injection?
Webpage text is enclosed in strict data delimiters and passed through sanitizers that strip imperative command overrides (`Ignore previous instructions`). System instructions explicitly treat all page text as untrusted observational evidence.

### 7. How do you protect user privacy?
DOM extraction ignores form values, text inputs, and password fields. All processing happens on structured element properties (tags, button text, checked states), not full page text or personal data.

### 8. Does TrustLens read passwords?
**No.** `<input type="password">` elements and form fields with sensitive attributes are explicitly excluded by the DOM extraction engine.

### 9. Does TrustLens store browsing history?
**No.** TrustLens analyzes only the specific page signals when requested, and never collects URLs across background browsing.

### 10. What happens without a Gemini API key?
TrustLens immediately and gracefully activates its local heuristic rule engine. All 6 demo patterns are detected, scored, and displayed with a transparent `"Rule-Based Analysis"` indicator.

### 11. How does risk scoring work?
Risk is calculated deterministically from 0 to 100 based on the count, severity (critical=30, high=20, medium=10, low=5), and confidence of verified findings, capped at 100.

### 12. How do you reduce false positives?
TrustLens distinguishes directly *Observed Evidence* from *Inferred Intent*. A countdown is not flagged as fake unless accompanied by commercial urgency or scarcity claims. Terms checkboxes are distinguished from marketing checkboxes.

### 13. What happens on dynamic websites?
The extension's content script monitors DOM changes using throttled MutationObservers. Users can click "Scan Again" as checkout steps progress.

### 14. How does the browser extension communicate with the backend?
The content script extracts DOM signals and sends them to the background worker/popup via `chrome.runtime.sendMessage`. The popup calls the backend REST API (`POST /api/analyze`) with a JSON payload and displays the response.

### 15. What is the biggest current limitation?
Late-stage drip pricing that is only revealed after submitting credit card details cannot be observed beforehand without user progression through the checkout funnel.

### 16. How could this scale to production?
By bundling on-device WebAssembly heuristics into the extension for instant sub-millisecond scoring, and offloading complex privacy policy audits to a scalable serverless Gemini backend with Redis caching.

---

## 16. License

MIT License. Built for ethical web browsing and consumer privacy protection.
