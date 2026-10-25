# MEDICURE PHASE 8: FULL-PROJECT ARCHITECTURE, RELIABILITY & READINESS AUDIT

- **Audit Date:** October 25, 2026
- **Auditor Roles:** Senior Full-Stack Engineer, ML Engineer, QA Engineer, Application Security Reviewer
- **Scope:** Entire Medicure Healthcare Application (`smart-health-assistant`)
- **Mode:** Read-Only Forensic Architecture & Readiness Assessment
- **Status:** Complete & Formally Documented

---

## 1. Executive Summary & Readiness Verdict

### Overall Readiness Verdict: **NOT PRODUCTION READY**
*(Academic Prototype / Development Baseline)*

While Medicure possesses several well-engineered individual modules—notably the **Phase 4–7 candidate skin classification model (`skin_model_v2.h5`)**, a **195,605-record indexed Indian pharmaceutical database**, and a **clinically grounded Gemini chatbot with hardcoded suicide/cardiac crisis guardrails**—the application as a whole cannot be deployed in a clinical, commercial, or public production setting.

### Primary Architectural & Reliability Blockers:
1. **Critical Patient Safety Hazards in UI:** Multiple emergency and care workflows—such as the **Emergency SOS button**, **Specialist Appointment Booking**, and **Ambulance Dispatch**—display misleading success toasts (e.g. *"EMERGENCY SOS BROADCAST SENT TO DISPATCHERS!"*, *"Confirmation SMS sent!"*, *"Ambulance dispatched!"*) when **no external dispatch service, SMS gateway, or backend booking record is ever executed**.
2. **Missing Authentication Enforcement & Zero Multi-Tenancy:** Although JWT user authentication (`/api/auth/register`, `/api/auth/login`) is implemented, **not a single route across the rest of the backend enforces or verifies JWT tokens**. Medical history logs (`/api/history`) and medication reminders (`/api/reminder`) are stored in shared global tables with no `user_id` foreign keys; anyone can read, create, or wipe all historical patient records (`DELETE /api/history/clear`).
3. **Machine-Locked Artifact Paths:** Backend inference routes (`skin.py`, `disease.py`, `medicine.py`, `friend_chat.py`) contain hardcoded Windows absolute paths pointing to developer conversation scratch directories (`C:\Users\prash\.gemini\antigravity\brain\...`). In a clean checkout, Docker container, or cloud server, these models and databases fail to resolve.
4. **Voice Inference Feature Mismatch:** The Parkinson's voice model expects 22 tabular MDVP laboratory features, but the audio processing endpoint extracts 17 acoustic signal parameters. Consequently, **the trained ML model fails on every uploaded recording**, silently falling back to an unvalidated heuristic rule.
5. **Zero Native Test Suite in Source Tree:** The project contains no unit tests, integration tests, or end-to-end tests within its repository tree (`medicure_src/smart-health-assistant`). All existing tests reside in external scratch directories.

```
+------------------------------------------------------------------------------------+
|                               MEDICURE SYSTEM MATURITY                              |
+------------------------------------------------------------------------------------+
|  Core AI & Search       |  Skin v2 CNN (71.2% Bal Acc), 195k Medicine DB, Medi Chat | [PASS - Core]
|  Security & Auth        |  Unprotected Routes, Zero Multi-Tenancy, Hardcoded Secrets| [FAIL - Critical]
|  Patient Safety Flow    |  Fake SOS/Dispatch/Booking Toasts Without Integration     | [FAIL - Critical]
|  Portability & DevOps   |  Hardcoded Machine Scratch Paths, Windows-Only Scripts    | [FAIL - High]
|  Voice ML Pipeline      |  17-Feature Audio vs 22-Feature Model Incompatibility     | [FAIL - High]
|  QA & Test Readiness    |  0 Tests in Source Repository, No CI/CD Pipeline          | [FAIL - High]
+------------------------------------------------------------------------------------+
```

---

## 2. Actual Repository Architecture & Inventory

### 2.1 Technology Stack

