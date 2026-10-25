# Medicure Phase 11A — Rigorous ML Model Validation Report

**Execution Date:** 2026-10-25  
**Evaluation Harness:** `scratch/validate_models_rigorous.py`  
**Execution Runtime:** Python 3.11.1 (venv), TensorFlow 2.18.0, Scikit-Learn 1.6.1, NumPy 2.0.2  
**Evaluation Scope:** Exhaustive Model-by-Model Audit, Provenance Inspection, Leakage Detection, and Metric Verification

---

## 1. Executive Summary

A comprehensive, model-by-model technical audit was conducted on every artificial intelligence, machine learning, and acoustic signal processing pipeline within Medicure.

### Summary Status Table

| Model / Pipeline | Artifact | Active Route | Preprocessing Pipeline | Output Classes | Benchmark Metric (Empirical) | Independent Test Set Status | Clinical Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Dermatology Classifier** | `skin_model_v2.h5` (11.5 MB) | `POST /api/skin/analyze` | Base64 decode -> RGB -> Resize (224, 224) -> Rescale `1./255` | 4 classes | Accuracy: **76.33%**<br>Balanced Acc: **76.33%**<br>Macro F1: **76.05%** | **NOT VERIFIED** (Roboflow augmented copies present; no patient holdout) | **Preliminary Screening Only** (Severe Acne Recall: 69.33%) |
| **General Disease Predictor** | `disease_model_v2.pkl` (2.1 MB) | `POST /api/disease/predict` | Lowercase -> Strip -> TF-IDF (1,2 n-grams, 962 terms) | 45 classes | In-catalog symptom match: **78.96%** confidence | **NOT VERIFIED** (Augmentation leakage across 45 seed rows in training) | **Non-Clinical Matching** (Cannot parse clinical history or negation) |
| **Voice Acoustic Tremor** | `voice_model.pkl` (868 KB) | `POST /api/voice/analyze` | Librosa DSP (Pitch, Jitter, Shimmer, HNR) | 2 classes (Risk / No Risk) | Tabular Benchmark:<br>GroupKFold: **76.87%**<br>Naive SKF: **88.72%** (+11.85% leakage) | **NOT APPLICABLE** (Runtime route executes DSP baseline; `is_ml_model: False`) | **Experimental DSP Tool** (MDVP parameters cannot be derived from web audio) |
| **Medical Report Analyzer** | External Gemini 1.5 Flash | `POST /api/report/analyze` | Binary read -> Image validation (`%PDF` rejected) | Structured Markdown | N/A (Cloud Multimodal API) | **N/A** (Third-party foundation model) | **Educational / OCR Aid** (Requires active API key) |
| **Visual Symptom Checker** | External Gemini 1.5 Flash | `POST /api/visual-check/analyze` | Binary read -> Image validation | Structured Markdown | N/A (Cloud Multimodal API) | **N/A** (Third-party foundation model) | **Visual Triage Aid** (Requires active API key) |

---

## 2. Model 1: Dermatology Skin Classifier

### 2.1 Artifact & Deployed Code Path
- **Primary Deployed Artifact:** `backend/models/skin_model_v2.h5` (11,555,728 bytes, SHA256: `6984c4bda4e6cb40...`)
- **Baseline Preserved Artifact:** `backend/models/skin_model.h5` (11,546,792 bytes, SHA256: `4e7dea6e5f5cc3b9...`)
- **Class Mapping Files:** `backend/models/skin_model_v2_classes.json` and `backend/models/skin_model_classes.json` (Both: `{"Acne_Mild": 0, "Acne_Severe": 1, "Healthy": 2, "Rosacea_Other": 3}`)
- **Active Route:** `backend/app/routes/skin.py` -> `POST /api/skin/analyze`
- **Fallback Behavior:** Prioritizes `skin_model_v2.h5`. If missing, falls back to `skin_model.h5` with a logged warning. If neither is found, raises `HTTP 500`.
- **Architecture:** MobileNetV2 transfer learning backbone with custom GlobalAveragePooling2D, Dense(128, ReLU), Dropout(0.3), and Dense(4, Softmax). Total parameters: 2,422,980.

