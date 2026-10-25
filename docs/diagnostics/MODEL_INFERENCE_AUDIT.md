# Medicure — Model Artifact & Inference Audit

**Diagnostic Phase**: Phase 4 Inference Tracing & Stage-by-Stage Forensic Audit  
**Date**: October 2026  
**Auditor**: ML Systems Forensic Auditor  

---

## 1. Model Artifact Specifications & Loading Mechanics

| Specification | Disease Predictor (`disease_model.pkl`) | Voice Disorder Model (`voice_model.pkl`) | Skin Lesion Analyzer (`skin_model.h5`) |
| :--- | :--- | :--- | :--- |
| **File Format** | Pickle / Joblib serialized binary | Pickle / Joblib serialized binary | Keras / HDF5 neural network |
| **Loader** | `joblib.load(MODEL_PATH)` | `joblib.load(MODEL_PATH)` | `tensorflow.keras.models.load_model()` |
| **Expected Input Shape** | `(n_samples,)` list of string texts | `(n_samples, 22)` float array | `(batch, 224, 224, 3)` float32 array |
| **Expected Dtypes** | `str` (lowercased) | `float64` | `float32` in range `[0.0, 1.0]` |
| **Output Shape** | `(n_samples,)` string label, `(n_samples, 10)` probabilities | `(n_samples,)` int (`0`/`1`), `(n_samples, 2)` probabilities | `(batch, 4)` softmax probabilities |
| **Class Label Mapping** | Internal to pipeline: `classifier.classes_` | `0` = Healthy, `1` = Parkinson's | `skin_model_classes.json` (indices 0..3) |
| **Execution Hardware** | CPU | CPU | CPU (TensorFlow-CPU 2.20.0) |
| **Inference Latency** | ~2 - 5 ms | ~8 - 15 ms (feature extraction) | ~60 - 120 ms (after 10s initial load) |
| **Status** | **STALE PROTOTYPE** | **SCHEMA MISMATCH (CRASHES)** | **UNRELIABLE / DEFICIENT** |

---

## 2. Stage-by-Stage Trace 1: Voice Analysis Subsystem

### Input: Real 3-second human vocal audio recording (`recording.webm`)
The table below traces the exact transition of data from microphone capture to final screen rendering:

| Stage | Data Representation | Expected Content / Shape | Actual Content / Shape | Discrepancy Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Raw Input** | Binary Audio Buffer | WebM audio container | 48,214 bytes WebM audio | Valid |
| **2. Preprocessed Input** | Numerical Feature Vector | **22 acoustic features** (MDVP, Shimmer, Jitter, NHR, HNR, RPDE, DFA, spread1, spread2, D2, PPE) | **17 features** (13 MFCCs, mean f0, jitter, shimmer, HNR) | **STAGE OF FAILURE**: Shape mismatch (17 vs 22) |
| **3. Model Invocation** | Pipeline Execution | Scaler normalizes 22 features -> VotingClassifier | Throws `ValueError: X has 17 features, but StandardScaler is expecting 22 features as input.` | **CRASH**: Model invocation aborted |
| **4. Postprocessing** | Exception Handler Fallback | Extract calibrated probability | Catch block triggers: `_heuristic_prediction()` computes `risk_score = jitter*50 + shimmer*20` | Fake score substituted |
| **5. Final UI Result** | JSON Response to Client | Real ML prediction | `{"prediction": "Positive Risk Detected", "confidence": 78.4, "note": null}` | **User Deception**: UI claims model output |

```
CONCLUSION FOR VOICE INFERENCE:
The production inference function FAILS AT STAGE 2. The trained model is NEVER executed in production.
```

---

## 3. Stage-by-Stage Trace 2: Disease Prediction Subsystem

### Test Input A: Exact Clinical Match from Dataset
**Raw Input**: `"vomiting fever abdominal pain nausea loose stools"`

| Stage | Transformation | Output Value / State | Observation |
| :--- | :--- | :--- | :--- |
| **1. Raw Input** | User input string | `"vomiting fever abdominal pain nausea loose stools"` | Clean input |
| **2. Preprocessed** | `.lower()` -> `TfidfVectorizer` | Sparse vector, shape `(1, 66)` | Matches training unigrams |
| **3. Model Output** | `model.predict()` | `['Diarrhoea']` | Matches clinical expectation |
| **4. Probabilities**| `model.predict_proba()` | `[0.54, 0.10, 0.10, ...]` | Argmax probability = 54.0% |
| **5. Postprocessed**| Metadata lookup & formatting | `{"disease": "Diarrhoea", "confidence": 54.0, "recommendations": ...}` | Returned to client |

---