| Layer | Framework / Library | Version | Role in Application |
| :--- | :--- | :---: | :--- |
| **Frontend** | React | 19.2.4 | Single Page Application (SPA) UI |
| **Build Tool** | Vite | 8.0.1 | Frontend Bundler and Dev Server (Proxying `/api` $\to$ `8000`) |
| **Mobile Shell** | Capacitor | 8.2.0 | Mobile wrapper configuration (Android targets) |
| **Backend** | FastAPI | $\ge$ 0.110.0 | High-performance asynchronous REST API |
| **Server** | Uvicorn | $\ge$ 0.28.0 | ASGI HTTP Server |
| **Database ORM** | SQLAlchemy | $\ge$ 2.0.0 | Object Relational Mapping |
| **Primary DB** | SQLite (`medicines.db`) | 3.x | Users, Doctors, Ambulances, History, Reminders (7 tables) |
| **Reference DB** | SQLite (`medicine_expanded.db`) | 3.x | 195,605 Indian pharmaceutical formulations (483 MB) |
| **Deep Learning** | TensorFlow CPU | 2.20.0 | MobileNetV2 CNN skin disease classification |
| **Machine Learning**| Scikit-Learn | 1.4.0 | TF-IDF disease classifier, CalibratedClassifierCV |
| **Audio DSP** | Librosa | 0.10.1 | Acoustic audio feature extraction (MFCC, pitch, jitter, shimmer) |
| **Optical OCR** | PyTesseract | $\ge$ 0.3.10 | Optical Character Recognition for medicine packaging |
| **Generative AI** | Google Generative AI | 0.7.0 *(Deprecated)* | Gemini 1.5 Flash for report analysis, visual check & chat |
| **Auth & Crypto** | Bcrypt / Python-Jose | 3.3.0 | Password hashing and JWT generation |

### 2.2 Component Directory Structure

```
smart-health-assistant/
├── backend/
│   ├── app/
│   │   ├── database.py              # SQLite schema & seed logic (7 tables)
│   │   ├── main.py                  # FastAPI app entry & router inclusions
│   │   ├── models/
│   │   │   ├── train_skin.py        # Skin model training script (v2 pipeline)
│   │   │   └── skin_dataset_organized/ # 2,060 raw skin images (4 classes)
│   │   └── routes/                  # 14 REST API routers
│   ├── database/
│   │   ├── build_expanded_db.py     # ETL pipeline for 195k medicine database
│   │   ├── medicines.db             # Primary SQLite application database
│   │   └── database/medicines.db    # Accidental duplicate nested database
│   ├── models/
│   │   ├── disease_model.pkl        # Legacy v1 disease model
│   │   ├── disease_metadata.pkl     # Legacy v1 disease metadata
│   │   ├── skin_model.h5            # Baseline v1 skin model
│   │   ├── skin_model_classes.json  # Skin class index mapping
│   │   ├── train_disease.py         # Disease model training pipeline
│   │   └── voice_model.pkl          # Tabular 22-feature Parkinson's model
│   ├── .env                         # Environment keys (GEMINI_API_KEY, DEEPSEEK_API_KEY)
│   └── requirements.txt             # Python dependencies manifest
├── frontend/
│   ├── public/                      # Static assets & herb graphics
│   ├── src/
│   │   ├── App.jsx                  # Root state, authentication wrapper & router
│   │   ├── components/Toast.jsx     # Global notification toast renderer
│   │   └── pages/                   # 22 React Page Components
│   ├── .env                         # VITE_API_BASE_URL=http://localhost:8000
│   ├── package.json                 # Frontend dependencies (React 19, Capacitor)
│   └── vite.config.js               # Dev server with proxy to backend port 8000
├── ml_workspace/
│   ├── data/
│   │   ├── disease_dataset.csv      # 45-row medical condition reference CSV
│   │   └── parkinsons.data          # 195-sample UCI Parkinson's dataset
│   └── train_voice_model.py         # Voice model training script with GroupKFold
├── package.json                     # Root orchestrator (concurrently running front/back)
├── run_servers.ps1                  # Hardcoded PowerShell startup loop
└── setup.ps1                        # Hardcoded PowerShell environment setup
```

---

## 3. Module-by-Module Audit & Evidence

Every functional module in the codebase was traced end-to-end from frontend UI through backend logic, models, databases, and third-party APIs:

