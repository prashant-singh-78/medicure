import os
import joblib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../models/disease_model.pkl")
META_PATH = os.path.join(os.path.dirname(__file__), "../../models/disease_metadata.pkl")

model = None
metadata = None

class SymptomRequest(BaseModel):
    symptoms: str

@router.post("/predict")
def predict_disease(req: SymptomRequest):
    global model, metadata
    if model is None or metadata is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(status_code=500, detail="Disease ML model not found. Please train it first.")
        model = joblib.load(MODEL_PATH)
        metadata = joblib.load(META_PATH)
        
    try:
        # Predict
        prediction = model.predict([req.symptoms.lower()])[0]
        # Get probability
        probabilities = model.predict_proba([req.symptoms.lower()])[0]
        confidence = max(probabilities) * 100
        
        info = metadata.get(prediction, {})
        
        return {
            "disease": prediction,
            "confidence": round(confidence, 2),
            "recommendations": {
                "tests": info.get("tests", []),
                "consultant": info.get("consultant", "General Physician")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
