from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, History, User
from app.routes.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()


class HistoryLog(BaseModel):
    activity_type: str
    title: str
    details: str


class HistoryResponse(BaseModel):
    id: int
    activity_type: str
    title: str
    details: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.post("")
@router.post("/")
def log_history(
    log: HistoryLog,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log an activity record strictly scoped to the authenticated user."""
    db_item = History(
        user_id=current_user.id,
        activity_type=log.activity_type,
        title=log.title,
        details=log.details
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return {"status": "success", "id": db_item.id}


@router.get("", response_model=List[HistoryResponse])
@router.get("/", response_model=List[HistoryResponse])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve history records belonging exclusively to the authenticated user."""
    items = (
        db.query(History)
        .filter(History.user_id == current_user.id)
        .order_by(History.created_at.desc())
        .all()
    )
    return items


@router.delete("/clear/")
@router.delete("/clear")
def clear_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear history records belonging exclusively to the authenticated user."""
    deleted_count = (
        db.query(History)
        .filter(History.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {
        "status": "success",
        "message": "User history cleared successfully",
        "deleted_count": deleted_count
    }
