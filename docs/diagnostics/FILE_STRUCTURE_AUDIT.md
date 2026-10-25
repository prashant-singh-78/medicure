# Medicure — Comprehensive File Structure Audit

**Audit Date:** 2026-10-25  
**Auditor:** Antigravity Advanced Agentic Pair Programmer  
**Repository Branch:** `main`  
**Physical Root:** `D:\prash projects\fy project\smart-health-assistant`  
**NTFS Junction:** `C:\Users\prash\OneDrive\Desktop\fy project\medicure_src\smart-health-assistant`  
**Scope:** Complete inventory of directories, source files, datasets, model weights, database paths, and redundancy analysis.

---

## 1. Top-Level Directory Organization

```text
smart-health-assistant/
├── .vscode/               # IDE configuration & workspace settings
├── backend/               # FastAPI Python application, models, SQLite databases, regression tests
├── docs/                  # Project documentation, preflight audits, and completion reports
│   └── diagnostics/       # Diagnostic audit reports & verification gates
├── frontend/              # Vite 8 + React 19 single-page application (SPA)
├── ml_workspace/          # Standalone ML training scripts and reference datasets
├── node_modules/          # Root build dependencies (concurrently)
├── .gitignore             # Global Git ignore patterns (ignores *.db, *.env, node_modules)
├── docker-compose.yml     # Multi-container composition specification (v3.8)
├── package.json           # Root orchestration package scripts (`npm run dev`)
├── README.md              # Project overview & high-level architecture
├── run_servers.ps1        # Persistent PowerShell startup loop for development
└── setup.ps1              # Initial setup bootstrap script
```

---

## 2. Backend Architecture (`backend/`)

```text
backend/
├── app/
│   ├── models/
│   │   ├── skin_dataset_organized/      # 2,060 categorized dermatology clinical images
│   │   │   ├── Acne_Mild/               # 824 images
│   │   │   ├── Acne_Severe/             # 93 images
│   │   │   ├── Healthy/                 # 1,066 images
│   │   │   └── Rosacea_Other/           # 77 images
│   │   └── train_skin.py                # Group-aware stratified MobileNetV2 trainer
│   ├── routes/                          # 14 Modular FastAPI Routers
│   │   ├── ambulance.py                 # Emergency ambulance fleet management & dispatch
│   │   ├── auth.py                      # JWT authentication (HS256), RBAC, demo patient session
│   │   ├── disease.py                   # 45-class TF-IDF + CalibratedClassifierCV predictor
│   │   ├── disease_info.py              # Medical disease encyclopedia & consultant directory
│   │   ├── doctors.py                   # Verified doctor registration & public directory
│   │   ├── friend_chat.py               # Crisis keyword interceptor & grounded AI wellness chat
│   │   ├── history.py                   # Multi-tenant user medical event history
│   │   ├── medicine.py                  # Batch verification (genuine/fake) & 195k Indian medicine search
│   │   ├── meditation.py                # Clinical mindfulness audio sessions & timers
│   │   ├── reminder.py                  # Multi-tenant daily prescription schedule tracker
│   │   ├── report.py                    # Pathology report image OCR & analysis
│   │   ├── skin.py                      # MobileNetV2 dermatology inference
│   │   ├── visual_check.py              # Multimodal visual symptom analysis
│   │   └── voice.py                     # Librosa DSP vocal perturbation acoustic screening
│   ├── database.py                      # SQLAlchemy ORM schemas, SessionLocal, init_db()
│   ├── main.py                          # FastAPI application factory, CORS, startup hooks
│   └── __init__.py
├── database/
│   ├── build_expanded_db.py             # Script to build 195k Indian medicine database from CSV
│   ├── medicines.db                     # Active SQLite database (UNTRACKED - PRESERVED)
│   ├── medicines.db.bak                 # Local physical safety backup (UNTRACKED)
│   ├── medicine_expanded.db             # 461.5 MB SQLite database (195,605 medicines)
│   └── database/                        # [REDUNDANT NESTED FOLDER] Accidental duplicate path
│       ├── medicines.db                 # Duplicate 69,632 byte database (UNTRACKED)
│       └── medicines.db.bak             # Duplicate backup
├── models/                              # Trained ML Model Weights & Class Maps
│   ├── disease_metadata_v2.pkl          # Active 45-class disease metadata dictionary
│   ├── disease_model_v2.pkl             # Active 45-class TF-IDF pipeline
│   ├── skin_model_v2.h5                 # Active MobileNetV2 dermatology weights (11.56 MB)
│   ├── skin_model_v2_classes.json       # Active skin class mapping (Acne_Mild, Acne_Severe, etc.)
│   ├── voice_model.pkl                  # Standby voice model (route executes DSP baseline)
│   ├── disease_metadata.pkl             # Archival v1 10-class metadata
│   ├── disease_model.pkl                # Archival v1 10-class model
│   ├── skin_model.h5                    # Archival v1 baseline skin model
│   └── skin_model_classes.json          # Archival v1 skin classes
├── venv/                                # Python 3.11.1 Virtual Environment
├── .dockerignore                        # Excludes *.db, .env, venv/, __pycache__/
├── .env                                 # Local environment variables (UNTRACKED)
├── .env.example                         # Environment template with dummy placeholders
├── Dockerfile                           # Production Python 3.11 container blueprint
├── promote_admin.py                     # CLI tool to promote user to administrator
├── requirements.txt                     # Pinned Python package dependencies
├── test_phase10_integration.py          # Master integration test suite (18 tests)
├── test_phase9a_security.py             # Security and multi-tenant isolation suite (19 tests)
└── test_phase9c_admin_security.py       # Admin authorization and RBAC suite (19 tests)
```

