# Medicure Phase 11B — Final Deployment Preflight Report

**Audit Date:** 2026-10-25  
**Auditor:** Antigravity Agentic Deployment Gate  
**Scope:** Phase 11B Deployment Preflight Audit (Read-only, zero code mutation, zero Git staging/commits)  
**Repository Working Copy:** `D:\prash projects\fy project\smart-health-assistant` (NTFS junction at `medicure_src\smart-health-assistant`)  
**Git Branch:** `main` (Synchronized with `origin/main` at `245df33`)

---

## 1. Executive Summary

This Preflight Report establishes the technical, security, repository, and machine learning criteria required before proceeding with any deployment or repository hygiene actions.

- **Frontend Compilation:** **PROVED CLEAN**. When built from the physical directory, Vite 8 / Rolldown compiles production assets (`dist/`) in **202ms with Exit Code 0**. Cross-drive junction invocation previously triggered an absolute path error in Rolldown (`emitFile`). ESLint flags 18 cosmetic/hook issues (12 errors, 6 warnings) that fail standalone linting but do not halt Vite production builds.
- **Regression Suites:** **56 / 56 tests passed (100.0%)** across `test_phase10_integration.py`, `test_phase9a_security.py`, and `test_phase9c_admin_security.py`.
- **Live Backend & Security:** Uvicorn starts cleanly with `--env-file`, answering `GET /health` with HTTP 200 `{"status": "ok", "version": "2.0"}`. Authentication boundaries strictly reject unauthenticated calls (`HTTP 401`) and accept valid demo JWT sessions.
- **Git Security Exposure:** **CRITICAL REPOSITORY FINDING**. `backend/database/medicines.db` is actively tracked in Git index and exists in prior commit history (`29e79a9`, `8955985`, `1150101`, `62ae950`, `497bfc8`). It contains user records with bcrypt hashes. `backend/.env` has **never** been committed to Git.
- **Model Validation Status:** **NOT VERIFIED**. The 2,060 images in `skin_dataset_organized` consist 100% of Roboflow exports with 147 augmented duplicate stem groups and no independent holdout test manifest. Clinical efficacy cannot be verified.
- **Deployment Verdict:** **Academic Demo Deployment is CONDITIONALLY FEASIBLE TODAY**. **Clinical Production Medical Deployment is STRICTLY BLOCKED**.

---

## 2. Frontend Production Build & Linter Audit

### 2.1 Build Execution Analysis
The frontend build was evaluated across both working directory contexts to diagnose the previous failure:

#### Attempt A: Via Cross-Drive NTFS Junction
- **Command:** `powershell -Command "Set-Location 'medicure_src\smart-health-assistant\frontend'; npm run build"`
- **Exit Code:** `1` (Failed)
- **Observed Error:**
  ```text
  [plugin vite:build-html]
  Error: The "fileName" or "name" properties of emitted chunks and assets must be strings that are neither absolute nor relative paths, received "D:/prash projects/fy project/smart-health-assistant/frontend/index.html".
  ```
- **Root Cause Diagnosis:** `medicure_src\smart-health-assistant` is an NTFS junction on `C:` pointing to physical storage on `D:`. When Node.js and Vite 8 run with `$PWD` on `C:` while resolving module paths on `D:`, `path.relative('C:\...', 'D:\...')` cannot compute a relative path across distinct Windows drive letters. Rolldown's `emitFile` receives an absolute Windows path and intentionally throws.

#### Attempt B: Canonical Repository Physical Directory
- **Command:** `powershell -Command "Set-Location 'D:\prash projects\fy project\smart-health-assistant\frontend'; npm run build"`
- **Exit Code:** `0` (**SUCCESS**)
- **Duration:** 202ms
- **Emitted Artifacts:**
  ```text
  dist/index.html                   0.45 kB │ gzip:  0.29 kB
  dist/assets/index-CCwvscfp.css   25.97 kB │ gzip:  5.75 kB
  dist/assets/index-qOJ-MpPI.js   366.17 kB │ gzip: 99.79 kB
  built in 202ms
  ```
- **Hosting Impact:** In containerized deployments (Docker) or Linux CI runners (Vercel, Netlify, Render), all paths reside on a single mount point without NTFS junctions; the build will compile with exit code 0.

### 2.2 ESLint Code Quality Inspection
- **Command:** `npx eslint src` (executed in frontend root)
- **Exit Code:** `1` (18 problems: 12 errors, 6 warnings)
- **Breakdown of Errors:**
  1. `no-unused-vars` (6 errors): Unused error variables and handler arguments (`err`, `error`, `isStandalone`, `addToast`, `e`).
  2. `react-hooks/set-state-in-effect` (2 errors): Synchronous state mutation inside `useEffect` in `App.jsx:115` (`setUser(null)`) and `EmergencySOS.jsx:77` (`getGeolocation()`).
  3. `react-hooks/immutability` (4 errors): Function declarations invoked inside `useEffect` prior to their definition in `History.jsx`, `MedicineReminder.jsx`, and `Meditation.jsx`.
- **Build Impact:** `npm run build` (`vite build`) does not fail on ESLint rules unless a strict lint step is enforced in CI. However, these 12 errors must be remediated in Phase 11B to prevent runtime regressions and cascading renders.

---

## 3. Regression Suite Verification

All three test suites were re-executed sequentially in the backend virtual environment:

