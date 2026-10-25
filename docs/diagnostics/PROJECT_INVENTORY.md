# Medicure — System & Project Inventory

**Diagnostic Phase**: Phase 1 Inventory Audit  
**Date**: October 2026  
**Auditor**: ML Systems Forensic Auditor  
**Repository Working Copy**: `c:\Users\prash\OneDrive\Desktop\fy project` (linked to `D:\prash projects\fy project`)

---

## 1. Executive Architecture Overview

Medicure is architected as a full-stack, multimodal medical intelligence platform and "portable hospital". The repository contains three primary layers:
1. **Frontend**: React 19 single-page application built with Vite 8 and styled with vanilla modular CSS, wrapped for optional Android packaging via Capacitor 8.
2. **Backend**: FastAPI (v0.135.1) REST API application served via Uvicorn (v0.42.0), utilizing SQLite + SQLAlchemy for persistence, Scikit-Learn pipelines, TensorFlow/Keras deep neural networks, Librosa audio signal processing, and Google Generative AI (Gemini) external APIs.
3. **ML Workspace & Data Store**: Standalone training scripts, raw biomedical datasets, Roboflow computer-vision skin lesion datasets, and a 337 MB Indian medicine pharmaceutical dataset.

---

## 2. Technology Stack & Framework Inventory

### Frontend Stack
| Component | Technology | Version | Location / Config |
| :--- | :--- | :--- | :--- |
| Framework | React (TypeScript/JSX) | `^19.2.4` | `smart-health-assistant/frontend/package.json` |
| Build Tool | Vite | `^8.0.1` | `smart-health-assistant/frontend/vite.config.js` |
| Mobile Bridge | Capacitor (Android) | `^8.2.0` | `smart-health-assistant/frontend/capacitor.config.json` |
| Linter | ESLint | `^9.39.4` | `smart-health-assistant/frontend/eslint.config.js` |
| Deployment | GitHub Pages (`gh-pages`) | `^6.3.0` | `smart-health-assistant/frontend/package.json` |

### Backend Stack
| Component | Technology | Version | Location / Config |
| :--- | :--- | :--- | :--- |
| Web Framework | FastAPI | `0.135.1` | `smart-health-assistant/backend/app/main.py` |
| ASGI Server | Uvicorn | `0.42.0` | `smart-health-assistant/backend/requirements.txt` |
| Database ORM | SQLAlchemy | `2.0.48` | `smart-health-assistant/backend/app/database.py` |
| Serialization | Pydantic | `2.12.5` | `smart-health-assistant/backend/requirements.txt` |
| Auth & Crypto | Passlib (Bcrypt) + Python-Jose | `1.7.4` / `3.5.0` | `smart-health-assistant/backend/app/routes/auth.py` |

### Machine Learning & Data Processing Stack
| Library | Installed Version | Declared in requirements.txt | Notes / Compatibility |
| :--- | :--- | :--- | :--- |
| **Python** | `3.11.1` (64-bit) | `>=3.10` | Running in `backend/venv` |
| **NumPy** | `2.4.3` | `>=1.26.0` | NumPy 2.x breaking C-API changes affect older compiled wheels |
| **Pandas** | `3.0.1` | `>=2.0.0` | High-performance dataframe processing |
| **Scikit-Learn** | `1.8.0` | `>=1.4.0` | Calibrated Random Forest, VotingClassifier |
| **TensorFlow-CPU** | `2.20.0` | `>=2.15.0` | Deep learning backend |
| **Keras** | `3.13.2` | (Bundled/dependency) | Keras 3 multi-backend layer |
| **Librosa** | `0.11.0` | `>=0.10.1` | Audio feature extraction (MFCC, pyin, RMS) |
| **Pillow (PIL)** | `12.1.1` | `>=10.2.0` | Image transformation and resizing |
| **PyTesseract** | `0.3.13` | `>=0.3.10` | Python wrapper for Tesseract OCR |
| **Joblib** | `1.5.3` | `>=1.3.0` | Model artifact persistence |

---

## 3. Trained Model Artifacts