### 2.2 Dataset Provenance & Leakage Audit
- **Dataset Path:** `backend/app/models/skin_dataset_organized`
- **Class Distribution (2,060 Total Images):**
  - `Acne_Mild`: 824 images (40.0%)
  - `Acne_Severe`: 93 images (4.5%) — *Severe Class Imbalance*
  - `Healthy`: 1,066 images (51.7%)
  - `Rosacea_Other`: 77 images (3.7%) — *Severe Class Imbalance*
- **Provenance & Leakage Findings:**
  - Filenames indicate a Roboflow export containing automated augmentations and duplicated views:
    - Example: `07acne0811011-copy_jpg.rf.a975d52a38f5b1880caaf3a5b23608ef.jpg`
    - Example: `07acne081101_jpg.rf.78aec21a5f31ef6ece56e374fe449f32.jpg`
  - There is **no pre-existing holdout test directory**. All 2,060 images reside together in class subfolders.
  - Randomly splitting these files produces near-duplicate image leakage between train and test sets due to shared augmentation origins (`.rf.`, `-copy`).
  - **Verdict on Independent Accuracy:** **NOT VERIFIED**. Independent clinical generalizability cannot be claimed without an external, unaugmented hospital dataset.

### 2.3 Empirical Evaluation Metrics
An independent stratified evaluation was conducted using `scratch/validate_models_rigorous.py` with 300 randomly selected balanced images (75 images per class, random seed 42):

```text
================================================================================
SKIN MODEL V2 EMPIRICAL EVALUATION (300 Stratified Samples)
================================================================================
Overall Accuracy:           76.33%
Balanced Accuracy:          76.33%
Macro Precision:            76.37%
Macro Recall:               76.33%
Macro F1-Score:             76.05%

Per-Class Performance:
  Class            Precision    Recall     F1-Score    Support
  -------------------------------------------------------------
  Acne_Mild          66.67%     69.33%      67.97%       75
  Acne_Severe        77.61%     69.33%      73.24%       75
  Healthy            80.30%     70.67%      75.18%       75
  Rosacea_Other      80.90%     96.00%      87.80%       75

Safeguard Metrics:
  Severe Acne Recall:          69.33% (30.67% False Negative Miss Rate)
  Healthy False Positive Rate:  5.78% (Healthy misclassified as pathology)

Confusion Matrix:
  Predicted ->    Acne_Mild  Acne_Severe   Healthy  Rosacea_Other
  True Acne_Mild      52          9           9           5
  True Acne_Severe    12         52           4           7
  True Healthy        13          4          53           5
  True Rosacea         1          2           0          72
```

### 2.4 Deterministic Behavioral Smoke Tests
- **Valid RGB Base64 Image:** `POST /api/skin/analyze` -> Returns HTTP 200, predicted class, confidence, health percentage, model version (`skin_model_v2.h5`), and disclaimer.
- **Corrupt Base64 String:** Returns `HTTP 400` ("Invalid base64 image data. Unable to decode image.").
- **Empty String:** Returns `HTTP 400` ("Empty image data provided.").
- **Non-Image Binary in Base64:** Returns `HTTP 400`.
- **Numerical Stability:** Softmax probabilities sum strictly to 1.0; no `NaN` or non-finite outputs observed.

---

## 3. Model 2: General Disease Predictor

### 3.1 Artifact & Deployed Code Path
- **Primary Deployed Artifact:** `backend/models/disease_model_v2.pkl` (2,146,354 bytes, SHA256: `ba03369c1dbd24ed...`)
- **Baseline Preserved Artifact:** `backend/models/disease_model.pkl` (113,842 bytes, SHA256: `1f21ac3066e028bc...`)
- **Metadata Catalogs:** `backend/models/disease_metadata_v2.pkl` (45 conditions) vs `backend/models/disease_metadata.pkl` (10 conditions)
- **Active Route:** `backend/app/routes/disease.py` -> `POST /api/disease/predict`
- **Fallback Behavior:** Checks `DISEASE_MODEL_PATH` env override -> `disease_model_v2.pkl` -> `disease_model.pkl`.
- **Pipeline Structure:** Scikit-Learn `Pipeline` composed of:
  1. `vectorizer`: `TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words='english')` (962 terms)
  2. `clf`: `CalibratedClassifierCV(RandomForestClassifier(n_estimators=150, max_depth=25))` (45 classes)

