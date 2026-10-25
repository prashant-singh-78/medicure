# Medicure — Evidence-Based Model Evaluation Report

**Diagnostic Phase**: Phase 5 Empirical Model Evaluation  
**Date**: October 2026  
**Auditor**: ML Systems Forensic Auditor  

---

## 1. Evaluation Methodology & Integrity Notice

To maintain clinical integrity, all evaluation metrics reported in this section were **empirically executed and calculated during this forensic audit** using the actual serialized model artifacts and datasets present in the repository.

> [!CAUTION]
> The offline validation metrics reported in the repository's original training scripts (e.g., "98% test accuracy" for disease prediction or "90% accuracy" for voice detection) **cannot be trusted** due to train/test data leakage, patient contamination, and heuristic label noise.

---

## 2. Evaluation 1: Dermatology AI Model (`skin_model.h5`)

### 2.1 Dataset Partitioning & Execution
- **Dataset Evaluated**: `backend/app/models/skin_dataset_organized`
- **Total Samples Evaluated**: 410 images (20% validation split, `rescale=1./255`, target size `224x224`)
- **Evaluation Command**: Direct batch inference using `tensorflow.keras.models.load_model('backend/models/skin_model.h5')`

### 2.2 Global Classification Metrics
- **Overall Accuracy**: **42.44%** (174 / 410 correct)
- **Macro Average Precision**: `0.3638` (36.38%)
- **Macro Average Recall**: `0.3132` (31.32%)
- **Macro Average F1-Score**: **`0.2862` (28.62%)**
- **Weighted Average F1-Score**: `0.3625` (36.25%)

### 2.3 Detailed Per-Class Performance Table

| Class Label | Support (Samples) | Precision | Recall | F1-Score | False Negative Rate (FNR) | False Positive Rate (FPR) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`Acne_Mild`** | 164 | 0.4012 | 0.8171 | 0.5382 | 18.29% | **81.30%** (200 FP) |
| **`Acne_Severe`** | 18 | **0.0000** | **0.0000** | **0.0000** | **100.00%** | 0.77% (3 FP) |
| **`Healthy`** | 213 | 0.5538 | **0.1690** | 0.2590 | **83.10%** | 14.72% (29 FP) |
| **`Rosacea_Other`** | 15 | 0.5000 | 0.2667 | 0.3478 | **73.33%** | 1.01% (4 FP) |

### 2.4 Empirical Confusion Matrix

```
                 PREDICTED
              Mild   Severe  Healthy  Rosacea
ACTUAL Mild  [ 134      1       29        0  ]   (Support: 164)
    Severe   [  16      0        0        2  ]   (Support: 18)  <-- 0% DETECTED
   Healthy   [ 173      2       36        2  ]   (Support: 213) <-- 81% FLAGGED AS MILD
   Rosacea   [  11      0        0        4  ]   (Support: 15)
```

### 2.5 Clinical Risk Analysis for Skin Model
1. **Total Failure on High-Risk Lesions (`Acne_Severe`)**:
   - The model predicted `Acne_Severe` only 3 times across all 410 images, and **all 3 were false positives** (1 mild acne, 2 healthy).
   - Among the 18 actual cases of severe cystic acne, **0 were detected** (16 were classified as Mild Acne, 2 as Rosacea).
   - In a clinical deployment, a patient suffering from severe cystic acne requiring urgent oral isotretinoin or dermatological intervention would be told: *"Mild acne detected. Consider a salicylic acid cleanser."*
2. **Pathological Over-Diagnosis of Healthy Patients**:
   - Out of 213 healthy skin images, **173 were misdiagnosed as `Acne_Mild`**.
   - The specificity for healthy patients is barely 16.9%, leading to massive unnecessary medical anxiety.

---

## 3. Evaluation 2: Vocal Tremor Model (`voice_model.pkl`)

### 3.1 Contaminated vs Leakage-Free Evaluation Benchmark
The model was evaluated on the complete UCI Parkinson's dataset (195 recordings, 32 subjects) comparing the author's random stratified split against patient-grouped cross-validation (`GroupKFold`):

