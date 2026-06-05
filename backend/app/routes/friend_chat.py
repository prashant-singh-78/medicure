import os
import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_PROMPT = """You are "Medi", a warm, caring, and supportive friend — not a therapist or doctor.
Your role is to listen, empathize, and help the user feel heard and less alone.

Guidelines:
- Talk like a kind best friend, not a professional. Use casual, warm language.
- Always acknowledge the user's feelings first before offering any advice.
- Never diagnose, prescribe, or recommend medical treatments.
- If the user seems to be in serious distress or mentions self-harm, gently encourage them to reach out to a professional or helpline.
- Keep responses concise (2-4 sentences usually), warm and conversational.
- Use light emojis occasionally to feel friendly (not excessive).
- Ask follow-up questions to show you are genuinely interested.
- You can suggest simple things like taking a walk, breathing exercises, or journaling.
- Never be dismissive — every feeling the user shares is valid.
- You can understand Hindi/Hinglish and respond naturally if the user writes in it.

Remember: You are a friend, not a bot. Be human, be real, be kind. 💙"""


class ChatMessage(BaseModel):
    role: str  # "user" or "model" (model is Gemini's role for assistant)
    text: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


@router.post("/message")
def send_message(req: ChatRequest):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_api_key_here":
        # Fallback responses when no API key is configured
        fallback_responses = [
            "Hey, I'm here for you! 💙 Tell me more about how you're feeling. Sometimes just talking about it helps a lot.",
            "That sounds really tough. You're not alone in this — I'm right here with you. What's been on your mind the most?",
            "I hear you, and your feelings are completely valid. Want to try taking a few slow, deep breaths together? It can really help calm things down. 🌿",
            "It takes strength to talk about this stuff. I'm proud of you for reaching out. What would make you feel even just a tiny bit better right now?",
            "You matter so much. Whatever you're going through, we'll figure it out together. Tell me everything — I'm all ears. 😊",
        ]
        import random
        return {"reply": random.choice(fallback_responses)}

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Using full model name which sometimes helps with 404/403 issues
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT
        )

        # Build chat history for context
        history = []
        for msg in (req.history or []):
            history.append({
                "role": msg.role,
                "parts": [msg.text]
            })

        chat = model.start_chat(history=history)
        response = chat.send_message(req.message)

        return {"reply": response.text}

    except Exception as e:
        import traceback
        import random
        error_detail = f"AI chat error: {str(e)}"
        print(f"DEBUG: {error_detail}")
        traceback.print_exc()
        
        # Fallback to a friendly response if the API fails (e.g., 403/Quota issues)
        fallback_responses = [
            "Hey! 💙 I'm here for you, but I'm feeling a bit shy right now. Tell me more about what's on your mind?",
            "That sounds like a lot to handle. Remember, I'm always on your team! What else would you like to talk about? 😊",
            "I'm listening! 🌿 Sometimes I lose my train of thought, but I'm still all ears. Keep sharing with me.",
            "You're doing great just by talking about things. Let's keep the conversation going! 💙",
        ]
        return {"reply": random.choice(fallback_responses)}
