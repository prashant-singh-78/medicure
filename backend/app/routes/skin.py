import os
import json
import numpy as np
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from io import BytesIO
from PIL import Image
from typing import Any, Dict, Optional
from tensorflow.keras.models import load_model

router = APIRouter()

class SkinImage(BaseModel):
    image_base64: str

# Globals for lazy loading
_model: Optional[Any] = None
_class_indices: Optional[Dict[str, int]] = None
_idx_to_class: Optional[Dict[int, str]] = None
_active_model_path: Optional[str] = None

def load_skin_model():
    global _model, _class_indices, _idx_to_class, _active_model_path
    
    if _model is not None:
        return

    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))
    env_model_path = os.getenv("SKIN_MODEL_PATH")
    
    # Prioritize project-relative v2 candidate model, support explicit env override
    primary_v2_path = os.path.join(models_dir, 'skin_model_v2.h5')
    selected_model_path = None
    
    if env_model_path and os.path.exists(env_model_path):
        selected_model_path = env_model_path
    elif os.path.exists(primary_v2_path):
        selected_model_path = primary_v2_path
    elif os.path.exists(os.path.join(models_dir, 'skin_model.h5')):
        selected_model_path = os.path.join(models_dir, 'skin_model.h5')
        print(f"WARNING: Primary skin_model_v2.h5 not found in {models_dir}. Falling back to baseline {selected_model_path}.")
    else:
        raise FileNotFoundError(f"Dermatology skin model not found in {models_dir}.")
        
    class_path = selected_model_path.replace('.h5', '_classes.json')
    if not os.path.exists(class_path):
        class_path = os.path.join(models_dir, 'skin_model_classes.json')
    if not os.path.exists(class_path):
        raise FileNotFoundError(f"Dermatology class mapping not found at {class_path}.")

    _model = load_model(selected_model_path)
    _active_model_path = selected_model_path
    with open(class_path, 'r') as f:
        _class_indices = json.load(f)
    _idx_to_class = {v: k for k, v in _class_indices.items()}


@router.post("/analyze")
async def analyze_skin(payload: SkinImage):
    # 1. Validate payload and image decoding first (fast fail before model load)
    img_str = payload.image_base64.strip()
    if not img_str:
        raise HTTPException(status_code=400, detail="Empty image data provided.")

    if ',' in img_str:
        img_str = img_str.split(',')[1]
        
    try:
        img_data = base64.b64decode(img_str)
        img = Image.open(BytesIO(img_data)).convert('RGB')
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data. Unable to decode image.")

    # 2. Load model on demand
    try:
        load_skin_model()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dermatology model: {str(e)}")
        
    try:
        # Resize to 224x224
        img = img.resize((224, 224))
        
        # Preprocess
        img_arr = np.array(img, dtype=np.float32)
        img_arr = img_arr / 255.0  # Match the rescale=1./255 in training
        img_arr = np.expand_dims(img_arr, axis=0) # Add batch dimension
        
        # Predict
        assert _model is not None, "Model not loaded"
        assert _idx_to_class is not None, "Classes not loaded"
            
        preds = _model.predict(img_arr)
        pred_idx = int(np.argmax(preds[0]))
        confidence = float(np.max(preds[0])) * 100.0
        
        detected_class = _idx_to_class.get(pred_idx, "Unknown")
        
        # Clinically grounded score and recommendation
        if detected_class == 'Healthy':
            health_score = 90 + (confidence * 0.1)
            recommendation = "Dermatological scan indicates healthy skin surface. Maintain daily sun protection and gentle hydration."
        elif detected_class == 'Acne_Mild':
            health_score = 60 + ((100 - confidence) * 0.2)
            recommendation = "Mild inflammatory acne detected. Cleanse with a mild salicylic acid wash and avoid comedogenic formulations."
        elif detected_class == 'Acne_Severe':
            health_score = 30 + ((100 - confidence) * 0.2)
            recommendation = "Severe acne / nodulocystic lesion indicators detected. Dermatologist evaluation is strongly recommended for prescription therapy."
        else: # Rosacea_Other
            health_score = 50 + ((100 - confidence) * 0.2)
            recommendation = "Signs of erythema or rosacea pattern. Avoid heat triggers and harsh exfoliants, and seek clinical evaluation."
            
        model_name = os.path.basename(_active_model_path) if _active_model_path else "unknown"
        return {
            "status": "success",
            "problem": detected_class.replace('_', ' '),
            "confidence": float(f"{confidence:.2f}"),
            "health_percentage": float(f"{health_score:.1f}"),
            "recommendation": recommendation,
            "model_version": model_name,
            "disclaimer": "AI preliminary dermatology screening only; not a formal clinical biopsy or diagnosis."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")
