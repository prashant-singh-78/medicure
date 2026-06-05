from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db, Reminder
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class ReminderSchema(BaseModel):
    id: Optional[int] = None
    medicine_name: str
    dosage: Optional[str] = None
    time: str
    days: str = "Daily"
    is_active: bool = True

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ReminderSchema])
def get_reminders(db: Session = Depends(get_db)):
    return db.query(Reminder).all()

@router.post("/")
def add_reminder(reminder: ReminderSchema, db: Session = Depends(get_db)):
    new_rem = Reminder(
        medicine_name=reminder.medicine_name,
        dosage=reminder.dosage,
        time=reminder.time,
        days=reminder.days,
        is_active=reminder.is_active
    )
    db.add(new_rem)
    db.commit()
    db.refresh(new_rem)
    return new_rem

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    rem = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(rem)
    db.commit()
    return {"message": "Reminder deleted successfully"}
