# MedStock AI — Backend (Phase 2 - MySQL Architecture)

Minimal, reliable Python + FastAPI + SQLAlchemy backend foundation for MedStock AI, connecting the existing Type C Pharmacy Dashboard to a local **MySQL** database.

---

## 🏗️ Architecture & Technology Stack

- **Framework:** FastAPI (Python 3.12+)
- **Server:** Uvicorn ASGI
- **ORM & Database Toolkit:** SQLAlchemy 2.0+
- **Driver:** `PyMySQL` (Pure-Python MySQL client) + `cryptography` (for modern `caching_sha2_password` authentication)
- **Configuration & Validation:** Pydantic 2.0+ and `pydantic-settings`
- **Testing:** `pytest` + `httpx` (FastAPI TestClient)
- **Database:** Local MySQL 8.0 Server (Default: `127.0.0.1:3306`)

---

## 📁 Directory Structure

```text
backend/
├── app/
│   ├── __init__.py               # Package metadata and version (v0.1.0)
│   ├── main.py                   # FastAPI app factory, CORS, exception handlers, lifespan
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py             # Root API router aggregator (/api)
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py         # GET /api/health and GET /api/health/db
│   │       └── medicines.py      # CRUD endpoints for Medicine Master catalog
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py             # Pydantic Settings (MYSQL_* settings, CORS origins)
│   │   └── database.py           # Engine, SessionLocal, get_db, init_db schema initialization
│   ├── models/
│   │   ├── __init__.py
│   │   └── medicine.py           # SQLAlchemy declarative Medicine model
│   └── schemas/
│       ├── __init__.py
│       ├── health.py             # Health response schemas (ApiHealthResponse, DatabaseHealthResponse)
│       └── medicine.py           # Pydantic schemas (MedicineCreate, MedicineUpdate, MedicineResponse, etc.)
├── tests/
│   ├── __init__.py
│   ├── test_health.py            # Unit & integration tests for health, CORS, & credential masking
│   └── test_medicines.py         # Full CRUD, validation, duplicates, and persistence tests (isolated in-memory DB)
├── .env.example                  # Environment configuration template with placeholders
├── .env                          # Local environment file (gitignored)
├── requirements.txt              # Pinned Python dependencies (PyMySQL, FastAPI, SQLAlchemy, etc.)
└── README.md                     # Backend documentation and MySQL setup guide
```

---

## ⚙️ Configuration & Environment Variables

Environment variables are loaded automatically from `backend/.env`. A template is provided in `backend/.env.example`.

### Key Variables

| Variable | Description | Default |
|---|---|---|
| `ENVIRONMENT` | Runtime mode (`development`, `staging`, `production`) | `development` |
| `PROJECT_NAME` | Name displayed in docs and metadata | `MedStock AI Backend` |
| `API_V1_STR` | Root path prefix for API endpoints | `/api` |
| `HOST` | Backend bind address | `127.0.0.1` |
| `PORT` | Backend listening port | `8000` |
| `CORS_ORIGINS` | Comma-separated allowlist of origins permitted to call the API | `http://localhost:5173,http://127.0.0.1:5173` |
| `MYSQL_HOST` | MySQL server hostname or IP | `127.0.0.1` |
| `MYSQL_PORT` | MySQL TCP port | `3306` |
| `MYSQL_USER` | MySQL username | `root` |
| `MYSQL_PASSWORD` | MySQL password | *(Set locally in backend/.env)* |
| `MYSQL_DATABASE` | Target database name | `medstock_ai` |
| `DATABASE_URL` | *(Optional)* Direct connection URI override | `mysql+pymysql://USER:PASS@HOST:PORT/DB?charset=utf8mb4` |

> **Security Note:** Secrets and passwords are never hardcoded. All error logs and health probe outputs automatically mask database credentials (e.g., `mysql+pymysql://root:***@127.0.0.1:3306/medstock_ai?charset=utf8mb4`) to prevent credential leakage.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Python 3.12 verified)
- **Node.js 18+** (for existing frontend)
- **MySQL 8.0 Server** (running locally on port 3306)

---

### 2. Setting Up MySQL Database

