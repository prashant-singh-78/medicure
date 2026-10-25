# Medicure — Reproducible Defect Catalog & Verification Suite

**Diagnostic Phase**: Phase 9 Empirical Defect Reproduction  
**Date**: October 2026  
**Auditor**: ML Systems Forensic Auditor  

---

## 1. Confirmed Reproducible Defects

### BUG-01: Voice Inference Feature Dimension Crash & Silent Heuristic Fallback
- **Issue ID**: `MED-BUG-01`
- **Category**: *Inference Implementation Bug*
- **Status**: **CONFIRMED** (100% Reproducible)
- **Confidence**: 100%
- **Affected Files**:
  - `backend/app/routes/voice.py` (lines 49-78)
  - `backend/models/voice_model.pkl`
- **Preconditions**: Backend server running with `voice_model.pkl` present.
- **Minimal Reproducible Input**:
  Any valid audio file uploaded to `POST /api/voice/analyze`, or Python reproduction:
  ```python
  import joblib, numpy as np

  model = joblib.load('backend/models/voice_model.pkl')
  # voice.py extracts 17 features:
  features_17 = np.zeros(17)
  model.predict([features_17])
```
- **Expected Behavior**: Model accepts the extracted features, normalizes them via `StandardScaler`, and outputs an ensemble prediction.
- **Actual Behavior**:
  `StandardScaler` throws:
  ```
  ValueError: X has 17 features, but StandardScaler is expecting 22 features as input.
  ```
  The route catches the exception and executes `_heuristic_prediction()`, returning a fake rule-based score while setting `"note": null` (making it appear as if the ML model ran).
- **First Stage of Failure**: Stage 2 (Feature Extraction in `voice.py`).
- **Root Cause**: `train_voice_model.py` trained on 22 specific columns of the UCI Parkinson's dataset; `voice.py` extracts 13 MFCCs + 4 summary metrics.
- **Proposed Fix**: Re-align training and inference on a shared feature extractor (e.g., train model on MFCCs + pitch metrics, or extract full 22-dimensional vocal perturbation vector during inference).
- **Required Regression Test**: Test script passing extracted audio features to `model.predict()` verifying no shape error occurs and prediction is derived from the pipeline.

---

### BUG-02: Stale Disease Model Checkpoint & Lack of OOD Rejection
- **Issue ID**: `MED-BUG-02`
- **Category**: *Model Artifact & Pipeline Defect*
- **Status**: **CONFIRMED** (100% Reproducible)
- **Confidence**: 100%
- **Affected Files**:
  - `backend/models/disease_model.pkl`
  - `backend/models/disease_metadata.pkl`
  - `backend/app/routes/disease.py`
- **Preconditions**: `disease_model.pkl` loaded into memory.
- **Minimal Reproducible Input**:
  ```python
  import joblib

  model = joblib.load('backend/models/disease_model.pkl')
  # 1. Valid disease present in dataset CSV but missing from prototype model:
  print(model.predict(['persistent cough with blood night sweats']))  # Tuberculosis
  # 2. Out-of-distribution input:
  print(model.predict(['can you tell me a joke about airplanes']))
```
- **Expected Behavior**:
  1. Tuberculosis is identified correctly.
  2. Non-medical query returns an "unknown / low-confidence" prompt rejection.
- **Actual Behavior**:
  1. Outputs `Heart Attack` (confidence 34%).
  2. Outputs `Diabates` (confidence 16%).
- **First Stage of Failure**:
  - For unlisted diseases: Model Training / Checkpoint stage (artifact is stale).
  - For OOD queries: Inference postprocessing stage (missing rejection threshold).
- **Root Cause**: The deployed artifact is an early 10-disease prototype with a misspelled class name (`'Diabates'`). The CSV contains 45 diseases.
- **Proposed Fix**: Re-train the disease prediction model across all 45 diseases with proper feature expansion, correct label spelling, and implement an empirical confidence rejection threshold (e.g., minimum calibrated probability of 45%, otherwise return `"Condition unclear; consult a physician"`).
- **Required Regression Test**: Evaluate test suite containing all 45 dataset conditions and 10 OOD non-medical strings; assert all 45 conditions are recognized and all 10 OOD strings return rejection.

