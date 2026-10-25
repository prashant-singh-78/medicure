# Medicure Phase 10A: Baseline Audit & System Verification
**Full-Project ML Reliability, Feature Portability & Baseline Diagnostics**
*Date: October 25, 2026 | Environment: Windows / FastAPI / React / TensorFlow / scikit-learn / SQLite*

---

## Executive Summary

Phase 10A conducted an exhaustive, non-destructive audit of all Machine Learning pipelines, backend services, dataset splits, database artifacts, and frontend interfaces in Medicure.

The primary finding of Phase 10A is that **while previous phases developed superior candidate models and expanded datasets, these artifacts currently reside in an ephemeral Antigravity scratch directory rather than the portable repository**. As a result:
1. **Skin Classifier**: `skin_model_v2.h5` is actively selected only through a hardcoded local absolute path (`C:\Users\prash\.gemini\antigravity\brain\...`). In any other deployment environment or clean clone, it silently degrades to Baseline v1 (which suffers from an 85.7% false negative rate on severe acne).
2. **General Disease Predictor**: `disease_model_v2.pkl` and `disease_metadata_v2.pkl` reside exclusively in scratch. The source training set consists of only **45 rows** with severe train-test data leakage caused by pre-split synthetic phrase augmentation.
3. **Voice / Parkinson's**: The active backend pipeline attempts to feed a 17-feature audio vector (`librosa` MFCCs + pitch/perturbation) into a tabular model (`voice_model.pkl`) expecting 22 laboratory MDVP features. The model inference **always throws an exception**, silently triggering a crude heuristic rule (`jitter * 50 + shimmer * 20 > 0.4`), while the frontend falsely claims to run a "Neural Network" for Parkinson's, Respiratory, and COVID-19.
4. **Pathology Report Analyzer**: The UI advertises "Supports PDF Scans" and falsely claims the model is "Trained on 50,000+ laboratory diagnostic charts," but the backend only accepts image formats via PIL `Image.open`, crashing on actual PDF uploads.
5. **Medicine Database**: The 483 MB `medicine_expanded.db` (195,605 products) is loaded via scratch path fallbacks, and is not located in the default repository database directory.

All 65 automated regression tests from Phases 2, 4, 9A, 9B, and 9C currently pass in the host environment, but maintain fragile dependencies on local absolute paths.

---

## 1. Safety, Change Control & Read-Only Audit Protocol

In accordance with Phase 10 requirements:
- Zero source files, model artifacts, datasets, or databases were modified, deleted, or overwritten during Phase 10A.
- Existing database contents in `medicines.db` were verified intact (all 6 user records, admin RBAC flags, and isolate histories preserved).
- All checks were executed non-destructively using isolated Python virtual environment tools (`backend/venv/Scripts/python.exe`).

---

## 2. Component Audits

### 2.1 Skin Disease Classifier

