import os
import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Primary v2 paths with fallback to v1 to preserve existing models
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))

MODEL_PATHS_TRY = [
    os.getenv("DISEASE_MODEL_PATH", ""),
    os.path.join(MODELS_DIR, "disease_model_v2.pkl"),
    os.path.join(MODELS_DIR, "disease_model.pkl")
]

META_PATHS_TRY = [
    os.getenv("DISEASE_META_PATH", ""),
    os.path.join(MODELS_DIR, "disease_metadata_v2.pkl"),
    os.path.join(MODELS_DIR, "disease_metadata.pkl")
]

model = None
metadata = None


def load_artifacts():
    global model, metadata
    loaded_m = False
    for p in MODEL_PATHS_TRY:
        if p and os.path.exists(p):
            try:
                model = joblib.load(p)
                loaded_m = True
                break
            except Exception as e:
                print(f"Warning: Failed loading model from {p}: {e}")

    for p in META_PATHS_TRY:
        if p and os.path.exists(p):
            try:
                metadata = joblib.load(p)
                break
            except Exception as e:
                print(f"Warning: Failed loading metadata from {p}: {e}")

    if not loaded_m or metadata is None:
        raise HTTPException(status_code=500, detail="Disease ML model not found. Please train it first.")


class SymptomRequest(BaseModel):
    symptoms: str


@router.post("/predict")
def predict_disease(req: SymptomRequest):
    global model, metadata
    if model is None or metadata is None:
        load_artifacts()

    cleaned_input = req.symptoms.lower().strip()
    if len(cleaned_input) < 2:
        return {
            "disease": "Inconclusive / Insufficient Input",
            "confidence": 0.0,
            "status": "insufficient_input",
            "recommendations": {
                "tests": ["Clinical Evaluation"],
                "consultant": "General Physician",
                "note": "Please describe specific symptoms (e.g. fever, headache, cough, rash)."
            }
        }

    try:
        # Principled rejection: Check TF-IDF vocabulary overlap
        # If none of the input tokens exist in the medical training vocabulary, vector is empty.
        vectorizer = model.named_steps.get("vectorizer")
        if vectorizer is not None:
            tfidf_vec = vectorizer.transform([cleaned_input])
            if tfidf_vec.nnz == 0:
                return {
                    "disease": "Inconclusive / No Recognized Symptoms",
                    "confidence": 0.0,
                    "status": "unmatched_symptoms",
                    "recommendations": {
                        "tests": ["General Health Checkup"],
                        "consultant": "General Physician",
                        "note": "None of the entered terms match documented clinical symptoms in our medical reference database. Please enter specific symptoms or consult a medical doctor."
                    }
                }

        # Predict with probabilistic calibration
        probabilities = model.predict_proba([cleaned_input])[0]
        max_prob = float(np.max(probabilities) * 100)
        prediction = str(model.predict([cleaned_input])[0])

        # Correct legacy spelling if old model checkpoint is active
        if prediction.lower() == "diabates":
            prediction = "Diabetes"

        # Statistical uncertainty rejection:
        # For K classes, random guessing prior is 100/K.
        num_classes = len(probabilities)
        prior = 100.0 / max(1, num_classes)
        if max_prob < (1.5 * prior) or max_prob < 15.0:
            return {
                "disease": "Inconclusive / Low Diagnostic Specificity",
                "confidence": round(max_prob, 2),
                "status": "low_confidence",
                "recommendations": {
                    "tests": ["Comprehensive Clinical Workup"],
                    "consultant": "General Physician",
                    "note": "Symptoms overlap with multiple medical conditions without a dominant diagnostic pattern. Clinical consultation advised."
                }
            }

        info = metadata.get(prediction, {})
        tests = info.get("tests", [])
        consultant = info.get("consultant", "General Physician")

        return {
            "disease": prediction,
            "confidence": round(max_prob, 2),
            "status": "success",
            "recommendations": {
                "tests": tests if tests else ["Routine Medical Workup"],
                "consultant": consultant if consultant else "General Physician"
            },
            "catalog_conditions": len(metadata),
            "disclaimer": "Statistical symptom matching against 45 reference conditions; not a comprehensive clinical diagnostic evaluation. Cannot evaluate negative/excluded symptoms."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
