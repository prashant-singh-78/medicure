# Medicure — External API & Service Integration Forensic Audit

**Diagnostic Phase**: Phase 6 API & Service Forensics  
**Date**: October 2026  
**Auditor**: ML Systems Forensic Auditor  

---

## 1. Security Compliance Notice

> [!IMPORTANT]
> In accordance with diagnostic guidelines, **NO RAW SECRETS, TOKENS, COOKIES, OR CREDENTIALS ARE REVEALED IN THIS REPORT**. All configuration variables are referenced by their **exact variable names only**.

---

## 2. API Integration Matrix

| Integration Name | Configuration Variable Name | Calling Source File | Model / Endpoint Specified | Observed Operational Status | Primary Failure Mode / Error Category |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Generative AI (Gemini Chat)** | `GEMINI_API_KEY` | `backend/app/routes/friend_chat.py` | `gemini-1.5-flash` | Degraded / Flawed Error Handling | Silent error swallowing; returns random canned replies on failure. |
| **Google Generative AI (Gemini Report)**| `GEMINI_API_KEY` | `backend/app/routes/report.py` | `gemini-1.5-flash` | Degraded / Flawed Error Handling | Silent error swallowing; returns simulated report text on failure. |
| **Google Generative AI (Gemini Vision)**| `GEMINI_API_KEY` | `backend/app/routes/visual_check.py` | `models/gemini-2.5-flash` | **Broken / Invalid Endpoint** | Model does not exist in API catalog (`404 Not Found`). |
| **DeepSeek AI** | `DEEPSEEK_API_KEY` | *(None - orphaned)* | *(Unspecified)* | **Orphaned / Unused** | Configured in `.env` but never referenced anywhere in code. |
| **Tesseract OCR Engine** | *(System binary)* | `backend/app/routes/medicine.py` | Local `pytesseract` CLI | **Missing System Dependency** | `tesseract.exe` not found on PATH; returns placeholder text. |
| **Expanded Medicine Database** | *(Filesystem path)* | `backend/app/routes/medicine.py` | `medicine_expanded.db` | **Missing File / 404** | Target SQLite database missing from disk. |

---

## 3. Forensic Analysis: Google Generative AI (Gemini)

### 3.1 Invalid Model Identifier in `visual_check.py`
In `backend/app/routes/visual_check.py` (line 24):
```python
model = genai.GenerativeModel(model_name="models/gemini-2.5-flash")
```
- **Error Description**: The string `"models/gemini-2.5-flash"` does not correspond to any published Gemini production or preview model in the Google AI API.
- **Diagnostic Result**: Any user uploading an image to the Visual Symptom Checker triggers an API 404/NotFound error from the Google Generative Language endpoint.
- **Handling in Code**: Caught by lines 61-68:
  ```python
  except Exception as e:
    return {
        "status": "error",
        "analysis": "### ⚠️ Analysis Note\n\nI encountered an issue...",
    }
```
  The endpoint permanently fails for all users.
- **Remediation**: Update the model identifier to a verified model name, such as `"gemini-1.5-flash"`.

---

### 3.2 Silent Error Masking in `report.py`
In `backend/app/routes/report.py` (lines 87-98):
```python
    except Exception as e:
      print(f"DEBUG: Report Analysis Error: {str(e)}")
      fallback_msg = [
          (
              "### 📊 Analysis Note\n\nI was able to read your report, but I'm"
              " having a little trouble interpreting the medical nuances right"
              " now..."
          ),
          (
              "### 🩺 AI Assistant Note\n\nYour report has been uploaded! 📑 I'm"
              " currently experiencing a high volume of requests..."
          ),
      ]
      return {"status": "success", "analysis": random.choice(fallback_msg)}
```
- **Critical Flaw**: When the Google API fails (due to quota limits, network latency, bad key, or content moderation blocks), the endpoint returns HTTP `200 OK` with `"status": "success"`.
- **Impact**: The user is led to believe the AI successfully analyzed their medical report, when in reality an unhandled API exception occurred.