| Module Name | Implementation Type | Key Files (UI / Route) | Backend Route / Target | Status | Verification Evidence / Summary |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Skin Problem Detector** | MobileNetV2 CNN Deep Learning | `SkinAnalyzer.jsx`<br>`skin.py` | `POST /api/skin/analyze` | **Partially Functional (Working with Local Path)** | Verified in Phase 7: Candidate v2 achieves **71.15% balanced accuracy** and **64.29% severe acne recall**. However, `skin.py` loads `skin_model_v2.h5` via a hardcoded scratch directory path; in clean environments it silently falls back to inferior v1 model. |
| **Disease Predictor** | TF-IDF + Calibrated Random Forest | `DiseasePrediction.jsx`<br>`disease.py` | `POST /api/disease/predict` | **Partially Functional** | Real NLP pipeline with OOD rejection. However, the model was trained on an augmented 45-row dataset (`disease_dataset.csv`) with cross-partition leakage. v2 model artifact is located only in scratch directory. |
| **Medicine Verification (QR / Batch)** | SQLite Registry Lookup | `MedicineDetection.jsx`<br>`medicine.py` | `GET /api/medicine/verify` | **Working** | Correctly queries `medicines.db`. Increments scan counts; marks batches as suspicious after 15 scans. Returns honest `not_found` without fabricating records. |
| **Medicine Search & Suggestions** | SQLite B-Tree Index Search | `MedicineDetection.jsx`<br>`medicine.py` | `GET /api/medicine/search`<br>`GET /api/medicine/suggest` | **Partially Functional (Working with Local DB)** | High-speed substring search over 195,605 products. However, `medicine_expanded.db` is 483 MB and resides solely in the developer scratch directory; missing in standard repo path. |
| **Packaging OCR Authenticator** | Tesseract OCR + Keyword Rules | `MedicineDetection.jsx`<br>`medicine.py` | `POST /api/medicine/analyze-image` | **Fragile / Heuristic** | Uses `pytesseract` to extract text and checks for 9 brand names vs 6 suspicious words. Fails if Tesseract binary is not installed on OS. Not a visual packaging authenticity model. |
| **AI Medical Chatbot ("Medi")** | External GenAI (Gemini) + DB Grounding | `FriendChat.jsx`<br>`friend_chat.py` | `POST /api/friend-chat/message` | **Working (Requires Key & DB)** | Verified hardcoded suicide/cardiac crisis interceptor; verified drug grounding retrieval from 195k DB; calls Gemini 1.5 Flash. Requires active `GEMINI_API_KEY`. |
| **Pathology Report Analyzer** | External GenAI (Gemini) Multimodal | `ReportAnalyzer.jsx`<br>`report.py` | `POST /api/report/analyze` | **Partially Functional** | Calls Gemini 1.5 Flash to summarize report images. Fails completely on PDF documents despite UI claiming "Supports PDF Scans". |
| **Visual Symptom Checker** | External GenAI (Gemini) Multimodal | `VisualChecker.jsx`<br>`visual_check.py` | `POST /api/visual-check/analyze` | **Working (Requires Key)** | Sends user symptom photo to Gemini 1.5 Flash with structured medical observation prompt and safety filter recovery. |
| **Voice / Parkinson's Detection** | Acoustic DSP + Tabular ML / Heuristics | `VoiceDetection.jsx`<br>`voice.py` | `POST /api/voice/analyze` | **Broken ML / Heuristic Fallback** | `voice_model.pkl` expects 22 tabular MDVP features, but `extract_features_from_audio` extracts 17 audio features. Model inference ALWAYS crashes, permanently triggering the heuristic rule. |
| **Meditation & Wellness** | Static JSON API + Client Timer | `Meditation.jsx`<br>`meditation.py` | `GET /api/meditation/techniques` | **Working** | Returns 4 meditation protocols and breathing guides. Client-side timer and local history storage. Completely functional. |
| **User Authentication** | Bcrypt + Python-Jose (JWT) | `Login.jsx`<br>`Register.jsx`<br>`auth.py` | `POST /api/auth/register`<br>`POST /api/auth/login` | **Incomplete / Disconnected** | Generates valid JWT tokens, but **no other route in the backend validates or requires the token**. Hardcoded secret key in source code. |
| **Past Data / History** | SQLite Activity Log | `History.jsx`<br>`history.py` | `GET /api/history`<br>`POST /api/history`<br>`DELETE /api/history/clear` | **Insecure / No Multi-Tenancy** | Logs activity strings. Critical defect: history has no `user_id` column; all users share one global history log, and any user can wipe all records. |
| **Medicine Reminders** | SQLite CRUD | `MedicineReminder.jsx`<br>`reminder.py` | `GET /api/reminder/`<br>`POST /api/reminder/`<br>`DELETE /api/reminder/{id}` | **Insecure / No Multi-Tenancy** | CRUD operations work. However, reminders are not linked to user accounts. No push notifications or background alarm scheduler implemented. |
| **Find Specialist Doctors** | SQLite + Static Seed | `Doctors.jsx`<br>`doctors.py` | `GET /api/doctors/list`<br>`POST /api/doctors/register` | **Deceptive UI Booking** | Listing and doctor registration work. However, clicking "Book Consultation" triggers a fake success toast with no appointment saved to the database. |
| **Ambulance Service** | SQLite Fleet Registry | `Ambulance.jsx`<br>`ambulance.py` | `GET /api/ambulance/list`<br>`POST /api/ambulance/register` | **Deceptive UI Dispatch** | Vehicle registration works. However, clicking "Dispatch Ambulance" runs a 2-second timeout and shows a fake confirmation toast with no emergency dispatch. |
| **Emergency SOS** | Client Geolocation + History Log | `EmergencySOS.jsx`<br>*(No Route)* | `POST /api/history` | **Hazardous Mock** | Captures GPS coordinates and writes a log entry to `/api/history`, but alerts NO emergency contacts, ambulance services, or SMS gateways. |
| **Medicine Suggestions** | SQLite Query (Duplicate UI) | `MedicineSuggestion.jsx`<br>`medicine.py` | `GET /api/medicine/suggest` | **Redundant / Incomplete** | Queries `/api/medicine/suggest`. Duplicate of `MedicineDetection.jsx` Tab 3. "View Details" and "Buy Now" buttons have no onClick handlers. |
| **About Disease Catalog** | SQLite Disease Reference | `AboutDisease.jsx`<br>`disease_info.py` | `GET /api/disease-info/list` | **Fragile / Crash Risk** | Displays 10 conditions from `disease_dataset.csv`. Unhandled null check on `d.symptoms` crashes page if symptoms field is empty. |
| **Dashboard** | Client Dashboard View | `Dashboard.jsx`<br>*(No Route)* | Static Mock Data | **Cosmetic / Mock Data** | Displays hardcoded stats ("AI Model Accuracy: 99.4%", 47 medicines verified) and hardcoded recent activities. No live database statistics. |
| **Healing Music** | Embedded YouTube Iframe | `HealingMusic.jsx`<br>*(No Route)* | None | **Working Static Feature** | Embedded YouTube playlist for stress relief. Client-side only. Functional. |
| **Ayurveda Botanical Guide** | Static React Array | `Ayurveda.jsx`<br>*(No Route)* | None | **Working Static Feature** | Informative botanical guide covering 8 traditional Ayurvedic herbs. Client-side only. Functional. |
| **BMI Calculator** | Client-side Math | `BMICalculator.jsx`<br>*(No Route)* | None | **Working Static Feature** | Client-side formula $(\text{weight} / \text{height}^2)$. Categorizes weight and provides health advice. Functional. |

