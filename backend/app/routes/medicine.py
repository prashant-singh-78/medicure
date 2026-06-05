import os
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, Depends
from fastapi import Body
from sqlalchemy.orm import Session
from PIL import Image
import io
from app.database import get_db, Medicine
import sqlite3

EXPANDED_DB_PATH = os.path.join(os.path.dirname(__file__), "../../database/database/medicine_expanded.db")

router = APIRouter()


@router.get("/search")
def search_medicines(query: str = Query(..., min_length=2)):
    """Search for medicines in the expanded Indian medicine dataset."""
    if not os.path.exists(EXPANDED_DB_PATH):
        raise HTTPException(status_code=404, detail="Expanded medicine database not found.")
    
    conn = sqlite3.connect(EXPANDED_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Use LIKE for partial matching
        cursor.execute(
            "SELECT * FROM medicines WHERE product_name LIKE ? LIMIT 20",
            (f"%{query}%",)
        )
        results = [dict(row) for row in cursor.fetchall()]
        return results
    finally:
        conn.close()


@router.get("/suggest")
def suggest_medicines(symptoms: str = Query(..., min_length=2)):
    """Suggest medicines based on symptoms or disease keywords."""
    if not os.path.exists(EXPANDED_DB_PATH):
        raise HTTPException(status_code=404, detail="Expanded medicine database not found.")
    
    conn = sqlite3.connect(EXPANDED_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Search symptoms in medicine_desc and sub_category
        # We also check product_name just in case
        cursor.execute(
            """SELECT * FROM medicines 
               WHERE medicine_desc LIKE ? 
               OR sub_category LIKE ? 
               OR product_name LIKE ? 
               LIMIT 10""",
            (f"%{symptoms}%", f"%{symptoms}%", f"%{symptoms}%")
        )
        results = [dict(row) for row in cursor.fetchall()]
        return results
    finally:
        conn.close()


@router.get("/verify")
def verify_by_code(code: str = Query(..., description="Medicine QR/Barcode/Batch ID"), db: Session = Depends(get_db)):
    """Verify medicine authenticity by looking it up in the SQLite database."""
    entry = db.query(Medicine).filter(Medicine.code == code.upper()).first()

    if not entry:
        return {
            "name": "Medicine Not Found in Database",
            "manufacturer": "N/A",
            "batch": code,
            "expiry": "N/A",
            "status": "unknown",
            "scans": 0,
        }

    # Increment scan count
    entry.scans += 1

    # Fraud signal: same code scanned > 15 times → suspicious
    if entry.scans > 15 and entry.status == "genuine":
        entry.status = "suspicious"

    db.commit()
    db.refresh(entry)

    return {
        "name": entry.name,
        "manufacturer": entry.manufacturer,
        "batch": entry.batch,
        "expiry": entry.expiry,
        "status": entry.status,
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
):
    """Register a new medicine into the database."""
    existing = db.query(Medicine).filter(Medicine.code == code.upper()).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Medicine with code '{code}' already exists.")

    new_med = Medicine(
        code=code.upper(),
        name=name,
        manufacturer=manufacturer,
        batch=batch,
        expiry=expiry,
        status=status.lower(),
    )
    db.add(new_med)
    db.commit()
    return {"success": True, "message": f"Medicine '{name}' registered with code {code.upper()}."}


@router.get("/list")
def list_medicines(db: Session = Depends(get_db)):
    """List all medicines in the database."""
    meds = db.query(Medicine).all()
    return [
        {"code": m.code, "name": m.name, "manufacturer": m.manufacturer, "batch": m.batch, "expiry": m.expiry, "status": m.status, "scans": m.scans}
        for m in meds
    ]


@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze medicine packaging image using OCR."""
    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    ocr_text = ""
    try:
        import pytesseract
        ocr_text = pytesseract.image_to_string(img, lang='eng').strip()
    except Exception:
        ocr_text = "[OCR not available — install Tesseract: https://github.com/tesseract-ocr/tesseract]"

    text_lower = ocr_text.lower()
    suspicious_keywords = ["fake", "imitation", "replica", "copy", "unregistered", "duplicate"]
    genuine_brands = ["sun pharma", "cipla", "dr. reddy", "lupin", "abbott", "pfizer", "ranbaxy", "zydus", "alkem"]

    is_suspicious = any(kw in text_lower for kw in suspicious_keywords)
    has_known_brand = any(brand in text_lower for brand in genuine_brands)

    if is_suspicious:
        status, name, manufacturer, confidence = "fake", "Suspicious Packaging Detected", "Unverified", 88.5
    elif has_known_brand:
        status = "genuine"
        name = "Medicine Packaging Appears Authentic"
        manufacturer = next((b.title() for b in genuine_brands if b in text_lower), "Verified Brand")
        confidence = 82.3
    else:
        status, name, manufacturer, confidence = "unknown", "Could Not Determine Authenticity", "N/A", 45.0

    return {
        "name": name,
        "manufacturer": manufacturer,
        "batch": "N/A (scan barcode for batch)",
        "expiry": "N/A (scan barcode for expiry)",
        "status": status,
        "confidence": float(f"{confidence:.1f}"),
        "ocr_text": ocr_text[:300] if ocr_text else "No text detected",
    }
