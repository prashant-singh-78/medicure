from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db, Ambulance

router = APIRouter()

@router.get("/list")
def list_ambulances(db: Session = Depends(get_db)):
    return db.query(Ambulance).all()

@router.post("/register")
def register_ambulance(
    vehicle_number: str = Body(...),
    contact: str = Body(...),
    location: str = Body(None),
    type: str = Body("Basic"),
    db: Session = Depends(get_db)
):
    new_amb = Ambulance(
        vehicle_number=vehicle_number,
        contact=contact,
        location=location,
        type=type
    )
    db.add(new_amb)
    db.commit()
    db.refresh(new_amb)
    return {"success": True, "message": f"Ambulance {vehicle_number} registered successfully.", "ambulance": new_amb}
