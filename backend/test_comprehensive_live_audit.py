"""
Medicure Comprehensive Feature Integration & Security Live Audit Suite (v2)
Tests all feature domains with live HTTP socket requests against running FastAPI backend.
"""

import sys
import os
import io
import time
import base64
import requests
from PIL import Image, ImageDraw
import numpy as np
import soundfile as sf

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:5173"

def print_section(title):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)

def generate_test_image(text="SAMPLE"):
    img = Image.new("RGB", (250, 250), color=(240, 230, 220))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 200, 200], fill=(210, 60, 60))
    draw.text((60, 110), text, fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def generate_report_image():
    img = Image.new("RGB", (400, 250), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((20, 20), "CITY PATHOLOGY LABORATORY", fill=(0, 50, 150))
    d.text((20, 50), "COMPLETE BLOOD COUNT (CBC)", fill=(0, 0, 0))
    d.text((20, 80), "Hemoglobin: 14.2 g/dL (Normal: 12.0 - 15.5)", fill=(0, 0, 0))
    d.text((20, 110), "WBC: 7,100 /mcL (Normal: 4,500 - 11,000)", fill=(0, 0, 0))
    d.text((20, 140), "Platelets: 260,000 /mcL (Normal: 150,000 - 450,000)", fill=(0, 0, 0))
    d.text((20, 170), "Status: Normal haematological findings.", fill=(0, 120, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def generate_synthetic_audio():
    sample_rate = 22050
    duration = 2.0  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    # 220 Hz fundamental frequency (vocal A3 tone)
    audio = 0.5 * np.sin(2 * np.pi * 220 * t)
    buf = io.BytesIO()
    sf.write(buf, audio, sample_rate, format='WAV')
    return buf.getvalue()

def run_all_audits():
    results = []
    
    def log_test(domain, test_name, passed, detail=""):
        status_str = "PASS" if passed else "FAIL"
        print(f"[{status_str}] {domain} :: {test_name} {('- ' + detail) if detail else ''}")
        results.append({"domain": domain, "name": test_name, "passed": passed, "detail": detail})

    # ----------------------------------------------------
    # DOMAIN 1: Server & Static Health
    # ----------------------------------------------------
    print_section("1. Core Infrastructure & Dashboard")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        log_test("Infrastructure", "Backend Health /health", r.status_code == 200 and r.json().get("status") == "ok")
    except Exception as e:
        log_test("Infrastructure", "Backend Health /health", False, str(e))

    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        log_test("Infrastructure", "Backend Root /", r.status_code == 200)
    except Exception as e:
        log_test("Infrastructure", "Backend Root /", False, str(e))

    try:
        r = requests.get(f"{FRONTEND_URL}/", timeout=5)
        log_test("Infrastructure", "Frontend Vite Root", r.status_code == 200 and "<div id=\"root\">" in r.text)
    except Exception as e:
        log_test("Infrastructure", "Frontend Vite Root", False, str(e))

    try:
        r = requests.get(f"{FRONTEND_URL}/brand_logo.png", timeout=5)
        log_test("Infrastructure", "Brand Logo Delivery", r.status_code == 200 and len(r.content) > 100000)
    except Exception as e:
        log_test("Infrastructure", "Brand Logo Delivery", False, str(e))

    # ----------------------------------------------------
    # DOMAIN 2: Authentication & User-Data Isolation
    # ----------------------------------------------------
    print_section("2. Authentication & Multi-Tenant Data Isolation")
    
    # 2.1 Demo login
    demo_token = None
    try:
        r = requests.post(f"{BASE_URL}/api/auth/demo", timeout=5)
        if r.status_code == 200 and "access_token" in r.json():
            demo_token = r.json()["access_token"]
            log_test("Auth", "Demo Login", True)
        else:
            log_test("Auth", "Demo Login", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Auth", "Demo Login", False, str(e))

    # 2.2 Unauthenticated /me
    try:
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=5)
        log_test("Auth", "Unauthenticated /me rejected (401)", r.status_code == 401)
    except Exception as e:
        log_test("Auth", "Unauthenticated /me rejected (401)", False, str(e))

    # 2.3 User A Registration & Login
    ts = int(time.time())
    user_a_email = f"audit_user_a_{ts}@medicure.org"
    user_b_email = f"audit_user_b_{ts}@medicure.org"
    user_a_pass = "AuditSecurePass123!"
    user_b_pass = "AuditSecurePass456!"
    
    user_a_token = None
    user_b_token = None

    try:
        # Register User A with attempt at privilege escalation (role="admin")
        r = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": user_a_email, "password": user_a_pass, "full_name": "Audit User A", "role": "admin"},
            timeout=5
        )
        reg_ok = r.status_code == 200
        # Login to obtain token
        login_r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": user_a_email, "password": user_a_pass},
            timeout=5
        )
        if login_r.status_code == 200:
            user_a_token = login_r.json().get("access_token")
            # Verify role escalation was blocked
            me_r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {user_a_token}"})
            role_blocked = me_r.json().get("role") == "user"
            log_test("Auth", "User A Registration & Privilege Escalation Blocked", reg_ok and role_blocked, f"Assigned role: {me_r.json().get('role')}")
        else:
            log_test("Auth", "User A Registration & Login", False, f"Login status: {login_r.status_code}")
    except Exception as e:
        log_test("Auth", "User A Registration & Login", False, str(e))

    try:
        # Duplicate registration rejected
        r = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": user_a_email, "password": user_a_pass, "full_name": "Duplicate A"},
            timeout=5
        )
        log_test("Auth", "Duplicate Email Registration Blocked (400)", r.status_code == 400)
    except Exception as e:
        log_test("Auth", "Duplicate Email Registration Blocked", False, str(e))

    try:
        # Invalid password rejected
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": user_a_email, "password": "WrongPassword999!"},
            timeout=5
        )
        log_test("Auth", "Invalid Password Rejected (401)", r.status_code == 401)
    except Exception as e:
        log_test("Auth", "Invalid Password Rejected", False, str(e))

    # Register User B
    try:
        r = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": user_b_email, "password": user_b_pass, "full_name": "Audit User B"},
            timeout=5
        )
        login_b = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": user_b_email, "password": user_b_pass},
            timeout=5
        )
        if login_b.status_code == 200:
            user_b_token = login_b.json().get("access_token")
            log_test("Auth", "User B Registration & Login", True)
        else:
            log_test("Auth", "User B Registration", False, f"Status: {login_b.status_code}")
    except Exception as e:
        log_test("Auth", "User B Registration", False, str(e))

    # 2.4 Multi-Tenant Data Isolation (History & Reminders)
    if user_a_token and user_b_token:
        headers_a = {"Authorization": f"Bearer {user_a_token}"}
        headers_b = {"Authorization": f"Bearer {user_b_token}"}

        # Create User A History
        requests.post(
            f"{BASE_URL}/api/history",
            json={"activity_type": "disease", "title": "User A Record", "details": "Secret medical notes for A"},
            headers=headers_a
        )
        # Create User B History
        requests.post(
            f"{BASE_URL}/api/history",
            json={"activity_type": "disease", "title": "User B Record", "details": "Secret medical notes for B"},
            headers=headers_b
        )

        # Check User A history
        hist_a = requests.get(f"{BASE_URL}/api/history", headers=headers_a).json()
        hist_b = requests.get(f"{BASE_URL}/api/history", headers=headers_b).json()

        a_titles = [h.get("title") for h in hist_a]
        b_titles = [h.get("title") for h in hist_b]

        history_isolated = ("User A Record" in a_titles and "User B Record" not in a_titles and
                            "User B Record" in b_titles and "User A Record" not in b_titles)
        log_test("Data Isolation", "History Records Isolated between Users", history_isolated)

        # Reminder Isolation & Cross-Tenant Delete
        rem_a_res = requests.post(
            f"{BASE_URL}/api/reminder",
            json={"medicine_name": "Aspirin 75mg A", "dosage": "1 pill", "time": "09:00", "days": "Daily"},
            headers=headers_a
        ).json()
        rem_a_id = rem_a_res.get("id")

        # User B attempts to delete User A's reminder
        del_attempt = requests.delete(f"{BASE_URL}/api/reminder/{rem_a_id}", headers=headers_b)
        cross_delete_blocked = del_attempt.status_code == 404
        
        # Verify reminder is still there for User A
        rem_a_list = requests.get(f"{BASE_URL}/api/reminder", headers=headers_a).json()
        reminder_intact = any(r.get("id") == rem_a_id for r in rem_a_list)

        log_test("Data Isolation", "Cross-Tenant Reminder Deletion Blocked (404)", cross_delete_blocked and reminder_intact)

        # Clean up User A history
        requests.delete(f"{BASE_URL}/api/history/clear", headers=headers_a)
        hist_a_cleared = len(requests.get(f"{BASE_URL}/api/history", headers=headers_a).json()) == 0
        hist_b_still_there = len(requests.get(f"{BASE_URL}/api/history", headers=headers_b).json()) > 0
        log_test("Data Isolation", "History Clear Strictly Scoped to Caller", hist_a_cleared and hist_b_still_there)

    # ----------------------------------------------------
    # DOMAIN 3: Gemini Vision / Visual Checker
    # ----------------------------------------------------
    print_section("3. Gemini Vision & Visual Symptom Checker")
    symptom_bytes = generate_test_image("RASH")
    try:
        files = {"file": ("symptom.jpg", io.BytesIO(symptom_bytes), "image/jpeg")}
        r = requests.post(f"{BASE_URL}/api/visual-check/analyze", files=files, timeout=35)
        if r.status_code == 200 and r.json().get("status") == "success":
            analysis = r.json().get("analysis", "")
            log_test("Gemini Vision", "Visual Checker (Valid Image Analysis)", len(analysis) > 30, f"Chars: {len(analysis)}")
        else:
            log_test("Gemini Vision", "Visual Checker (Valid Image Analysis)", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Gemini Vision", "Visual Checker (Valid Image Analysis)", False, str(e))

    # Empty file
    try:
        files = {"file": ("empty.jpg", io.BytesIO(b""), "image/jpeg")}
        r = requests.post(f"{BASE_URL}/api/visual-check/analyze", files=files, timeout=10)
        log_test("Gemini Vision", "Visual Checker (Empty File Rejected 400)", r.status_code == 400)
    except Exception as e:
        log_test("Gemini Vision", "Visual Checker (Empty File Rejected)", False, str(e))

    # Invalid non-image file
    try:
        files = {"file": ("not_image.txt", io.BytesIO(b"Hello text"), "text/plain")}
        r = requests.post(f"{BASE_URL}/api/visual-check/analyze", files=files, timeout=10)
        log_test("Gemini Vision", "Visual Checker (Invalid Non-Image 400)", r.status_code == 400)
    except Exception as e:
        log_test("Gemini Vision", "Visual Checker (Invalid Non-Image)", False, str(e))

    # ----------------------------------------------------
    # DOMAIN 4: Medical Report Analyzer
    # ----------------------------------------------------
    print_section("4. Medical Report Analyzer")
    report_bytes = generate_report_image()
    try:
        files = {"file": ("cbc_scan.jpg", io.BytesIO(report_bytes), "image/jpeg")}
        r = requests.post(f"{BASE_URL}/api/report/analyze", files=files, timeout=35)
        if r.status_code == 200 and r.json().get("status") == "success":
            analysis = r.json().get("analysis", "")
            log_test("Report Analyzer", "Pathology Report Image Scan (200 OK)", len(analysis) > 30, f"Chars: {len(analysis)}")
        else:
            log_test("Report Analyzer", "Pathology Report Image Scan", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Report Analyzer", "Pathology Report Image Scan", False, str(e))

    # Direct PDF rejection
    try:
        files = {"file": ("lab_report.pdf", io.BytesIO(b"%PDF-1.4 Mock PDF Stream"), "application/pdf")}
        r = requests.post(f"{BASE_URL}/api/report/analyze", files=files, timeout=10)
        log_test("Report Analyzer", "PDF Upload Rejection with User Guidance (400)", r.status_code == 400 and "PDF" in r.json().get("detail", ""))
    except Exception as e:
        log_test("Report Analyzer", "PDF Upload Rejection", False, str(e))

    # ----------------------------------------------------
    # DOMAIN 5: AI Friend Chat & Crisis Triage
    # ----------------------------------------------------
    print_section("5. AI Friend Chat & Emergency Triage")
    # General health inquiry
    try:
        r = requests.post(
            f"{BASE_URL}/api/friend-chat/message",
            json={"message": "What are 3 practical habits for good hydration?", "history": []},
            timeout=25
        )
        if r.status_code == 200:
            reply = r.json().get("reply", "")
            log_test("Friend Chat", "Conversational Medical Companion (200 OK)", len(reply) > 20 and not r.json().get("is_emergency"))
        else:
            log_test("Friend Chat", "Conversational Medical Companion", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Friend Chat", "Conversational Medical Companion", False, str(e))

    # Emergency mental health crisis triage
    try:
        r = requests.post(
            f"{BASE_URL}/api/friend-chat/message",
            json={"message": "I feel hopeless and I want to end my life right now", "history": []},
            timeout=10
        )
        if r.status_code == 200 and r.json().get("is_emergency"):
            reply = r.json().get("reply", "")
            has_helpline = ("helpline" in reply.lower() or "988" in reply or "112" in reply or "tele-manas" in reply.lower())
            log_test("Friend Chat", "Immediate Crisis Triage & Helplines (200 OK)", has_helpline, "Intervention verified")
        else:
            log_test("Friend Chat", "Immediate Crisis Triage", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Friend Chat", "Immediate Crisis Triage", False, str(e))

    # ----------------------------------------------------
    # DOMAIN 6: Disease Prediction
    # ----------------------------------------------------
    print_section("6. Disease Predictor (45-Class ML)")
    try:
        r = requests.post(
            f"{BASE_URL}/api/disease/predict",
            json={"symptoms": "itching, skin rash, nodal skin eruptions"},
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            valid_prediction = bool(data.get("disease") and data.get("confidence") is not None)
            log_test("Disease Predictor", "Known Symptom Prediction (200 OK)", valid_prediction, f"Disease: {data.get('disease')}, Conf: {data.get('confidence')}%")
        else:
            log_test("Disease Predictor", "Known Symptom Prediction", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Disease Predictor", "Known Symptom Prediction", False, str(e))

    # Empty symptoms handled gracefully with status "insufficient_input"
    try:
        r = requests.post(f"{BASE_URL}/api/disease/predict", json={"symptoms": ""}, timeout=5)
        log_test("Disease Predictor", "Empty Symptoms Safe Handling (200 OK)", r.status_code == 200 and r.json().get("status") == "insufficient_input")
    except Exception as e:
        log_test("Disease Predictor", "Empty Symptoms Safe Handling", False, str(e))

    # Unmatched symptoms handled safely
    try:
        r = requests.post(f"{BASE_URL}/api/disease/predict", json={"symptoms": "xyzunknownfoobar"}, timeout=5)
        log_test("Disease Predictor", "Unrecognized Symptoms Safe Handling (200 OK)", r.status_code == 200 and r.json().get("status") == "unmatched_symptoms")
    except Exception as e:
        log_test("Disease Predictor", "Unrecognized Symptoms Safe Handling", False, str(e))

    # ----------------------------------------------------
    # DOMAIN 7: Skin Analysis (MobileNetV2 CNN)
    # ----------------------------------------------------
    print_section("7. Skin Analysis (Local CNN Inference)")
    skin_bytes = generate_test_image("SKIN")
    b64_skin = base64.b64encode(skin_bytes).decode("utf-8")
    try:
        r = requests.post(
            f"{BASE_URL}/api/skin/analyze",
            json={"image_base64": f"data:image/jpeg;base64,{b64_skin}"},
            timeout=20
        )
        if r.status_code == 200:
            data = r.json()
            valid_skin = bool(data.get("problem") and data.get("confidence") is not None)
            log_test("Skin Analysis", "CNN Image Inference (200 OK)", valid_skin, f"Class: {data.get('problem')}, Conf: {data.get('confidence')}%")
        else:
            log_test("Skin Analysis", "CNN Image Inference", False, f"Status: {r.status_code}, Body: {r.text}")
    except Exception as e:
        log_test("Skin Analysis", "CNN Image Inference", False, str(e))

    # Non-base64 / corrupt payload rejected with 400
    try:
        r = requests.post(f"{BASE_URL}/api/skin/analyze", json={"image_base64": "invalid_base64"}, timeout=5)
        log_test("Skin Analysis", "Corrupt Base64 Rejected (400)", r.status_code == 400)
    except Exception as e:
        log_test("Skin Analysis", "Corrupt Base64 Rejected", False, str(e))

    # Empty payload rejected with 400
    try:
        r = requests.post(f"{BASE_URL}/api/skin/analyze", json={"image_base64": ""}, timeout=5)
        log_test("Skin Analysis", "Empty Image Rejected (400)", r.status_code == 400)
    except Exception as e:
        log_test("Skin Analysis", "Empty Image Rejected", False, str(e))

    # ----------------------------------------------------
    # DOMAIN 8: Voice Analysis (Librosa DSP)
    # ----------------------------------------------------
    print_section("8. Voice Acoustic Analysis")
    audio_bytes = generate_synthetic_audio()
    try:
        files = {"file": ("patient_voice.wav", io.BytesIO(audio_bytes), "audio/wav")}
        r = requests.post(f"{BASE_URL}/api/voice/analyze", files=files, timeout=15)
        if r.status_code == 200:
            data = r.json()
            dsp_ok = (data.get("is_ml_model") is False and "features" in data and "mdvp_fo" in data.get("features", {}))
            log_test("Voice Analysis", "Librosa DSP Perturbation Screening (200 OK)", dsp_ok, f"Pitch (F0): {data.get('features', {}).get('mdvp_fo')} Hz")
        else:
            log_test("Voice Analysis", "Librosa DSP Perturbation Screening", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Voice Analysis", "Librosa DSP Perturbation Screening", False, str(e))

    # ----------------------------------------------------
    # DOMAIN 9: Medicine OCR, Search, and Verification
    # ----------------------------------------------------
    print_section("9. Medicine Search, Authenticity & Packaging OCR")
    # 9.1 Search in 461 MB expanded catalog
    try:
        r = requests.get(f"{BASE_URL}/api/medicine/search?query=paracetamol", timeout=10)
        if r.status_code == 200:
            items = r.json()
            log_test("Medicine", "Expanded Database Search (195k records)", len(items) > 0, f"Found {len(items)} matching products")
        else:
            log_test("Medicine", "Expanded Database Search", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Medicine", "Expanded Database Search", False, str(e))

    # 9.2 Symptom suggestion
    try:
        r = requests.get(f"{BASE_URL}/api/medicine/suggest?symptoms=fever", timeout=10)
        if r.status_code == 200:
            items = r.json()
            log_test("Medicine", "Clinical Symptom Suggestion", len(items) > 0, f"Found {len(items)} suggestions")
        else:
            log_test("Medicine", "Clinical Symptom Suggestion", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Medicine", "Clinical Symptom Suggestion", False, str(e))

    # 9.3 Authentic medicine verification
    try:
        r = requests.get(f"{BASE_URL}/api/medicine/verify?code=MED-2024-001", timeout=5)
        if r.status_code == 200:
            data = r.json()
            log_test("Medicine", "Authentic Batch Verification", data.get("status") == "genuine", f"Batch: {data.get('batch')}")
        else:
            log_test("Medicine", "Authentic Batch Verification", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Medicine", "Authentic Batch Verification", False, str(e))

    # 9.4 Counterfeit warning
    try:
        r = requests.get(f"{BASE_URL}/api/medicine/verify?code=FAKE-9999", timeout=5)
        if r.status_code == 200:
            data = r.json()
            log_test("Medicine", "Counterfeit Batch Flagging", data.get("status") == "fake", f"Status: {data.get('status')}")
        else:
            log_test("Medicine", "Counterfeit Batch Flagging", False, f"Status: {r.status_code}")
    except Exception as e:
        log_test("Medicine", "Counterfeit Batch Flagging", False, str(e))

    # 9.5 Packaging Image Analysis / OCR graceful degradation
    try:
        pkg_bytes = generate_test_image("CIPLA")
        files = {"file": ("packaging.jpg", io.BytesIO(pkg_bytes), "image/jpeg")}
        r = requests.post(f"{BASE_URL}/api/medicine/analyze-image", files=files, timeout=10)
        # Either 200 (if tesseract installed) or 503 (clean explanatory error if tesseract binary missing)
        graceful = (r.status_code == 200) or (r.status_code == 503 and "Tesseract" in r.json().get("detail", ""))
        log_test("Medicine", "Packaging OCR (Graceful Degradation)", graceful, f"HTTP {r.status_code}: {r.json().get('status') or r.json().get('detail')}")
    except Exception as e:
        log_test("Medicine", "Packaging OCR", False, str(e))

    # ----------------------------------------------------
    # DOMAIN 10: Doctors & Ambulance Directory
    # ----------------------------------------------------
    print_section("10. Healthcare Provider Directory & RBAC")
    try:
        r = requests.get(f"{BASE_URL}/api/doctors/list", timeout=5)
        log_test("Directory", "Public Doctors Directory", r.status_code == 200 and len(r.json()) >= 2)
    except Exception as e:
        log_test("Directory", "Public Doctors Directory", False, str(e))

    try:
        r = requests.get(f"{BASE_URL}/api/ambulance/list", timeout=5)
        log_test("Directory", "Public Ambulance Directory", r.status_code == 200 and len(r.json()) >= 1)
    except Exception as e:
        log_test("Directory", "Public Ambulance Directory", False, str(e))

    # RBAC: Ordinary user cannot register a doctor
    if user_a_token:
        try:
            r = requests.post(
                f"{BASE_URL}/api/doctors/register",
                json={"name": "Dr. Hacker", "specialization": "None", "contact": "0000000000"},
                headers={"Authorization": f"Bearer {user_a_token}"},
                timeout=5
            )
            log_test("RBAC", "Ordinary User Registration of Doctors Blocked (403)", r.status_code == 403)
        except Exception as e:
            log_test("RBAC", "Ordinary User Registration of Doctors Blocked", False, str(e))

    # ----------------------------------------------------
    # DOMAIN 11: Ancillary Utilities (Disease Info & Meditation)
    # ----------------------------------------------------
    print_section("11. Ancillary Utilities (Disease Info & Meditation)")
    try:
        r = requests.get(f"{BASE_URL}/api/disease-info/list", timeout=5)
        log_test("Utilities", "Disease Knowledgebase /api/disease-info/list", r.status_code == 200 and len(r.json()) > 0)
    except Exception as e:
        log_test("Utilities", "Disease Knowledgebase", False, str(e))

    try:
        r = requests.get(f"{BASE_URL}/api/meditation/techniques", timeout=5)
        log_test("Utilities", "Meditation Techniques /api/meditation/techniques", r.status_code == 200 and len(r.json()) > 0)
    except Exception as e:
        log_test("Utilities", "Meditation Techniques", False, str(e))

    try:
        r = requests.get(f"{BASE_URL}/api/meditation/guides/breathing", timeout=5)
        log_test("Utilities", "Breathing Guides /api/meditation/guides/breathing", r.status_code == 200 and len(r.json()) > 0)
    except Exception as e:
        log_test("Utilities", "Breathing Guides", False, str(e))

    # ----------------------------------------------------
    # SUMMARY
    # ----------------------------------------------------
    print_section("AUDIT SUMMARY")
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    print(f"Total Integrations Tested: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Pass Rate: {(passed / total) * 100:.1f}%")
    return passed == total

if __name__ == "__main__":
    success = run_all_audits()
    sys.exit(0 if success else 1)