| Suite File | Scope | Tests Run | Passed | Failed | Skipped | Errored | Duration | Exit Code |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `backend/test_phase10_integration.py` | E2E API Routes & Workflows | 18 | 18 | 0 | 0 | 0 | 4.474s | **0** |
| `backend/test_phase9a_security.py` | JWT, Auth, Tenant Isolation | 19 | 19 | 0 | 0 | 0 | 10.759s | **0** |
| `backend/test_phase9c_admin_security.py` | RBAC, Admin Routes, Session Defense | 19 | 19 | 0 | 0 | 0 | 10.917s | **0** |
| **Total / Aggregate** | **All Discovered Suites** | **56** | **56** | **0** | **0** | **0** | **26.150s** | **0 (100% PASS)** |

---

## 4. Live Backend Startup & Authentication Probe

- **Execution Script:** `scratch/test_phase11b_backend.py`
- **Execution Command:** `backend\venv\Scripts\python.exe scratch\test_phase11b_backend.py`
- **Port:** `127.0.0.1:8770` with `--env-file backend/.env`
- **Results:**
  - `GET /health` -> **HTTP 200 OK**: `{"status": "ok", "version": "2.0"}`
  - `GET /` -> **HTTP 200 OK**: `{"message": "Medicure API v2.0 is running!"}`
  - `GET /api/auth/me` (No Token) -> **HTTP 401 Unauthorized**: Strictly rejected (`detail: Authentication required. Missing Bearer token...`)
  - `POST /api/auth/demo` -> **HTTP 200 OK**: Issued valid signed HS256 JWT access token (151 chars)
  - `GET /api/auth/me` (With Bearer Token) -> **HTTP 200 OK**: Returned `{"email": "demo.patient@medicure.org", "role": "user"}`
- **Verification Guarantee:** Zero secrets, passwords, or private key values were printed. Server shutdown cleanly in 0.5s without lingering background tasks.

---

## 5. Git Tracking, History & Credential Audit

### 5.1 Tracked Sensitive Files
An audit of `git ls-files` revealed that two SQLite databases are actively tracked by Git:
1. `backend/database/medicines.db`
2. `backend/database/database/medicines.db`

### 5.2 Commit History Analysis
`git log --all --oneline -- backend/database/medicines.db` shows 5 commits altering this file:
- `497bfc8`: Baseline checkpoint
- `62ae950`: Update Medicure application
- `1150101`: Update Medicure application
- `8955985`: Update gitignore
- `29e79a9`: Update gitignore

### 5.3 Security Risk & Exposure Assessment
- **What is inside `medicines.db`?** Tables for `users` (containing user email records and bcrypt password hashes), `reminders`, `history`, `doctors`, `ambulances`, `medicines`.
- **Status of `.env`:** Confirmed **CLEAN**. `git log --all -- .env` returned zero commits. Private API keys (`GEMINI_API_KEY`, `JWT_SECRET_KEY`) have **never** been committed to Git history.
- **Exposure Risk:** Because `medicines.db` is present in previous public commits, any real patient credentials or passwords stored in the database during earlier development are historically exposed.
- **Credential Rotation Requirement:**
  - All test accounts in `medicines.db` must be considered public.
  - The demo patient credentials (`DemoPatient2026!`) are non-sensitive public demo credentials.
  - Any administrative password used in prior commits must be rotated immediately.

---

## 6. Hosting Footprint & Deployment Constraints

| Category | Item | Value / Footprint | Assessment |
| :--- | :--- | :---: | :--- |
| **Model Weights** | `skin_model_v2.h5` | 11.56 MB | Compatible with Git LFS / Docker |
| **Model Weights** | `skin_model.h5` | 11.55 MB | Tracked in Git history |
| **Model Weights** | `disease_model_v2.pkl` | 2.15 MB | Compatible |
| **Model Weights** | `voice_model.pkl` | 869 KB | Compatible |
| **Expanded Database** | `medicine_expanded.db` | ~70 - 90 MB | Excluded by `.gitignore`; must be provisioned during deploy |
| **Total Artifact Footprint** | All Models + DBs | **~105 MB** | **Docker/VPS Supported; Serverless (<50MB) BLOCKED** |
| **CORS Policy** | `allow_origins` | `["*"]` | Must be restricted to frontend domain in production |
| **Frontend API Calls** | Route Consistency | `VITE_API_BASE_URL` | Mostly consistent; 3 calls in `AboutDisease.jsx`, `MedicineDetection.jsx`, `MedicineSuggestion.jsx` use relative `/api/...` and must be normalized for cross-domain hosting. |

---

## 7. Skin Model Provenance & Evaluation Verification

An exhaustive automated image audit was conducted on all 2,060 files in `backend/app/models/skin_dataset_organized`:
- **Roboflow Export Signatures (`.rf.<hash>`):** **2,060 / 2,060 (100.0%)**
- **Augmentation / Copy Filenames:** 122 images (5.9%)
- **Related Source Image Stem Groups:** **147 groups** containing identical lesions under varying augmented transformations (e.g. `acne-pustular-28_jpg.rf.c748...` vs `acne-pustular-28_jpg.rf.f221...`).
- **Independent Test Manifest:** **None found** (`test_manifest.json` does not exist).
- **Audit Conclusion:** Splitting this dataset at random without patient clustering causes near-duplicate augmented images to cross between training and test sets. True out-of-sample clinical generalizability cannot be demonstrated from this repository.
- **Retained Status:** **NOT VERIFIED**.

---

## 8. Deployment Gate Summary

1. **Academic Demo Feasibility:** **YES, FEASIBLE TODAY**.
   - With backend launched via Docker or VPS using `python -m uvicorn app.main:app --env-file .env`, and frontend served from `dist/`, the demo performs reliably.
   - All 56 regression and security checks pass.
2. **Clinical Medical Deployment:** **STRICTLY BLOCKED**.
   - ~31% severe acne false negative rate.
   - No clinical trial validation.
   - 45-condition catalog with no clinical negation handling.
