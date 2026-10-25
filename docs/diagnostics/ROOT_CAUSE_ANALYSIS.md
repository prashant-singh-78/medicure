# Medicure — Prioritized Root-Cause Analysis Matrix

**Diagnostic Phase**: Phase 10 Root-Cause Prioritization  
**Date**: October 2026  
**Auditor**: ML Systems Forensic Auditor  

---

## 1. Prioritization Criteria & Governance

Issues are prioritized based on:
1. **Medical Safety & Clinical Liability**: Preventing hazardous misdiagnoses and fake diagnostic signals.
2. **Data & Algorithmic Integrity**: Eliminating data leakage, feature shape crashes, and label corruption.
3. **Execution Correctness**: Eliminating 404s, missing dependencies, and unhandled exceptions.
4. **Performance & Scalability**: Minimizing cold-start latency and memory overhead.

---

## 2. Ranked Root-Cause Matrix

| Rank | Issue ID | Problem | Evidence | Root-Cause Category | Severity | Confidence | Affected Files | Proposed Remediation | Compute / API Cost | Risk of Regression | Required Validation |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | `MED-BUG-01` | **Voice Model Feature Crash** | `voice_model.pkl` expects 22 features; `voice.py` extracts 17. Crashes 100% of calls, falls back to silent fake rule. | *Inference Pipeline Bug* | **CRITICAL** | **100%** | `backend/app/routes/voice.py`, `backend/models/voice_model.pkl` | Align training & inference on a common feature extraction pipeline (e.g. 13 MFCCs + fundamental frequency + perturbation metrics). | < $0.05 (CPU train) | Low | Audio file inference produces real prediction without shape error. |
| **2** | `MED-BUG-06` | **Frontend Fake Mock Deceptions** | React catch blocks substitute fake high-confidence diagnoses (94.5% skin, 99.2% medicine, random voice coin-flip) on network errors. | *Frontend / Patient Safety* | **CRITICAL** | **100%** | `MedicineDetection.jsx`, `VoiceDetection.jsx`, `SkinAnalyzer.jsx`, `ReportAnalyzer.jsx` | Strip all fabricated mock objects from catch blocks. Display clear error states and retry buttons. | $0.00 | None | Disconnect network; verify UI shows explicit connection error and zero medical data. |
| **3** | `MED-BUG-02` | **Stale Disease Model Checkpoint** | Saved model only has 10 prototype classes and typo `'Diabates'`. 35 of 45 diseases in CSV (77.8%) cannot be predicted. OOD inputs diagnosed as Diabetes. | *Model Checkpoint Defect* | **HIGH** | **100%** | `backend/models/disease_model.pkl`, `backend/app/routes/disease.py` | Retrain model on all 45 diseases; add calibrated confidence threshold (reject if max probability < 45%). | < $0.05 (CPU train) | Low | Test suite of 45 diseases and 10 OOD non-medical queries. |
| **4** | `MED-BUG-07` | **Skin Model 0% Severe Acne Recall** | Severe Acne recall is 0.00% (F1=0.00); 81% of healthy skin misdiagnosed as mild acne. | *Model Training & Data Imbalance* | **HIGH** | **100%** | `backend/models/skin_model.h5`, `train_skin.py` | Correct heuristic labeling; apply class-balanced weights; fine-tune top MobileNetV2 layers. | ~15 mins GPU/CPU | Low | Validation set evaluation achieves >75% recall on severe acne. |
| **5** | `MED-BUG-03` | **Visual Check 404 Model Error** | Code requests non-existent `models/gemini-2.5-flash`, causing permanent 404 API error. | *API Integration Defect* | **MEDIUM** | **100%** | `backend/app/routes/visual_check.py` | Change model string to `"gemini-1.5-flash"`. | Standard Gemini API rates | None | Image upload returns structured visual check report. |
| **6** | `MED-BUG-04` | **Missing Expanded Medicine DB** | `medicine_expanded.db` is missing on disk; `/search` and `/suggest` return 404. | *Data Persistence Defect* | **MEDIUM** | **100%** | `backend/app/routes/medicine.py`, `medicine_data.csv` | Convert 195k-row `medicine_data.csv` into an indexed SQLite database with FTS5. | < 2 mins CPU ETL | Low | `/search?query=paracetamol` returns 200 OK with matching records. |
| **7** | `MED-BUG-10` | **Silent API Error Swallowing** | Report and Friend Chat routes catch Gemini exceptions and return fake successful canned text. | *API / Backend Logic* | **MEDIUM** | **100%** | `routes/report.py`, `routes/friend_chat.py` | Return explicit HTTP error codes (e.g. 503 Service Unavailable) so UI knows when the API is down. | $0.00 | None | Mock API failure triggers proper error banner in UI. |
| **8** | `MED-BUG-05` | **Missing Tesseract OCR Binary** | Packaging OCR fails because `tesseract.exe` is not installed on Windows PATH. | *Environment Dependency* | **LOW** | **100%** | `backend/app/routes/medicine.py` | Install Tesseract or migrate packaging analysis to multimodal vision API. | $0.00 | None | Packaging photo extracts authentic text brand. |
| **9** | `MED-BUG-08` | **Patient-Level Data Leakage** | Random split in `train_voice_model.py` contaminates train and test with same patient's voice (11.3% performance gap). | *Evaluation Methodology* | **LOW** | **100%** | `ml_workspace/train_voice_model.py` | Use `GroupKFold(groups=subject_id)` for voice model evaluation. | $0.00 | None | Validation script reports true cross-patient generalization score. |
| **10**| `MED-BUG-09` | **Synthetic Augmentation Leakage** | Combinatorial symptom augmentation in `train_disease.py` occurs before train/test split. | *Evaluation Methodology* | **LOW** | **100%** | `backend/models/train_disease.py` | Partition train/test sets before generating synthetic rephrasings. | $0.00 | None | Separate evaluation set contains disjoint natural language sentences. |

---

## 3. Hypotheses & Validation Tests

| Hypothesis ID | Suspected Root Cause | Test to Confirm or Reject |
| :--- | :--- | :--- |
| **HYP-01** | `DEEPSEEK_API_KEY` was intended for Medical RAG or clinical grounding. | Search commit history / developer documentation or ask the user if DeepSeek was planned for medical chatbot responses. |
| **HYP-02** | `meditation_extracted` EEG dataset (4.1 GB) is obsolete dead storage. | Verify whether any planned feature requires EEG raw data; if not, prune from deployment container. |
| **HYP-03** | Frontend mock data was introduced solely for static GitHub Pages demonstration. | Inspect `package.json` `"deploy": "gh-pages"` and verify that the UI was published without a backend. |
