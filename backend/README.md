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

### Safe Schema Initialization
Tables are created safely via `init_db()` using SQLAlchemy's idempotent `Base.metadata.create_all()`. This executes `CREATE TABLE IF NOT EXISTS` and will **never reset, drop, or overwrite** existing tables or data. In a future production phase, formal schema migrations will be handled via Alembic.

---

## 🧪 Running Automated Tests

Run the full pytest suite (health + medicine master):
```powershell
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\python.exe -m pytest backend/tests -v
```

All **16 automated tests** execute against an isolated in-memory test database, guaranteeing that real pharmacy data is never altered:
1. `test_root_endpoint`: Verifies API welcome metadata, MySQL dialect, and documentation URLs.
2. `test_api_health_endpoint`: Confirms `GET /api/health` returns status `ok`.
3. `test_database_health_endpoint`: Validates `GET /api/health/db` probe schema and sanitized diagnostics.
4. `test_root_health_aliases`: Ensures root `/health` and `/health/db` mirror the `/api` routes.
5. `test_cors_preflight_and_headers`: Tests allowlist for `http://localhost:5173`.
6. `test_cors_rejected_for_disallowed_origin`: Verifies rejection of untrusted origins.
7. `test_database_error_sanitization`: Verifies regex masking of MySQL passwords in error messages.
8. `test_masked_database_uri`: Confirms `masked_database_uri` obscures passwords in connection strings.
9. `test_create_valid_medicine`: Confirms creating a medicine with full attributes.
10. `test_reject_invalid_or_missing_required_fields`: Tests 422 errors on missing name, whitespace-only name, and negative reorder level.
11. `test_handle_duplicate_records`: Validates 409 Conflict on exact name + brand duplicates, while allowing different brands of the same generic salt.
12. `test_list_and_search_medicines`: Validates pagination, multi-field search, and category filtering.
13. `test_get_medicine_by_id`: Validates retrieval by primary key and 404 on missing record.
14. `test_update_medicine`: Validates partial updates (PATCH) and conflict rejection.
15. `test_deactivate_medicine`: Validates soft-deactivation (DELETE) setting `is_active=False` while preserving historical records.
16. `test_records_persist_across_sessions`: Confirms records persist across separate database sessions.