| Model Name | Artifact File | File Type & Format | Disk Size | Architecture & Specs | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Disease Predictor** | `backend/models/disease_model.pkl` | Pickled Scikit-Learn Pipeline | 113.8 KB | `TfidfVectorizer` (ngram 1-2, vocab: 66) + `CalibratedClassifierCV(RandomForest)` | **Stale / Obsolete**: Trained on 10 prototype diseases only; misses 35 diseases |
| **Disease Metadata** | `backend/models/disease_metadata.pkl` | Pickled Python dictionary | 677 bytes | Key-value mapping of tests and specialist consultant per disease | **Stale**: Only 10 keys present; contains typo `'Diabates'` |
| **Voice Disease Detector** | `backend/models/voice_model.pkl` | Pickled Scikit-Learn Pipeline | 868.9 KB | `StandardScaler` (22 features) + `VotingClassifier(RandomForest, GradientBoosting)` | **Incompatible / Crashing**: Expects 22 features, inference passes 17 |
| **Skin Lesion Analyzer** | `backend/models/skin_model.h5` | Keras HDF5 Model | 11.5 MB (11,546,792 B) | Transfer Learning: `MobileNetV2` base (frozen) + `Dense(128)` + `Dropout(0.5)` + `Dense(4, Softmax)` | **Severely Deficient**: Macro F1 28.6%, 0% recall on severe acne |
| **Skin Class Map** | `backend/models/skin_model_classes.json` | JSON mapping | 68 bytes | `{"Acne_Mild": 0, "Acne_Severe": 1, "Healthy": 2, "Rosacea_Other": 3}` | Matched to H5 output indices |

---

## 4. Dataset Inventory

| Dataset Identifier | Location | Format | Size on Disk | Records / Count | Schema & Description | Status / Issues |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Disease Dataset** | `ml_workspace/data/disease_dataset.csv` | CSV (UTF-8) | 6,031 bytes | 45 rows, 9 cols | `Desease list, Symptom 1..5, Test 1..2, Consultant` | 1 null in Consultant. Only 1 row per disease. |
| **Parkinson's Voice Data** | `ml_workspace/data/parkinsons.data` | CSV / ASCII | 40,697 bytes | 195 rows, 24 cols | 22 vocal biomedical acoustic features + `name` + `status` (0/1) | 32 unique subjects (~6 recordings/subject). Severe patient leakage in random splits. |
| **Skin Acne & Lesion Dataset** | `acne/` | JPEG images | ~150 MB | 2,060 images | Dermatology macro photos of acne, rosacea, healthy skin | 100% Roboflow augmented exports; 1,888 unique bases; heuristic label noise. |
| **Organized Skin Dataset** | `backend/app/models/skin_dataset_organized/` | Directory structure | ~150 MB | 2,060 images in 4 folders | `Healthy` (1066), `Acne_Mild` (824), `Acne_Severe` (93), `Rosacea_Other` (77) | Extreme class imbalance (51.7% Healthy, 4.5% Severe Acne). Split leakage. |
| **Indian Medicine Dataset** | `medicine_data.csv` | CSV | 337.75 MB | 195,605 rows, 8 cols | `sub_category, product_name, salt_composition, product_price, product_manufactured, medicine_desc, side_effects, drug_interactions` | 19,436 null prices (9.94%). **Never indexed into SQLite database**. |
| **Primary SQLite Database** | `backend/database/medicines.db` | SQLite 3 | 69,632 bytes | 7 tables | Tables: `medicines` (5), `doctors` (2), `ambulances` (1), `disease_info` (10), `users` (6), `history` (7), `reminders` (1) | Active operational database, but contains only 5 seeded medicines. |
| **Expanded Medicine Database** | `backend/database/database/medicine_expanded.db` | SQLite 3 | **0 bytes** | **MISSING** | Target database expected by `routes/medicine.py` | **File does not exist**. Causes HTTP 404 on `/search` and `/suggest`. |
| **Meditation EEG Dataset** | `meditation_extracted/BIDS_EEG_meditation_experiment/` | BIDS / EEG raw | ~4.1 GB | 24 subjects (`sub-001` .. `sub-024`) | Raw electroencephalogram recordings during meditation | **Orphaned / Unused**. No code in repository references this dataset. |

---

## 5. External API Integrations

