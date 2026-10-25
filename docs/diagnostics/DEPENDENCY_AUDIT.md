# Medicure — Dependency, Environment & Compatibility Audit

**Diagnostic Phase**: Phase 1 Environment & Dependency Forensics  
**Date**: October 2026  
**Auditor**: ML Systems Forensic Auditor  

---

## 1. Python Environment Audit

### 1.1 Virtual Environment Overview
- **Path**: `smart-health-assistant/backend/venv`
- **Python Version**: `3.11.1` (64-bit Windows)
- **Base Executable**: `C:\Users\prash\AppData\Local\Programs\Python\Python311\python.exe`
- **Pip Version**: `22.3.1` (upgrade warning present)

### 1.2 Package Matrix: Specified vs Installed

| Package Name | Specified in `requirements.txt` | Actually Installed | Version Difference / Impact |
| :--- | :--- | :--- | :--- |
| `fastapi` | `>=0.110.0` | `0.135.1` | Compatible modern release |
| `uvicorn` | `>=0.28.0` | `0.42.0` | Compatible modern release |
| `pydantic` | `>=2.6.4` | `2.12.5` | Pydantic V2 in use |
| `scikit-learn` | `>=1.4.0` | `1.8.0` | **High Risk**: Scikit-Learn 1.8 introduced API changes and stricter validation on feature dimensions. |
| `numpy` | `>=1.26.0` | `2.4.3` | **Critical Risk**: NumPy 2.x breaking changes affect C extensions, array scalar representations, and serialization. |
| `pandas` | `>=2.0.0` | `3.0.1` | Pandas 3.x breaking changes on PyArrow backends and copy-on-write semantics. |
| `tensorflow-cpu` | `>=2.15.0` | `2.20.0` | Upgraded to TensorFlow 2.20.0 CPU. |
| `keras` | *(implicit)* | `3.13.2` | **High Risk**: Keras 3 rewrite. Model loading emits warnings on metric compilation. |
| `librosa` | `>=0.10.1` | `0.11.0` | Modern Librosa release. Requires `soundfile` and `soxr`. |
| `joblib` | `>=1.3.0` | `1.5.3` | Compatible pickling library. |
| `pillow` | `>=10.2.0` | `12.1.1` | Modern PIL release. |
| `pytesseract` | `>=0.3.10` | `0.3.13` | Python wrapper only; **system binary is missing**. |
| `google-generativeai` | `>=0.7.0` | `0.8.6` | Modern Google Generative AI SDK. |
| `sqlalchemy` | `>=2.0.0` | `2.0.48` | SQLAlchemy 2.0 style used in `database.py`. |
| `python-jose` | `>=3.3.0` | `3.5.0` | Cryptographic signing for JWT tokens. |
| `passlib[bcrypt]` | `>=1.7.4` | `1.7.4` (`bcrypt==4.0.1`) | Passlib has known deprecation warnings with `bcrypt>=4.0.0`. |

---

## 2. Missing System Binaries & External Tool Dependencies

### 2.1 Tesseract OCR (`tesseract.exe`)
- **Calling Code**: `smart-health-assistant/backend/app/routes/medicine.py` (lines 149-153):
  ```python
  try:
    import pytesseract

    ocr_text = pytesseract.image_to_string(img, lang="eng").strip()
  except Exception:
    ocr_text = (
        "[OCR not available — install Tesseract:"
        " https://github.com/tesseract-ocr/tesseract]"
    )
```
- **Observed State**: `tesseract.exe` is **NOT installed** on the Windows host PATH.
- **Diagnostic Proof**: Any image uploaded to `/api/medicine/analyze-image` triggers the exception handler, populating `ocr_text` with the error string. Because this string contains neither `"fake"` nor known brand names, it always evaluates to `status="unknown", confidence=45.0`.
- **Frontend Reaction**: The React frontend (`MedicineDetection.jsx`) catches any timeout or downstream issue and substitutes a fake hardcoded result (`Amoxicillin 250mg, Cipla Ltd., confidence 96.8%`).

---

## 3. Node.js & Frontend Dependency Audit

### 3.1 Dependencies in `smart-health-assistant/frontend/package.json`
- **React**: `^19.2.4` (React 19 release)
- **Vite**: `^8.0.1` (Vite 8 build tool)
- **Capacitor**: `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` (`^8.2.0`)
- **gh-pages**: `^6.3.0` (static GitHub Pages publishing tool)