---

## 3. Frontend Architecture (`frontend/`)

```text
frontend/
├── public/
│   ├── brand_logo.png                   # High-tech metallic red brand logo asset (1024x576 RGBA)
│   ├── favicon.svg                      # Stethoscope brand icon
│   ├── hospital_bg.png                  # Virtual hospital hero background artwork
│   ├── icons.svg                        # SVG symbol sprites
│   └── herbs/                           # Botanical illustrations for Ayurveda module
│       ├── aloe.png, amla.png, ashwagandha.png, brahmi.png,
│       ├── giloy.png, haldi.png, neem.png, tulsi.png
├── src/
│   ├── assets/
│   │   ├── brand_logo.png               # Bundled brand logo asset
│   │   ├── hero.png                     # Hero illustration
│   │   ├── react.svg                    # React framework logo
│   │   └── vite.svg                     # Vite build tool logo
│   ├── components/
│   │   └── Toast.jsx                    # Global floating feedback notification system
│   ├── pages/                           # 21 Modular Application Feature Screens
│   │   ├── AboutApp.jsx                 # Platform documentation & architecture tour
│   │   ├── AboutDisease.jsx             # Medical encyclopedia & specialist recommendations
│   │   ├── Ambulance.jsx                # Emergency trauma fleet directory & SOS booking
│   │   ├── Ayurveda.jsx                 # Holistic botanical medicine directory
│   │   ├── BMICalculator.jsx            # Body composition and healthy weight calculator
│   │   ├── Dashboard.jsx                # Tri-color Virtual Hospital Command Center
│   │   ├── DiseasePrediction.jsx        # 45-class symptom input & probabilistic prediction
│   │   ├── Doctors.jsx                  # Virtual OPD specialist registry & booking
│   │   ├── EmergencySOS.jsx             # Geolocation broadcast & 1-click crisis dispatch
│   │   ├── FriendChat.jsx               # AI wellness companion ("Medi") & crisis triage
│   │   ├── HealingMusic.jsx             # Solfeggio & binaural relaxation audio therapy
│   │   ├── History.jsx                  # User-isolated medical history timeline
│   │   ├── Login.jsx                    # Hospital portal sign-in & instant demo access
│   │   ├── MedicineDetection.jsx        # Vision batch check & 195k Indian medicine search
│   │   ├── MedicineReminder.jsx         # Scheduled prescription reminder manager
│   │   ├── MedicineSuggestion.jsx       # Keyword-grounded pharmaceutical recommender
│   │   ├── Meditation.jsx               # Mindfulness breathing exercises & neuro-timers
│   │   ├── Register.jsx                 # Patient registration portal
│   │   ├── ReportAnalyzer.jsx           # Pathology document scan & blood test OCR
│   │   ├── SkinAnalyzer.jsx             # Dermatology visual problem detector
│   │   ├── VisualChecker.jsx            # Multi-modal clinical visual symptom evaluator
│   │   └── VoiceDetection.jsx           # Vocal cord acoustic perturbation analyzer
│   ├── App.css                          # Layout animations & component rules
│   ├── App.jsx                          # Main application layout, sidebar navigation, auth guard
│   ├── index.css                        # Design system: tri-color CSS variables, dark/light themes
│   └── main.jsx                         # React 19 entrypoint mounting root element
├── .dockerignore                        # Excludes node_modules, dist, .env
├── Dockerfile                           # Multi-stage: Node 20 builder + Nginx Alpine runtime
├── package.json                         # Frontend dependencies (React 19, Vite 8, ESLint 9)
└── vite.config.js                       # Vite build configuration with React plugin
```

---

## 4. Redundancy & Anomaly Analysis

### 4.1 Duplicate Folder: `backend/database/database/`
- **Origin:** Created accidentally during early manual migration commands (`backend/database/database/medicines.db`).
- **Inspection Finding:**
  - Contains duplicate `medicines.db` (69,632 bytes) and `medicines.db.bak`.
  - Both files have been safely untracked from Git (`git rm --cached`).
  - Active application code (`backend/app/database.py`) explicitly targets `backend/database/medicines.db`.
  - `medicine.py` and `friend_chat.py` check `backend/database/medicine_expanded.db` first.
- **Actionable Recommendation:** To eliminate technical debt and avoid confusion, `backend/database/database/` can be safely archived or removed in a controlled cleanup step.

### 4.2 Cross-Drive NTFS Junction Quirk
- **Origin:** Junction at `C:\Users\prash\OneDrive\Desktop\fy project\medicure_src\smart-health-assistant` points to `D:\prash projects\fy project\smart-health-assistant`.
- **Finding:** Vite 8 / Rolldown compiler fails with `emitFile` cross-drive path error if invoked from `C:` drive targeting `D:` assets.
- **Resolution:** All frontend commands are executed from the canonical root (`D:\prash projects\fy project\smart-health-assistant\frontend`), where compilation succeeds in <250ms with Exit Code 0.

---

*File Structure Audit complete. Current tree documented with zero destructive operations.*
