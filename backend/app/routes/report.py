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
async def analyze_report(file: UploadFile = File(...)):
    key = os.getenv("GEMINI_API_KEY")
    if not key or key == "your_api_key_here":
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured on the server. Please set GEMINI_API_KEY."
        )

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty report file uploaded.")

        if contents.startswith(b"%PDF"):
            raise HTTPException(
                status_code=400,
                detail="Direct PDF document processing is not supported. Please upload a clear JPG, PNG, or WEBP image scan of the pathology report."
            )

        try:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is not a valid image format. Please upload a clear JPG, PNG, or WEBP image scan."
            )

        genai.configure(api_key=key, transport="rest")

        prompt = """
        You are an expert AI medical assistant. 
        Analyze the provided medical report image and give a structured analysis.
        
        Provide:
        1. **Short Summary**: A 1-2 sentence overview of the report's purpose and status.
        2. **Key Findings**: Highlight abnormal or important biomarkers.
        3. **Reliability Score**: (0-10) Based on your confidence in the OCR and medical context.
        4. **Recommendations**: Simple, non-prescriptive advice.
        
        Format:
        ### 👨‍⚕️ Report Analysis
        - **Summary**: (text)
        - **Key Findings**: (text)
        - **Reliability Score**: (score)/10
        - **Recommendations**: (text)
        
        Keep it concise.
        Disclaimer: ALWAYS add this at the bottom: 
        *Disclaimer: This analysis is AI-generated and NOT a clinical diagnosis. Always consult a qualified doctor.*
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

        if not response or not response.text:
            err_detail = sanitize_error(str(last_err) if last_err else "No response from AI service")
            raise HTTPException(status_code=502, detail=f"Report analysis model unavailable: {err_detail}")

        return {
            "status": "success",
            "analysis": response.text
        }

    except HTTPException:
        raise
    except Exception as e:
        sanitized = sanitize_error(str(e))
        print(f"DEBUG: Report Analysis Error: {sanitized}")
        raise HTTPException(
            status_code=503,
            detail=f"Report analysis service error: {sanitized}"
        )
