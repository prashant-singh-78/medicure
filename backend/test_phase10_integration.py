"""
Medicure Phase 10 Comprehensive Master Integration Test Suite
============================================================
Validates end-to-end ML reliability, artifact portability, input validation,
truth-in-advertising guards, RBAC authorization, and data isolation.
Directly exercises route handlers, ML models, and databases without httpx dependencies.
"""

import os
import sys
import tempfile
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["MPLCONFIGDIR"] = tempfile.gettempdir()

import unittest
import asyncio
import io
import base64
import sqlite3
import numpy as np
from PIL import Image

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, User, Doctor, Ambulance, Medicine
from app.routes.auth import (
    get_password_hash,
    create_access_token,
    get_current_user,
    get_admin_user,
    register,
    UserCreate,
)
from app.routes import skin as skin_module
from app.routes import disease as disease_module
from app.routes import voice as voice_module
from app.routes import medicine as medicine_module
from app.routes import report as report_module
from app.routes import friend_chat as friend_chat_module
from app.routes import doctors as doctors_module
from app.routes import ambulance as ambulance_module


class TestPhase10MasterIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # 1. Isolated in-memory SQLite database for authentication & entities
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False}
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=cls.engine, expire_on_commit=False
        )
        Base.metadata.create_all(bind=cls.engine)

        # 2. Seed test admin and user
        db = cls.TestingSessionLocal()
        cls.admin_user = User(
            id=101,
            email="admin.phase10@medicure.test",
            hashed_password=get_password_hash("AdminSecretPass123!"),
            full_name="Phase 10 Admin",
            role="admin",
            is_active=True
        )
        cls.ordinary_user = User(
            id=102,
            email="patient.phase10@medicure.test",
            hashed_password=get_password_hash("PatientSecretPass123!"),
            full_name="Phase 10 Patient",
            role="user",
            is_active=True
        )
        db.add(cls.admin_user)
        db.add(cls.ordinary_user)
        db.commit()
        db.close()

    def setUp(self):
        self.db = self.TestingSessionLocal()
        self.admin_user = self.db.merge(self.__class__.admin_user)
        self.ordinary_user = self.db.merge(self.__class__.ordinary_user)

    def tearDown(self):
        self.db.close()

    def _get_auth_creds(self, user: User) -> HTTPAuthorizationCredentials:
        token = create_access_token(data={"sub": user.email})
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    # =========================================================================
    # 1. SKIN CLASSIFIER ML & PORTABILITY TESTS
    # =========================================================================
    def test_01_skin_model_loads_from_canonical_backend_models_dir(self):
        """Verify skin model v2 and classes exist in canonical backend/models/."""
        models_dir = os.path.join(BACKEND_DIR, "models")
        v2_path = os.path.join(models_dir, "skin_model_v2.h5")
        classes_path = os.path.join(models_dir, "skin_model_v2_classes.json")
        self.assertTrue(os.path.exists(v2_path), f"Canonical skin_model_v2.h5 missing from {models_dir}")
        self.assertTrue(os.path.exists(classes_path), f"Canonical skin_model_v2_classes.json missing from {models_dir}")

    def test_02_skin_analyze_returns_valid_prediction_and_version(self):
        """Verify analyze_skin processes image, returns prediction, confidence, and model_version."""
        img = Image.new("RGB", (224, 224), color=(180, 100, 80))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")

        payload = skin_module.SkinImage(image_base64=b64_str)
        res = asyncio.run(skin_module.analyze_skin(payload))
        self.assertEqual(res["status"], "success")
        self.assertIn("problem", res)
        self.assertIn("confidence", res)
        self.assertIn("disclaimer", res)
        self.assertIn("model_version", res)
        self.assertTrue("skin_model_v2" in res["model_version"])

    def test_03_skin_analyze_rejects_empty_and_malformed_base64(self):
        """Verify fast-fail validation on empty or corrupt base64."""
        with self.assertRaises(HTTPException) as ctx_empty:
            asyncio.run(skin_module.analyze_skin(skin_module.SkinImage(image_base64="")))
        self.assertEqual(ctx_empty.exception.status_code, 400)

        with self.assertRaises(HTTPException) as ctx_malformed:
            asyncio.run(skin_module.analyze_skin(skin_module.SkinImage(image_base64="not_base64_data")))
        self.assertEqual(ctx_malformed.exception.status_code, 400)

    # =========================================================================
    # 2. GENERAL DISEASE PREDICTOR ML & GUARDRAIL TESTS
    # =========================================================================
    def test_04_disease_model_loads_from_canonical_backend_models_dir(self):
        """Verify disease model v2 and metadata exist in canonical backend/models/."""
        models_dir = os.path.join(BACKEND_DIR, "models")
        v2_path = os.path.join(models_dir, "disease_model_v2.pkl")
        meta_path = os.path.join(models_dir, "disease_metadata_v2.pkl")
        self.assertTrue(os.path.exists(v2_path), f"Canonical disease_model_v2.pkl missing from {models_dir}")
        self.assertTrue(os.path.exists(meta_path), f"Canonical disease_metadata_v2.pkl missing from {models_dir}")

    def test_05_disease_predict_valid_symptoms_and_scope(self):
        """Verify calibrated prediction on medical symptoms returns scope and disclaimers."""
        req = disease_module.SymptomRequest(symptoms="wheezing, breathlessness, tight chest")
        res = disease_module.predict_disease(req)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["disease"].lower(), "asthma")
        self.assertGreater(res["confidence"], 50.0)
        self.assertIn("catalog_conditions", res)
        self.assertEqual(res["catalog_conditions"], 45)
        self.assertIn("disclaimer", res)

    def test_06_disease_predict_ood_and_insufficient_rejection(self):
        """Verify out-of-distribution gibberish and insufficient input rejection."""
        res_short = disease_module.predict_disease(disease_module.SymptomRequest(symptoms="a"))
        self.assertEqual(res_short["status"], "insufficient_input")

        res_ood = disease_module.predict_disease(disease_module.SymptomRequest(symptoms="quantum entanglement teleportation galaxy"))
        self.assertEqual(res_ood["status"], "unmatched_symptoms")
        self.assertEqual(res_ood["confidence"], 0.0)

    # =========================================================================
    # 3. VOICE / PARKINSON'S ACOUSTIC DSP TESTS
    # =========================================================================
    def test_07_voice_rejects_unmodeled_diseases_with_400(self):
        """Verify voice route explicitly rejects unmodeled diseases like covid and respiratory."""
        upload_covid = UploadFile(filename="test.webm", file=io.BytesIO(b"\x00" * 2000))
        with self.assertRaises(HTTPException) as ctx_covid:
            asyncio.run(voice_module.analyze_voice(file=upload_covid, disease="covid"))
        self.assertEqual(ctx_covid.exception.status_code, 400)
        self.assertIn("currently only implemented for Parkinson", ctx_covid.exception.detail)

        upload_resp = UploadFile(filename="test.webm", file=io.BytesIO(b"\x00" * 2000))
        with self.assertRaises(HTTPException) as ctx_resp:
            asyncio.run(voice_module.analyze_voice(file=upload_resp, disease="respiratory"))
        self.assertEqual(ctx_resp.exception.status_code, 400)

    def test_08_voice_honest_dsp_screening_categorization(self):
        """Verify voice route processes audio and transparently marks output as DSP screening."""
        sr = 22050
        t = np.linspace(0, 1.0, sr)
        sine = (np.sin(2 * np.pi * 220 * t) * 32767).astype(np.int16)
        import wave
        wav_buf = io.BytesIO()
        with wave.open(wav_buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            wf.writeframes(sine.tobytes())

        upload_valid = UploadFile(filename="tone.wav", file=io.BytesIO(wav_buf.getvalue()))
        res = asyncio.run(voice_module.analyze_voice(file=upload_valid, disease="parkinsons"))
        self.assertEqual(res["is_ml_model"], False)
        self.assertEqual(res["model_status"], "acoustic_dsp_baseline")
        self.assertIn("Digital Signal Processing", res["screening_type"])
        self.assertIn("disclaimer", res)
        self.assertIn("note", res)

    # =========================================================================
    # 4. MEDICINE & EXPANDED DATABASE TESTS
    # =========================================================================
    def test_09_medicine_database_loads_from_canonical_backend_database_dir(self):
        """Verify expanded medicine database is located in canonical backend/database."""
        db_path = os.path.join(BACKEND_DIR, "database", "medicine_expanded.db")
        self.assertTrue(os.path.exists(db_path), f"Expanded medicine DB missing from {db_path}")

    def test_10_medicine_search_and_suggest_returns_indexed_results(self):
        """Verify search and suggest endpoints query 195k records successfully."""
        results = medicine_module.search_medicines(query="Paracetamol")
        self.assertGreater(len(results), 0)
        self.assertTrue(any("paracetamol" in (m["product_name"] + " " + (m.get("salt_composition") or "")).lower() for m in results))

        suggests = medicine_module.suggest_medicines(symptoms="headache")
        self.assertGreater(len(suggests), 0)

    def test_11_unregistered_batch_verification_returns_not_found(self):
        """Verify batch verification never invents authentic status."""
        res = medicine_module.verify_by_code(code="FAKE_BATCH_999999", db=self.db)
        self.assertEqual(res["status"], "not_found")

    # =========================================================================
    # 5. REPORT ANALYZER PDF & VALIDATION TESTS
    # =========================================================================
    def test_12_report_analyzer_rejects_pdf_with_clear_400(self):
        """Verify uploading a PDF file is intercepted with HTTP 400 and clear message."""
        pdf_bytes = b"%PDF-1.4 Fake PDF Content for medical report"
        upload_pdf = UploadFile(filename="report.pdf", file=io.BytesIO(pdf_bytes))
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(report_module.analyze_report(file=upload_pdf))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Direct PDF document processing is not supported", ctx.exception.detail)

    def test_13_report_analyzer_rejects_empty_and_corrupt_files(self):
        """Verify empty or corrupt files return HTTP 400."""
        upload_empty = UploadFile(filename="empty.jpg", file=io.BytesIO(b""))
        with self.assertRaises(HTTPException) as ctx_empty:
            asyncio.run(report_module.analyze_report(file=upload_empty))
        self.assertEqual(ctx_empty.exception.status_code, 400)

        upload_corrupt = UploadFile(filename="corrupt.jpg", file=io.BytesIO(b"CorruptImageData123"))
        with self.assertRaises(HTTPException) as ctx_corrupt:
            asyncio.run(report_module.analyze_report(file=upload_corrupt))
        self.assertEqual(ctx_corrupt.exception.status_code, 400)

    # =========================================================================
    # 6. CHATBOT EMERGENCY TRIAGE & GROUNDING TESTS
    # =========================================================================
    def test_14_chatbot_emergency_triage_intercepts_crisis(self):
        """Verify chatbot emergency triage immediately provides helplines."""
        req_suicide = friend_chat_module.ChatRequest(message="I feel like ending my life")
        res_suicide = friend_chat_module.send_message(req_suicide)
        self.assertIn("1800-599-0019", res_suicide["reply"])
        self.assertIn("URGENT EMERGENCY ALERT", res_suicide["reply"])

        req_cardiac = friend_chat_module.ChatRequest(message="I am having severe chest pain and cannot breathe")
        res_cardiac = friend_chat_module.send_message(req_cardiac)
        self.assertIn("108 or 102", res_cardiac["reply"])

    # =========================================================================
    # 7. REGRESSION SAFETY & RBAC AUTHORIZATION TESTS
    # =========================================================================
    def test_15_admin_write_endpoints_deny_unauthenticated_and_ordinary_users(self):
        """Verify doctors, ambulance, and medicine register require admin privileges."""
        # Unauthenticated -> raises 401
        with self.assertRaises(HTTPException) as ctx_unauth:
            get_current_user(credentials=None, db=self.db)
        self.assertEqual(ctx_unauth.exception.status_code, 401)

        # Authenticated ordinary user -> raises 403
        with self.assertRaises(HTTPException) as ctx_user:
            get_admin_user(current_user=self.ordinary_user)
        self.assertEqual(ctx_user.exception.status_code, 403)

        # Authenticated admin -> succeeds
        admin_check = get_admin_user(current_user=self.admin_user)
        self.assertEqual(admin_check.role, "admin")

        # Admin can register doctor
        res_doc = doctors_module.register_doctor(
            name="Dr. Phase10 Specialist",
            specialization="Pulmonology",
            experience="15 years",
            contact="+91 99999 00000",
            location="AIIMS Trauma Center",
            db=self.db,
            admin_user=self.admin_user
        )
        self.assertTrue(res_doc["success"])

    # =========================================================================
    # 8. STATIC FRONTEND TRUTH-IN-ADVERTISING GUARDS
    # =========================================================================
    def test_16_frontend_voice_detection_truth_in_advertising(self):
        """Verify VoiceDetection.jsx contains no deceptive Neural Network marketing claims."""
        page_path = os.path.join(BACKEND_DIR, "..", "frontend", "src", "pages", "VoiceDetection.jsx")
        self.assertTrue(os.path.exists(page_path))
        with open(page_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("Processing Neural Network", content)
        self.assertNotIn("Neural Network Diagnostic Output", content)
        self.assertIn("Acoustic Biomarker", content)

    def test_17_frontend_report_analyzer_truth_in_advertising(self):
        """Verify ReportAnalyzer.jsx contains no fake 50k training claims and restricts formats."""
        page_path = os.path.join(BACKEND_DIR, "..", "frontend", "src", "pages", "ReportAnalyzer.jsx")
        self.assertTrue(os.path.exists(page_path))
        with open(page_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("Trained on 50,000+ laboratory diagnostic charts", content)
        self.assertNotIn("Supports JPG, PNG, PDF Scans", content)

    def test_18_frontend_disease_prediction_catalog_scope(self):
        """Verify DiseasePrediction.jsx documents 45-condition catalog scope and negation limits."""
        page_path = os.path.join(BACKEND_DIR, "..", "frontend", "src", "pages", "DiseasePrediction.jsx")
        self.assertTrue(os.path.exists(page_path))
        with open(page_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("45-condition", content)
        self.assertIn("Catalog Scope", content)


if __name__ == "__main__":
    unittest.main()
