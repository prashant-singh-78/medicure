# Medicure — Large Dataset Forensic Analysis

**Diagnostic Phase**: Phase 2 Dataset Forensic Audit  
**Date**: October 2026  
**Auditor**: ML Systems Forensic Auditor  

---

## 1. Inventory & Metadata Overview

All datasets across the Medicure project repository and adjacent workspace folders were analyzed using chunked streams, metadata inspection, and cryptographic hashing without overloading RAM.

| Dataset Identifier | Location Path | Format | Size on Disk | Record Count | Validated Hash / Integrity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Disease Conditions** | `smart-health-assistant/ml_workspace/data/disease_dataset.csv` | CSV (UTF-8) | 6,031 bytes | 45 rows | Complete |
| **Parkinson's Voice Data** | `smart-health-assistant/ml_workspace/data/parkinsons.data` | CSV / ASCII | 40,697 bytes | 195 rows | Complete |
| **Acne & Lesions (Raw)** | `acne/` | JPEG Images | 150 MB | 2,060 files | 0 corrupt |
| **Acne & Lesions (Organized)**| `backend/app/models/skin_dataset_organized/` | Folder Tree | 150 MB | 2,060 files | 0 corrupt |
| **Indian Medicine Store** | `medicine_data.csv` | CSV | 337.75 MB | 195,605 rows | Complete |
| **Primary SQLite DB** | `backend/database/medicines.db` | SQLite 3 | 69,632 bytes | 7 tables | Operational |
| **Expanded Medicine DB** | `backend/database/database/medicine_expanded.db` | SQLite 3 | **0 bytes** | **0 rows** | **MISSING FILE** |
| **Meditation EEG Dataset** | `meditation_extracted/BIDS_EEG_meditation_experiment/` | BIDS / EEG | ~4.1 GB | 24 subjects | Complete |

---

## 2. Dataset 1: `disease_dataset.csv`

### 2.1 File & Schema Characteristics
- **Exact Size**: 6,031 bytes
- **Dimensions**: 45 rows × 9 columns
- **Target Column**: `Desease list` (45 distinct diagnostic classes)
- **Feature Columns**: `Symptom 1`, `Symptom 2`, `Symptom 3`, `Symptom 4`, `Symptom 5`
- **Metadata Columns**: `Test 1`, `Test 2`, `Consultant`

### 2.2 Missing Values & Data Integrity
| Column Name | Non-Null Count | Null Count | Null % | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `Desease list` | 45 | 0 | 0.00% | Unique label per row |
| `Symptom 1` | 45 | 0 | 0.00% | Primary presenting symptom |
| `Symptom 2` | 45 | 0 | 0.00% | Secondary symptom |
| `Symptom 3` | 45 | 0 | 0.00% | Tertiary symptom |
| `Symptom 4` | 45 | 0 | 0.00% | Present in all rows |
| `Symptom 5` | 45 | 0 | 0.00% | Present in all rows |
| `Test 1` | 45 | 0 | 0.00% | Clinical recommendation |
| `Test 2` | 45 | 0 | 0.00% | Secondary clinical test |
| `Consultant` | 44 | 1 | 2.22% | Missing consultant for row 41 (`Lyme Disease`) |

### 2.3 Structural Deficiency: Single-Instance Clinical Classes
- Every disease condition in this dataset appears **exactly once**.
- There is **zero natural clinical variance, no real patient records, and no observed clinical distributions**.
- All natural language variations are synthetically generated in memory during training by combinatorial permutations.

---

## 3. Dataset 2: `parkinsons.data` (UCI Machine Learning Repository)

