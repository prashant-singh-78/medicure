import os
import json
import numpy as np
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from io import BytesIO
from PIL import Image

from tensorflow.keras.models import load_model

router = APIRouter()

class SkinImage(BaseModel):
    image_base64: str

from typing import Any, Dict, Optional

# Globals for lazy loading
_model: Optional[Any] = None
_class_indices: Optional[Dict[str, int]] = None
_idx_to_class: Optional[Dict[int, str]] = None

def load_skin_model():
    global _model, _class_indices, _idx_to_class
        
    model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'skin_model.h5')
    class_path = model_path.replace('.h5', '_classes.json')
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Please train it first.")
        
    if _model is None:
        _model = load_model(model_path)
        with open(class_path, 'r') as f:
            _class_indices = json.load(f)
        _idx_to_class = {v: k for k, v in _class_indices.items()}

@router.post("/analyze")
async def analyze_skin(payload: SkinImage):
    try:
        load_skin_model()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    try:
        # Decode base64
        # Format usually: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        img_str = payload.image_base64
        if ',' in img_str:
            img_str = img_str.split(',')[1]
            
        img_data = base64.b64decode(img_str)
        img = Image.open(BytesIO(img_data)).convert('RGB')
        
        # Resize to 224x224
        img = img.resize((224, 224))
        
        # Preprocess
        img_arr = np.array(img)
        img_arr = img_arr / 255.0  # Match the rescale=1./255 in training
        img_arr = np.expand_dims(img_arr, axis=0) # Add batch dimension
        
        # Predict
        assert _model is not None, "Model not loaded"
        assert _idx_to_class is not None, "Classes not loaded"
            
        preds = _model.predict(img_arr)
        pred_idx = int(np.argmax(preds[0]))
        confidence = float(np.max(preds[0])) * 100.0
        
        detected_class = _idx_to_class[pred_idx]
        
        # Health percentage logic
        if detected_class == 'Healthy':
            health_score = 90 + (confidence * 0.1) # 90-100%
            recommendation = "Your skin looks clear and healthy! Maintain a good skincare routine."
        elif detected_class == 'Acne_Mild':
            health_score = 60 + ((100 - confidence) * 0.2) # 60-80%
            recommendation = "Mild acne detected. Consider a salicylic acid cleanser and stay hydrated."
        elif detected_class == 'Acne_Severe':
            health_score = 30 + ((100 - confidence) * 0.2) # 30-50%
            recommendation = "Severe acne detected. It is recommended to consult a dermatologist for proper treatment."
        else: # Rosacea_Other
            health_score = 50 + ((100 - confidence) * 0.2)
            recommendation = "Signs of rosacea or other conditions. Avoid known triggers like spicy food and excessive sun, and consult a doctor."
            
        return {
            "status": "success",
            "problem": detected_class.replace('_', ' '),
            "confidence": float(f"{confidence:.2f}"),
            "health_percentage": float(f"{health_score:.1f}"),
            "recommendation": recommendation
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")
