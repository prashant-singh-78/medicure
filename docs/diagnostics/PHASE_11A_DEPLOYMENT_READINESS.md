# Medicure Phase 11A — Deployment Readiness Evaluation

**Assessment Date:** 2026-10-25  
**Evaluation Scope:** Deployment Gate Audit across Technical, Security, Artifact, and Clinical Criteria  
**Dual-Gate Target:** (1) Academic / Educational Demo vs. (2) Production Medical System  

---

## 1. Executive Deployment Verdict

| Deployment Target | Gate Verdict | Justification Summary |
| :--- | :---: | :--- |
| **Academic / Educational Demo Deployment** | **CONDITIONALLY FEASIBLE** | All 56 regression tests pass (100%). Backend health endpoint operates cleanly (`/health` HTTP 200). Frontend builds in 173ms. Authentication, tenant data isolation, and admin RBAC defense operate as specified. Feasible for student showcase or internal demo provided `.env` is supplied and tracked DB is handled. |
| **Production Clinical Medical Deployment** | **STRICTLY BLOCKED / NOT READY** | **Severe Safety & Regulatory Blockers.** The software contains zero clinical validation, lacks regulatory clearance (FDA 510(k), CE-IVD, CDSCO), exhibits ~31% false negative miss rate on severe acne, has an uncalibrated 45-disease catalog, cannot parse negation, and cannot extract laboratory-grade MDVP parameters from web audio. Deployed clinical use is unsafe and illegal. |

---

## 2. Technical & Environmental Readiness Checklist

### 2.1 Backend Readiness
- [x] **FastAPI Application Health:** Verified. `GET /health` returns HTTP 200 `{"status": "ok", "version": "2.0"}` in 4ms.
- [x] **Root Probe:** `GET /` returns HTTP 200 `{"message": "Medicure API v2.0 is running!"}`.
- [x] **Startup Mechanics:** Uvicorn starts in ~3.0s outside sandbox with `--env-file backend/.env`.
- [x] **Database Initialization:** `app.database.init_db()` runs automatically on startup; creates SQLite tables if missing.
- [!] **Missing Optional Test Runner Package:** `fastapi.testclient.TestClient` cannot be imported because `httpx` is not installed in `backend/venv`. Does not affect production Uvicorn runtime.

### 2.2 Frontend Readiness
- [x] **Production Bundle Build:** Verified. `vite build` executes in 173ms, emitting:
  - `dist/index.html` (0.45 kB)
  - `dist/assets/index-CCwvscfp.css` (25.97 kB)
  - `dist/assets/index-qOJ-MpPI.js` (366.17 kB)
- [!] **ESLint Code Quality:** Fails with exit code 1 (18 problems: 12 errors, 6 warnings). Errors stem from React 19 / ESLint 9 rules (`no-unused-vars`, `react-hooks/set-state-in-effect`, `react-hooks/immutability`). Does not prevent bundling, but represents technical debt to clean.
- [x] **API Base URL Configuration:** Dynamically resolved via `(import.meta.env.VITE_API_BASE_URL || '') + '/api/...'`.

### 2.3 Security, Auth & Data Isolation
- [x] **Fail-Fast Secret Defense:** Application terminates on startup with `RuntimeError` if `JWT_SECRET_KEY` is missing or set to a weak placeholder.
- [x] **JWT Token Verification:** Strict cryptographic signature, expiration (60m), and claims parsing.
- [x] **Per-User Tenant Isolation:** `History` and `Reminder` records strictly scoped by `user_id == current_user.id`. Cross-tenant reads return empty lists; cross-tenant deletions return `HTTP 404 Not Found`.
- [x] **Role-Based Access Control (RBAC):** Server-side dependency `get_admin_user` protects doctor registration, ambulance registration, and medicine registration. Non-admin users receive `HTTP 403 Forbidden`.
- [x] **Registration Tampering Defense:** Client-supplied `role` parameter in `POST /api/auth/register` is strictly ignored; hardcoded to `role="user"`.
- [x] **Emergency Guardrail Filter:** Red-flag crisis keywords intercept immediately before LLM call, providing crisis hotlines (108, 102, 911, 112, 1800-599-0019).
- [x] **Report Analyzer Safety:** Direct `%PDF` uploads rejected with `HTTP 400`; only safe image formats (JPG, PNG, WEBP) accepted.