---

### BUG-03: Visual Symptom Checker Calling Non-Existent Gemini Model
- **Issue ID**: `MED-BUG-03`
- **Category**: *API Integration Bug*
- **Status**: **CONFIRMED** (100% Reproducible)
- **Confidence**: 100%
- **Affected Files**:
  - `backend/app/routes/visual_check.py` (line 24)
- **Preconditions**: Uploading any image to `POST /api/visual-check/analyze`.
- **Minimal Reproducible Input**:
  ```python
  import google.generativeai as genai, os

  genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
  model = genai.GenerativeModel(model_name="models/gemini-2.5-flash")
  model.generate_content("hello")
```
- **Expected Behavior**: Image is processed by Google Gemini Vision.
- **Actual Behavior**:
  Google API responds with HTTP 404 / NotFound:
  ```
  google.api_core.exceptions.NotFound: 404 models/gemini-2.5-flash is not found for API version v1beta
  ```
  Route catches exception and returns static failure banner: `"I encountered an issue while analyzing the image."`
- **First Stage of Failure**: Model configuration in `visual_check.py`.
- **Root Cause**: The model identifier `models/gemini-2.5-flash` is invalid.
- **Proposed Fix**: Change model identifier to `"gemini-1.5-flash"`.
- **Required Regression Test**: Unit test calling `visual_check.py` with mock image asserting HTTP 200 and structured response.

---

### BUG-04: Missing Expanded Medicine Database Causing 404
- **Issue ID**: `MED-BUG-04`
- **Category**: *Data Persistence & Storage Defect*
- **Status**: **CONFIRMED** (100% Reproducible)
- **Confidence**: 100%
- **Affected Files**:
  - `backend/app/routes/medicine.py` (lines 10, 18-19, 40-42)
  - Missing file: `backend/database/database/medicine_expanded.db`
- **Preconditions**: Running backend server without `medicine_expanded.db`.
- **Minimal Reproducible Input**:
  `GET /api/medicine/search?query=paracetamol` or `GET /api/medicine/suggest?symptoms=fever`
- **Expected Behavior**: Returns matching pharmaceutical records from the Indian medicine dataset.
- **Actual Behavior**:
  Returns HTTP 404:
  ```json
  {"detail": "Expanded medicine database not found."}
  ```
  Frontend React catch block triggers and injects hardcoded mock records (`Dolo 650mg`, `Pan-D`).
- **First Stage of Failure**: Filesystem existence check in `medicine.py`.
- **Root Cause**: `medicine_data.csv` was never compiled into `medicine_expanded.db`.
- **Proposed Fix**: Write an ETL migration script to index `medicine_data.csv` into a SQLite database with FTS5 search tables at `backend/database/database/medicine_expanded.db`.
- **Required Regression Test**: Query `/api/medicine/search?query=Dolo` asserting 200 OK with real database records.

---

### BUG-05: Missing Tesseract OCR Binary
- **Issue ID**: `MED-BUG-05`
- **Category**: *Environment & System Dependency Defect*
- **Status**: **CONFIRMED** (100% Reproducible)
- **Confidence**: 100%
- **Affected Files**:
  - `backend/app/routes/medicine.py` (lines 148-153)
- **Preconditions**: Windows host without Tesseract installed on PATH.
- **Minimal Reproducible Input**:
  `POST /api/medicine/analyze-image` with packaging image.
- **Expected Behavior**: OCR extracts medicine brand name and batch details from packaging.
- **Actual Behavior**:
  `pytesseract.image_to_string` fails; returns error text. Result defaults to `status="unknown", confidence=45.0`.
