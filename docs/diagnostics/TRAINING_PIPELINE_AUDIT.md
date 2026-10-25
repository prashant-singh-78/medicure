# Medicure — Training Pipeline Forensic Audit

**Diagnostic Phase**: Phase 3 Training Pipeline Audit  
**Date**: October 2026  
**Auditor**: ML Systems Forensic Auditor  

---

## 1. Cross-Model Pipeline Comparison

| Training Pipeline Element | Disease Predictor (`train_disease.py`) | Voice Model (`train_voice_model.py`) | Skin Lesion Model (`train_skin.py`) |
| :--- | :--- | :--- | :--- |
| **Source Script** | `backend/models/train_disease.py` | `ml_workspace/train_voice_model.py` | `backend/app/models/train_skin.py` |
| **Model Type** | `Pipeline(TfidfVectorizer, CalibratedClassifierCV(RandomForest))` | `Pipeline(StandardScaler, VotingClassifier(RF, GB))` | Transfer Learning: `MobileNetV2` + Dense Classification Head |
| **Target Variable** | Disease category string | Binary vocal status (`0` / `1`) | 4-class dermatological label |
| **Input Shape** | Arbitrary text string | 22 numerical acoustic features | RGB image resized to `(224, 224, 3)` |
| **Preprocessing** | Lowercasing, TF-IDF unigrams & bigrams | `StandardScaler()` zero-mean unit-variance | Rescale `1./255`, random rotation, shifts, horizontal flip |
| **Optimization / Loss**| Log-loss / Brier score calibration | Cross-entropy / Soft probability voting | `Adam(lr=0.001)`, `categorical_crossentropy` |
| **Batch / Epochs** | Full batch (CPU) | Full batch (CPU) | Batch size 32, 10 epochs |
| **Class Weighting** | `class_weight='balanced'` | `class_weight='balanced'` on RF | **None** (unweighted under severe imbalance) |
| **Split Strategy** | Stratified 85/15 (leaked) | Stratified 80/20 (leaked) | `validation_split=0.2` (leaked) |
| **Saved Artifact Path** | `backend/models/disease_model.pkl` | `backend/models/voice_model.pkl` | `backend/models/skin_model.h5` |
| **Artifact Status** | **STALE PROTOTYPE CHECKPOINT** (10 classes vs 45) | **FEATURE MISMATCH ON INFERENCE** (expects 22, gets 17) | **DEFICIENT ACCURACY** (42.44% val accuracy) |

---

## 2. Detailed Audit: Disease Predictor (`train_disease.py`)

### 2.1 The Stale Artifact Finding
Inspection of `train_disease.py` reveals that the script was written to iterate over all rows of `ml_workspace/data/disease_dataset.csv` (which contains 45 disease conditions).
However, forensic inspection of the deployed model file `backend/models/disease_model.pkl` revealed:
- `classifier.classes_` contains only **10 classes**:
  `['Allergy', 'Asthma', 'Covid', 'Diabates', 'Diarrhoea', 'Heart Attack', 'Influenza', 'Malaria', 'Parkinson', 'Ulcer']`
- `disease_metadata.pkl` contains only **10 keys**, with the misspelling `'Diabates'`.
- **Finding**: The saved artifact in `backend/models/` is an **early prototype artifact** that was never updated when the author expanded the dataset to 45 conditions.
- As a consequence, 35 out of 45 diseases (77.8%) present in the application's clinical dataset cannot be predicted by the deployed model.

### 2.2 Text Tokenization & OOD Vulnerability
- Vectorizer: `TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words='english')`.
- Vocabulary size in deployed artifact: **66 tokens**.
- Because the training vocabulary consists only of the narrow symptom words for 10 diseases, any general inquiry, out-of-domain prompt, or unlisted symptom produces an all-zero TF-IDF vector.
- The classifier lacks an open-set rejection mechanism or confidence threshold. When provided an all-zero vector, it emits `'Diabates'` with a 16.0% probability, which the route formats as a positive medical diagnosis.

---

## 3. Detailed Audit: Voice Model Pipeline (`train_voice_model.py`)

### 3.1 Training-to-Inference Feature Schema Divergence
The most severe architectural bug in the repository exists between `train_voice_model.py` and `routes/voice.py`.

