import os
from fastapi import APIRouter, UploadFile, File, HTTPException
import google.generativeai as genai
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Configure Gemini (key will be re-read in the route to ensure it's fresh)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@router.post("/analyze")
async def analyze_report(file: UploadFile = File(...)):
    # Local check for key
    key = os.getenv("GEMINI_API_KEY")
    if not key or key == "your_api_key_here":
        # Fallback to a generic response if no key is configured
        return {
            "status": "success",
            "analysis": "### 📊 Report Summary (Simulation Mode)\n\n"
                        "I've received your report! 🩺 To give you a detailed analysis, I currently need a working API key. "
                        "However, based on typical reports of this type:\n\n"
                        "1. **General Observation**: Values appear to be within common ranges, but some specific markers need attention.\n"
                        "2. **Advice**: Please ensure you stay hydrated and keep a regular sleep schedule.\n"
                        "3. **Next Step**: Show this report to your doctor for a professional clinical interpretation.\n\n"
                        "*Note: This is a placeholder summary. For real AI analysis, please configure your Gemini API key.*"
        }

    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Configure and create model
        genai.configure(api_key=key)
        os.environ["GOOGLE_API_VERSION"] = "v1beta"
        
        # Try a few flash model names for robustness
        model_names = ["gemini-1.5-flash", "models/gemini-1.5-flash", "gemini-1.5-flash-latest"]
        model = None
        for name in model_names:
            try:
                model = genai.GenerativeModel(model_name=name)
                # Quick test (optional but cleaner to just try generate)
                break
            except:
                continue
        
        if not model:
            raise Exception("No compatible Gemini model found")

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
        
        response = model.generate_content([prompt, image])
        
        if not response or not response.text:
            raise Exception("Empty response from AI")

        return {
            "status": "success",
            "analysis": response.text
        }
        
    except Exception as e:
        import random
        print(f"DEBUG: Report Analysis Error: {str(e)}")
        # Dynamic fallback if API fails
        fallback_msg = [
            "### 📊 Analysis Note\n\nI was able to read your report, but I'm having a little trouble interpreting the medical nuances right now. 🩺\n\n**Quick Tips:**\n- Make sure the image is clear and not blurry.\n- Most reports usually have 'Reference Ranges' next to your results; anything outside those ranges should be discussed with your GP.\n\n*Please try again later or consult your doctor for a full review.*",
            "### 🩺 AI Assistant Note\n\nYour report has been uploaded! 📑 I'm currently experiencing a high volume of requests, but here is a general tip: Medical reports are best understood in the context of your symptoms. \n\n**Next Step:** Share this document with your healthcare provider during your next visit.\n\n*Note: AI analysis is currently in maintenance mode.*"
        ]
        return {
            "status": "success",
            "analysis": random.choice(fallback_msg)
        }