- **Root Cause**: `pytesseract` is a Python wrapper that requires the native `tesseract.exe` C++ engine to be installed.
- **Proposed Fix**: Document system dependency in setup guide, or use an API-based multimodal OCR approach (e.g., Gemini Vision).
- **Required Regression Test**: Test OCR pipeline with standard test card image.

---

### BUG-06: Frontend Fake Mock Fallbacks Deceiving Users
- **Issue ID**: `MED-BUG-06`
- **Category**: *Frontend Architecture & Patient Safety Defect*
- **Status**: **CONFIRMED** (100% Reproducible)
- **Confidence**: 100%
- **Affected Files**:
  - `frontend/src/pages/MedicineDetection.jsx` (lines 31-36, 49-51, 62-67)
  - `frontend/src/pages/VoiceDetection.jsx` (lines 69-79)
  - `frontend/src/pages/SkinAnalyzer.jsx` (lines 58-66)
  - `frontend/src/pages/ReportAnalyzer.jsx` (lines 47-51)
- **Preconditions**: Stop backend server or disconnect network, then use any AI tool.
- **Minimal Reproducible Input**:
  Click "Analyze" on any frontend tool while backend is stopped.
- **Expected Behavior**: UI informs user: `"Unable to connect to server. Please check your connection."`
- **Actual Behavior**:
  - Voice Detection runs `Math.random()` and displays `"Positive Risk Signal Detected"` with 88% confidence.
  - Skin Analyzer displays `"Mild Inflammatory Acne / Rosacea, confidence: 94.5%, health: 82%"`.
  - Report Analyzer generates a complete fake blood report with Normal WBC and Hemoglobin.
- **Root Cause**: Leftover simulation / mock code used during initial frontend UI design.
- **Proposed Fix**: Remove all fake mock responses from catch blocks; replace with explicit error toasts and retry buttons.
- **Required Regression Test**: Simulate network disconnect; verify UI renders connection failure error and zero medical data.

---

### BUG-07: Skin Model Severe Acne 0% Detection Rate
- **Issue ID**: `MED-BUG-07`
- **Category**: *Model Quality & Data Imbalance Defect*
- **Status**: **CONFIRMED** (100% Reproducible)
- **Confidence**: 100%
- **Affected Files**:
  - `backend/models/skin_model.h5`
  - `backend/app/models/train_skin.py`
- **Preconditions**: Pass images of severe acne to `skin_model.h5`.
- **Minimal Reproducible Input**:
  Direct batch evaluation on the 18 validation images in `skin_dataset_organized/Acne_Severe`.
- **Expected Behavior**: Model detects `Acne_Severe` with high sensitivity.
- **Actual Behavior**:
  0 out of 18 severe acne cases detected (Recall = 0.00%, F1 = 0.00). 16 are labeled Mild Acne, 2 Rosacea.
- **Root Cause**: Extreme class imbalance (4.5% severe acne in dataset), lack of class weighting, base network frozen, and heuristic label noise.
- **Proposed Fix**: Clean annotations, balance classes, unfreeze top layers of MobileNetV2 with focal loss or balanced class weights.
- **Required Regression Test**: Evaluate validation set ensuring `Acne_Severe` recall is at least 75%.

---

## 2. Hypotheses Requiring Further Testing

### HYP-01: DeepSeek Intended for Medical RAG
- **Hypothesis**: The developer added `DEEPSEEK_API_KEY` to `.env` to replace or supplement Gemini for medical query grounding or RAG retrieval.
- **Status**: **Unconfirmed Hypothesis** (No code references found).
- **Test to Confirm/Reject**: Ask the user/development team about the intended role of DeepSeek.

### HYP-02: BIDS EEG Dataset for Meditation Brainwave Classification
- **Hypothesis**: The 4.1 GB `meditation_extracted/BIDS_EEG_meditation_experiment` dataset was intended to train an EEG classifier for mental state monitoring, but development was abandoned in favor of static text guides.
- **Status**: **Unconfirmed Hypothesis**.
- **Test to Confirm/Reject**: Ask the user if this dataset should be pruned or integrated into a future roadmap.