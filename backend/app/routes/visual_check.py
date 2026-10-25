import os
import io
import re
from fastapi import APIRouter, UploadFile, File, HTTPException
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Prioritized list of active Google Gemini multimodal models
ACTIVE_VISION_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
]

def sanitize_error(msg: str) -> str:
    """Strip out any potential key patterns or URLs from error strings."""
    sanitized = re.sub(r'AIza[0-9A-Za-z-_]{35}', '[REDACTED_API_KEY]', str(msg))
    sanitized = re.sub(r'key=[^&\s]+', 'key=[REDACTED]', sanitized)
    return sanitized

@router.post("/analyze")
async def analyze_visual_symptom(file: UploadFile = File(...)):
    key = os.getenv("GEMINI_API_KEY")
    if not key or key == "your_api_key_here":
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured on the server. Please configure GEMINI_API_KEY."
        )

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty image file uploaded.")

        try:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid image format.")

        genai.configure(api_key=key, transport="rest")

        prompt = """
        You are a specialized Medical Visual Assistant. 
        Analyze the provided image (which could be a skin rash, eye redness, dental issue, or other visible symptom).
        
        Provide a **clear, structured analysis**:
        ### 🔍 Visual Analysis
        - **Observations**: What do you see in the image? (e.g., "red circular rash", "swollen gums")
        - **Possible Indications**: Based on common medical knowledge, what could this look like? 
        - **Urgency Level**: (Low / Medium / High)
        - **Recommendation**: (e.g., "Consult a dermatologist", "Keep the area clean", "Seek immediate care")
        
        Keep it concise and professional.
        ALWAYS add this disclaimer at the bottom: 
        *Disclaimer: This is an AI-powered visual analysis and NOT a medical diagnosis. Always consult a qualified healthcare professional for any health concerns.*
        """

        response = None
        last_err = None
        for model_name in ACTIVE_VISION_MODELS:
            try:
                model = genai.GenerativeModel(model_name=model_name)
                response = model.generate_content([prompt, image], request_options={"timeout": 30})
                if response:
                    break
            except Exception as e:
                last_err = e
                continue

        if not response:
            err_detail = sanitize_error(str(last_err) if last_err else "No response from AI service")
            raise HTTPException(
                status_code=502,
                detail=f"All active Gemini vision models were unavailable. Error: {err_detail}"
            )

        # Handle Safety Blocks
        try:
            analysis_text = response.text
        except ValueError:
            # If the response was blocked by safety filters
            analysis_text = (
                "### ⚠️ Analysis Blocked by Clinical Safety Filter\n\n"
                "The AI could not analyze this image because safety filters were triggered.\n\n"
                "**Clinical Recommendation:**\n"
                "Please consult a licensed medical professional or dermatologist directly for in-person evaluation."
            )

        return {
            "status": "success",
            "analysis": analysis_text
        }

    except HTTPException:
        raise
    except Exception as e:
        sanitized = sanitize_error(str(e))
        print(f"DEBUG: Visual Check Error: {type(e).__name__}: {sanitized}")
        raise HTTPException(
            status_code=503,
            detail=f"Visual symptom analysis service unavailable: {sanitized}"
        )
