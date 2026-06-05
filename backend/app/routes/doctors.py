from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db, Doctor

router = APIRouter()

@router.get("/list")
def list_doctors(db: Session = Depends(get_db)):
    return db.query(Doctor).all()

@router.post("/register")
def register_doctor(
    name: str = Body(...),
    specialization: str = Body(...),
    experience: str = Body(None),
    contact: str = Body(...),
    location: str = Body(None),
    db: Session = Depends(get_db)
):
    new_doc = Doctor(
        name=name,
        specialization=specialization,
        experience=experience,
        contact=contact,
        location=location
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return {"success": True, "message": f"Doctor {name} registered successfully.", "doctor": new_doc}
