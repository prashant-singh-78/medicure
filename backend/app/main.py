from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import voice, medicine, report, disease, history, skin, doctors, ambulance, disease_info, meditation, auth, friend_chat, reminder, visual_check
from app.database import init_db

app = FastAPI(title="Medicure API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(voice.router, prefix="/api/voice", tags=["Voice Detection"])
app.include_router(medicine.router, prefix="/api/medicine", tags=["Medicine Detection"])
app.include_router(report.router, prefix="/api/report", tags=["Report Analyzer"])
app.include_router(disease.router, prefix="/api/disease", tags=["Disease Predictor"])
app.include_router(history.router, prefix="/api/history", tags=["User History"])
app.include_router(reminder.router, prefix="/api/reminder", tags=["Reminder"])
app.include_router(visual_check.router, prefix="/api/visual-check", tags=["Visual Check"])
app.include_router(skin.router, prefix="/api/skin", tags=["Skin Problem Analyzer"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["Doctors Registration"])
app.include_router(ambulance.router, prefix="/api/ambulance", tags=["Ambulance Service"])
app.include_router(disease_info.router, prefix="/api/disease-info", tags=["About Diseases"])
app.include_router(meditation.router, prefix="/api/meditation", tags=["Meditation & Wellness"])
app.include_router(auth.router, prefix="/api/auth", tags=["User Authentication"])
app.include_router(friend_chat.router, prefix="/api/friend-chat", tags=["Friend Chat"])

@app.get("/")
def root():
    return {"message": "Medicure API v2.0 is running!"}

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0"}
