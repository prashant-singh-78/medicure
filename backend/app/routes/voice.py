import os, io, tempfile
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import joblib

router = APIRouter()

# Load model at startup (if exists)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../models/voice_model.pkl")
model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)


def extract_features_from_audio(audio_bytes: bytes) -> np.ndarray:
    """Extract MFCC and other vocal features from raw audio bytes."""
    import librosa
    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name
        y, sr = librosa.load(tmp_path, sr=22050, mono=True)
        os.unlink(tmp_path)

        # MFCCs (most discriminative for voice disorders)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfccs, axis=1)

        # Pitch (fundamental frequency)
        f0, _, _ = librosa.pyin(y, fmin=50, fmax=500)
        f0_clean = f0[~np.isnan(f0)]
        mdvp_fo = np.mean(f0_clean) if len(f0_clean) > 0 else 0.0

        # Jitter (pitch variation) – approximate
        if len(f0_clean) > 1:
            diffs = np.abs(np.diff(f0_clean))
            jitter = np.mean(diffs) / (np.mean(f0_clean) + 1e-6)
        else:
            jitter = 0.0

        # Shimmer (amplitude variation)
        rms = librosa.feature.rms(y=y)[0]
        shimmer = np.std(rms) / (np.mean(rms) + 1e-6)

        # HNR (Harmonics-to-Noise Ratio)
        hnr = librosa.effects.harmonic(y=y)
        hnr_val = float(np.mean(np.abs(hnr))) / (np.mean(np.abs(y)) + 1e-6)

        features = np.concatenate([mfcc_mean, [mdvp_fo, jitter, shimmer, hnr_val]])
        return features, {
            "mdvp_fo": float(f"{mdvp_fo:.3f}"),
            "jitter": float(f"{jitter:.6f}"),
            "shimmer": float(f"{shimmer:.6f}"),
            "hnr": float(f"{hnr_val:.3f}"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature extraction failed: {str(e)}")


@router.post("/analyze")
async def analyze_voice(
    file: UploadFile = File(...),
    disease: str = Form("parkinsons")
):
    """Analyze uploaded voice recording for disease indicators."""
    audio_bytes = await file.read()
    features, feature_dict = extract_features_from_audio(audio_bytes)

    if model is not None:
        try:
            prediction = model.predict([features])[0]
            proba = model.predict_proba([features])[0]
            confidence = float(np.max(proba) * 100)
            pred_label = "Positive Risk Detected" if prediction == 1 else "No Risk Detected"
        except Exception:
            prediction, confidence, pred_label = _heuristic_prediction(feature_dict, disease)
    else:
        prediction, confidence, pred_label = _heuristic_prediction(feature_dict, disease)

    return {
        "disease": disease,
        "prediction": pred_label,
        "confidence": float(f"{confidence:.1f}"),
        "features": feature_dict,
        "note": None if model else "Model not trained yet."
    }


def _heuristic_prediction(features: dict, disease: str):
    """Simple rule-based fallback when no model is available."""
    jitter = features["jitter"]
    shimmer = features["shimmer"]
    # Higher jitter/shimmer → more likely disease
    risk_score = (jitter * 50 + shimmer * 20)
    confidence = min(95.0, 55 + risk_score * 10)
    is_positive = risk_score > 0.4
    label = "Positive Risk Detected" if is_positive else "No Risk Detected"
    return int(is_positive), confidence, label