### 3.2 Proxy & URL Inconsistencies
There is an active discrepancy in how frontend pages construct API request URLs:
1. **Pages using `VITE_API_BASE_URL`**:
   - `FriendChat.jsx`: `(import.meta.env.VITE_API_BASE_URL || '') + '/api/friend-chat/message'`
   - `ReportAnalyzer.jsx`: `(import.meta.env.VITE_API_BASE_URL || '') + '/api/report/analyze'`
   - `DiseasePrediction.jsx`: `(import.meta.env.VITE_API_BASE_URL || '') + '/api/disease/predict'`
   - `SkinAnalyzer.jsx`: `(import.meta.env.VITE_API_BASE_URL || '') + '/api/skin/analyze'`
   - `VisualChecker.jsx`: `(import.meta.env.VITE_API_BASE_URL || '') + '/api/visual-check/analyze'`
   - `VoiceDetection.jsx`: `(import.meta.env.VITE_API_BASE_URL || '') + '/api/voice/analyze'`
2. **Pages using relative paths (omitting `VITE_API_BASE_URL`)**:
   - `MedicineSuggestion.jsx` (line 16): `fetch('/api/medicine/suggest?symptoms=...')`
   - `MedicineDetection.jsx` (line 27): `fetch('/api/medicine/verify?code=...')`
   - `MedicineDetection.jsx` (line 59): `fetch('/api/medicine/search?query=...')`
   - `AboutDisease.jsx` (line 15): `fetch('/api/medicine/suggest?symptoms=...')`

> [!WARNING]
> While Vite's development server proxies `/api` to `http://127.0.0.1:8000` via `vite.config.js`, any production build deployed to GitHub Pages (`gh-pages`) or mobile device via Capacitor will fail for all relative URL calls because there is no reverse proxy running on the static host or mobile device.

---

## 4. Environment Variables Audit

> [!IMPORTANT]
> In accordance with diagnostic security instructions, **NO SECRET VALUES, TOKENS, OR API KEYS ARE DISCLOSED IN THIS REPORT**. Only variable names, files, and functional statuses are recorded.

| Variable Name | Location | Calling Module(s) | Observed Functional Status | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | `backend/.env` | `routes/friend_chat.py`, `routes/report.py`, `routes/visual_check.py` | Configured with valid string length, but fails in `visual_check.py` due to invalid model identifier `models/gemini-2.5-flash`. | Fix model identifiers to stable names (`gemini-1.5-flash`). Add proper error responses. |
| `DEEPSEEK_API_KEY` | `backend/.env` | *(None)* | **Orphaned Credential**. Configured in `.env` but never loaded by `os.getenv` or called anywhere in source code. | Clarify if DeepSeek was intended to replace Gemini for the medical chatbot. |
| `DATABASE_URL` | Optional | `app/database.py` | Defaults to local SQLite file `sqlite:///../database/medicines.db`. | Retain default SQLite path or specify persistent absolute path. |
| `VITE_API_BASE_URL` | `frontend/.env` | All frontend React pages | Configured as `http://localhost:8000`. | Normalize all API calls to consistently use this environment variable. |

---

## 5. Potential Serialization & Framework Conflicts

1. **Pickle / Joblib Cross-Version Deserialization**:
   - `disease_model.pkl` was saved using older Scikit-Learn versions and contains `CalibratedClassifierCV` wrapping `RandomForestClassifier`.
   - Running under `scikit-learn==1.8.0` and `numpy==2.4.3` loads without an immediate crash, but future re-serialization or cross-environment migration between NumPy 1.x and NumPy 2.x may trigger binary unpickling failures.
2. **Keras 3 Multi-Backend Warning**:
   - Loading `skin_model.h5` in Keras 3 prints:
     `WARNING:absl:Compiled the loaded model, but the compiled metrics have yet to be built. model.compile_metrics will be empty until you train or evaluate the model.`
   - This occurs because `.h5` (Legacy Keras format) does not encapsulate optimizer metrics identically to Keras 3 `.keras` format.
3. **Matplotlib Global Directory Permission**:
   - In sandboxed environments or specific user permission profiles, Matplotlib warns:
     `C:\Users\prash\.matplotlib is not a writable directory... highly recommended to set the MPLCONFIGDIR environment variable.`
   - This causes an unexpected 3-5 second delay on the first import of Matplotlib while the font cache is rebuilt in a temporary folder.