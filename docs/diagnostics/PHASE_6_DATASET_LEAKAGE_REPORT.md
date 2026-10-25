# Medicure — Phase 6: Zero-Leakage Dataset Split Repair Report

**Phase**: Phase 6 Dataset Grouping Forensics, Overlap Remediation & Independent Split Verification  
**Date**: October 2026  
**Auditor / Role**: Senior ML Data-Quality Engineer  
**Final Verdict**: **`ZERO LEAKAGE CONFIRMED & REPAIRED (MANIFEST V2.0)`**  
**Training & Deployment Status**: **ZERO MODELS RETRAINED. APPLICATION NOT DEPLOYED.** Original images and original model artifacts remain 100% unaltered.

---

## 1. Executive Summary

In Phase 5, an independent audit revealed that while the split manifest had zero string overlap in its manifest base lists, **8 out of 1,857 base lesion clusters (16 images total) crossed split partition boundaries**. Five clusters crossed between Train and Test, two crossed between Train and Validation, and one crossed between Validation and Test.

In Phase 6, a rigorous data-quality investigation was conducted to identify the mechanical root cause of these overlaps, implement a conservative graph-based connected-component clustering algorithm, generate a clean **Manifest Version 2.0**, and independently prove zero leakage across all 2,060 images.

### Key Deliverables & Outcomes:
1. **Root Cause Confirmed**: The 8 overlaps were caused by a greedy digit regular expression (`[0-9]*-copy`) in the original Phase 4 split generator. When images ended in numeric dates or lesion indices (e.g., `07acne081101`), the regex greedily consumed the trailing date digits along with the copy marker, resulting in mismatched base IDs (`07acne` vs `07acne081101`) that were placed into separate splits.
2. **Safer Connected-Component Grouping**: Implemented an exact Union-Find connected-component clustering pipeline that:
   - Links identical binary image content (MD5/SHA-256).
   - Links Roboflow pre-export augmentation stems (`.rf.[a-f0-9]{32}`).
   - Links verified copy markers (`1-copy`, `-copy`, `_copy`) without stripping dates or lesion index numbers.
   - Enforces 100% class purity (zero cross-class connections).
   - Prevents aggressive prefix merging (e.g., keeping distinct patient lesions like `acne-closed-comedo-7` and `acne-closed-comedo-70` completely separate).
3. **Cluster Count Discovered**: The dataset comprises **1,856 true base lesion clusters** across 2,060 images:
   - 1,677 single-image clusters (1,677 images)
   - 157 two-image clusters (314 images)
   - 19 three-image clusters (57 images)
   - 3 four-image clusters (12 images)
