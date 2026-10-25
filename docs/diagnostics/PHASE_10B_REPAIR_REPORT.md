# Medicure Phase 10B Remediation Report
**Targeted ML Reliability, Artifact Portability & Feature Realism Repairs**
*Date: October 25, 2026 | Environment: Windows / FastAPI / React / TensorFlow / scikit-learn / SQLite*

---

## Executive Summary

Phase 10B resolved the core architectural portability gaps and misleading claims identified during the Phase 10A baseline audit:
1. **Model & Database Portability Established**:
   - Promoted `skin_model_v2.h5` (Candidate v2 with 71.15% balanced accuracy), `skin_model_v2_classes.json`, `disease_model_v2.pkl`, and `disease_metadata_v2.pkl` into the canonical [`backend/models/`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/models) directory.
   - Placed `medicine_expanded.db` (483 MB, 195,605 products) into [`backend/database/`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/database) with `.gitignore` protection.
   - Completely purged hardcoded author-specific scratch directory paths (`C:\Users\prash\.gemini\antigravity\...`) across all route handlers.
2. **Skin Classifier Production Consolidation**:
   - [`skin.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/skin.py) now directly loads `skin_model_v2.h5` relative to the repository, eliminating silent degradation to Baseline v1 on new environments.
3. **Voice / Parkinson's Screening Realism**:
   - Fixed [`voice.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/voice.py) to reject unmodeled diseases (COVID-19, Respiratory) with `HTTP 400`.
   - Reclassified the screening as experimental Digital Signal Processing (DSP) acoustic perturbation screening (`is_ml_model: False`), explicitly documenting why laboratory MDVP parameters cannot be computed from web audio.
   - Updated [`VoiceDetection.jsx`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/frontend/src/pages/VoiceDetection.jsx) to disable unsupported options and remove fake "Neural Network" claims.
4. **Report Analyzer Format Validation & Honest UI**:
   - [`report.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/report.py) now validates file headers and cleanly returns `HTTP 400` when a PDF is uploaded, preventing server crashes.
   - [`ReportAnalyzer.jsx`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/frontend/src/pages/ReportAnalyzer.jsx) removed the fabricated "Trained on 50,000+ laboratory charts" claim and restricts inputs to image formats.
5. **General Disease Prediction Clarification**:
   - [`disease.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/disease.py) and [`DiseasePrediction.jsx`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/frontend/src/pages/DiseasePrediction.jsx) clearly document the 45-condition catalog scope and warn against bag-of-words negation misinterpretations.

---

## 1. Safety & Change Control

All targeted files were backed up prior to modification:

