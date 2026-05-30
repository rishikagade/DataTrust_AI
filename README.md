# DataTrust AI — Automated Data Quality Auditor

> Rules detect the issues. AI explains the business impact.

**[Live Demo](https://data-trust-7dmrekaoy-rishikagades-projects.vercel.app/)** · [Report an Issue](https://github.com/rishikagade/DataTrust_AI/issues)

---

## What It Does

Data teams waste hours manually checking datasets before analysis. Dashboards built on unchecked data produce misleading KPIs. DataTrust AI automates the audit — upload a CSV, get a scored quality report in seconds, and optionally connect any OpenAI-compatible AI provider to get plain-English explanations of what is wrong and how to fix it.

**The core design:** deterministic rules find the issues. AI explains the business impact. Raw data rows never reach the model. The full tool works without any API key.

---

## Key Features

- **11 automated validation rules** — completeness, uniqueness, type validity, outliers, date format consistency, referential integrity, and more
- **Weighted 0–100 quality score** — with severity tiers (Critical / High / Medium / Low) and a per-category breakdown showing exactly where points were lost
- **Provider-agnostic AI layer** — works with Groq, OpenAI, Together AI, or any OpenAI-compatible API via three environment variables. No key needed — the agent uses smart rule-based responses by default
- **Privacy-safe AI integration** — the AI model receives only aggregated statistics (column names, counts, percentages). No CSV rows are ever sent to any model
- **Conversational audit agent** — ask plain-English questions about your specific findings and get column-specific, data-grounded answers
- **Downloadable PDF audit report** — governance-ready document suitable for attaching to data tickets or sharing with stakeholders
- **Three built-in demo datasets** — customer data, sales transactions, and HR records with intentional quality problems seeded in

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, Tailwind CSS, Recharts, Zustand, React Router v6 |
| Backend | Python, FastAPI, pandas |
| AI | Any OpenAI-compatible API (Groq, OpenAI, Together AI, etc.) — optional |
| PDF Export | WeasyPrint |
| Deploy | Vercel (frontend) + Render (backend) |
| Tests | pytest (backend) · Vitest (frontend) |

---

## How the AI Integration Works

Before any AI call, a sanitisation function strips all raw-value fields (`sample_values`, `top_values`, `raw_values`, `row_data`) from the audit result. The AI model only ever sees structured aggregate findings:

```
Dataset: customer_master.csv  |  Rows: 5,000  |  Score: 58/100 (High Risk)

[Critical] Duplicate Key Check    | customer_id  | 1,247 rows (24.9%)
[High]     Missing Value Check    | email        | 2,068 rows (41.4%)
[High]     Duplicate Row Check    | all columns  | 847 rows (16.9%)
[Medium]   Category Consistency   | country      | 11 label variants
```

The rules engine detects. The AI translates. No exceptions.

### Provider Design

The AI layer is built on the OpenAI chat completions interface — an open standard supported by Groq, OpenAI, Together AI, Mistral, and many others. Configure your preferred provider with three environment variables and the agent works immediately. No code changes needed.

**Without any key**, the agent uses a smart rule-based fallback that produces data-specific answers directly from the audit JSON — referencing actual column names, row counts, and severity levels. The full dashboard, scoring, PDF export, and all 11 validation rules work without any AI provider configured.

---

## Architecture

```
CSV Upload → Profiler → Rules Engine (11 rules) → Scoring Engine
                                                        ↓
                                                   AuditJSON
                                                  ↙         ↘
                                          AI Summary      AI Agent
                                       (any provider    (any provider
                                        or rule-based)   or rule-based)
                                                  ↘         ↙
                                              React Frontend
                              Dashboard · Issues · Report · Downloads · Chat
```

---

## Running Locally

**Prerequisites:** Python 3.11+, Node.js 18+

```bash
# Clone and configure
git clone https://github.com/rishikagade/DataTrust_AI.git
cd DataTrust_AI
cp .env.example .env
# Optional: add AI_API_KEY to .env to enable AI-powered responses
# Without it, the agent uses smart rule-based responses — fully functional

# Start the backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Start the frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — or click **Try Demo** on the landing page to load a prebuilt audit with real findings.

### Enabling AI responses (optional)

Set these three variables in your `.env` file:

```bash
# Groq (free tier — https://console.groq.com)
AI_API_KEY=gsk_your_key_here
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile

# OpenAI alternative
# AI_API_KEY=sk_your_key_here
# AI_BASE_URL=https://api.openai.com/v1
# AI_MODEL=gpt-4o-mini
```

---

## Sample Datasets

Three datasets are included with intentionally seeded data quality problems:

| Dataset | Rows | Issues Seeded |
|---|---:|---|
| `customer_master.csv` | 5,000 | Duplicate IDs, 34% null emails, duplicate rows, 11 country label variants, impossible ages, invalid revenue strings |
| `sales_transactions.csv` | 15,000 | Mixed date formats, ship-before-order dates, negative order totals, category whitespace variants, discounts over 100% |
| `hr_employees.csv` | 1,200 | Salary outliers, department code/name inconsistency, hire-after-termination rows, status case variants |

---

## Tests

```bash
# Backend — 33 tests
cd backend && pytest -q

# Frontend — 7 tests
cd frontend && npm test

# Production build check
cd frontend && npm run build
```

---

## Privacy

Uploaded files are processed in memory and discarded after the audit completes. No CSV rows are stored in any database. When AI is enabled, the model receives only aggregated statistics — column names, counts, percentages, and severity labels. This is enforced by `sanitize_audit_context()`, which runs before every AI call and is covered by automated tests.

---

## What This Project Demonstrates

Each section highlights a different capability area. Relevant to roles in data analysis, BI, analytics engineering, data governance, and AI-assisted tooling.

**Building the audit pipeline**
- Built a full-stack data quality auditor (FastAPI + React) that runs 11 deterministic validation rules across uploaded CSV datasets — detecting missing values, duplicate keys, type mismatches, mixed date formats, referential integrity violations, and outliers — and computes a weighted 0–100 quality score with severity-ranked findings
- Designed a scoring engine where every point deducted traces back to a named rule result, so the quality score and the issue list are always consistent — a dataset with zero findings always scores 100

**Integrating AI responsibly**
- Designed a provider-agnostic AI layer using the OpenAI-compatible chat completions interface, allowing any provider (Groq, OpenAI, Together AI) to be configured via environment variables without touching the codebase
- Built an intent-aware conversational audit agent that classifies each user question (prioritisation, score explanation, business impact, remediation) and routes it to a targeted prompt — producing column-specific, count-referencing answers rather than generic advice
- Designed a smart rule-based fallback that produces data-grounded responses from the audit JSON when no API key is present — making the project fully functional and demonstrable without any external dependency
- Implemented a recursive sanitisation layer that strips all raw data fields before every AI call, enforced by automated tests — the model receives only aggregated statistics regardless of which provider is configured

**Translating findings for stakeholders**
- Designed an AI-generated four-section audit report (executive summary, risk interpretation, cleaning recommendations, dashboard impact) that translates deterministic rule findings into plain-English business narratives — downloadable as a governance-ready PDF
- Built a completeness heatmap, column risk ranking table, and severity distribution chart that communicate dataset readiness to both technical and non-technical audiences at a glance

**Pre-report and pre-model validation**
- Automated pre-dashboard data validation across 11 quality categories, reducing manual CSV inspection time and creating a documented audit trail before data is used in reporting or model training
- Validated the tool against three purpose-built datasets (5,000-row customer data, 15,000-row sales transactions, 1,200-row HR records) with intentionally seeded quality problems — confirming all expected rule categories fire and scores fall within predicted ranges

**Governance and auditability**
- Implemented a downloadable PDF audit report with timestamped findings, rule-level traceability, and a score breakdown — producing a governance artifact that can be attached to data tickets or included in compliance documentation
- Architected the audit result as a single canonical JSON object consumed by the dashboard, AI summary, PDF export, and agent — ensuring the issue list, score, and all UI components are always derived from the same source of truth

---

## License

MIT
