# Medicure — Data Flow & Architecture Dependency Map

**Diagnostic Phase**: Phase 1 System Tracing  
**Date**: October 2026  
**Auditor**: ML Systems Forensic Auditor  

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    User([User / Patient]) -->|Browser / Web App| Frontend[React 19 SPA + Vite]
    
    subgraph Frontend Layer
        UI_Voice[VoiceDetection.jsx]
        UI_Disease[DiseasePrediction.jsx]
        UI_Skin[SkinAnalyzer.jsx]
        UI_Report[ReportAnalyzer.jsx]
        UI_Visual[VisualChecker.jsx]
        UI_Medicine[MedicineDetection.jsx / MedicineSuggestion.jsx]
        UI_Chat[FriendChat.jsx]
    end

    Frontend -->|HTTP REST JSON / Multipart| Backend[FastAPI Backend - Port 8000]

    subgraph Backend Routing Layer
        R_Voice["/api/voice/analyze"]
        R_Disease["/api/disease/predict"]
        R_Skin["/api/skin/analyze"]
        R_Report["/api/report/analyze"]
        R_Visual["/api/visual-check/analyze"]
        R_Med["/api/medicine/search & suggest"]
        R_Chat["/api/friend-chat/message"]
    end

    subgraph ML & Deep Learning Artifacts
        Model_Voice[(voice_model.pkl<br/>VotingClassifier - 22 feats)]
        Model_Disease[(disease_model.pkl<br/>TF-IDF + Calibrated RF - 10 classes)]
        Model_Skin[(skin_model.h5<br/>MobileNetV2 Transfer - 4 classes)]
    end

    subgraph Data Stores
        DB_Primary[(medicines.db<br/>SQLite - 5 records)]
        DB_Expanded[(medicine_expanded.db<br/>MISSING ON DISK)]
        CSV_Meds[(medicine_data.csv<br/>195,605 records - UNINDEXED)]
    end

    subgraph External Cloud Services
        API_Gemini[Google Generative AI - Gemini 1.5 Flash]
        API_Tesseract[Local Tesseract OCR Engine - NOT INSTALLED]
    end

    R_Voice -->|Feature Extraction| Model_Voice
    R_Disease -->|TfidfVectorizer| Model_Disease
    R_Skin -->|PIL Resize & Rescale| Model_Skin
    R_Report -->|Multipart Image| API_Gemini
    R_Visual -->|Image Bytes| API_Gemini
    R_Med -->|SQLite Query| DB_Expanded
    R_Chat -->|Chat History & Prompt| API_Gemini
```

---

## 2. End-to-End Subsystem Traces

### Subsystem A: Voice Disorder Detection (`/api/voice/analyze`)

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient
    participant UI as VoiceDetection.jsx
    participant Route as voice.py (/analyze)
    participant Librosa as extract_features_from_audio()
    participant ML as voice_model.pkl
    participant Fallback as _heuristic_prediction()

    User->>UI: Records audio via Web Audio API (MediaRecorder)
    UI->>Route: POST multipart/form-data (audio/webm)
    Route->>Librosa: Writes temp file, loads with sr=22050
    Librosa-->>Route: Extracts 13 MFCCs + mdvp_fo + jitter + shimmer + hnr (17 features)
    Route->>ML: model.predict([features_17])
    Note over ML: CRASH! StandardScaler expects 22 features.<br/>Raises ValueError!
    ML-->>Route: Exception caught silently
    Route->>Fallback: _heuristic_prediction(feature_dict, disease)
    Note over Fallback: Computes: risk_score = jitter*50 + shimmer*20<br/>confidence = min(95.0, 55 + risk_score*10)
    Fallback-->>Route: Simulated prediction label + heuristic confidence
    Route-->>UI: 200 OK {"prediction": "Positive Risk...", "confidence": 85.0, "note": null}
    Note over UI: UI displays heuristic result as if ML model succeeded!
```

---

### Subsystem B: Disease Predictor (`/api/disease/predict`)

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient
    participant UI as DiseasePrediction.jsx
    participant Route as disease.py (/predict)
    participant Pipe as disease_model.pkl (Pipeline)
    participant Meta as disease_metadata.pkl
    participant History as /api/history

    User->>UI: Enters symptoms string: "vomiting, fever, loose stools"
    UI->>Route: POST {"symptoms": "vomiting, fever, loose stools"}
    Route->>Pipe: model.predict([symptoms.lower()])
    Note over Pipe: Vectorizer creates TF-IDF representation.<br/>Classifier only knows 10 prototype classes!
    Pipe-->>Route: Top predicted label (e.g., 'Diarrhoea')
    Route->>Pipe: model.predict_proba([symptoms.lower()])
    Pipe-->>Route: Probabilities vector -> max(probabilities) * 100
    Route->>Meta: metadata.get(prediction, {})
    Meta-->>Route: Recommended tests & consultant
    Route-->>UI: 200 OK {"disease": "Diarrhoea", "confidence": 54.0, ...}
    UI->>History: Logs predicted disease to SQLite history table
    UI-->>User: Displays disease card & recommendations