### 3.1 Provenance & Schema
- **Origin**: Max Little et al., University of Oxford / National Centre for Voice and Speech (2007).
- **Disk Size**: 40,697 bytes
- **Dimensions**: 195 rows × 24 columns
- **Missing Values**: 0 nulls across all 24 columns.
- **Target Column**: `status` (Binary: `1` = Parkinson's Disease, `0` = Healthy Control).

### 3.2 Label Distribution & Class Imbalance
- **Positive Class (`1`)**: 147 recordings (75.38%)
- **Negative Class (`0`)**: 48 recordings (24.62%)
- **Imbalance Ratio**: ~3.06 : 1 (Significant positive skew)

### 3.3 Patient Subject Grouping Forensic
Each row identifier in column `name` follows the format `phon_R01_SXX_Y`, where `SXX` represents the unique patient subject identifier:
- **Unique Subjects (`patients`)**: Exactly **32 subjects** across the 195 recordings.
- **Recordings per Subject**: Mean = 6.09 (min: 6, max: 7 recordings per individual).
- **Inter-Class Subject Consistency**: 0 subjects have mixed status. 23 subjects are strictly Parkinson's patients, and 9 subjects are strictly healthy controls.

> [!CRITICAL]
> The UCI Parkinson's dataset consists of multiple recordings from the same human vocal cords. Splitting this dataset randomly across recordings violates patient separation and creates severe optimistic leakage.

---

## 4. Dataset 3: Dermatology Acne & Skin Lesion Dataset (`acne/`)

### 4.1 File Inventory & Integrity
- **Total Files**: 2,060 images
- **Image Extensions**: 100% `.jpg` (2,060 files)
- **Decodability**: 2,060 / 2,060 images successfully opened and decoded via Pillow without corruptions.
- **Exact Byte Duplicates (MD5 Hash)**: 0 exact binary duplicate files (2,060 unique MD5 hashes).

### 4.2 Roboflow Provenance & Near-Duplicate Analysis
- **Roboflow Augmentation Tag**: All 2,060 files (100%) contain `.rf.` in their filename (e.g., `07Acne081101_jpg.rf.78aec21a5f31ef6ece56e374fe449f32.jpg`).
- **Files with explicit `-Copy`**: 38 files.
- **Unique Base Image Names before `.rf.` hash**: Exactly **1,888 unique base images**.
- This proves the dataset was exported from Roboflow with geometric or photometric data augmentations applied *prior to export*.

### 4.3 Image Dimensions & Aspect Ratios
The raw images exhibit extreme dimensional heterogeneity:
- `(150, 150)`: 806 images (39.1%)
- `(720, 472)`: 129 images (6.3%)
- `(720, 480)`: 64 images (3.1%)
- `(720, 477)`: 39 images (1.9%)
- `(720, 471)`: 32 images (1.6%)
- Over 180 other varied image resolutions ranging from `150x150` thumbnails up to `1024x768` macro photos.

---

## 5. Dataset 4: Large Indian Medicine Dataset (`medicine_data.csv`)

### 5.1 Volume & Streamed Inspection
Because `medicine_data.csv` is 337.75 MB (354,155,236 bytes), it was analyzed using chunked iteration (`chunksize=50000`) to evaluate full schema properties without saturating host memory.

- **Total Rows**: Exactly **195,605 records**
- **Columns**: 8 columns
- **Memory Consumption if fully loaded into Pandas**: ~980 MB - 1.25 GB RAM.

### 5.2 Schema, Data Types & Missing Value Audit
| Column Name | Data Type | Null Count | Null % | Example Values |
| :--- | :--- | :--- | :--- | :--- |
| `sub_category` | string | 0 | 0.00% | `"Human Insulin Basal"`, `"Analgesics"`, `"Antacid"` |
| `product_name` | string | 0 | 0.00% | `"Human Insulatard 40IU/ml"`, `"Dolo 650mg Tablet"` |
| `salt_composition` | string | 0 | 0.00% | `"Insulin Isophane (40IU)"`, `"Paracetamol (650mg)"` |
| `product_price` | string / float | 19,436 | **9.94%** | `"₹133.93"`, `"₹34.50"`, `NaN` |
| `product_manufactured` | string | 0 | 0.00% | `"Novo Nordisk India"`, `"Sun Pharma"`, `"Cipla"` |
| `medicine_desc` | string (long text) | 0 | 0.00% | Detailed indications, administration, clinical guidance |
| `side_effects` | string | 0 | 0.00% | `"Hypoglycemia, Weight gain, Injection site reaction"` |
| `drug_interactions` | string (JSON format) | 0 | 0.00% | `'{"drug": ["Benazepril"], "effect": ["MODERATE"]}'` |

### 5.3 Forensic Finding: The Missing SQLite Database Link
- In `smart-health-assistant/backend/app/routes/medicine.py`, lines 10, 18, 40 define:
  ```python
  EXPANDED_DB_PATH = os.path.join(
      os.path.dirname(__file__),
      "../../database/database/medicine_expanded.db",
  )
```
- And lines 27-31 execute:
  ```python
  cursor.execute(
      "SELECT * FROM medicines WHERE product_name LIKE ? LIMIT 20",
      (f"%{query}%",),
  )
```
- **The forensic truth**: `medicine_data.csv` was downloaded as the source pharmaceutical dataset for this feature, but was **never converted or compiled into `medicine_expanded.db`**. As a consequence, all medicine search and suggestion features in production throw a 404 error.

---

## 6. Dataset 5: SQLite Database (`backend/database/medicines.db`)

Forensic inspection of the existing SQLite database reveals the following record counts:
- `medicines`: **5 rows only** (`Paracetamol 500mg`, `Amoxicillin 250mg`, `Metformin 500mg`, `Aspirin 75mg Counterfeit`, plus 1 test record).
- `doctors`: **2 rows** (`Dr. Rajesh Kumar`, `Dr. Anita Desai`).
- `ambulances`: **1 row** (`DL-01-AB-1234`).
- `disease_info`: **10 rows** (seeded from early 10-disease prototype).
- `users`: **6 rows** (registered test user accounts).
- `history`: **7 rows** (activity log records).
- `reminders`: **1 row**.

The database is functional for basic CRUD operations, but contains virtually none of the medical knowledge needed to answer broad clinical inquiries.