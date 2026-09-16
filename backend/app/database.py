"""
Medicine Database using SQLite + SQLAlchemy.
This replaces the in-memory dict with a persistent database.
"""

import os
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DB_PATH = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(os.path.dirname(__file__), '../database/medicines.db')}")
if DB_PATH.startswith("sqlite:///"):
    sqlite_path = DB_PATH.replace("sqlite:///", "")
    os.makedirs(os.path.dirname(os.path.abspath(sqlite_path)), exist_ok=True)

engine = create_engine(DB_PATH, connect_args={"check_same_thread": False} if "sqlite" in DB_PATH else {})

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


class Medicine(Base):
    __tablename__ = "medicines"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
    code        = Column(String, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    manufacturer= Column(String, nullable=False)
    batch       = Column(String, nullable=False)
    expiry      = Column(String, nullable=False)
    status      = Column(String, default="genuine")     # genuine | fake | suspicious
    scans       = Column(Integer, default=0)
    registered  = Column(DateTime, default=datetime.utcnow)
    is_active   = Column(Boolean, default=True)


class Doctor(Base):
    __tablename__ = "doctors"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    experience = Column(String)
    contact = Column(String, nullable=False)
    location = Column(String)
    is_available = Column(Boolean, default=True)


class Ambulance(Base):
    __tablename__ = "ambulances"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_number = Column(String, nullable=False)
    contact = Column(String, nullable=False)
    location = Column(String)
    is_available = Column(Boolean, default=True)
    type = Column(String, default="Basic") # Basic | Advanced


class DiseaseInfo(Base):
    __tablename__ = "disease_info"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    symptoms = Column(String)
    tests = Column(String)
    consultant = Column(String)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class History(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    activity_type = Column(String, nullable=False) # e.g., disease, report, medicine
    title = Column(String, nullable=False)
    details = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String)
    time = Column(String, nullable=False) # e.g., "08:00"
    days = Column(String, default="Daily") # e.g., "Mon,Tue,Wed" or "Daily"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Create tables and seed initial data if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    if db.query(Medicine).count() == 0:
        seed_med = [
            Medicine(code="MED-2024-001", name="Paracetamol 500mg",    manufacturer="Sun Pharma",      batch="B2024-01", expiry="2026-06", status="genuine"),
            Medicine(code="MED-2024-002", name="Amoxicillin 250mg",    manufacturer="Cipla Ltd.",       batch="B2024-07", expiry="2025-12", status="genuine"),
            Medicine(code="MED-2024-003", name="Metformin 500mg",       manufacturer="Dr. Reddy's",     batch="B2024-11", expiry="2027-03", status="genuine"),
            Medicine(code="FAKE-9999",    name="Aspirin 75mg (Counterfeit)", manufacturer="Unknown",   batch="FAKE-001", expiry="N/A",     status="fake"),
        ]
        db.add_all(seed_med)
        db.commit()

    if db.query(DiseaseInfo).count() == 0:
        # Look for CSV in the backend root directory (for Render) or up one level
        project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        csv_path = os.path.join(project_dir, "ml_workspace", "data", "disease_dataset.csv")
        if os.path.exists(csv_path):
            try:
                import csv
                with open(csv_path, mode='r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    diseases = []
                    for row in reader:
                        symptoms = ", ".join([row[f"Symptom {i}"] for i in range(1, 6) if row.get(f"Symptom {i}")])
                        tests = ", ".join([row[f"Test {i}"] for i in range(1, 3) if row.get(f"Test {i}")])
                        diseases.append(DiseaseInfo(
                            name=row["Desease list"],
                            symptoms=symptoms,
                            tests=tests,
                            consultant=row["Consultant"]
                        ))
                    db.add_all(diseases)
                    db.commit()
            except Exception as e:
                print(f"Error seeding disease info: {e}")

    if db.query(Doctor).count() == 0:
        seed_docs = [
            Doctor(name="Dr. Rajesh Kumar", specialization="Cardiologist", experience="15 years", contact="9876543210", location="Delhi", is_available=True),
            Doctor(name="Dr. Anita Desai", specialization="Dermatologist", experience="8 years", contact="9988776655", location="Mumbai", is_available=True),
        ]
        db.add_all(seed_docs)
        db.commit()

    db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
