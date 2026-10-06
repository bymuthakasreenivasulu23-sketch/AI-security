# TrustLens AI — Dark Pattern & Privacy Trap Detector

TrustLens AI is a production-grade, privacy-first cybersecurity and consumer protection platform. It combines local browser DOM analysis with Google Gemini reasoning to detect deceptive UI/UX designs, hidden fees, fake urgency timers, preselected consent checkboxes, and invasive tracking traps in real time.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Environment Variables](#environment-variables)
7. [Database Setup & Migrations](#database-setup--migrations)
8. [Development Commands](#development-commands)
9. [Building & Loading the Chrome Extension](#building--loading-the-chrome-extension)
10. [Testing the Simulated Demo Environment](#testing-the-simulated-demo-environment)
11. [How Gemini AI Integration Works](#how-gemini-ai-integration-works)
12. [Security Model](#security-model)
13. [Privacy Model & Guarantees](#privacy-model--guarantees)
14. [API Documentation](#api-documentation)
15. [Automated Test Suite](#automated-test-suite)
16. [Troubleshooting](#troubleshooting)

---

## 1. Key Features

- **30 Dark Pattern Categories**: Detects fake urgency, fake countdown timers, hidden fees, drip pricing, confirmshaming, preselected consent, subscription traps, roach motel patterns, and asymmetrical cookie choices.
- **Privacy-First Local Analysis**: Local DOM tree analysis extracts only relevant, sanitized signals (buttons, links, prices, checkboxes). **Passwords, payment cards, session tokens, and personal form inputs are strictly excluded**.
- **Deterministic & Explainable Risk Scoring**: Generates an explainable **0–100 risk score** with defined risk tiers (`LOW`, `MILD`, `MODERATE`, `HIGH`, `CRITICAL`) using mathematical severity weighting rather than arbitrary LLM output.
- **Google Gemini 3.8 Flash Engine**: Deploys `@google/genai` on the secure backend with strict prompt injection guardrails, treating all webpage content as untrusted input.
- **Privacy Policy Auditor**: Analyzes privacy policies and outputs structured breakdowns of what data is collected, why, who it is shared with, tracking and profiling practices, retention policies, and user controls.
- **Sensitive Page Auto-Pause**: Automatically pauses background scans when entering banking portals, healthcare accounts, password managers, or government identity systems.
- **Zero-Telemetry Default**: Browsing history and full HTML trees are never stored or sold. Telemetry is turned off by default.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, React Router
- **Browser Extension**: Chrome Manifest V3, TypeScript, React 19, Vite, Service Worker, MutationObserver
- **Backend**: Node.js, Express.js, TypeScript
- **AI**: Google Gemini (`gemini-3.8-flash`), official `@google/genai` SDK
- **Database**: PostgreSQL / Replit Postgres SQL compatible, connection pooling (`pg`), with resilient automatic fallback for local offline testing
- **Validation**: Zod 3.24
- **Security**: Helmet, CORS, express-rate-limit, input sanitizers, parameterized SQL

---

## 3. Architecture Overview

```text
trustlens-ai/
├── client/          # Web Application (React, Vite, Tailwind, Dashboard, Studio)
├── extension/       # Manifest V3 Chrome Extension (Popup, Options, Content Script, Worker)
├── server/          # Express API server (Controllers, Routes, AI engine, Middleware, DB)
├── shared/          # Shared TypeScript types, Zod schemas, and Constants
├── migrations/      # PostgreSQL migrations (001_init.sql with UUID keys & constraints)
├── tests/           # Unit, Integration, and Security Test Suites
├── package.json     # Monorepo workspaces & orchestrating scripts
└── .env.example     # Environment template
```

---

## 4. Prerequisites

- **Node.js**: `v20.0.0` or higher (verified on Node `v24`)
- **npm**: `v10.0.0` or higher
- **PostgreSQL** *(optional for development)*: Running instance or connection string (`DATABASE_URL`). If not running, TrustLens utilizes an in-memory repository implementing identical constraints.
- **Google Gemini API Key**: Obtain a key from Google AI Studio.

---

## 5. Installation & Setup

Clone the repository and install all workspace dependencies from the root directory:

```bash
# Install all monorepo dependencies
npm install

# Setup environment configuration
cp .env.example .env
```

---

## 6. Environment Variables

Configure your `.env` file in the workspace root:

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | API server listening port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/trustlens_ai` |
| `GEMINI_API_KEY` | Google Gemini API key | *(your API key)* |
| `SESSION_SECRET` | Session encryption secret | *(min 32 character string)* |
| `CORS_ORIGIN` | Allowed web origins | `http://localhost:5173,http://localhost:5000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit timeframe | `900000` (15 mins) |
| `RATE_LIMIT_MAX_REQUESTS`| General endpoint limit | `100` |
| `AI_RATE_LIMIT_MAX_REQUESTS`| AI analysis endpoint limit | `20` |

---

## 7. Database Setup & Migrations

If using a local or cloud PostgreSQL instance:

```bash
# Run PostgreSQL migration
npm run db:migrate
```

The database initializes 5 tables with UUID primary keys, foreign key constraints, check constraints, and performance indexes:
- `users`: User identity
- `user_settings`: User preferences (auto scan, sensitive protection, thresholds)
- `scans`: Metadata of inspected pages (score, level, counts)
- `findings`: Evidence-based dark pattern findings
- `feedback`: User feedback (accurate / false positive)

---

## 8. Development Commands

Run development servers concurrently:

```bash
# Start backend API (port 5000) and frontend client (port 5173) concurrently
npm run dev

# Run TypeScript typechecks across all workspaces
npm run typecheck

# Run automated test suite
npm run test

# Production build of all packages (shared, server, client, extension)
npm run build
```

---

## 9. Building & Loading the Chrome Extension

### Build the Extension:
```bash
npm run extension:build
```
This generates the ready-to-load extension directory in `extension/dist/`.

### Load Extension in Google Chrome:
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the upper-right corner.
3. Click the **Load unpacked** button in the upper-left.
4. Select the folder: `c:\Users\bymut\OneDrive\Desktop\HACKATHON 2\extension\dist`.
5. The **TrustLens AI** icon will appear in your Chrome toolbar. Pin it to monitor live pages.

---

## 10. Testing the Simulated Demo Environment

TrustLens includes an intentionally simulated test lab containing 6 classic dark patterns:

1. **Fake Countdown**: `"Offer expires in 00:29!"`
2. **Hidden Fee**: `"Mandatory Service Fee: +$6.50"` revealed only in the final step.
3. **Prechecked Consent**: `"Personalized advertising"` pre-selected.
4. **Confirmshaming**: `"No, I prefer paying full price and wasting money"`.
5. **Subscription Trap**: `"Start Free 7-Day Trial"` that quietly auto-renews at \$119/year.
6. **Privacy Trap**: `"Allow personalized cross-site tracking cookies"` preselected.

To test:
- Start the app with `npm run dev` and navigate to: **`http://localhost:5173/demo`**
- Click **"Scan This Page With TrustLens"** to verify live detection.
- Or click the TrustLens extension icon in Chrome while viewing the page.

---

## 11. How Gemini AI Integration Works

- **Backend-Only Execution**: The Gemini API key is **never** sent to the browser extension or React client bundle.
- **Prompt Injection Defense**: All DOM signals are passed through strict sanitization filters that disarm prompt override attempts (`"ignore previous instructions"`, `"reveal system prompt"`).
- **Cautious Legal Phrasing**: System instructions mandate objective wording (`"appears to"`, `"may"`, `"indicates"`) and forbid unfounded legal accusations.
- **Evidence Verification**: If evidence is insufficient, the system returns no findings rather than inventing false claims.
- **Zod Output Validation**: Model output is parsed and validated against strict Zod schemas. If the model returns malformed JSON, a fallback heuristic engine provides reliable deterministic results.

---

## 12. Security Model

- **Helmet**: Enforces strict Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and X-Frame-Options.
- **Rate Limiting**: Defends against denial-of-service and protects AI execution budgets.
- **Input Sanitization**: Scrubs credit card numbers (Luhn/regex), Social Security numbers, and JWT tokens before analysis.
- **Data Isolation**: All scan queries and settings lookups are derived strictly from the authenticated user token, never from browser-provided request body IDs.
- **Safe Error Handling**: Stack traces are never leaked in API responses.

---

## 13. Privacy Model & Guarantees

1. **Passwords and Payment Fields**: Form fields of type `password` or `hidden` are never read.
2. **No Full HTML Transmission**: The extension only transmits compact, structured JSON signals.
3. **Telemetry Disabled by Default**: Users must explicitly opt-in if they want to share telemetry.
4. **Right to Erasure**: Users can permanently purge all stored scan records with one click in the Settings tab.

---

## 14. API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and service status |
| `POST` | `/api/analyze` | Evaluates page signals and returns findings + risk score |
| `GET` | `/api/scans` | Paginated list of scans for the authenticated user |
| `GET` | `/api/scans/:id` | Detailed scan report and findings |
| `DELETE` | `/api/scans/:id` | Deletes a scan report |
| `POST` | `/api/findings/:id/feedback` | Records user feedback (accurate / false positive) |
| `GET` | `/api/settings` | Retrieves user settings |
| `PUT` | `/api/settings` | Updates user settings |
| `DELETE` | `/api/settings/data` | Permanently deletes all user scans and feedback |
| `POST` | `/api/privacy-summary` | Summarizes and audits privacy policy text |
| `POST` | `/api/page-signals` | Pre-flight validation of local DOM signals |

---

## 15. Automated Test Suite

Run all tests:
```bash
npm run test
```

The test suite covers:
- **Unit Tests**: Deterministic risk scoring mathematical weights, Zod schema validations, malformed AI response handling.
- **Security Tests**: Prompt injection neutralization, payment card and credential scrubbers, sensitive URL detection.
- **Integration Tests**: Database user isolation (preventing cross-user scan access), SQL injection parameterization, heuristic dark pattern analysis.

---

## 16. Troubleshooting

- **Extension Cannot Connect to Backend**:
  Ensure the backend server is running (`npm run dev:server`). If using a custom port or domain, open the extension Options page and verify the API Base URL is set to `http://localhost:5000/api`.
- **Database Connection Warning**:
  If PostgreSQL is not running locally, TrustLens automatically activates its resilient in-memory repository. All features, scans, and settings will work seamlessly.
- **Gemini Rate Limit Exceeded**:
  Wait for the rate limit window to refresh, or adjust `AI_RATE_LIMIT_MAX_REQUESTS` in `.env`.