---

## 3. Storage, Hosting & Artifact Size Analysis

Hosting providers (e.g., Render, Railway, Vercel, AWS ECS) impose repository and image size limits. The model and database inventory is summarized below:

| Artifact Path | Description | File Size | Hosting Impact |
| :--- | :--- | :---: | :--- |
| `backend/models/skin_model_v2.h5` | MobileNetV2 Dermatology weights | 11.56 MB | Safe for git / container builds |
| `backend/models/skin_model.h5` | MobileNetV2 Baseline weights | 11.55 MB | Safe for git / container builds |
| `backend/models/disease_model_v2.pkl` | 45-class Calibrated Random Forest | 2.15 MB | Safe |
| `backend/models/disease_model.pkl` | 10-class Baseline Random Forest | 114 KB | Safe |
| `backend/models/voice_model.pkl` | Tabular Parkinson's Random Forest | 869 KB | Safe |
| `backend/database/medicines.db` | User accounts, auth, reminders, history | ~50 - 100 KB | **Critical Git Tracking Issue** (See Section 4) |
| `backend/database/medicine_expanded.db` | 195,605 Indian medicine records | ~70 - 90 MB | Excluded by `.gitignore`; must be built or mounted on host |
| **Total Artifact Footprint** | All models + expanded DB | **~105 MB** | Feasible for VPS/Docker; too large for serverless lambda (<50MB) |

---

## 4. Critical Deployment Blockers & Environmental Pitfalls

### Blocker 1: Sensitive Database Tracked in Git History
- **Issue:** `backend/database/medicines.db` is currently tracked in Git history.
- **Risk:** This SQLite file contains 6 registered user accounts, bcrypt password hashes, and user records. Even though `*.db` was later added to `.gitignore`, Git continues tracking previously committed files.
- **Remediation:** In Phase 11B, execute `git rm --cached backend/database/medicines.db` to remove it from the index without deleting the local file, ensuring it is never pushed to public remotes.

### Blocker 2: External Gemini API Dependency
- **Issue:** Medical Report Analyzer (`/api/report/analyze`), Visual Checker (`/api/visual-check/analyze`), and General Friend Chat (`/api/friend-chat/message`) depend on Google Gemini 1.5 Flash.
- **Risk:** If `GEMINI_API_KEY` is omitted from the deployment environment, these routes fail-closed with `HTTP 503 Service Unavailable`.
- **Remediation:** Ensure `GEMINI_API_KEY` is populated in the production secrets manager. The system correctly fails-closed with clear error messages.

### Blocker 3: Windows Sandbox Loopback Socket Restriction
- **Issue:** On Windows workstations running in restricted sandbox environments, loopback TCP calls (`127.0.0.1`) fail with `[WinError 10013]`.
- **Remediation:** Deploy on Linux container (Docker), standard Windows host, or cloud VPS where loopback TCP is permitted.

---

## 5. Production Startup Commands & Environment Configuration

### Required Environment Variables (`backend/.env`)
```bash
# Security & Cryptography (REQUIRED)
JWT_SECRET_KEY="<cryptographically_secure_random_string_min_32_chars>"
ACCESS_TOKEN_EXPIRE_MINUTES=60

# External AI Services (REQUIRED for Report & Visual Check)
GEMINI_API_KEY="<valid_google_ai_studio_api_key>"

# Optional Path Overrides (Defaults to project structure if omitted)
# SKIN_MODEL_PATH="models/skin_model_v2.h5"
# DISEASE_MODEL_PATH="models/disease_model_v2.pkl"
# MEDICINE_EXPANDED_DB_PATH="database/medicine_expanded.db"
```

### Verified Production Startup Commands

