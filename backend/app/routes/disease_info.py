from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, DiseaseInfo
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class DiseaseInfoResponse(BaseModel):
    id: int
    name: str
    category: Optional[str] = "General Medical"
    description: Optional[str] = ""
    symptoms: Optional[str] = ""
    prevention: Optional[str] = ""
    tests: Optional[str] = ""
    consultant: Optional[str] = ""
    image: Optional[str] = ""

    class Config:
        from_attributes = True


@router.get("/list", response_model=List[DiseaseInfoResponse])
def list_diseases(db: Session = Depends(get_db)):
    """Retrieve full catalog of diseases including descriptions, prevention, and diagnostics."""
    return db.query(DiseaseInfo).all()
