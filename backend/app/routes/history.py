from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, History
from pydantic import BaseModel
from typing import List

router = APIRouter()

class HistoryLog(BaseModel):
    activity_type: str
    title: str
    details: str

@router.post("/")
def log_history(log: HistoryLog, db: Session = Depends(get_db)):
    db_item = History(
        activity_type=log.activity_type,
        title=log.title,
        details=log.details
    )
    db.add(db_item)
    db.commit()
    return {"status": "success"}

@router.get("/")
def get_history(db: Session = Depends(get_db)):
    items = db.query(History).order_by(History.created_at.desc()).all()
    return items

@router.delete("/clear/")
@router.delete("/clear")
def clear_history(db: Session = Depends(get_db)):
    db.query(History).delete()
    db.commit()
    return {"status": "success", "message": "History cleared"}
