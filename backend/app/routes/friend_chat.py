import os
import re
import sqlite3
import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

EXPANDED_DB_PATHS = [
    os.getenv("MEDICINE_EXPANDED_DB_PATH", ""),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../database/medicine_expanded.db")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../database/database/medicine_expanded.db"))
]

def get_expanded_db():
    for p in EXPANDED_DB_PATHS:
        if p and os.path.exists(p):
            return p
    return None

EMERGENCY_KEYWORDS = [
    "chest pain", "heart attack", "can't breathe", "cannot breathe", "difficulty breathing",
    "shortness of breath", "suicide", "suicidal", "kill myself", "end my life", "ending my life",
    "end life", "want to die", "hurt myself", "harm myself", "self harm",
    "overdose", "unconscious", "passed out", "severe bleeding", "anaphylaxis",
    "stroke", "slurred speech", "facial drooping", "seizure", "convulsions"
]

SYSTEM_PROMPT = """You are "Medi", a warm, caring, and supportive wellness companion.
Your role is to listen, empathize, and help the user feel heard and less alone.

Guidelines:
- Talk like a kind, supportive friend. Use casual, warm language.
- Always acknowledge the user's feelings first before offering simple comfort.
- Never provide clinical medical diagnoses, and never prescribe medication or dosages.
- If asked about medication facts, refer only to verified database facts provided in your context.
- Keep responses concise (2-4 sentences usually), warm and conversational.
- Use light emojis occasionally to feel friendly (not excessive).
- You can suggest gentle wellness practices like deep breathing, hydration, or taking a walk.
- You can understand Hindi/Hinglish and respond naturally if the user writes in it.

Remember: You are a supportive companion, not a replacement for a doctor. Always recommend qualified medical advice for health concerns. 💙"""


def check_emergency(message: str) -> Optional[str]:
    """Intercept red-flag emergency symptoms to provide immediate crisis resources."""
    msg_lower = message.lower()
    for kw in EMERGENCY_KEYWORDS:
        if kw in msg_lower:
            return (
                "⚠️ **URGENT EMERGENCY ALERT**\n\n"
                "Your message mentions symptoms or thoughts that may require immediate emergency medical care.\n\n"
                "**Immediate Crisis Resources:**\n"
                "- 🚑 **National Ambulance**: 108 or 102 (India) / 911 (US) / 112 (EU/International)\n"
                "- 🚨 **Mental Health Helpline (KIRAN)**: 1800-599-0019 (24/7 Toll-Free)\n"
                "- 🏥 **Go to the Nearest Hospital Emergency Department** immediately.\n\n"
                "*Please do not rely on an AI conversation for emergency care. Reach out to healthcare professionals or emergency services right now.*"
            )
    return None


def retrieve_drug_facts(message: str) -> Optional[str]:
    """Retrieve grounded pharmaceutical context from the 195k medicine database."""
    db_path = get_expanded_db()
    if not db_path:
        return None

    words = [w.strip("?,.!;:\"'") for w in message.lower().split() if len(w) >= 4]
    if not words:
        return None

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        matches = []
        for w in words[:4]:
            cur.execute(
                """SELECT product_name, salt_composition, side_effects, drug_interactions 
                   FROM medicines 
                   WHERE product_name LIKE ? 
                   LIMIT 1""",
                (f"%{w}%",)
            )
            row = cur.fetchone()
            if row:
                matches.append(
                    f"Product: {row['product_name']}\n"
                    f"Salt Composition: {row['salt_composition']}\n"
                    f"Reported Side Effects: {row['side_effects']}\n"
                    f"Key Interactions: {row['drug_interactions']}"
                )
        conn.close()
        
        if matches:
            return "\n\n".join(matches)
        return None
    except Exception:
        return None


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


@router.post("/message")
def send_message(req: ChatRequest):
    # 1. Hardcoded emergency guardrail filter (immediate triage)
    emergency_response = check_emergency(req.message)
    if emergency_response:
        return {
            "reply": emergency_response,
            "is_emergency": True,
            "grounding_source": "Crisis Emergency Protocol"
        }

    # 2. Check for grounded medicine information in the 195k database
    grounding_context = retrieve_drug_facts(req.message)
    active_system_prompt = SYSTEM_PROMPT
    grounding_source = None

    if grounding_context:
        grounding_source = "Verified Indian Pharmaceutical Database (195,605 records)"
        active_system_prompt += (
            f"\n\n[VERIFIED MEDICAL DATABASE CONTEXT]:\n{grounding_context}\n\n"
            "INSTRUCTION: When discussing this medicine, state the factual salt composition and side effects "
            "from the context above. Remind the user: 'Source: Verified Pharmaceutical Database. Consult a doctor for personal dosing.'"
        )

    # 3. Verify Gemini API key configuration
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured on the server. Please configure GEMINI_API_KEY."
        )

    try:
        genai.configure(api_key=api_key, transport="rest")
        
        active_chat_models = [
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-flash-lite-latest",
        ]
        response = None
        last_err = None

        history = []
        for msg in (req.history or []):
            history.append({
                "role": msg.role,
                "parts": [msg.text]
            })

        for model_name in active_chat_models:
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=active_system_prompt
                )
                chat = model.start_chat(history=history)
                response = chat.send_message(req.message, request_options={"timeout": 35})
                if response and response.text:
                    break
            except Exception as e:
                last_err = e
                continue

        if not response or not response.text:
            sanitized = re.sub(r'AIza[0-9A-Za-z-_]{35}', '[REDACTED_API_KEY]', str(last_err or "No response from AI chat model"))
            raise HTTPException(
                status_code=503,
                detail=f"Chat service temporarily unavailable: {sanitized}"
            )

        return {
            "reply": response.text,
            "is_emergency": False,
            "grounding_source": grounding_source
        }

    except HTTPException:
        raise
    except Exception as e:
        sanitized = re.sub(r'AIza[0-9A-Za-z-_]{35}', '[REDACTED_API_KEY]', str(e))
        print(f"DEBUG: Chat Error: {sanitized}")
        raise HTTPException(
            status_code=503,
            detail=f"Chat service error: {sanitized}"
        )