**Backup Directory**:
`C:\Users\prash\.gemini\antigravity\brain\14bc2de0-5fa1-424c-ae60-8cdb3e12c626\backups\phase10b_backup\`

**Backed Up Files**:
- `skin.py` (pre-portability skin route)
- `disease.py` (pre-portability disease route)
- `voice.py` (pre-honesty voice route)
- `medicine.py` (pre-portability medicine route)
- `friend_chat.py` (pre-portability chat route)
- `report.py` (pre-validation report route)
- `VoiceDetection.jsx` (pre-honesty voice frontend)
- `ReportAnalyzer.jsx` (pre-honesty report frontend)
- `DiseasePrediction.jsx` (pre-guardrail disease frontend)

---

## 2. Detailed Technical Remediations

### 2.1 Artifact Promotion & Clean Project-Relative Path Resolution
The following artifacts were promoted from scratch to canonical project directories:
- `backend/models/skin_model_v2.h5` (11,555,728 bytes)
- `backend/models/skin_model_v2_classes.json` (68 bytes)
- `backend/models/disease_model_v2.pkl` (2,146,354 bytes)
- `backend/models/disease_metadata_v2.pkl` (7,623 bytes)
- `backend/database/medicine_expanded.db` (483,876,864 bytes)

In [`skin.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/skin.py), [`disease.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/disease.py), [`medicine.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/medicine.py), and [`friend_chat.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/friend_chat.py):
- Hardcoded scratch directory strings (`C:\Users\prash\.gemini\antigravity\...`) were completely removed.
- Path resolution now relies on `os.path.abspath(os.path.join(os.path.dirname(__file__), ...))` targeting project-relative folders (`backend/models` and `backend/database`).
- Supported environment variable overrides (`SKIN_MODEL_PATH`, `DISEASE_MODEL_PATH`, `DISEASE_META_PATH`, `MEDICINE_EXPANDED_DB_PATH`) for enterprise container deployments.

### 2.2 Voice / Parkinson's Honesty & Validation
- **Disease Parameter Validation**: In `voice.py`, `disease` is strictly checked. If an unmodeled target such as `respiratory` or `covid` is passed, `voice.py` immediately raises `HTTP 400` ("Acoustic biomarker screening is currently only implemented for Parkinson's vocal tremor evaluation...").
- **Signal Processing Categorization**: The response schema now includes:
  ```json
  {
    "is_ml_model": false,
    "screening_type": "Digital Signal Processing (DSP) Acoustic Perturbation",
    "model_status": "acoustic_dsp_baseline",
    "note": "Acoustic screening derived from digital signal processing (pitch, jitter, shimmer, HNR)...",
    "disclaimer": "Experimental screening tool only; not a substitute for clinical neurological examination."
  }
  ```
- **Frontend Realism**: In `VoiceDetection.jsx`, disabled options for Respiratory and COVID-19 in the dropdown; replaced "Neural Network" headers with "Acoustic Biomarker Screening".

### 2.3 Report Analyzer PDF Error Handling & Truth in Advertising
- **PDF Rejection & Magic Byte Check**: In `report.py`, inspects incoming bytes for `%PDF`. If detected, returns `HTTP 400` with clear instructions to provide image scans (JPG, PNG, WEBP), preventing unhandled PIL errors.
- **Frontend File Drop Guards**: In `ReportAnalyzer.jsx`, intercepts PDF drops and displays toast instructions.
- **Marketing Text Elimination**: Removed "Trained on 50,000+ laboratory diagnostic charts" in favor of "Multimodal AI assistant to help explain complex medical terminology and reference ranges from clear laboratory report images."

### 2.4 General Disease Prediction Guardrails
- **Catalog Scope**: Updated `disease.py` to return `catalog_conditions: 45` and explicit disclaimer notes.
- **Frontend Guidance**: `DiseasePrediction.jsx` now clearly identifies itself as a 45-condition medical catalog matcher and warns against entering negative symptoms (e.g. "no fever").

---

## 3. Summary of Changed Files

| File Path | Description of Changes |
| :--- | :--- |
| [`backend/models/skin_model_v2.h5`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/models/skin_model_v2.h5) | Promoted Candidate v2 model to canonical models directory. |
| [`backend/models/skin_model_v2_classes.json`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/models/skin_model_v2_classes.json) | Promoted Candidate v2 class indices to models directory. |
| [`backend/models/disease_model_v2.pkl`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/models/disease_model_v2.pkl) | Promoted calibrated v2 disease pipeline to models directory. |
| [`backend/models/disease_metadata_v2.pkl`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/models/disease_metadata_v2.pkl) | Promoted v2 disease metadata to models directory. |
| [`backend/database/medicine_expanded.db`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/database/medicine_expanded.db) | Placed 483 MB expanded medicine database into canonical database directory. |
| [`backend/app/routes/skin.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/skin.py) | Replaced hardcoded scratch path with project-relative v2 loading and model version tracking. |
| [`backend/app/routes/disease.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/disease.py) | Replaced hardcoded scratch path with project-relative v2 loading, catalog count, and disclaimers. |
| [`backend/app/routes/voice.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/voice.py) | Enforced disease input validation (HTTP 400 on unmodeled targets), honest DSP categorization. |
| [`backend/app/routes/medicine.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/medicine.py) | Cleaned database paths to project-relative `backend/database/medicine_expanded.db`. |
| [`backend/app/routes/friend_chat.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/friend_chat.py) | Cleaned database paths to project-relative `backend/database/medicine_expanded.db`. |
| [`backend/app/routes/report.py`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/backend/app/routes/report.py) | Added PDF and image header validation; explicit HTTP 400 for unsupported documents. |
| [`frontend/src/pages/VoiceDetection.jsx`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/frontend/src/pages/VoiceDetection.jsx) | Disabled unmodeled disease targets; replaced "Neural Network" claims with acoustic DSP terms. |
| [`frontend/src/pages/ReportAnalyzer.jsx`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/frontend/src/pages/ReportAnalyzer.jsx) | Removed fake 50k training claim; added PDF drop interception and image-only restriction. |
| [`frontend/src/pages/DiseasePrediction.jsx`](file:///c:/Users/prash/OneDrive/Desktop/fy%20project/medicure_src/smart-health-assistant/frontend/src/pages/DiseasePrediction.jsx) | Documented 45-condition catalog scope and negation limitations in UI. |
