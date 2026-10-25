from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, Reminder, User
from app.routes.auth import get_current_user
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


@router.get("", response_model=List[ReminderSchema])
@router.get("/", response_model=List[ReminderSchema])
def get_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve medication reminders belonging exclusively to the authenticated user."""
    return db.query(Reminder).filter(Reminder.user_id == current_user.id).all()


@router.post("", response_model=ReminderSchema)
@router.post("/", response_model=ReminderSchema)
def add_reminder(
    reminder: ReminderSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new medication reminder strictly scoped to the authenticated user."""
    new_rem = Reminder(
        user_id=current_user.id,
        medicine_name=reminder.medicine_name.strip(),
        dosage=reminder.dosage.strip() if reminder.dosage else None,
        time=reminder.time.strip(),
        days=reminder.days.strip(),
        is_active=reminder.is_active
    )
    db.add(new_rem)
    db.commit()
    db.refresh(new_rem)
    return new_rem


@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a reminder belonging exclusively to the authenticated user."""
    rem = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
        .first()
    )
    if not rem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found or access denied."
        )
    db.delete(rem)
    db.commit()
    return {"message": "Reminder deleted successfully", "id": reminder_id}