#### Backend (FastAPI / Uvicorn)
```bash
# Working directory: backend/
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 --env-file .env
```

#### Frontend (Static Hosting / Nginx)
```bash
# Working directory: frontend/
cd frontend
npm run build
# Serve dist/ via Nginx, Caddy, Vercel, or Netlify
```

---

## 6. Answers to Mandated Gate Criteria

### 1. Total Tests Discovered and Tests Remaining
- **Discovered & Executed:** **56 tests** across 3 test suites:
  - `test_phase10_integration.py`: 18 / 18 PASS
  - `test_phase9a_security.py`: 19 / 19 PASS
  - `test_phase9c_admin_security.py`: 19 / 19 PASS
- **Tests Remaining:** **0 automated tests remaining**. (100% execution pass rate).

### 2. Model-by-Model Accuracy Verification Status
- **Skin Classifier (`skin_model_v2.h5`):** **NOT VERIFIED for independent clinical generalization.** Empirical evaluation on 300 balanced samples yielded 76.33% balanced accuracy, but severe acne recall is only 69.33% (~31% false negative miss rate) and Roboflow duplicate augmentation leakage is present.
- **Disease Predictor (`disease_model_v2.pkl`):** **NOT VERIFIED.** 45-class catalog with combinatorial synthetic training augmentation leakage; cannot evaluate negation or clinical history.
- **Voice / Parkinson's (`voice_model.pkl`):** **NOT APPLICABLE.** Web audio cannot derive 22 laboratory-grade MDVP parameters; active route honestly executes an acoustic DSP baseline (`is_ml_model: False`).
- **Multimodal (Report & Visual):** **N/A.** Third-party foundation model; requires `GEMINI_API_KEY`.

### 3. Exact Cause of Backend Startup Failure & Resolution
The reported startup failure (exit code 1) was caused by two factors:
1. Running inside a restricted Windows Sandbox where loopback socket binding is blocked (`PermissionError: [WinError 10013]`).
2. Starting Uvicorn without loading `backend/.env`, which triggers a deliberate fail-fast `RuntimeError` in `get_jwt_secret_key()`.
*Resolution:* Running outside the sandbox with `--env-file backend/.env` and allowing 3.0s for TensorFlow initialization produces a 100% clean startup and HTTP 200 health check.

### 4. Is an Academic Demo Deployment Technically Feasible Today?
**YES.** An academic or educational demo deployment is technically feasible today. The backend starts cleanly, passes all 56 security and integration tests, enforces tenant isolation, builds the frontend bundle in 173ms, and includes honest crisis disclaimers and emergency hotline guardrails.

### 5. Is Production Medical Deployment Unsafe or Unverified?
**YES, STRICTLY UNSAFE AND UNVERIFIED.** Deploying this application for actual patient clinical decision-making is strictly unsafe, unethical, and medically non-compliant. The models have a ~31% miss rate on severe acne, cannot parse symptom negation, and have not been validated against diverse patient demographics or clinical reference standards.

---

## 7. Prioritized Checklist of Remaining Steps

### Immediate Next Steps (Phase 11B — Repository & Security Hygiene)
- [ ] **Step 1:** Untrack `backend/database/medicines.db` from Git history without deleting the local file (`git rm --cached`).
- [ ] **Step 2:** Ensure `.env` is never staged or committed.
- [ ] **Step 3:** Format and fix the 18 React 19 ESLint warnings in `frontend/src/`.
- [ ] **Step 4:** Provide a safe deployment runbook for hosting the demo (e.g. Dockerfile, Docker Compose).

### Long-Term Clinical & Engineering Steps (Post-Phase 11)
- [ ] **Step 5:** Acquire an independent, unaugmented, multi-institution dermatology dataset for true out-of-sample benchmarking.
- [ ] **Step 6:** Migrate symptom matching to a validated clinical ontology (e.g. SNOMED-CT / HPO) with bidirectional negation parsing.
- [ ] **Step 7:** Replace web-audio Parkinson's screening with a validated vocal analysis protocol or remove the Parkinson's label in favor of general acoustic pitch stability.