---

## 4. Prioritized Issue Register

### 4.1 Critical Priority Issues (P0 — Patient Safety & Security Hazards)

#### [P0-1] Deceptive Emergency SOS Alert Flow
- **Affected File:** `frontend/src/pages/EmergencySOS.jsx` (Lines 15–31)
- **Evidence:** 
  ```javascript
  const handleSOS = () => {
    setIsAlerting(true);
    addToast('🚨 EMERGENCY SOS BROADCAST SENT TO DISPATCHERS!', 'error');
    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/history', { ... });
    setTimeout(() => setIsAlerting(false), 5000);
  };
  ```
- **Hazard:** When a user experiencing an acute life-threatening emergency clicks the SOS button, the UI displays *"EMERGENCY SOS BROADCAST SENT TO DISPATCHERS!"*. In reality, **zero emergency dispatchers, SMS gateways (e.g. Twilio), or contacts are notified**; it merely saves an unread string into the local SQLite database.

#### [P0-2] Fake Doctor Booking & Ambulance Dispatch Interactions
- **Affected Files:** 
  - `frontend/src/pages/Doctors.jsx` (Lines 88–91)
  - `frontend/src/pages/Ambulance.jsx` (Lines 71–77)
- **Evidence:**
  In `Doctors.jsx`:
  ```javascript
  const confirmAppointment = (docName) => {
    addToast(`Appointment request sent to ${docName}. Confirmation SMS sent!`, 'success');
    setBookingModal(null);
  };
  ```
  In `Ambulance.jsx`:
  ```javascript
  const handleDispatch = (vehicleNo) => {
    setTimeout(() => {
      addToast(`Ambulance ${vehicleNo} dispatched to your location! Driver will call shortly.`, 'success');
    }, 2000);
  };
  ```