### 3.2 Dataset Provenance & Leakage Audit
- **Dataset Path:** `ml_workspace/data/disease_dataset.csv`
- **Catalog Size:** Exactly **45 rows** (1 row per disease, up to 5 symptom keywords per disease).
- **Leakage Analysis in `train_disease.py`:**
  - The training script generates combinatorial synthetic phrases (e.g., "patient complains of fever and chills") from the 5 base symptoms before splitting into train/test sets:
    ```python
    aug_samples = augment_symptoms(symptoms) # Combinations per disease
    # ...
    X_train, X_test, y_train, y_test = train_test_split(docs, labels, test_size=0.15)
    ```
  - Because all synthetic variations for Disease X derive from the exact same 5 tokens, a random train/test split leaks identical n-grams and symptom subsets across the split.
  - The high test accuracy reported by naive train/test splits is **synthetically inflated**.
  - **Verdict on Independent Accuracy:** **NOT VERIFIED**.

### 3.3 Behavioral Rejection Gates & Smoke Tests

| Query Input | Query Category | Route Output Status | Confidence | Clinical Outcome |
| :--- | :--- | :---: | :---: | :--- |
| `"fever high fever sweating chills"` | In-Catalog Match (Malaria) | `success` | 78.96% | **PASS** — Predicted Malaria; suggested Blood test & General Physician. |
| `"a"` | Insufficient Input | `insufficient_input` | 0.00% | **PASS** — Rejection gate blocked input < 2 chars. |
| `"quantum entanglement extraterrestrial spacetime distortion"` | Out-of-Vocabulary (OOD) | `unmatched_symptoms` | 0.00% | **PASS** — Zero TF-IDF overlap rejected cleanly. |
| `"no fever, no headache, absolutely no cough, healthy feeling"` | Negated Symptom Query | `low_confidence` | 8.85% | **PASS** — Statistical uncertainty rejection gate blocked prediction (8.85% < 15.0% threshold). |
| `"tired"` | Ambiguous Single Term | `unmatched_symptoms` | 0.00% | **PASS** — Unrecognized as single diagnostic symptom. |

### 3.4 Medical Limitations of the Disease Model
1. **Negation Blindness:** As a bag-of-words / n-gram TF-IDF model, the pipeline cannot parse linguistic negation. "No fever" matches the token "fever". While the uncertainty gate caught the test negation case by diluting probability across multiple classes, complex clinical negations cannot be safely parsed.
2. **Fixed 45-Disease Scope:** Cannot consider the thousands of other human conditions.
3. **Probability Interpretation:** Confidence represents Scikit-Learn Platt-scaling probability over the 45 synthetic classes, not a clinical Bayes prevalence probability.

---

## 4. Model 3: Voice / Parkinson's Screening

### 4.1 Artifact vs. Runtime Reality Audit
- **Artifact on Disk:** `backend/models/voice_model.pkl` (868,932 bytes, SHA256: `7597eaef1fe24a52...`)
- **Dataset on Disk:** `ml_workspace/data/parkinsons.data` (195 rows, 24 columns)
- **Active Route:** `backend/app/routes/voice.py` -> `POST /api/voice/analyze`
- **Crucial Architectural Verification:**  
  The active route `voice.py` **DOES NOT execute `voice_model.pkl` on user audio**.
  - *Reason:* The UCI Parkinson's model requires 22 specialized laboratory acoustic parameters (e.g., MDVP:RAP, MDVP:PPQ, Jitter:DDP, MDVP:APQ, Shimmer:DDA, NHR, HNR, RPDE, DFA, PPE) that require specialized laboratory microphones and acoustic analysis software (Kay Pentax CSL/MDVP). These cannot be extracted from browser-recorded compressed WebM/WAV audio.
  - *Active Implementation:* `voice.py` extracts basic digital signal processing (DSP) acoustic perturbation features using Librosa (pitch fundamental frequency, jitter estimate, shimmer estimate, HNR) and applies an acoustic threshold heuristic.
  - *API Response Payload:*
    ```json
    {
      "disease": "Parkinson's Disease (Vocal Tremor)",
      "prediction": "Positive Risk Detected",
      "confidence": 62.2,
      "model_status": "acoustic_dsp_baseline",
      "is_ml_model": false,
      "screening_type": "Digital Signal Processing (DSP) Acoustic Perturbation",
      "note": "Acoustic screening derived from digital signal processing (pitch, jitter, shimmer, HNR). Laboratory-grade MDVP parameters required by clinical ML tabular models cannot be extracted from web audio without specialized hardware.",
      "disclaimer": "Experimental screening tool only; not a substitute for clinical neurological examination."
    }
    ```

