import os
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, Depends
from fastapi import Body
from sqlalchemy.orm import Session
from PIL import Image
import io
from app.database import get_db, Medicine, User
from app.routes.auth import get_admin_user
import sqlite3

EXPANDED_DB_PATHS = [
    os.getenv("MEDICINE_EXPANDED_DB_PATH", ""),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../database/medicine_expanded.db")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../database/database/medicine_expanded.db"))
]

def get_expanded_db_path():
    for p in EXPANDED_DB_PATHS:
        if p and os.path.exists(p):
            return p
    return None

router = APIRouter()


@router.get("/search")
def search_medicines(query: str = Query(..., min_length=2)):
    """Search for medicines in the expanded Indian medicine dataset (195k records)."""
    db_path = get_expanded_db_path()
    if not db_path:
        raise HTTPException(
            status_code=503, 
            detail="Expanded medicine database not found. Please build the database using build_expanded_db.py."
        )
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Search indexed product_name and salt_composition
        cursor.execute(
            """SELECT * FROM medicines 
               WHERE product_name LIKE ? 
               OR salt_composition LIKE ? 
               LIMIT 25""",
            (f"%{query}%", f"%{query}%")
        )
        results = [dict(row) for row in cursor.fetchall()]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")
    finally:
        conn.close()


@router.get("/suggest")
def suggest_medicines(symptoms: str = Query(..., min_length=2)):
    """Suggest medicines based on symptoms or disease keywords from clinical medicine descriptions."""
    db_path = get_expanded_db_path()
    if not db_path:
        raise HTTPException(
            status_code=503, 
            detail="Expanded medicine database not found. Please build the database using build_expanded_db.py."
        )
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Search symptoms in medicine_desc, sub_category, and product_name
        cursor.execute(
            """SELECT * FROM medicines 
               WHERE medicine_desc LIKE ? 
               OR sub_category LIKE ? 
               OR product_name LIKE ? 
               LIMIT 15""",
            (f"%{symptoms}%", f"%{symptoms}%", f"%{symptoms}%")
        )
        results = [dict(row) for row in cursor.fetchall()]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")
    finally:
        conn.close()


@router.get("/verify")
def verify_by_code(code: str = Query(..., description="Medicine QR/Barcode/Batch ID"), db: Session = Depends(get_db)):
    """Verify medicine authenticity by querying the verified SQLite registry."""
    clean_code = code.strip().upper()
    entry = db.query(Medicine).filter(Medicine.code == clean_code).first()

    if not entry:
        return {
            "status": "not_found",
            "name": f"Batch Code '{clean_code}' Not Found",
            "manufacturer": "Unverified Distributor",
            "batch": clean_code,
            "expiry": "N/A",
            "scans": 0,
            "message": "This batch code is not present in the registered authentic manufacturer database."
        }

    # Increment scan count
    entry.scans += 1

    # Fraud signal: code scanned > 15 times marked as suspicious
    if entry.scans > 15 and entry.status == "genuine":
        entry.status = "suspicious"

    db.commit()
    db.refresh(entry)

    return {
        "status": entry.status,
        "name": entry.name,
        "manufacturer": entry.manufacturer,
        "batch": entry.batch,
        "expiry": entry.expiry,
        "scans": entry.scans,
        "registered": entry.registered.strftime('%Y-%m-%d') if entry.registered else "N/A",
    }


@router.post("/register")
def register_medicine(
    code: str = Body(...),
    name: str = Body(...),
    manufacturer: str = Body(...),
    batch: str = Body(...),
    expiry: str = Body(...),
    status: str = Body("genuine"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Register an authenticated medicine batch into the local database."""
    clean_code = code.strip().upper()
    existing = db.query(Medicine).filter(Medicine.code == clean_code).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Medicine batch with code '{clean_code}' is already registered.")

    new_med = Medicine(
        code=clean_code,
        name=name.strip(),
        manufacturer=manufacturer.strip(),
        batch=batch.strip(),
        expiry=expiry.strip(),
        status=status.lower(),
    )
    db.add(new_med)
    db.commit()
    return {"success": True, "message": f"Medicine '{name}' registered with code {clean_code}."}


@router.get("/list")
def list_medicines(db: Session = Depends(get_db)):
    """List all registered medicine batches."""
    meds = db.query(Medicine).all()
    return [
        {"code": m.code, "name": m.name, "manufacturer": m.manufacturer, "batch": m.batch, "expiry": m.expiry, "status": m.status, "scans": m.scans}
        for m in meds
    ]


@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze medicine packaging image using OCR optical character recognition."""
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty packaging image uploaded.")

    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file format.")

    try:
        import pytesseract
        ocr_text = pytesseract.image_to_string(img, lang='eng').strip()
    except Exception as e:
        # Check if tesseract binary is missing
        err_str = str(e).lower()
        if "tesseract is not installed" in err_str or "not in your path" in err_str or "tesseractnotfounderror" in type(e).__name__.lower():
            raise HTTPException(
                status_code=503,
                detail=(
                    "Tesseract OCR optical engine is not installed or not in system PATH. "
                    "Install Tesseract OCR (e.g. from https://github.com/UB-Mannheim/tesseract/wiki) "
                    "to enable local optical medicine packaging verification."
                )
            )
        raise HTTPException(status_code=500, detail=f"Packaging OCR processing failed: {str(e)}")

    if not ocr_text:
        return {
            "status": "unreadable",
            "name": "No Text Detected on Packaging",
            "manufacturer": "N/A",
            "batch": "N/A",
            "expiry": "N/A",
            "confidence": 0.0,
            "ocr_text": ""
        }

    text_lower = ocr_text.lower()
    suspicious_keywords = ["fake", "imitation", "replica", "copy", "unregistered", "duplicate"]
    genuine_brands = ["sun pharma", "cipla", "dr. reddy", "lupin", "abbott", "pfizer", "ranbaxy", "zydus", "alkem"]

    is_suspicious = any(kw in text_lower for kw in suspicious_keywords)
    has_known_brand = any(brand in text_lower for brand in genuine_brands)

    if is_suspicious:
        status, name, manufacturer, confidence = "fake", "Suspicious Packaging Text Detected", "Unverified", 85.0
    elif has_known_brand:
        status = "genuine"
        name = "Medicine Packaging Verified Authentic"
        manufacturer = next((b.title() for b in genuine_brands if b in text_lower), "Verified Brand")
        confidence = 88.0
    else:
        status, name, manufacturer, confidence = "unknown", "Brand Not in Verified Authentic Catalog", "N/A", 50.0

    return {
        "status": status,
        "name": name,
        "manufacturer": manufacturer,
        "batch": "Extracted via OCR",
        "expiry": "Extracted via OCR",
        "confidence": float(f"{confidence:.1f}"),
        "ocr_text": ocr_text[:300],
    }