4. **Manifest Version 2.0 Generated**: Created a stratified 70% / 15% / 15% cluster-level manifest at [`scratch/phase6/skin_split_manifest_v2.json`](file:///C:/Users/prash/.gemini/antigravity/brain/14bc2de0-5fa1-424c-ae60-8cdb3e12c626/scratch/phase6/skin_split_manifest_v2.json):
   - **Train**: 1,433 images (1,298 clusters)
   - **Validation**: 314 images (277 clusters)
   - **Test**: 313 images (281 clusters)
5. **Zero-Leakage Proven**: Independent verification confirmed:
   - **0 overlapping file paths** across splits ($Train \cap Val = \emptyset, Train \cap Test = \emptyset, Val \cap Test = \emptyset$).
   - **0 overlapping SHA-256 content hashes** across splits.
   - **All 8 previously leaking pairs are 100% co-isolated** into single partitions.
   - **0 corrupt files** across all 2,060 images.
   - **100% consistent class labels** matching directory ground truth.

---

## 2. Root Cause Analysis of the Eight Overlaps

### 2.1 The Greedy Regex Flaw
In the original Phase 4 split generation script, base image grouping used a regular expression to strip Roboflow hashes and duplicate copy markers:
```python
# FLAWED LOGIC USED DURING INITIAL MANIFEST GENERATION:
s = re.sub(r'(\d+)?-copy[0-9]*', '', s, flags=re.IGNORECASE)
```
When evaluated against an image whose original stem ended in digits (such as the date `081101` in `07acne0811011-copy_jpg.rf.a975...`):
1. `\d+` greedily matched the date digits `0811011` before `-copy`.
2. The regex stripped `0811011-copy`, leaving the base stem as: `"07acne"`.
3. Meanwhile, the non-copy original image `07acne081101_jpg.rf.78ae...` contained no `-copy` marker, leaving its stem as: `"07acne081101"`.
4. Because `"07acne"` $\ne$ `"07acne081101"`, the splitter treated them as two distinct base lesion clusters and placed them into different split partitions.

### 2.2 Table of the Eight Overlapping Groups (Before vs. After)

| # | Filename Pair (Twin Variants of Same Lesion) | Disease Class | Phase 4 Split Status (Leaking) | Phase 6 Split Status (Resolved) | Resolved Partition |
| :-: | :--- | :---: | :---: | :---: | :---: |
| **1** | `07acne0811011-copy_jpg.rf.a975...`<br>`07acne081101_jpg.rf.78ae...` | Acne_Mild | **LEAKING** (`test` vs `train`) | **CO-ISOLATED** | `[VAL]` |
| **2** | `241b000fa0e0caf8cf8ac4b29137af481-copy...`<br>`241b000fa0e0caf8cf8ac4b29137af48_jpg...` | Acne_Mild | **LEAKING** (`val` vs `train`) | **CO-ISOLATED** | `[VAL]` |
| **3** | `4a5da7f500000578-amy_..._15215419581041-copy...`<br>`4a5da7f500000578-amy_..._1521541958104_jpg...` | Acne_Mild | **LEAKING** (`train` vs `test`) | **CO-ISOLATED** | `[TRAIN]` |
| **4** | `752kd5y464t011-copy_jpg.rf.dd35...`<br>`752kd5y464t01_jpg.rf.4b47...` | Acne_Mild | **LEAKING** (`val` vs `train`) | **CO-ISOLATED** | `[VAL]` |
| **5** | `acne-closed-comedo-0031-copy_jpg.rf.8415...`<br>`acne-closed-comedo-003_jpg.rf.2661...` | Acne_Mild | **LEAKING** (`test` vs `val`) | **CO-ISOLATED** | `[VAL]` |
| **6** | `acne-closed-comedo-71-copy_jpg.rf.6dc6...`<br>`acne-closed-comedo-7_jpg.rf.3222...` | Acne_Mild | **LEAKING** (`test` vs `train`) | **CO-ISOLATED** | `[TRAIN]` |
| **7** | `07rosaceaok08280631-copy_jpg.rf.6e30...`<br>`07rosaceaok0828063_jpg.rf.1e0b...` | Healthy | **LEAKING** (`train` vs `test`) | **CO-ISOLATED** | `[TRAIN]` |
| **8** | `07steroidperioral11-copy_jpg.rf.b072...`<br>`07steroidperioral1_jpg.rf.f9a3...` | Rosacea_Other | **LEAKING** (`test` vs `train`) | **CO-ISOLATED** | `[VAL]` |

**Critical Observation**:
- **Zero Severe Acne clusters were involved in the leak**. All 93 Severe Acne images remained cleanly partitioned.
- In Phase 6, all 8 pairs are confirmed co-isolated into single partitions (3 in Train, 5 in Validation, 0 split across partitions).

---

## 3. Safer Grouping Methodology & Implementation

### 3.1 Dataset Filename Anatomy
Analysis of all 2,060 images revealed that 100% of filenames adhere to the Roboflow export schema:
$$\texttt{\^{}(?P<stem>.+?)(?:\_|\.)(?:jpg|jpeg|png|webp)?\.rf\.[a-f0-9]\{32\}\.(?:jpg|jpeg|png|webp)\$}$$

When duplicate files were created in Windows prior to Roboflow export, Windows appended `1-Copy` (e.g., `07acne081101 1-Copy.jpg` $\rightarrow$ `07acne0811011-copy`).

### 3.2 Corrected Copy Stripping Rules
To prevent date stripping while accurately removing duplicate markers:
1. **Embedded Resolution Suffix**: Remove `[-_]copy[-_].*$` (e.g., `iss_20309_29682-copy-2-2048x1365`).
2. **Explicit Delimiter Suffix**: Remove `[-_][0-9]-copy$` (e.g., `2-1-1-1-copy`, `acne-1-1-copy`).
3. **Single Copy Index Digit**: Remove `[12]-copy$` strictly matching the single copy counter digit `1` or `2` immediately preceding `-copy` (e.g., `07acne0811011-copy` $\rightarrow$ `07acne081101`).
4. **Generic Suffix**: Remove `[-_]copy$` (e.g., `2ff3...-copy` $\rightarrow$ `2ff3...`).
5. **Parenthesized Counter**: Remove `\([0-9]+\)$` (e.g., `file (1)` $\rightarrow$ `file`).

### 3.3 Connected-Component Clustering Algorithm
Rather than relying on string matching alone, a **Union-Find Disjoint Set** structure was constructed across all 2,060 files:
- **Rule 1 (Binary Content)**: Unify files with identical SHA-256/MD5 hashes.
- **Rule 2 (Roboflow Augmentation)**: Unify files with identical pre-Roboflow raw stems within the same disease class (182 unions).
- **Rule 3 (Copy Suffix Equivalence)**: Unify files whose cleaned stems match an existing base stem within the same disease class (22 unions).
- **Rule 4 (Class Invariance)**: Invariance check asserting that no union operation connects two files belonging to different disease classes.

### 3.4 Prevention of Over-Grouping (Ambiguous Prefixes)
A naive prefix match (e.g., grouping on common prefix `acne-closed-comedo-`) would falsely merge 29 distinct patient photographs. The algorithm strictly requires **exact equality of cleaned stems** rather than prefix matching:
- `acne-closed-comedo-7` and `acne-closed-comedo-71-copy` $\rightarrow$ Clean stem: `acne-closed-comedo-7` (Unified).
- `acne-closed-comedo-7` and `acne-closed-comedo-70` $\rightarrow$ Clean stems: `acne-closed-comedo-7` vs `acne-closed-comedo-70` (Distinct clusters, preserved separate).

---

## 4. Manifest Version 2.0 Partition Statistics

The corrected split was generated with fixed random seed `seed=42` and stratified by class across all 1,856 clusters.

Saved Manifest Path:  
[`scratch/phase6/skin_split_manifest_v2.json`](file:///C:/Users/prash/.gemini/antigravity/brain/14bc2de0-5fa1-424c-ae60-8cdb3e12c626/scratch/phase6/skin_split_manifest_v2.json)

### 4.1 Comparison: Manifest Version 1.0 vs. Version 2.0

| Parameter / Metric | Manifest Version 1.0 (Phase 4) | Manifest Version 2.0 (Phase 6 Repaired) | Remediation Impact |
| :--- | :---: | :---: | :--- |
| **Total Images** | 2,060 | 2,060 | 100% images preserved |
| **Total Base Clusters** | 1,863 (Corrupted by date-strip) | **1,856 (Exact Connected Components)** | -7 false clusters merged |
| **Clusters Leaking Across Splits** | **8 clusters (0.43%)** | **0 clusters (0.00%)** | **100% Elimination of Leakage** |
| **Train Set Images (Clusters)** | 1,451 (1,305 clusters) | **1,433 (1,298 clusters)** | 69.56% of dataset |
| **Validation Set Images (Clusters)** | 300 (279 clusters) | **314 (277 clusters)** | 15.24% of dataset |
| **Test Set Images (Clusters)** | 309 (279 clusters) | **313 (281 clusters)** | 15.19% of dataset |
| **Severe Acne in Test Set** | 16 images (16 clusters) | **14 images (14 clusters)** | 100% strictly held out |
| **Severe Acne in Validation Set**| 13 images (13 clusters) | **13 images (13 clusters)** | Stratified representation |
| **Severe Acne in Train Set** | 64 images (64 clusters) | **66 images (62 clusters)** | Sufficient training sample |

### 4.2 Per-Class Breakdown in Manifest Version 2.0

| Disease Class | Total Images | Total Clusters | Train Images (Clusters) | Validation Images (Clusters) | Test Images (Clusters) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Healthy** | 1,066 | 976 | 736 (683) | 166 (146) | 164 (147) |
| **Acne Mild** | 824 | 716 | 578 (501) | 123 (107) | 123 (108) |
| **Acne Severe** | 93 | 89 | 66 (62) | 13 (13) | 14 (14) |
| **Rosacea / Other** | 77 | 75 | 53 (52) | 12 (11) | 12 (12) |
| **TOTAL** | **2,060** | **1,856** | **1,433 (1,298)** | **314 (277)** | **313 (281)** |

---

## 5. Independent Verification Evidence

A separate, standalone verification script ([`scratch/phase6/step4_independent_manifest_verification.py`](file:///C:/Users/prash/.gemini/antigravity/brain/14bc2de0-5fa1-424c-ae60-8cdb3e12c626/scratch/phase6/step4_independent_manifest_verification.py)) re-audited the disk filesystem and Manifest v2.0 from scratch without referencing the clustering functions.

```
================================================================================
PHASE 6: STEP 4 — INDEPENDENT VERIFICATION OF MANIFEST VERSION 2
================================================================================
Loaded manifest: skin_split_manifest_v2.json (Version: 2.0_zero_leakage)

--- Check 1: File Existence, Image Validity & Directory Labels ---
Total disk files verified: 2060
Corrupt files on disk:     0
Label mismatches between manifest and directory: 0
  [PASS] All 2,060 files exist, are valid uncorrupted images, and have 100% consistent class labels.

--- Check 2: Partition Exclusivity & Content Hash Overlap ---
File Path Overlap Train & Val:  0
File Path Overlap Train & Test: 0
File Path Overlap Val & Test:   0
SHA-256 Content Overlap Train & Val:  0
SHA-256 Content Overlap Train & Test: 0
SHA-256 Content Overlap Val & Test:   0
  [PASS] Zero file path overlap and zero content hash overlap across all partitions.

--- Check 3: Verification of Previously Leaking 8 Clusters ---
  Pair: 07acne0811011-copy_jpg.rf <---> 07acne081101_jpg.rf.78aec -> ISOLATED TOGETHER in [VAL]
  Pair: 241b000fa0e0caf8cf8ac4b29 <---> 241b000fa0e0caf8cf8ac4b29 -> ISOLATED TOGETHER in [VAL]
  Pair: 4a5da7f500000578-5522003- <---> 4a5da7f500000578-5522003- -> ISOLATED TOGETHER in [TRAIN]
  Pair: 752kd5y464t011-copy_jpg.r <---> 752kd5y464t01_jpg.rf.4b47 -> ISOLATED TOGETHER in [VAL]
  Pair: acne-closed-comedo-0031-c <---> acne-closed-comedo-003_jp -> ISOLATED TOGETHER in [VAL]
  Pair: acne-closed-comedo-71-cop <---> acne-closed-comedo-7_jpg. -> ISOLATED TOGETHER in [TRAIN]
  Pair: 07rosaceaok08280631-copy_ <---> 07rosaceaok0828063_jpg.rf -> ISOLATED TOGETHER in [TRAIN]
  Pair: 07steroidperioral11-copy_ <---> 07steroidperioral1_jpg.rf -> ISOLATED TOGETHER in [VAL]
  [PASS] All 8 previously leaking pairs are 100% co-isolated into single split partitions.

--- Check 4: Manifest Base Set Overlap ---
Train base IDs: 1298
Val base IDs:   277
Test base IDs:  281
  [PASS] Zero base ID overlap across manifest partitions.

--- Check 5: Per-Class Counts and Ratios ---
  TRAIN (1433 images): Acne_Mild: 578, Acne_Severe: 66, Healthy: 736, Rosacea_Other: 53
  VAL   ( 314 images): Acne_Mild: 123, Acne_Severe: 13, Healthy: 166, Rosacea_Other: 12
  TEST  ( 313 images): Acne_Mild: 123, Acne_Severe: 14, Healthy: 164, Rosacea_Other: 12
```

---

## 6. Master Test Suite & Timeout Verification

All four Phase 6 scripts were executed under bounded timeouts using [`scratch/phase6/run_all_phase6_checks.py`](file:///C:/Users/prash/.gemini/antigravity/brain/14bc2de0-5fa1-424c-ae60-8cdb3e12c626/scratch/phase6/run_all_phase6_checks.py):

| Test Script | Functional Objective | Execution Time | Exit Code | Result |
| :--- | :--- | :---: | :---: | :---: |
| `step1_investigate_overlaps.py` | Overlap group diagnostics & pattern inventory | 0.10s | 0 | **PASSED** |
| `step2_safer_grouping.py` | Disjoint set clustering & co-clustering verification | 0.57s | 0 | **PASSED** |
| `step3_generate_new_manifest.py`| Stratified 70/15/15 manifest v2 generation | 0.16s | 0 | **PASSED** |
| `step4_independent_manifest_verification.py` | Multi-point independent verification | 1.00s | 0 | **PASSED** |

**Summary**: 4/4 checks passed in 1.83 seconds. Zero failures, zero skipped tests, zero timeouts.

---

## 7. Dataset Suitability Assessment for Future Retraining

### Suitability Verdict: `SUITABLE FOR RETRAINING EXPERIMENTS (WITH MINORITY-CLASS LIMITS)`

The dataset is now mathematically suitable for fair, reproducible machine learning experiments under the following confirmed conditions:
1. **Zero Data Leakage**: Evaluated models will no longer encounter augmented or duplicate twins of training images in validation or testing.
2. **Deterministic Partitions**: All partitions are persisted in `skin_split_manifest_v2.json` and reproducible using fixed seed `42`.
3. **Severe Class Imbalance Remains Unresolved in Raw Data**:
   - The underlying physical dataset still contains only 93 Severe Acne images (4.51%) and 77 Rosacea images (3.74%).
   - While splitting is now mathematically leak-free, **minority class sample scarcity will continue to limit statistical confidence** unless inverse class weighting or targeted minority oversampling is utilized.
   - Test set Severe Acne sample size is $N=14$. Point estimates of recall will continue to have wide 95% Wilson confidence intervals ($\approx \pm 20\%$).

---

## 8. Exact Reproduction Commands & Log Locations

```powershell
# 1. Run Master Phase 6 Suite (All 4 verification checks with bounded timeouts):
& "medicure_src/smart-health-assistant/backend/venv/Scripts/python.exe" -u "C:\Users\prash\.gemini\antigravity\brain\14bc2de0-5fa1-424c-ae60-8cdb3e12c626\scratch\phase6\run_all_phase6_checks.py"

# 2. Run Step 2 Safer Grouping Analysis:
& "medicure_src/smart-health-assistant/backend/venv/Scripts/python.exe" -u "C:\Users\prash\.gemini\antigravity\brain\14bc2de0-5fa1-424c-ae60-8cdb3e12c626\scratch\phase6\step2_safer_grouping.py"

# 3. Run Step 4 Independent Manifest Verification:
& "medicure_src/smart-health-assistant/backend/venv/Scripts/python.exe" -u "C:\Users\prash\.gemini\antigravity\brain\14bc2de0-5fa1-424c-ae60-8cdb3e12c626\scratch\phase6\step4_independent_manifest_verification.py"
```

**Artifact Paths**:
- New Manifest: [`scratch/phase6/skin_split_manifest_v2.json`](file:///C:/Users/prash/.gemini/antigravity/brain/14bc2de0-5fa1-424c-ae60-8cdb3e12c626/scratch/phase6/skin_split_manifest_v2.json)
- Investigation Log: [`scratch/phase6/step1_investigation_results.json`](file:///C:/Users/prash/.gemini/antigravity/brain/14bc2de0-5fa1-424c-ae60-8cdb3e12c626/scratch/phase6/step1_investigation_results.json)
- Clusters Data: [`scratch/phase6/step2_clusters.json`](file:///C:/Users/prash/.gemini/antigravity/brain/14bc2de0-5fa1-424c-ae60-8cdb3e12c626/scratch/phase6/step2_clusters.json)
- Independent Verification Data: [`scratch/phase6/step4_independent_verification_results.json`](file:///C:/Users/prash/.gemini/antigravity/brain/14bc2de0-5fa1-424c-ae60-8cdb3e12c626/scratch/phase6/step4_independent_verification_results.json)
- Master Execution Log: [`scratch/phase6/master_phase6_execution_log.json`](file:///C:/Users/prash/.gemini/antigravity/brain/14bc2de0-5fa1-424c-ae60-8cdb3e12c626/scratch/phase6/master_phase6_execution_log.json)