| Evaluation Methodology | Mean Accuracy | 95% Confidence Interval | Inter-Fold Variance (Std Dev) | Clinical Reliability |
| :--- | :--- | :--- | :--- | :--- |
| **Random Stratified 5-Fold** *(Contaminated)* | **89.23%** | [86.2%, 92.2%] | ± 2.99% | **Spurious**: Leaks same patient's voice into train & test |
| **GroupKFold by Patient ID** *(Leakage-Free)*| **77.89%** | [67.1%, 88.7%] | ± 10.80% | **Realistic Generalization**: Unseen vocal cords |
| **Generalization Penalty** | **-11.34%** | — | — | High sensitivity to individual speaker acoustics |

### 3.2 Clinical Risk Analysis for Voice Model
1. **The Model is Completely Inoperative in Production**:
   - Because `voice.py` extracts 17 features while `voice_model.pkl` expects 22, the actual runtime accuracy in production is **undefined (crashes 100% of the time)**.
2. **Deceptive Heuristic Scoring**:
   - The fallback formula `risk_score = (jitter * 50 + shimmer * 20)` has never been calibrated on clinical trials.
   - For an arbitrary user recording with background microphone static, the calculated jitter and shimmer trigger `"Positive Risk Detected"` with high confidence, generating false panic for neurodegenerative illness.

---

## 4. Evaluation 3: Disease Prediction Model (`disease_model.pkl`)

### 4.1 Scope & Coverage Deficit
- **Total Diseases in Application Dataset**: 45 medical conditions.
- **Diseases Present in Saved Artifact**: **10 conditions** (`Allergy`, `Asthma`, `Covid`, `Diabates`, `Diarrhoea`, `Heart Attack`, `Influenza`, `Malaria`, `Parkinson`, `Ulcer`).
- **Clinical Coverage**: **17.8%** of the application's intended disease catalog.
- **Diseases with 0% Coverage**: 37 conditions (including Pneumonia, Tuberculosis, Dengue, Typhoid, Sepsis, Meningitis, Appendicitis, PCOS, Kidney Failure).

### 4.2 Empirical Evaluation on the Intended Scope
When evaluated across the 45 symptom rows of `disease_dataset.csv`:
- **Correct Predictions**: 6 / 45
- **Accuracy Across Clinical Scope**: **13.33%**
- **Severe Misclassification Examples**:
  - `Tuberculosis` -> Predicted as **`Heart Attack`** (Confidence: 34%)
  - `Asthma` -> Predicted as **`Heart Attack`** (Confidence: 32%)
  - `Malaria` -> Predicted as **`Diarrhoea`** (Confidence: 30%)
  - `Pneumonia` -> Predicted as **`Heart Attack`** (Confidence: 31%)
  - `Appendicitis` -> Predicted as **`Diarrhoea`** (Confidence: 29%)

### 4.3 Robustness to Out-of-Distribution & Adversarial Inputs

| Input Category | Input Sample | Predicted Disease | Output Confidence | Clinical Risk Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Typo / Spoken** | `"i hav high fever nd bodyache"` | `Diarrhoea` | 26.0% | Misdiagnosis |
| **Unlisted Symptom** | `"severe toothache and bleeding gums"` | `Diarrhoea` | 18.0% | Tooth infection mapped to gastrointestinal disease |
| **Orthopedic Injury** | `"broken leg bone fracture"` | `Diabates` | 16.0% | Trauma injury mapped to endocrine disease |
| **Gibberish** | `"asdfghjklqwerty"` | `Diabates` | 16.0% | Hallucinated diagnosis on random text |
| **Conversational** | `"can you recommend a good movie"` | `Diabates` | 16.0% | Non-medical question mapped to disease |
| **Empty String** | `""` | `Diabates` | 16.0% | Non-input mapped to disease |

---

## 5. Root-Cause Classification of Findings

| Finding | Root-Cause Category | Explanation |
| :--- | :--- | :--- |
| **Voice Feature Mismatch** | *Inference Implementation Bug* | `voice.py` extracts 17 features instead of the 22 required by `voice_model.pkl`. |
| **Severe Acne 0% Recall** | *Dataset & Training Problem* | Severe class imbalance (4.5%), unweighted loss, and heuristic label noise. |
| **Disease 82% Unrecognized** | *Model Artifact Problem* | Stale 10-disease prototype deployed instead of retraining on the 45-disease CSV. |
| **Inflated Training Accuracies** | *Evaluation Methodology Problem* | Combinatorial augmentation before split; patient leakage in voice data. |
| **All-Zero Vector Hallucinations** | *Inference Implementation Bug* | Missing rejection threshold on low-confidence predictions. |