If MySQL 8.0 is running on your computer:
```sql
-- Connect via MySQL Command Line or MySQL Workbench:
mysql -u root -p

-- Create the database:
CREATE DATABASE IF NOT EXISTS medstock_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Optionally create a dedicated user (or use root):
CREATE USER IF NOT EXISTS 'medstock_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON medstock_ai.* TO 'medstock_user'@'localhost';
FLUSH PRIVILEGES;
```

---

### 3. Setting Up the Backend

#### Step 3.1: Create & Activate Virtual Environment
```powershell
# From the project root:
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
# source venv/bin/activate
```

#### Step 3.2: Install Dependencies
```powershell
pip install -r requirements.txt
```

#### Step 3.3: Configure Local Environment
```powershell
# Copy the example configuration template
cp .env.example .env

# Edit .env and enter your local MySQL password:
# MYSQL_PASSWORD=your_actual_password
```

---

### 4. Running the Backend Server

```powershell
# Option A: From backend/ directory with activated venv:
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Option B: Directly from project root:
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend is live at:
- **API Root & Welcome:** `http://127.0.0.1:8000/`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`
- **API Health Check:** `http://127.0.0.1:8000/api/health`
- **MySQL Database Health Check:** `http://127.0.0.1:8000/api/health/db`

---

### 5. Running the Existing Frontend

In a separate terminal window:
```powershell
# From project root:
npm run dev
```
The React frontend will be accessible at `http://localhost:5173/`.

---

## 🩺 Dual Health Check & Diagnostics

### 1. `GET /api/health` (FastAPI Service Status)
Confirms that the FastAPI server is running without blocking on the database:
```json
{
  "status": "ok",
  "project": "MedStock AI Backend",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-10-27T17:56:56.539789Z",
  "message": "MedStock AI Backend API is running.",
  "db_check_url": "/api/health/db"
}
```

### 2. `GET /api/health/db` (MySQL Live Connection Status)
Executes a live SQL probe (`SELECT 1;`) against MySQL:

#### When MySQL is connected:
```json
{
  "status": "ok",
  "connected": true,
  "dialect": "mysql",
  "driver": "pymysql",
  "host": "127.0.0.1",
  "port": 3306,
  "database": "medstock_ai",
  "message": "MySQL database connection is active and healthy.",
  "error_detail": null,
  "timestamp": "2026-10-27T17:57:16.714520Z"
}
```

#### When MySQL credentials require configuration:
```json
{
  "status": "degraded",
  "connected": false,
  "dialect": "mysql",
  "driver": "pymysql",
  "host": "127.0.0.1",
  "port": 3306,
  "database": "medstock_ai",
  "message": "MySQL connection failed. Ensure MySQL service is running locally on port 3306 and credentials in .env are valid.",
  "error_detail": "(1045, \"Access denied for user 'root'@'localhost' (using password: NO)\")",
  "timestamp": "2026-10-27T17:57:16.714520Z"
}
```

---

## 💊 Medicine Master REST API (`/api/medicines`)

The Medicine Master provides catalog management for drug formulations. Calculated stock quantities are excluded from this catalog master; inventory movements and batch-level tracking will be implemented separately in subsequent steps.

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `POST` | `/api/medicines` | Create a new medicine record (validates duplicate `name + brand`) | `201 Created` / `409 Conflict` |
| `GET` | `/api/medicines` | List medicines with pagination (`skip`, `limit`), search, and category filters | `200 OK` |
| `GET` | `/api/medicines/{id}` | Retrieve details of a single medicine by integer ID | `200 OK` / `404 Not Found` |
| `PATCH` | `/api/medicines/{id}` | Partially update editable fields with duplicate conflict validation | `200 OK` / `404 Not Found` / `409 Conflict` |
| `DELETE` | `/api/medicines/{id}` | Soft-deactivate a medicine (`is_active = False`) to preserve historical ledger records | `200 OK` / `404 Not Found` |

### Query Parameters for `GET /api/medicines`:
- `search` *(string, optional)*: Case-insensitive search across `medicine_name`, `brand_name`, `generic_name`, and `category`.
- `category` *(string, optional)*: Filter by exact therapeutic category.
- `is_active` *(boolean, optional)*: Filter by active status (default: returns all).
- `skip` *(integer, default 0)*: Number of records to skip.
- `limit` *(integer, default 20, max 100)*: Page size limit.

## 📦 Batch & Expiry Management REST API (`/api/batches`)

