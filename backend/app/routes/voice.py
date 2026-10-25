import os, io, tempfile
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import joblib

router = APIRouter()

# Load model at startup (if exists)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../models/voice_model.pkl")
model = None
if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Warning: Failed to load voice model from {MODEL_PATH}: {e}")
        model = None


def extract_features_from_audio(audio_bytes: bytes) -> tuple:
    """Extract acoustic frequency perturbation features from raw audio bytes."""
    import librosa
    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name
        y, sr = librosa.load(tmp_path, sr=22050, mono=True)
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

        # MFCCs (13 coefficients)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfccs, axis=1)

        # Pitch (fundamental frequency)
        f0, _, _ = librosa.pyin(y, fmin=50, fmax=500)
        f0_clean = f0[~np.isnan(f0)] if f0 is not None else np.array([])
        mdvp_fo = float(np.mean(f0_clean)) if len(f0_clean) > 0 else 0.0

        # Jitter (frequency perturbation estimate)
        if len(f0_clean) > 1:
            diffs = np.abs(np.diff(f0_clean))
            jitter = float(np.mean(diffs) / (np.mean(f0_clean) + 1e-6))
        else:
            jitter = 0.0

        # Shimmer (amplitude perturbation estimate)
        rms = librosa.feature.rms(y=y)[0]
        shimmer = float(np.std(rms) / (np.mean(rms) + 1e-6))

        # HNR (Harmonics-to-Noise Ratio)
        hnr = librosa.effects.harmonic(y=y)
        hnr_val = float(np.mean(np.abs(hnr))) / (float(np.mean(np.abs(y))) + 1e-6)

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
    """Analyze uploaded voice recording for acoustic disease risk indicators."""
    target_disease = disease.strip().lower()
    if target_disease not in ["parkinsons", "parkinson"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Acoustic biomarker screening is currently only implemented for Parkinson's vocal tremor evaluation. "
                f"Trained models or validated acoustic biomarkers for '{disease}' are not available in this system."
            )
        )

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio recording uploaded.")

    features, feature_dict = extract_features_from_audio(audio_bytes)

    # Note: Clinical UCI Parkinson's model expects 22 laboratory-grade MDVP acoustic
    # parameters (e.g. RAP, PPQ, DDP, APQ, NHR, RPDE, DFA, PPE) that cannot be 
    # legitimately synthesized from raw browser microphone audio. We execute 
    # digital signal processing (DSP) vocal perturbation screening and document the methodology honestly.
    prediction, confidence, pred_label = _heuristic_prediction(feature_dict, target_disease)
    model_status = "acoustic_dsp_baseline"
    note = (
        "Acoustic screening derived from digital signal processing (pitch, jitter, shimmer, HNR). "
        "Laboratory-grade MDVP parameters required by clinical ML tabular models cannot be extracted from web audio without specialized hardware."
    )

    return {
        "disease": "Parkinson's Disease (Vocal Tremor)",
        "prediction": pred_label,
        "confidence": float(f"{confidence:.1f}"),
        "features": feature_dict,
        "model_status": model_status,
        "is_ml_model": False,
        "screening_type": "Digital Signal Processing (DSP) Acoustic Perturbation",
        "note": note,
        "disclaimer": "Experimental screening tool only; not a substitute for clinical neurological examination."
    }


def _heuristic_prediction(features: dict, disease: str):
    """Rule-based acoustic perturbation screening when high-dimensional laboratory features cannot be derived."""
    jitter = features["jitter"]
    shimmer = features["shimmer"]
    # Higher jitter/shimmer indicates higher perturbation in sustained vocal fold vibration
    risk_score = (jitter * 50 + shimmer * 20)
    confidence = min(92.0, max(52.0, 55 + risk_score * 10))
    is_positive = risk_score > 0.4
    label = "Positive Risk Detected" if is_positive else "No Risk Detected"
    return int(is_positive), confidence, label