---

### 3.3 Silent Error Masking in `friend_chat.py`
In `backend/app/routes/friend_chat.py` (lines 77-91):
```python
    except Exception as e:
      error_detail = f"AI chat error: {str(e)}"
      print(f"DEBUG: {error_detail}")
      fallback_responses = [
          (
              "Hey! 💙 I'm here for you, but I'm feeling a bit shy right now."
              " Tell me more about what's on your mind?"
          ),
          (
              "That sounds like a lot to handle. Remember, I'm always on your"
              " team! What else would you like to talk about? 😊"
          ),
      ]
      return {"reply": random.choice(fallback_responses)}
```
- **Critical Flaw**: When API calls to `gemini-1.5-flash` fail, the route swallows the error and responds with randomized friendly phrases.
- **Impact**: If a patient asks a medical or psychological question, the system ignores the question completely and outputs a generic friendly diversion.

---

## 4. Forensic Analysis: Orphaned DeepSeek Integration

- In `backend/.env`, `DEEPSEEK_API_KEY` is present.
- A full-text grep of the repository reveals **zero references** to `DEEPSEEK` or `deepseek` in Python or JavaScript source files.
- **Hypothesis**: The development team intended to integrate DeepSeek for medical reasoning or conversational fallback, but never implemented the integration.

---

## 5. Forensic Analysis: Local Tesseract OCR

In `backend/app/routes/medicine.py` (lines 148-153):
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
- **Environment Status**: Tesseract binary (`tesseract.exe`) is not present in Windows System PATH.
- **Downstream Logic Failure**:
  Lines 154-170 check:
  ```python
  is_suspicious = any(kw in text_lower for kw in suspicious_keywords)
  has_known_brand = any(brand in text_lower for brand in genuine_brands)
```
  Because `ocr_text` contains the installation URL string, it matches neither condition and returns `status="unknown", confidence=45.0`.
- **Frontend Masking**:
  `MedicineDetection.jsx` (lines 49-51) wraps the fetch in `catch`:
  ```javascript
  catch {
    setResult({
      status: "genuine",
      name: "Amoxicillin 250mg OCR Scan",
      manufacturer: "Cipla Ltd.",
      batch: "BATCH-8821",
      expiry: "2026-12",
      confidence: 96.8,
    });
  }
```
  If the network or server fails, the client outputs a fake `96.8% confidence` genuine result.

---

## 6. Frontend Mock Response Inventory

The audit revealed that **every core feature in the React frontend contains hardcoded simulation catch blocks** that fabricate medical output whenever backend APIs or network requests fail:

| Frontend Page | Trigger Condition | Fabricated Mock Data Displayed to User |
| :--- | :--- | :--- |
| `MedicineDetection.jsx` | QR code fetch failure | `Paracetamol 500mg, Sun Pharma, confidence: 99.2%` |
| `MedicineDetection.jsx` | Package image OCR failure | `Amoxicillin 250mg, Cipla Ltd., confidence: 96.8%` |
| `MedicineDetection.jsx` | Medicine search failure | Hardcoded Dolo 650mg and Pan-D cards |
| `MedicineSuggestion.jsx`| Symptom suggest failure | Empty or fallback error toast |
| `VoiceDetection.jsx` | Audio analyze failure | Random coin-flip: `Math.random() > 0.5 ? 'Positive Risk' : 'Low Risk'` with random confidence `(Math.random() * 20 + 78)` |
| `SkinAnalyzer.jsx` | Skin analyze failure | `Mild Inflammatory Acne / Rosacea, confidence: 94.5%, health: 82%` |
| `ReportAnalyzer.jsx` | Report analyze failure | Full fabricated CBC pathology report (Hemoglobin 13.8, WBC 7,200, Glucose 98, Cholesterol 185) |

> [!CAUTION]
> This pattern of substituting fake high-confidence clinical outcomes on network errors creates an extreme clinical liability. A patient whose vocal recording or skin upload fails to reach the backend is shown a fabricated diagnostic result without any notification of transmission failure.