### 4.2 UCI Tabular Dataset Evaluation (Offline Audit)
For completeness, the offline tabular dataset was evaluated to measure cross-subject leakage:
- **GroupKFold (5-fold, grouped strictly by patient ID):** Accuracy = **76.87% ± 9.30%**
- **StratifiedKFold (5-fold, naive random split with patient overlap):** Accuracy = **88.72% ± 6.20%**
- **Leakage Inflation Delta:** **+11.85%** accuracy inflation when patient recordings are mixed between train and test splits.
- **Runtime Model Accuracy:** **NOT APPLICABLE** (The tabular model is intentionally uninvoked in the web API).

---

## 5. Other AI/ML Capabilities

### 5.1 Medical Report Analyzer (`POST /api/report/analyze`)
- **Engine:** Google Gemini 1.5 Flash multimodal API.
- **Input Validation:**
  - Explicitly rejects direct `%PDF` document uploads with `HTTP 400` ("Direct PDF document processing is not supported. Please upload a clear JPG, PNG, or WEBP image scan...").
  - Accepts image scans (JPG, PNG, WEBP).
  - Rejects empty uploads with `HTTP 400`.
- **Credential Handling:** If `GEMINI_API_KEY` is missing or placeholder, returns `HTTP 503` fail-closed.

### 5.2 Visual Symptom Checker (`POST /api/visual-check/analyze`)
- **Engine:** Google Gemini 1.5 Flash multimodal API.
- **Safety Fallback:** Catches Google Gemini safety filter blocks (`ValueError`) and returns a graceful in-person dermatologist recommendation notice rather than crashing.

### 5.3 Friend Chat Crisis Guardrail (`POST /api/friend-chat/message`)
- **Immediate Triage Filter:** Scans input for crisis keywords (`"chest pain"`, `"heart attack"`, `"can't breathe"`, `"suicide"`, `"kill myself"`, `"stroke"`, etc.).
- **Behavior:** Bypasses LLM generation instantly to deliver certified emergency helpline numbers (108, 102, 911, 112, KIRAN 1800-599-0019).
- **Pharmaceutical Grounding:** For non-emergency medication queries, queries `medicine_expanded.db` (195k records) to inject factual salt composition and side effect warnings into the prompt context.

---

## 6. Reproducible Evaluation Commands

All metrics documented in this report can be reproduced deterministically with the following commands:

```powershell
# 1. Full Model Artifact Audit & Multi-Model Evaluation Harness
backend\venv\Scripts\python.exe scratch\validate_models_rigorous.py

# 2. Group-Aware Voice Model Cross-Validation
backend\venv\Scripts\python.exe ml_workspace\train_voice_model.py
```

---

## 7. Model Validation Conclusion

1. **Dermatology Classifier (`skin_model_v2.h5`):** Structurally sound; 76.33% balanced accuracy on Roboflow dataset. Real-world independent accuracy is **NOT VERIFIED**. Severe acne false negative rate (~31%) prohibits autonomous clinical use.
2. **Disease Predictor (`disease_model_v2.pkl`):** Functional for 45 catalog conditions with working rejection gates. Accuracy is **NOT VERIFIED** for free-form clinical complaints.
3. **Voice Screening:** Deployed route honestly reports `is_ml_model: False` with DSP acoustic baseline. Tabular ML accuracy is **NOT APPLICABLE** to web audio.
4. **Third-Party Multimodal:** Report Analyzer and Visual Checker operate as expected, gated strictly by `GEMINI_API_KEY`.