#### Architecture & Active Route
- Route: `POST /api/skin/analyze` in [`backend/app/routes/skin.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/skin.py).
- Input: JSON payload `{"image_base64": "<base64_string>"}`.
- Image Preprocessing: Base64 decoded, resized to $224 \times 224$ RGB, normalized to $[0.0, 1.0]$ float32.

#### Artifact Inventory & Verification
| Artifact | Location | Size (bytes) | SHA-256 Checksum | Audit Status |
| :--- | :--- | :--- | :--- | :--- |
| **Baseline v1** (`skin_model.h5`) | `backend/models/skin_model.h5` | 11,546,792 | `4e7dea6e5f5c...` | Legacy model in repository |
| **Candidate v2** (`skin_model_v2.h5`) | `scratch/skin_model_v2.h5` | 11,555,728 | `6984c4bda4e6...` | **Missing from `backend/models/`** |
| **Candidate v3** (`skin_model_v3_candidate.h5`) | `scratch/phase7/skin_model_v3_candidate.h5` | 11,555,728 | `3002832f6c57...` | Formally Rejected (Val Collapse) |
| **Class Map** (`skin_model_classes.json`) | `backend/models/skin_model_classes.json` | 68 | `50eec3357567...` | 4 classes verified |
| **Manifest V2** (`skin_split_manifest_v2.json`) | `scratch/phase6/skin_split_manifest_v2.json` | 291,564 | `be904cff46a2...` | Verified zero-leakage split |

#### Hardcoded Paths & Silent Fallback Defect
In [`skin.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/skin.py#L29-L38):
```python
models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
scratch_dir = (
    r'C:\Users\prash\.gemini\antigravity\brain\14bc2de0-5fa1-424c-ae60-8cdb3e12c626\scratch'
)

candidate_paths = [
    os.path.join(models_dir, 'skin_model_v2.h5'),
    os.path.join(scratch_dir, 'skin_model_v2.h5'),
    os.path.join(models_dir, 'skin_model.h5'),
]
```
- Because `models_dir/skin_model_v2.h5` does not exist, the code looks in `scratch_dir`.
- On another system, `scratch_dir` does not exist, so it **silently falls back to Baseline v1**.

#### Reproducibility of Phase 7 Reported Metrics
Phase 7 reported performance on the held-out Manifest V2 test partition ($N=313$ images, 279 patient clusters) was independently verified against `scratch/phase7/step5_evaluation_results.json`:
- **Baseline v1**: 53.72% Balanced Accuracy, 61.66% Overall Accuracy, 14.29% Severe Acne Recall (2/14 cases), 55.49% Healthy False Alarm Rate.
- **Candidate v2**: **71.15% Balanced Accuracy**, **65.50% Overall Accuracy**, **64.29% Severe Acne Recall** (9/14 cases), **34.76% Healthy False Alarm Rate**.
- **Candidate v3**: 33.94% Balanced Accuracy, 0.00% Severe Acne Recall (0/14 cases, collapsed to Healthy).

---

### 2.2 General Disease Prediction

#### Active Route & Implementation
- Route: `POST /api/disease/predict` in [`backend/app/routes/disease.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/disease.py).
- Input: JSON payload `{"symptoms": "fever headache chills"}`.
- Preprocessing: Lowercased, stripped, passed through TF-IDF Vectorizer (`ngram_range=(1, 2)`).

#### Dataset Forensics & Data Leakage
- Dataset: `ml_workspace/data/disease_dataset.csv`.
- Size: Exactly **45 rows** (one row per condition, each containing 5 symptom keywords).
- Training script: [`backend/models/train_disease.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/models/train_disease.py).
- **Severe Data Leakage Finding**:
  In `train_disease.py`, `augment_symptoms()` generates synthetic permutations of the 5 symptoms with template prefixes ("i am suffering from...", "patient complains of..."). It generates hundreds of samples from the same 45 base rows, and *then* applies `train_test_split(docs, labels, test_size=0.15)`. Synthetic variations of all 45 diseases exist simultaneously in train and test splits, producing an artificial ~99% test accuracy.
- **Negation & Out-of-Distribution Vulnerability**:
  - The TF-IDF bag-of-words ignores word order and negation. Entering `"I do not have a fever, no cough"` extracts tokens `"fever"` and `"cough"`, resulting in a high-confidence prediction for viral infections.
  - The vocabulary overlap check correctly catches completely unrecognized gibberish, but cannot handle clinical semantic nuance.

---

### 2.3 Voice / Parkinson's Detection

#### Pipeline Tracing & Mathematical Impossibility
1. **Frontend Capture** ([`VoiceDetection.jsx`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/frontend/src/pages/VoiceDetection.jsx)):
   - Captures `.webm` microphone audio, prompts user to select "Parkinson's", "Respiratory", or "COVID-19".
   - Sends audio blob to `POST /api/voice/analyze`.
2. **Audio Processing** ([`voice.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/voice.py)):
   - Loads audio with `librosa` at 22,050 Hz.
   - Extracts 13 MFCC means, 1 fundamental frequency (`mdvp_fo`), 1 jitter proxy, 1 shimmer proxy, 1 HNR proxy. Total: **17 features**.
3. **Model Prediction Attempt**:
   - `model = joblib.load("backend/models/voice_model.pkl")`
   - Model was trained on UCI Parkinson's dataset ([`ml_workspace/data/parkinsons.data`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/ml_workspace/data/parkinsons.data)) which contains **22 biomedical parameters**:
     `MDVP:Fo(Hz), MDVP:Fhi(Hz), MDVP:Flo(Hz), MDVP:Jitter(%), MDVP:Jitter(Abs), MDVP:RAP, MDVP:PPQ, Jitter:DDP, MDVP:Shimmer, MDVP:Shimmer(dB), Shimmer:APQ3, Shimmer:APQ5, MDVP:APQ, Shimmer:DDA, NHR, HNR, RPDE, DFA, spread1, spread2, D2, PPE`.
   - Calling `model.predict([features])` **always throws an exception**:
     `ValueError: Number of features of the model must match the input. Model n_features is 22 and input n_features is 17`.
4. **Heuristic Fallback & Fake Advertising**:
   - The catch block executes `_heuristic_prediction(feature_dict, disease)`:
     ```python
     risk_score = jitter * 50 + shimmer * 20
     is_positive = risk_score > 0.4
     ```
   - The UI completely ignores that Respiratory and COVID-19 have no models, and that the ML model failed. It displays *"Processing Neural Network..."* and *"Neural Network Diagnostic Output"*.

---

### 2.4 Medicine and Other Feature Classifications

| Feature / Route | Implementation Type | Current Operational Status | Key Issues & Limitations |
| :--- | :--- | :--- | :--- |
| **Medicine Search** (`GET /api/medicine/search`) | SQLite Database Search (195k Indian medicines) | Functional with Limitations | Database located in scratch directory (483 MB `medicine_expanded.db`). |
| **Medicine Symptom Match** (`GET /api/medicine/suggest`) | SQLite Database Search | Functional with Limitations | Database located in scratch directory. |
| **Batch Code Verification** (`GET /api/medicine/verify`) | SQLite Database Registry (`medicines.db`) | Verified Functional | Checks authentic manufacturer registry; flags >15 scans. |
| **Batch Code Registration** (`POST /api/medicine/register`) | Database Write (Admin Protected) | Verified Functional | Requires verified `admin` role (Phase 9C). |
| **Packaging OCR** (`POST /api/medicine/analyze-image`) | Optical Character Recognition (`pytesseract`) | Functional with Limitations | Depends on local system `tesseract` binary. |
| **Meditation & Breathing** (`/api/meditation/*`) | Static Content & Guides | Verified Functional | Rules-based/content. No ML required or claimed. |
| **Medical Report Analyzer** (`POST /api/report/analyze`) | External AI API (Gemini 1.5 Flash) | Functional with Limitations | **Crashes on PDF files** (only accepts images). False UI claims of 50k dataset. |
| **Medical Chatbot** (`POST /api/friend-chat/chat`) | External AI API (Gemini 1.5 Flash) + RAG | Verified Functional | Emergency/crisis triage intercepts suicidal & cardiac keywords. |
| **Visual Symptom Checker** (`POST /api/visual-check/analyze`) | External AI API (Gemini 1.5 Flash) | Verified Functional | Multimodal visual inspection with safety filters. |
| **Doctor / Ambulance** (`/api/doctors`, `/api/ambulance`) | Database Registry | Verified Functional | Direct-dial integration; admin write protection. |

---

## 3. Baseline Test Suite Execution

All current test suites were executed with `backend/venv/Scripts/python.exe`:

| Test Suite | Command / Path | Tests Run | Passed | Failed | Duration | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Phase 9C Admin Security** | `backend/test_phase9c_admin_security.py` | 19 | 19 | 0 | 11.04s | 100% Pass |
| **Phase 9A Security** | `backend/test_phase9a_security.py` | 19 | 19 | 0 | 10.86s | 100% Pass |
| **Phase 9B DB Isolation** | `scratch/phase9b_db_isolation_verification.py` | 5 | 5 | 0 | 0.13s | 100% Pass |
| **Phase 2 Master Suite** | `scratch/run_full_phase2_suite.py` | 14 | 14 | 0 | 1.22s | 100% Pass |
| **Phase 4 Skin Suite** | `scratch/run_phase4_skin_suite.py` | 8 | 8 | 0 | 9.56s | 100% Pass |
| **Total Baseline Tests** | — | **65** | **65** | **0** | **32.81s** | **100% PASS** |

---

## 4. Root Cause Analysis of Remaining Gaps

1. **Artifact Location & Non-Portability**:
   `skin_model_v2.h5`, `disease_model_v2.pkl`, and `medicine_expanded.db` were created in temporary scratch directories during earlier remediation phases and never promoted into standard repository directories due to sandbox restrictions or file sizes.
2. **Clinical Scientific Incompatibility (Voice)**:
   The UCI Parkinson's dataset contains acoustic metrics from proprietary MDVP clinical software that cannot be computed from web-browser `.webm` audio recordings using standard `librosa` transforms.
3. **Deceptive UI Claims**:
   - `ReportAnalyzer.jsx` falsely claims a 50,000-document custom trained model and PDF support.
   - `VoiceDetection.jsx` falsely advertises "Neural Network" models for COVID-19 and Respiratory disease.
4. **General Disease Dataset Scope**:
   The 45-row dataset is a basic symptom dictionary, not a clinical diagnostic training set.

---

## 5. Phase 10B Repair Action Plan

Based on these verified findings, the prioritized repairs for Phase 10B are:

1. **Model & Artifact Portability**:
   - Copy `skin_model_v2.h5` and `skin_model_v2_classes.json` into `backend/models/`.
   - Copy `disease_model_v2.pkl` and `disease_metadata_v2.pkl` into `backend/models/`.
   - Remove hardcoded developer machine scratch directory paths from [`skin.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/skin.py), [`disease.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/disease.py), [`medicine.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/medicine.py), and [`friend_chat.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/friend_chat.py).
   - Ensure `skin.py` loads `skin_model_v2.h5` as the primary production model relative to `backend/models`.
2. **Voice / Parkinson's Honesty & Pipeline Realism**:
   - Update `voice.py` and `VoiceDetection.jsx` to explicitly mark acoustic screening as an **experimental digital signal processing (DSP) vocal tremor screener**, clearly distinguishing it from a clinical neural network.
   - Remove deceptive claims regarding COVID-19 and Respiratory disease models from the frontend dropdown.
   - Provide transparent messaging explaining why laboratory MDVP parameters cannot be synthesized from raw audio.
3. **Report Analyzer PDF & Image Handling**:
   - If PDF processing libraries (`pypdf` / `pdf2image`) are not available or lack Poppler binaries, cleanly restrict file uploads to image formats (JPG, PNG, WEBP), update the upload dropzone text, and return honest validation errors.
   - Remove the false "Trained on 50,000+ charts" marketing claim from `ReportAnalyzer.jsx`.
4. **General Disease Predictor Clarification & Guardrails**:
   - Keep the calibrated `disease_model_v2.pkl` with OOD rejection.
   - Update frontend [`DiseasePredictor.jsx`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/frontend/src/pages/DiseasePredictor.jsx) to clearly state the 45-condition scope and warn users that bag-of-words keyword models cannot interpret negation or replace clinical evaluations.
5. **Comprehensive Integration Testing (Phase 10C)**:
   - Build a unified Phase 10 test suite covering all repaired routes, schemas, and error boundaries.