- **Hazard:** Both actions fabricate success messages (*"Confirmation SMS sent!"*, *"Driver will call shortly"*). No appointment table exists in `database.py`, and no dispatch API exists in `ambulance.py`. Patients in need of urgent consultation or transport receive false confirmation.

#### [P0-3] Complete Lack of Authentication Enforcement on API Routes
- **Affected Files:**
  - `backend/app/routes/auth.py` (Lines 11–15)
  - All routes in `backend/app/routes/`
- **Evidence:** `auth.py` generates JWT tokens on login, but **not a single route across the rest of the backend defines `Depends(get_current_user)` or inspects the `Authorization` header**. Every medical API route is completely open to unauthenticated public access. Additionally, `SECRET_KEY = "medicure-ai-fallback-secret-key-2026"` is hardcoded in plaintext rather than loaded from environment variables.

#### [P0-4] Zero Multi-Tenancy and Global Medical Data Exposure
- **Affected Files:**
  - `backend/app/database.py` (Lines 87–105)
  - `backend/app/routes/history.py` (Lines 25–35)
  - `backend/app/routes/reminder.py` (Lines 20–23)
- **Evidence:**
  The `History` and `Reminder` tables contain no `user_id` column. 
  `GET /api/history` returns the private medical activity history of **every user registered in the system** to any caller. 
  `DELETE /api/history/clear` permanently wipes the entire medical history table across all users without permission checks.

---

### 4.2 High Priority Issues (P1 — Architectural & Runtime Breakages)

#### [P1-1] Machine-Locked Hardcoded File Paths in Production Routes
- **Affected Files:**
  - `backend/app/routes/skin.py` (Line 30)
  - `backend/app/routes/disease.py` (Line 11)
  - `backend/app/routes/medicine.py` (Line 13)
  - `backend/app/routes/friend_chat.py` (Line 16)
- **Evidence:** All four route files contain hardcoded scratch paths:
  `r"C:\Users\prash\.gemini\antigravity\brain\14bc2de0-5fa1-424c-ae60-8cdb3e12c626\..."`
  `skin_model_v2.h5`, `disease_model_v2.pkl`, and `medicine_expanded.db` are physically located in that scratch path. On any other machine or server deployment, these paths will fail. Skin and disease will silently fall back to degraded baseline models, and medicine search will fail with 503 errors.

#### [P1-2] Voice Model Feature Dimensionality Mismatch
- **Affected File:** `backend/app/routes/voice.py` (Lines 54–88)
- **Evidence:**
  `extract_features_from_audio()` concatenates 13 MFCCs + 4 scalar acoustic features ($13 + 4 = 17$ features). 
  `voice_model.pkl` was trained on the UCI Parkinson's dataset with 22 laboratory MDVP parameters. 
  Executing `model.predict([features])` raises `ValueError: X has 17 features, but RandomForestClassifier is expecting 22 features as input`. Line 86 catches the exception and falls back to `_heuristic_prediction()`, rendering the trained ML model completely inert.

#### [P1-3] Inconsistent Frontend API Base URL Configuration
- **Affected Files:**
  - `frontend/src/pages/AboutDisease.jsx` (Line 15)
  - `frontend/src/pages/MedicineDetection.jsx` (Line 28)
  - `frontend/src/pages/MedicineReminder.jsx` (Line 50)
  - `frontend/src/pages/MedicineSuggestion.jsx` (Line 16)
- **Evidence:** These files contain raw relative fetch calls:
  `fetch('/api/medicine/suggest?symptoms=...')`
  while other pages correctly use:
  `fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/...')`
  In any environment where the frontend is served separately from the backend (e.g. production CDN, staging server), the hardcoded relative calls will target the frontend origin and fail.

#### [P1-4] Unhandled Null Pointer Exception in Disease Search
- **Affected File:** `frontend/src/pages/AboutDisease.jsx` (Lines 37–40)
- **Evidence:**
  ```javascript
  const filtered = diseases.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.symptoms.toLowerCase().includes(search.toLowerCase())
  );
  ```
  If any disease record in the database has `symptoms = NULL`, `d.symptoms.toLowerCase()` throws an unhandled `TypeError: Cannot read properties of null (reading 'toLowerCase')`, causing the entire React component tree to crash with a white screen.