#### Features Used in Training (`train_voice_model.py`):
The model fits `StandardScaler` on 22 specific columns from the UCI Parkinson's dataset:
1. `MDVP:Fo(Hz)` (Fundamental frequency mean)
2. `MDVP:Fhi(Hz)` (Fundamental frequency max)
3. `MDVP:Flo(Hz)` (Fundamental frequency min)
4. `MDVP:Jitter(%)`
5. `MDVP:Jitter(Abs)`
6. `MDVP:RAP` (Relative Amplitude Perturbation)
7. `MDVP:PPQ` (Pitch Period Perturbation Quotient)
8. `Jitter:DDP`
9. `MDVP:Shimmer`
10. `MDVP:Shimmer(dB)`
11. `Shimmer:APQ3`
12. `Shimmer:APQ5`
13. `MDVP:APQ`
14. `Shimmer:DDA`
15. `NHR` (Noise-to-Harmonics Ratio)
16. `HNR` (Harmonics-to-Noise Ratio)
17. `RPDE` (Recurrence Period Density Entropy)
18. `DFA` (Detrended Fluctuation Analysis)
19. `spread1` (Nonlinear fundamental frequency variation)
20. `spread2`
21. `D2` (Correlation dimension)
22. `PPE` (Pitch Period Entropy)

#### Features Extracted During Inference (`routes/voice.py`):
In `routes/voice.py` (lines 26-50), the author uses Librosa on uploaded audio bytes:
```python
mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
mfcc_mean = np.mean(mfccs, axis=1)  # 13 MFCC features
...
features = np.concatenate([mfcc_mean, [mdvp_fo, jitter, shimmer, hnr_val]])
```
`voice.py` constructs a vector of **17 features** (13 MFCC coefficients + 4 scalars). None of the nonlinear dynamical features (RPDE, DFA, spread1, spread2, D2, PPE) or detailed perturbation quotients (RAP, PPQ, DDP, APQ3, APQ5, DDA) are computed.

#### The Consequence:
1. When `model.predict([features])` executes, `StandardScaler` raises `ValueError: X has 17 features, but StandardScaler is expecting 22 features as input.`
2. The route wraps the inference call in a broad `try...except Exception:` block and falls back to a hand-crafted rule:
   ```python
   risk_score = jitter * 50 + shimmer * 20
   confidence = min(95.0, 55 + risk_score * 10)
```
3. The trained ML model is **100% bypassed at runtime**.

---

## 4. Detailed Audit: Skin Lesion Pipeline (`train_skin.py`)

### 4.1 Architecture & Training Hyperparameters
- Base Network: `MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))`
- Base Frozen: `base_model.trainable = False`
- Classification Head:
  - `GlobalAveragePooling2D()`
  - `Dense(128, activation='relu')`
  - `Dropout(0.5)`
  - `Dense(4, activation='softmax')`
- Optimizer: `Adam(learning_rate=0.001)`
- Epochs: 10
- Batch size: 32

### 4.2 Training Flaws Identified
1. **Severe Underfitting on Rare Classes**:
   - The base network was frozen, allowing only the final 164,484 parameters of the 2.42M total parameters to adapt.
   - With 10 epochs and no class weighting on an extreme 51.7% / 40% vs 4.5% / 3.7% class imbalance, the network minimized loss by learning to almost exclusively predict `Acne_Mild` and `Healthy`.
   - The validation recall for `Acne_Severe` is **0.00%**.
2. **Missing Training Checkpoints & Early Stopping**:
   - No `ModelCheckpoint` or `EarlyStopping` callbacks were used; only the model state at epoch 10 was serialized.
   - No evaluation metrics (macro F1, per-class recall) were logged during training.
3. **Inconsistent Preprocessing in Training vs Inference**:
   - Training uses `ImageDataGenerator(rotation_range=20, width_shift_range=0.2, height_shift_range=0.2, horizontal_flip=True)`.
   - Inference (`routes/skin.py`) takes raw base64, resizes to (224, 224), divides by 255.0, and directly passes to `model.predict`.
   - While the basic rescaling (`1./255`) matches, the inference pipeline does not perform bounding-box cropping, skin segmentation, or color normalization.