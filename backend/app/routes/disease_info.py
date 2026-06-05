from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, DiseaseInfo

router = APIRouter()

@router.get("/list")
def list_diseases(db: Session = Depends(get_db)):
    return db.query(DiseaseInfo).all()