#### [P1-5] Deprecated Google Generative AI SDK Dependency
- **Affected Files:**
  - `backend/app/routes/friend_chat.py` (Line 3)
  - `backend/app/routes/report.py` (Line 3)
  - `backend/app/routes/visual_check.py` (Line 3)
- **Evidence:** The runtime emits official deprecation notices:
  `All support for the 'google.generativeai' package has ended. It will no longer be receiving updates or bug fixes. Please switch to the 'google.genai' package as soon as possible.`
  This package will soon fail to receive security patches or model endpoint updates.

---

### 4.3 Medium Priority Issues (P2 — Reliability, Quality & Maintainability)

#### [P2-1] Report Analyzer Inability to Process Real-World PDF Lab Reports
- **Affected Files:**
  - `frontend/src/pages/ReportAnalyzer.jsx` (Lines 111–114)
  - `backend/app/routes/report.py` (Line 24)
- **Evidence:** `ReportAnalyzer.jsx` states `"Supports JPG, PNG, PDF Scans"`, but line 114 sets `<input type="file" accept="image/*">`, rejecting PDFs. In `report.py`, the backend unconditionally executes `Image.open(io.BytesIO(contents))`, which throws an `UnidentifiedImageError` if a PDF file is transmitted.

#### [P2-2] Data Leakage in General Disease ML Pipeline
- **Affected File:** `backend/models/train_disease.py` (Lines 62–73)
- **Evidence:** The 45-row dataset is artificially augmented via `augment_symptoms()` to create multiple synthetic combinations of the same base diseases. Then, `train_test_split(docs, labels, test_size=0.15)` is applied across the augmented list. Because identical base symptom combinations cross into both train and test partitions, the reported $>95\%$ accuracy is an artifact of data leakage.

#### [P2-3] Zero Native Automated Tests in Source Repository
- **Affected Directory:** `medicure_src/smart-health-assistant/`
- **Evidence:** A recursive scan of the repository tree reveals **zero test files** (no `tests/` folder, no `test_*.py`, no Jest/Vitest files, and no CI/CD configuration). All regression tests created in Phase 2–7 exist solely in the developer scratch folder.

#### [P2-4] Inert Placeholder Buttons in Medicine Suggestion UI
- **Affected File:** `frontend/src/pages/MedicineSuggestion.jsx` (Lines 74–77)
- **Evidence:** Each suggested medicine card displays `<button className="btn btn-outline">View Details</button>` and `<button className="btn btn-primary">Buy Now</button>`. Neither button has an `onClick` handler or route binding; clicking them performs no action.

#### [P2-5] Accidental Duplicate Directory Nesting
- **Affected Path:** `backend/database/database/`
- **Evidence:** A redundant nested folder `backend/database/database/medicines.db` was created due to path construction in `build_expanded_db.py`.

---

### 4.4 Low Priority Issues (P3 — Code Hygiene & Configuration Cleanliness)

#### [P3-1] Unused / Dead Configuration Keys
- **Affected File:** `backend/.env`
- **Evidence:** `DEEPSEEK_API_KEY` is present in `.env`, but a full codebase search confirms zero occurrences across all Python and JavaScript files.

#### [P3-2] Platform-Dependent Windows Hardcoding in Scripts
- **Affected Files:**
  - `package.json` (Line 8)
  - `run_servers.ps1` (Line 5)
  - `setup.ps1` (Line 3)
- **Evidence:** `package.json` specifies `backend: cd backend && .\\venv\\Scripts\\python.exe ...`. On Linux or macOS environments, this fails. `run_servers.ps1` and `setup.ps1` hardcode local paths: `d:\prash projects\fy project\smart-health-assistant`.

#### [P3-3] Static Fabricated Metrics Displayed on Dashboard
- **Affected File:** `frontend/src/pages/Dashboard.jsx` (Lines 3–8)
- **Evidence:** The dashboard displays `"AI Model Accuracy: 99.4%"`, `"Voice Scans Today: 12"`, and `"Medicines Verified: 47"` from a hardcoded JavaScript array. It does not fetch real operational statistics.

---

## 5. Prioritized Remediation Plan

To transition Medicure into a genuinely functional, safe, and portable application, remediation must be executed in 6 ordered milestones:

```
[Milestone 1: Safety & Deception Removal]
                    |
                    v
[Milestone 2: Security & Multi-Tenancy]
                    |
                    v
[Milestone 3: Portable Artifact Packaging]
                    |
                    v
[Milestone 4: Frontend API Uniformity & PDF Handling]
                    |
                    v
[Milestone 5: ML Pipeline Alignment (Voice & Disease)]
                    |
                    v
[Milestone 6: Native Automated Test Suite & CI/CD]
```

### Milestone 1: Deceptive Mock Decommissioning & Patient Safety (Immediate)
- **Goal:** Prevent patient harm by removing non-functional emergency dispatch and fake booking claims.
- **Tasks:**
  1. Replace the fake dispatch toast in `EmergencySOS.jsx` with prominent display of national emergency hotlines (108/102/112 in India, 911 in US) and a native `tel:` link button for immediate phone dialing.
  2. In `Doctors.jsx`, remove the fake SMS toast; either implement a real `appointments` database table with confirmation status or label the modal as an inquiry request with honest status.
  3. In `Ambulance.jsx`, replace the fake dispatch simulation with direct contact links to registered vehicle phone numbers.

### Milestone 2: Authentication Enforcement & Multi-Tenancy Architecture
- **Goal:** Protect patient health records and prevent cross-tenant data leakage.
- **Tasks:**
  1. Update `backend/app/database.py` to add `user_id = Column(Integer, ForeignKey('users.id'))` to `History` and `Reminder` tables.
  2. Implement a `get_current_user` FastAPI dependency in `backend/app/routes/auth.py` that decodes and validates JWT bearer tokens.
  3. Load `SECRET_KEY` from `os.getenv("SECRET_KEY")` with a secure random fallback warning.
  4. Protect `/api/history`, `/api/reminder`, and diagnostic routes with `Depends(get_current_user)`.
  5. Scope all queries in `history.py` and `reminder.py` strictly to `db.query(...).filter(Model.user_id == current_user.id)`.

### Milestone 3: Portable Model & Database Artifact Packaging
- **Goal:** Remove all dependencies on developer local scratch directories.
- **Tasks:**
  1. Relocate `skin_model_v2.h5` and `skin_model_v2_classes.json` from `scratch/` into `backend/models/`.
  2. Relocate `disease_model_v2.pkl` and `disease_metadata_v2.pkl` into `backend/models/`.
  3. Relocate or document the setup of `medicine_expanded.db` under `backend/database/` using environment variable `EXPANDED_DB_PATH` with a relative fallback.
  4. Remove all hardcoded `C:\Users\prash\.gemini\...` strings from `skin.py`, `disease.py`, `medicine.py`, and `friend_chat.py`.

### Milestone 4: Frontend API Client Standardization & Bug Fixes
- **Goal:** Ensure cross-environment URL consistency and eliminate runtime crash bugs.
- **Tasks:**
  1. Create a centralized API utility (`frontend/src/api/client.js`) using `import.meta.env.VITE_API_BASE_URL` and attaching the JWT Bearer token from `localStorage`.
  2. Refactor all 22 pages to use the central client, eliminating hardcoded `/api/...` calls.
  3. Fix the null check bug in `AboutDisease.jsx`: `(d.symptoms || '').toLowerCase().includes(...)`.
  4. Add PDF handling to `ReportAnalyzer.jsx` and `report.py` using `pdf2image` or `PyPDF2` to render first-page raster images for Gemini analysis.
  5. Migrate Google Generative AI integration to the official `google-genai` SDK.

### Milestone 5: Voice and Disease Machine Learning Pipeline Realignment
- **Goal:** Eliminate feature mismatches and data leakage.
- **Tasks:**
  1. For Voice Detection: Either retrain a 1D CNN / Random Forest model directly on Librosa-extracted MFCC and signal parameters, or integrate Praat-Parselmouth into the backend to compute standard MDVP parameters from uploaded audio.
  2. For Disease Prediction: Redesign `train_disease.py` using group-aware stratified cross-validation (grouping augmentations strictly by parent condition) to evaluate true out-of-sample generalization.

### Milestone 6: Native Automated Test Suite & CI/CD Pipeline
- **Goal:** Ensure long-term reliability and testability.
- **Tasks:**
  1. Create `backend/tests/` containing pytest test cases for auth, routes, input validation, and model inference.
  2. Create `frontend/src/__tests__/` with Vitest / React Testing Library for core page rendering.
  3. Set up a `.github/workflows/ci.yml` pipeline executing linting, backend tests, and frontend build on every pull request.

