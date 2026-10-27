# MedStock AI — Type C Pharmacy Dashboard (Phase 1)

MedStock AI is an intelligent inventory forecasting, stockout risk mitigation, and purchase recommendation web application purpose-built for **Type C retail pharmacies** that already use digital billing software (such as Marg ERP 9+, Tally Prime, or Vyapar).

---

## 🚀 Key Features

### 1. Dashboard
- **5 High-Visibility KPI Cards:**
  - **Total Medicines** (Active SKUs in dispensary)
  - **Total Stock Units** (Strips, bottles, vials, and canisters)
  - **Low-Stock Medicines** (Items crossing reorder levels with critical alarms)
  - **Batches Nearing Expiry** (Batches expiring within configured horizon)
  - **Inventory Valuation** (Total capital tied in current inventory in ₹)
- **Historical Sales & Velocity Trend:** Interactive [Recharts](https://recharts.org) area chart showing daily gross sales, units dispensed, and antibiotic surge patterns with 7d / 14d / 30d views.
- **Critical Stockout-Risk List:** Priority medicines projected to run out before next distributor shipment.
- **Near-Expiry Risk List:** Batches nearing expiry with capital value and distributor return eligibility flags.
- **Recent Import Activity:** Live Marg ERP sync health and latest purchase bill feeds.

### 2. Master Inventory Management
- **Search & Multi-Filter Engine:** Instant filtering by medicine name, generic salt, batch number, category, stock status (Low Stock, Healthy, Out of Stock), and expiry window (<60 days).
- **Batch Inspection Modal:** Detailed view of all batches under each SKU, including rack/shelf locations (e.g., `Rack A-02`), cost vs. MRP, days to expiry, and return eligibility.
- **Physical Audit Adjustments:** Fast stock verification drawer to reconcile physical dispensary shelf counts against digital ledger numbers.

### 3. Purchase Bill Ingestion
- Ingest distributor purchase invoices (Marg ERP 9+, Tally Prime, Vyapar formats).
- Line item drilldown with free schemes (e.g., 10+1), GST rates, batch auto-registration, and total procurement spend analytics.
- **Simulate Bill Import:** Interactive modal to simulate importing new distributor shipments with instant stock restocking.

### 4. Retail Sales & POS Ingestion
- Real-time billing data synchronization monitor for Marg ERP POS counters #1 & #2.
- Session logs detailing daily customer invoices, total revenue, units dispensed, and tax collected.
- **Discrepancy Reconciliation:** Automated detection and audit resolution for cancelled bills or drawer variances.
- **Simulate Live POS Sync:** One-click trigger that simulates incoming sales bills, recalculates daily velocity, and emits toast feedback.

### 5. AI Demand Forecasting Engine
- **Demonstration Forecaster:** Clearly labeled simulation models for retail planning previews.
- **Interactive Forward Curve:** 14-day forward projections plotted with 95% upper and lower confidence intervals.
- **Epidemiological & Seasonal Surge Detection:** Automatically flags viral illness waves, monsoonal antibiotic spikes, and chronic steady refills.
- **Model Transparency:** Displays simulated MAPE (4.8%) and confidence ratings.

### 6. Risk Center & Capital Protection
- **Stockout Threat Hub:** Ranks SKUs by days of supply left, daily depletion velocity, and projected revenue loss.
- **Expiry Waste Hub:** Tracks expiring batches, capital at risk, and distributor credit memo eligibility windows.
- **One-Click Mitigations:** Generate Distributor Return Notes before cut-off dates or apply 15% clearance promotional tags.

### 7. Smart Purchase Recommendations & Auto-PO
- AI replenishment proposals calculated from consumption rate, safety stock buffers, and supplier lead times.
- Bulk and individual checkbox selection with editable order quantities.
- **Floating Order Summary Bar:** Real-time calculation of total order spend and item count.
- **Purchase Order Draft Preview:** Formatted, print-ready Purchase Order (PO) document with pharmacy drug license numbers, GSTIN, distributor billing terms, and tax breakdown.

### 8. Pharmacy Settings & State Export
- Dispensary profile: Pharmacy Name, Branch, Drug License No. (DL-20B/21B), GSTIN, and Registered Pharmacist details.
- Configurable risk thresholds: Low stock days-of-supply horizon and near-expiry warning windows (30/60/90 days).
- **JSON State Exporter:** Export complete application state to JSON to facilitate migration to Phase 2 FastAPI + PostgreSQL endpoints.
- Demo data reset button to restore default demonstration state at any time.

---

## 🛠️ Technology Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS (Modern healthcare SaaS design: light background, dark navy text `#0f172a`, emerald accents `#059669`)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Architecture:** Modular components separated into `/types`, `/data`, `/context`, `/components/layout`, `/components/common`, and `/components/pages` for seamless Phase 2 backend integration.

---

## 💻 How to Run Locally

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+ (Python 3.12 verified)
- MySQL 8.0 Server (running locally on port 3306)

### 1. Frontend Setup & Execution
```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
# Accessible at: http://127.0.0.1:5173/

# Verify production build
npm run build
```

### 2. Backend Setup & Execution (Phase 2 — MySQL)
```powershell
# Navigate to backend directory
cd backend

# Create & activate virtual environment (Windows PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install backend dependencies (FastAPI, SQLAlchemy, PyMySQL, etc.)
pip install -r requirements.txt

# Configure environment credentials (edit with your local MySQL password)
cp .env.example .env

# Run backend development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# Accessible at: http://127.0.0.1:8000/
# Interactive Swagger Docs: http://127.0.0.1:8000/docs
# API Health Check: http://127.0.0.1:8000/api/health
# MySQL Database Health Check: http://127.0.0.1:8000/api/health/db
```

---

## 🔬 Demonstration & Phase Status
- **Phase 1 (Frontend):** Type C Pharmacy Dashboard with interactive mock data engine, full inventory ledger tracking, and Recharts analytics.
- **Phase 2, Step 1 (Backend Foundation - MySQL):** FastAPI service with SQLAlchemy 2.x and PyMySQL connection pooling, CORS allowlist for Vite frontend, Pydantic schemas, password-sanitized error handling, `GET /api/health` for API health, and `GET /api/health/db` for live local MySQL probe diagnostics.
- **Phase 2, Step 2 (Medicine Master API):** Full CRUD REST API (`/api/medicines`) backed by SQLAlchemy `Medicine` model, Pydantic validation schemas, pagination, multi-field search, duplicate name/brand conflict prevention, and soft-deactivation.