### Test Input B: Valid Clinical Condition Absent from Prototype
**Raw Input**: `"persistent cough with blood, night sweats, unexplained weight loss, fever, chest pain"`  
*(Ground Truth: **Tuberculosis**, present in `disease_dataset.csv` row 13)*

| Stage | Transformation | Output Value / State | Observation |
| :--- | :--- | :--- | :--- |
| **1. Raw Input** | Real medical condition | Symptoms of Tuberculosis | Clinical emergency |
| **2. Preprocessed** | `.lower()` -> `TfidfVectorizer` | TF-IDF extracts tokens `['cough', 'fever', 'chest pain']` | OOV for specific markers |
| **3. Model Output** | `model.predict()` | **`'Heart Attack'`** | **CRITICAL MISDIAGNOSIS** |
| **4. Probabilities**| `model.predict_proba()` | Probabilities: Heart Attack (34%), Covid (18%), Asthma (14%) | Low top confidence |
| **5. Postprocessed**| Metadata lookup & formatting | `{"disease": "Heart Attack", "confidence": 34.0, "recommendations": {"consultant": "Cardiologist"}}` | **STAGE OF FAILURE**: Model forced Tuberculosis into Heart Attack |

---

### Test Input C: Non-Medical Out-of-Distribution Input
**Raw Input**: `"can you tell me a joke about airplanes"`

| Stage | Transformation | Output Value / State | Observation |
| :--- | :--- | :--- | :--- |
| **1. Raw Input** | Conversational prompt | English conversational text | Completely non-medical |
| **2. Preprocessed** | `TfidfVectorizer` | All-zero vector `(1, 66)` | No known tokens match |
| **3. Model Output** | `model.predict()` | **`'Diabates'`** | **STAGE OF FAILURE**: Hallucinated diagnosis |
| **4. Probabilities**| `model.predict_proba()` | `Diabates: 16.0%`, `Malaria: 16.0%`, `Diarrhoea: 12.0%` | Flat prior distribution |
| **5. Postprocessed**| Format without rejection | `{"disease": "Diabates", "confidence": 16.0, ...}` | **Clinical Hazard**: User presented with Diabetes diagnosis |

```
CONCLUSION FOR DISEASE INFERENCE:
1. The model cannot predict 35 of the 45 conditions in the medical dataset because the deployed artifact is a stale 10-disease prototype.
2. The pipeline lacks an OOD rejection threshold. All non-medical queries, typos, and unlisted symptoms are forced into one of the 10 prototype classes (most frequently 'Diabates' or 'Diarrhoea').
```

---

## 4. Stage-by-Stage Trace 3: Dermatology AI Skin Analyzer

### Test Input: Image of Rosacea with Clinic Code in Filename
**Raw Input**: `07RosaceaOK08280631-Copy_jpg.rf.6e30df520d58c5625e16ef7aab4293e9.jpg`  
*(Prominent erythematous inflammatory facial flushing)*

| Stage | Transformation | Output Value / State | Observation |
| :--- | :--- | :--- | :--- |
| **1. Raw Input** | Base64 encoded JPEG | Image of severe facial flushing | Clinical Rosacea |
| **2. Preprocessed** | PIL RGB resize `(224, 224)` / 255.0 | Array shape `(1, 224, 224, 3)` | Normalized floats `[0, 1]` |
| **3. Model Output** | `skin_model.predict(img)` | Softmax probabilities: `[Acne_Mild: 0.292, Acne_Severe: 0.327, Healthy: 0.176, Rosacea: 0.205]` | Maximum entropy distribution |
| **4. Postprocessed**| `np.argmax(preds)` | Index `1` (`Acne_Severe`), Confidence `32.69%` | **STAGE OF FAILURE**: Argmax over noisy probabilities |
| **5. Health Score** | `30 + ((100 - 32.69) * 0.2)` | `health_percentage: 43.5%` | Heuristic calculation |
| **6. Final UI Result**| Render result | `{"problem": "Acne Severe", "confidence": 32.69, "health_percentage": 43.5}` | Clinically misleading diagnosis |

---

## 5. Medical Risk: Argmax Interpretation as Medical Confidence

Throughout the codebase, model confidence is computed as:
```python
confidence = float(np.max(probabilities)) * 100.0
```
This naive formulation contains severe clinical flaws:
1. **Uncalibrated Softmax**: In neural networks, softmax outputs represent relative exponential margins, not true Bayesian posterior probabilities.
2. **Ambiguity Masking**: When probabilities are `[0.26, 0.25, 0.25, 0.24]` (near complete uncertainty), `np.max` outputs `26.0%` and the application presents the corresponding disease as the definitive diagnosis.
3. **No Unknown / Low-Confidence Rejection**: The application never informs the patient: *"Your symptoms/image cannot be diagnosed with confidence. Please see an in-person clinician."* Instead, it always asserts an affirmative disease entity.