The Batch Management API enables tracking of individual drug shipments, manufacturer batch numbers, unit pricing (Numeric purchase price and MRP), and real-time calculated shelf-life analytics.

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `POST` | `/api/batches` | Register a new batch (initializes `current_stock` from `quantity_received`) | `201 Created` / `404 Not Found` / `409 Conflict` / `422 Unprocessable` |
| `GET` | `/api/batches` | List batches sorted FEFO (earliest expiry first) with pagination and filters | `200 OK` |
| `GET` | `/api/batches/{id}` | Retrieve detailed batch metrics and calculated shelf-life status | `200 OK` / `404 Not Found` |
| `PATCH` | `/api/batches/{id}` | Partially update permitted metadata (pricing, rack, supplier, dates) | `200 OK` / `404 Not Found` / `422 Unprocessable` |

### Query Parameters for `GET /api/batches`:
- `skip` *(integer, default 0)*: Pagination offset.
- `limit` *(integer, default 20, max 100)*: Maximum batches to return.
- `medicine_id` *(integer, optional)*: Filter batches by specific medicine catalog ID.
- `search` *(string, optional)*: Case-insensitive search across `batch_number`, `medicine_name`, or `brand_name`.
- `expired` *(boolean, optional)*: `true` returns only expired batches; `false` returns only non-expired active batches.
- `expiring_days` *(integer, optional)*: Filters batches expiring within `N` days from today (near-expiry horizon).

### Shelf-Life Analytics & Computed Attributes:
- `days_until_expiry`: Exact days remaining computed dynamically against reference date (`(expiry_date - date.today()).days`).
- `is_expired`: Boolean flag indicating if expiry date is in the past.
- `expiry_status`: Operational category:
  - `"expired"`: Past expiration date (`< 0` days).
  - `"near_expiry"`: Expiring within 90 days (`0 to 90` days).
  - `"normal"`: Standard shelf life (`> 90` days).

### Financial Precision & Immutability Rules:
- **Numeric Precision:** `purchase_price` and `mrp` use SQLAlchemy `Numeric(10, 2)` to eliminate IEEE 754 floating-point inaccuracies.
- **Stock Immutability:** `current_stock` and `quantity_received` cannot be modified via metadata PATCH. Stock adjustments will be managed strictly through the ledger transaction system.
- **Duplicate Protection:** Duplicate batch numbers for the same medicine are rejected via application check and database-level `canonical_batch_key` unique index (`f"{medicine_id}||{clean_batch_number}"`).

---

## 🗄️ Database Schema Evolution & Alembic Migrations

MedStock AI uses **Alembic** to manage database schema evolution safely across development and production environments.

### Migration Revisions:
1. `0001_create_medicines`: Initial schema establishing the `medicines` catalog table.
2. `0002_add_canonical_key`: Upgrades existing databases to add `canonical_key VARCHAR(512)`:
   - **Duplicate Safety Check:** Prior to schema alteration, inspects table for colliding rows. If pre-existing duplicate medicines are detected, the migration **aborts safely with a detailed `RuntimeError`** without deleting, modifying, or losing any records.
   - **Backfill:** Automatically computes and populates `f"{lower(name)}||{lower(brand)}"` for existing rows, then alters the column to `NOT NULL` with a `UNIQUE` index.
3. `0003_create_batches`: Creates the `batches` table with foreign-key constraint to `medicines.id`, check constraints, and unique compound index `canonical_batch_key`.