---

## 6. Proposed Test Matrix with Measurable Acceptance Criteria

| Test ID | Category | Target Component | Test Scenario & Input | Expected Output & Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | Safety | `EmergencySOS.jsx` | User clicks Emergency SOS button | No fake dispatch toast; immediate prominent display of national emergency telephone links (`tel:108`, `tel:112`). |
| **TEST-02** | Security | Protected Routes | Unauthenticated `GET /api/history` | Returns `HTTP 401 Unauthorized` with `detail: Not authenticated`. |
| **TEST-03** | Multi-Tenancy | `history.py` | User A creates log; User B queries `/api/history` | User B receives only User B's logs; User A's logs are completely inaccessible. |
| **TEST-04** | Portability | `skin.py` | Load model with clean environment variables | `load_skin_model()` resolves `backend/models/skin_model_v2.h5` without referencing any scratch path. |
| **TEST-05** | ML Model | `skin.py` | Inference on $N=313$ Manifest V2 test partition | Balanced Accuracy $\ge 70.0\%$; Severe Acne Recall $\ge 60.0\%$; Healthy False Alarm Rate $\le 36.0\%$. |
| **TEST-06** | ML Audio | `voice.py` | Upload valid `.webm` audio recording | Returns `model_status: "model_inference"`; feature vector dimension exactly matches model input schema without throwing `ValueError`. |
| **TEST-07** | Document OCR | `report.py` | Upload multi-page medical lab PDF | Server extracts first page; Gemini returns structured clinical analysis with `HTTP 200`. |
| **TEST-08** | Database | `medicine.py` | Query `GET /api/medicine/search?query=paracetamol` | Returns 25 indexed products in $< 100$ ms from `medicine_expanded.db`. |
| **TEST-09** | UI Resilience | `AboutDisease.jsx` | Database returns entry with `symptoms: null` | Search filter renders without throwing unhandled TypeError; displays "No symptoms listed". |
| **TEST-10** | Integration | `auth.py` + Client | Login with invalid credentials | Returns `HTTP 401 Unauthorized`; client displays toast error; no token stored. |

---

## 7. Missing Information & Limitations

1. **Third-Party Telephony / SMS Dispatch Credentials:** Verification of real SMS delivery for doctor bookings or ambulance dispatch is blocked because no Twilio, AWS SNS, or telecom gateway configuration exists in the repository.
2. **System-Level Tesseract Engine:** Packaging OCR verification depends on an external OS binary (`tesseract.exe`). In CI/CD or container environments without Tesseract pre-installed, packaging OCR will fail.
3. **Large Database Repository Storage:** `medicine_expanded.db` is 483 MB, exceeding GitHub's 100 MB single-file limit. An external storage URL (S3 / Hugging Face / Git LFS) or automated local build step is required for distribution.

---

## 8. Summary of Feature Readiness

- **Fully Functional:**
  - Gemini-powered Medical Chatbot with emergency crisis guardrails and drug grounding (when API key and DB are present).
  - Medicine Authenticity Verification via code/batch number lookup (`medicines.db`).
  - 195k Indian Pharmaceutical Search and Symptom Matcher (when expanded DB is mounted).
  - Meditation & Mindfulness protocols with interactive timer.
  - Visual Symptom Checker via Gemini 1.5 Flash.
  - Client-side BMI Calculator, Ayurveda Herb Guide, and Healing Music.
- **Partially Implemented (Require Path / Packaging Fixes):**
  - Skin Problem Classifier (High-performing Candidate v2 model works, but path is tied to scratch folder).
  - Disease Predictor (Working TF-IDF engine with OOD rejection, but trained on augmented 45-row dataset).
  - Medical Report Analyzer (Works on JPEG/PNG images; fails on PDF documents).
  - User Registration and Login (JWT issued, but unused by any other route).
- **Broken / Non-Functional:**
  - Voice / Parkinson's Detection ML Model (Feature shape mismatch; 100% falls back to heuristic rule).
  - Emergency SOS (Fake dispatch toast; no notification delivered).
  - Doctor Appointment Booking (Fake SMS confirmation; no appointments stored).
  - Ambulance Dispatch (Fake dispatch timer; no vehicle dispatched).
  - Native Repository Test Suite (0 tests in source repository).