```

> [!WARNING]
> If the user enters an out-of-distribution string (such as `"asdfghjk"` or `"can you tell me a joke"`), the vectorizer yields an all-zero vector, but the classifier still outputs `'Diabates'` with 16.0% confidence because there is no rejection threshold.

---

### Subsystem C: Dermatology AI Skin Analyzer (`/api/skin/analyze`)

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient
    participant UI as SkinAnalyzer.jsx
    participant Route as skin.py (/analyze)
    participant Keras as skin_model.h5 (MobileNetV2)
    participant Logic as Health Score Formula

    User->>UI: Uploads photo of skin rash
    UI->>Route: POST JSON {"image_base64": "data:image/jpeg;base64,..."}
    Route->>Route: Decodes Base64, opens in PIL RGB
    Route->>Route: Resizes to (224, 224), divides by 255.0
    Route->>Keras: model.predict(img_arr[1, 224, 224, 3])
    Keras-->>Route: Softmax probabilities across 4 classes
    Route->>Route: np.argmax(preds[0]) -> detected_class
    Route->>Logic: Calculates health_percentage:<br/>e.g., 30 + ((100 - confidence) * 0.2)
    Logic-->>Route: health_score & canned recommendation
    Route-->>UI: 200 OK {"problem": "Acne Severe", "confidence": 32.7, "health_percentage": 43.5, ...}
    UI-->>User: Renders gauge, detected label, and recommendation
```

---

### Subsystem D: Pathology Report Analyzer (`/api/report/analyze`)

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient
    participant UI as ReportAnalyzer.jsx
    participant Route as report.py (/analyze)
    participant Gemini as Google Generative AI (Gemini 1.5 Flash)

    User->>UI: Uploads blood report image
    UI->>Route: POST multipart/form-data (image)
    Route->>Route: Reads GEMINI_API_KEY from environment
    alt Key Missing or Default
        Route-->>UI: 200 OK {"status": "success", "analysis": "Report Summary (Simulation Mode)..."}
    else Key Present
        Route->>Gemini: model.generate_content([prompt, image])
        alt API Call Succeeds
            Gemini-->>Route: Formatted markdown analysis
            Route-->>UI: 200 OK {"status": "success", "analysis": response.text}
        else API Call Fails (Quota / Network / 403 / 404)
            Note over Route: Caught in except Exception as e!<br/>Swallows real error!
            Route-->>UI: 200 OK {"status": "success", "analysis": random.choice(fallback_msg)}
        end
    end
    UI-->>User: Renders report analysis markdown
```

---

### Subsystem E: Medicine Search & Suggestion (`/api/medicine/search & /suggest`)

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient
    participant UI as MedicineDetection.jsx / MedicineSuggestion.jsx
    participant Route as medicine.py (/search, /suggest)
    participant SQLite as medicine_expanded.db

    User->>UI: Searches for "Paracetamol" or enters symptom "fever"
    UI->>Route: GET /api/medicine/search?query=Paracetamol
    Route->>SQLite: Checks os.path.exists("../../database/database/medicine_expanded.db")
    Note over SQLite: FILE NOT FOUND!
    Route-->>UI: 404 Not Found {"detail": "Expanded medicine database not found."}
    Note over UI: React catch (error) block triggers!
    UI->>UI: Substitutes hardcoded mock list:<br/>[{product_name: "Dolo 650mg"}, {product_name: "Pan-D Capsule"}]
    UI-->>User: Displays fake mock medicine cards!
```

---

### Subsystem F: AI Friend Chat / Companion Chatbot (`/api/friend-chat/message`)

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient
    participant UI as FriendChat.jsx
    participant Route as friend_chat.py (/message)
    participant Gemini as Google Generative AI (gemini-1.5-flash)

    User->>UI: Types: "I have high fever and severe headache. What medicine should I take?"
    UI->>Route: POST {"message": "...", "history": [...]}
    Route->>Gemini: start_chat().send_message("...")
    Note over Gemini: System prompt mandates: "You are 'Medi', a friend...<br/>Never diagnose, prescribe, or recommend medical treatments."
    alt API Responds
        Gemini-->>Route: Conversational empathic response ("That sounds tough! Have you talked to a doctor?")
        Route-->>UI: 200 OK {"reply": response.text}
    else API Fails (Quota / Network / Key Error)
        Note over Route: Swallows exception silently!
        Route-->>UI: 200 OK {"reply": "Hey! 💙 I'm here for you, but I'm feeling a bit shy right now..."}
    end
    UI-->>User: Displays friendly non-clinical chat bubble
```

---

## 3. Data Flow Failure Matrix

| Stage | Subsystem | Failure Mechanism | User-Facing Symptom |
| :--- | :--- | :--- | :--- |
| **Feature Extraction / ML** | Voice Detection | Feature shape mismatch (17 vs 22) crashes model | Fake heuristic risk score with fabricated confidence |
| **Model Ingestion** | Disease Predictor | Obsolete 10-disease artifact deployed instead of 45 | Complete inability to predict 35 conditions; false mapping to prototype classes |
| **Model Classification** | Skin Problem Detector | Class imbalance & heuristic label corruption in training | 0% detection of severe acne; healthy skin flagged as mild acne |
| **Data Persistence** | Medicine Suggestion | `medicine_expanded.db` missing from repository | 404 error converted into hardcoded Dolo/Pan-D mock cards |
| **External API** | Visual Symptom Checker | Non-existent model `models/gemini-2.5-flash` in code | Permanent analysis error banner |
| **External API** | Report & Friend Chat | Silent error swallowing in exception handlers | Canned fallback replies displayed as genuine AI output |
| **Frontend Network** | All Modules | Universal `catch` blocks in React components | Fake clinical results displayed when backend is offline or errors |
