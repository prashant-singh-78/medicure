from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db, Ambulance, User
from app.routes.auth import get_admin_user

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
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
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
