import os
from fastapi import APIRouter, UploadFile, File, HTTPException
import google.generativeai as genai
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()
os.environ["GOOGLE_API_VERSION"] = "v1beta"

router = APIRouter()

@router.post("/analyze")
async def analyze_visual_symptom(file: UploadFile = File(...)):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        genai.configure(api_key=key)
        model = genai.GenerativeModel(model_name="models/gemini-2.5-flash")
        
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
        
        print("DEBUG: Sending request to Gemini Vision...")
        response = model.generate_content([prompt, image])
        
        if not response:
            raise Exception("Empty response from AI")

        # Handle Safety Blocks
        try:
            analysis_text = response.text
        except ValueError:
            # If the response was blocked by safety filters
            analysis_text = "### ⚠️ Analysis Blocked\n\nThe AI could not analyze this image due to safety filters. 🛡️\n\n**Common Reasons:**\n- High sensitivity content detected.\n- Image clarity issues.\n\n*Please try with a clearer image or a different angle.*"
            print(f"DEBUG: Response was blocked for safety: {response.prompt_feedback}")

        return {
            "status": "success",
            "analysis": analysis_text
        }
        
    except Exception as e:
        print(f"DEBUG: Visual Check Error Type: {type(e).__name__}")
        print(f"DEBUG: Visual Check Error Message: {str(e)}")
        # Provide a friendly fallback if API fails
        return {
            "status": "error",
            "analysis": "### ⚠️ Analysis Note\n\nI encountered an issue while analyzing the image. 🩺\n\n**Possible Causes:**\n- Invalid API key or model access.\n- Network connectivity issues.\n\n*Please try again later or consult a doctor if the symptom persists.*"
        }