### Running Migrations:
```powershell
# From backend/ directory with activated virtual environment:
alembic upgrade head

# From project root:
powershell -Command "`$env:PYTHONPATH='backend'; .\backend\venv\Scripts\python.exe -m alembic upgrade head"
```

Automatic startup initialization via `init_db()` executes Alembic migrations programmatically to ensure both fresh setups and existing development instances are safely up-to-date.

---

## 🔒 Reliability & Hardening Protections

### 1. Robust Medicine & Batch PATCH Validation
- **Non-nullable Field Protection:** Explicit `null` values for `medicine_name`, `unit`, `reorder_level`, `is_active`, `expiry_date`, `purchase_price`, or `mrp` are rejected with HTTP `422 Unprocessable Entity` before reaching the database.
- **Partial Update Flexibility:** Fields omitted from the PATCH payload are untouched (partial updates).
- **Clearing Optional Fields:** Explicit `null` values are permitted for optional fields (`brand_name`, `generic_name`, `category`, `supplier_name`, `storage_location`) allowing users to deliberately clear these fields.

### 2. Database-Level Duplicate Protection
- Uniqueness is validated at two tiers:
  1. **Application Query Level:** Case-insensitive check before write.
  2. **Database Engine Level:** A normalized `canonical_key` on medicines and `canonical_batch_key` on batches enforced via unique indexes.

### 3. Safe Exception Handling & Credential Masking
- **Client Safety:** Unhandled exceptions caught by the global error handler return a generic message `{"detail": "Internal server error. Please try again later."}` with status 500. Raw tracebacks, internal database schemas, and credentials are never exposed to clients.
- **Diagnostic Logging:** The server logs full diagnostic traces with all MySQL passwords and connection strings automatically masked via `sanitize_error()`.

---

## 🧪 Running Automated Tests

Run the full pytest suite (health, medicines, batches, and migrations):
```powershell
# From project root:
powershell -Command "`$env:PYTHONPATH='backend'; .\backend\venv\Scripts\python.exe -m pytest backend/tests -v"

# Or from backend/ directory with activated venv:
pytest tests -v
```

### Test Isolation Architecture
- **Isolated SQLite In-Memory Database:** All unit and integration tests (`backend/tests/`) run using an isolated in-memory SQLite database (`sqlite:///:memory:`) configured with SQLAlchemy's `StaticPool`. This guarantees tests run deterministically and safely without mutating or requiring access to live database instances.
- **Live Database Health Probe:** The `GET /api/health/db` endpoint specifically probes the live configured **MySQL database** (`127.0.0.1:3306`). If the local MySQL server is unavailable or credentials are unconfigured, it returns HTTP 200 with `status: "degraded"` and diagnostic details without throwing unhandled exceptions.

All **39 automated tests** pass cleanly:
- **Batch API (15 tests):**
  1. `test_create_batch_success`: Full creation, unit economics, and stock initialization.
  2. `test_create_batch_missing_medicine_reference`: 404 when referencing missing medicine.
  3. `test_create_batch_duplicate_case_insensitive`: 409 duplicate rejection for same medicine; permits on different medicine.
  4. `test_create_batch_validation_negative_quantity_and_pricing`: 422 on negative quantities or prices.
  5. `test_create_batch_invalid_date_ordering`: 422 when expiry precedes manufacturing date.
  6. `test_get_batch_by_id`: 200 retrieval and 404 on nonexistent batch.
  7. `test_expiry_status_calculations_and_date_boundaries`: Boundary tests for -1, 0, 1, 90, 91 days.
  8. `test_list_batches_fefo_sorting_and_pagination`: FEFO earliest-expiry sorting and offset/limit pagination.
  9. `test_list_batches_filtering_by_medicine_search_and_expiry`: Filters by medicine, search term, expired boolean, and 30-day horizon.
  10. `test_patch_batch_metadata_preserves_stock_and_partials`: Updates metadata while keeping stock intact.
  11. `test_patch_batch_forbids_arbitrary_stock_tampering`: 422 rejection when attempting to patch quantity or stock.
  12. `test_patch_batch_rejects_explicit_null_on_non_nullable_fields`: 422 on null expiry or pricing; allows null on optional fields.
  13. `test_patch_batch_invalid_date_ordering`: 422 when updating expiry to precede manufacturing date.
  14. `test_patch_nonexistent_batch_returns_404`: 404 when patching missing ID.
  15. `test_database_level_canonical_batch_key_uniqueness`: Direct SQLAlchemy duplicate insertion triggers `IntegrityError`.
- **Alembic Migrations (3 tests):**
  16. `test_alembic_clean_upgrade_to_head`: Fresh database upgrades through 0001, 0002, and 0003.
  17. `test_alembic_upgrade_existing_database_with_backfill`: Existing DB with pre-existing rows backfills `canonical_key` safely without data loss.
  18. `test_alembic_migration_aborts_on_preexisting_duplicates`: Safe abort on duplicate existing records with zero data deletion.
- **Medicine Master & System Health (21 tests):**
  19-39. Complete coverage of root, health, database probes, credential masking, CORS allowlisting, and medicine CRUD endpoints.