| Service Name | Purpose | Configuration Variable | Calling Module | Observed Status | Error Handling Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Generative AI (Gemini)** | Companion Chatbot ("Medi") | `GEMINI_API_KEY` | `routes/friend_chat.py` | Active / Misconfigured | Silently swallows API errors (403/Quota/404) and returns random canned replies. |
| **Google Generative AI (Gemini)** | Pathology Report Analyzer | `GEMINI_API_KEY` | `routes/report.py` | Active / Misconfigured | Silently catches errors and returns simulated medical summary. |
| **Google Generative AI (Gemini)** | Vision Symptom Checker | `GEMINI_API_KEY` | `routes/visual_check.py` | **Broken Endpoint** | Calls `models/gemini-2.5-flash` which does not exist in Google API catalog. |
| **DeepSeek AI** | Unclear / Candidate Chat Model | `DEEPSEEK_API_KEY` | None | **Orphaned** | Key exists in `.env` but is completely unreferenced in codebase. |
| **Tesseract OCR** | Packaging Text Recognition | System Binary | `routes/medicine.py` | **Missing System Binary** | `pytesseract` throws error; caught and returns placeholder string. |
| **YouTube Embed** | Audio Therapy | None | `frontend/src/pages/HealingMusic.jsx` | Functional | Client-side iframe to public YouTube playlist. |
| **Browser Geolocation** | Emergency SOS coordinates | Browser API | `frontend/src/pages/EmergencySOS.jsx` | Functional | Obtains lat/long and posts to `/api/history`. |

---

## 6. Entry Points & Routing Map

### Backend Entry Point
- **Server Startup**: `cd backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Root Router**: `backend/app/main.py`
  - `/api/voice` -> `app.routes.voice.router`
  - `/api/medicine` -> `app.routes.medicine.router`
  - `/api/report` -> `app.routes.report.router`
  - `/api/disease` -> `app.routes.disease.router`
  - `/api/history` -> `app.routes.history.router`
  - `/api/reminder` -> `app.routes.reminder.router`
  - `/api/visual-check` -> `app.routes.visual_check.router`
  - `/api/skin` -> `app.routes.skin.router`
  - `/api/doctors` -> `app.routes.doctors.router`
  - `/api/ambulance` -> `app.routes.ambulance.router`
  - `/api/disease-info` -> `app.routes.disease_info.router`
  - `/api/meditation` -> `app.routes.meditation.router`
  - `/api/auth` -> `app.routes.auth.router`
  - `/api/friend-chat` -> `app.routes.friend_chat.router`

### Frontend Entry Point
- **Dev Server**: `cd frontend && npm run dev` (`vite --host 0.0.0.0`)
- **Main Shell**: `frontend/src/main.jsx` -> `frontend/src/App.jsx`
- **Navigation Sections**:
  - *Core AI Tools*: Dashboard, Voice Analysis, AI Vision Checker, Skin Problem Detector, Disease Predictor, Report Analyzer, Medicine Check.
  - *Care & Emergency*: Emergency SOS, Find Doctors, Ambulance.
  - *Wellness & Lifestyle*: Meditation, Healing Music, Ayurveda, BMI Calculator.
  - *Records & Assistant*: Reminders, Past Data, AI Friend Chat, Suggestions, About Disease, About Platform.

---

## 7. Current Runtime Errors, Warnings, and Test Status

1. **Zero Test Suite**: The repository contains no automated unit, integration, or regression test suites in either frontend or backend (`tests/` directory does not exist, `pytest` is not in `requirements.txt`).
2. **Missing Database Runtime Error**: Invoking `/api/medicine/search` or `/api/medicine/suggest` raises `HTTPException 404: "Expanded medicine database not found."` because `backend/database/database/medicine_expanded.db` does not exist on disk.
3. **Inference Dimension Crash**: Invoking `/api/voice/analyze` with audio crashes with `ValueError: X has 17 features, but StandardScaler is expecting 22 features as input.` which triggers silent heuristic fallback.
4. **Invalid Gemini Model 404**: Invoking `/api/visual-check/analyze` fails because model `models/gemini-2.5-flash` is invalid in the Google Generative AI SDK.
5. **Frontend Mock Masking**: In all network failure modes, the React frontend catch blocks display fake pre-baked diagnostic results, masking all backend errors from the user.
