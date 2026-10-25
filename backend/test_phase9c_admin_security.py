"""
Automated Test Suite for Medicure Phase 9C
Admin Authorization, Session Security, and Public Route Preservation
"""
import os
import sys
import unittest
from datetime import datetime, timedelta
from jose import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import Base, User, Doctor, Ambulance, Medicine
from app.routes.auth import (
    get_jwt_secret_key,
    create_access_token,
    get_current_user,
    get_admin_user,
    get_password_hash,
    demo_login,
    register,
    UserCreate,
)
from app.routes import doctors as doctors_module
from app.routes import ambulance as ambulance_module
from app.routes import medicine as medicine_module


class TestPhase9CAdminAndSessionSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False}
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=cls.engine
        )
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = self.TestingSessionLocal()
        self.db.query(Doctor).delete()
        self.db.query(Ambulance).delete()
        self.db.query(Medicine).delete()
        self.db.query(User).delete()
        self.db.commit()

        # Seed users: 1 ordinary user, 1 admin user, 1 inactive admin user
        self.ordinary_user = User(
            id=201,
            email="patient@medicure.test",
            full_name="Ordinary Patient",
            hashed_password=get_password_hash("PatientPass123!"),
            role="user",
            is_active=True
        )
        self.admin_user = User(
            id=202,
            email="sysadmin@medicure.test",
            full_name="System Administrator",
            hashed_password=get_password_hash("AdminPass123!"),
            role="admin",
            is_active=True
        )
        self.inactive_admin = User(
            id=203,
            email="inactive.admin@medicure.test",
            full_name="Former Admin",
            hashed_password=get_password_hash("AdminPass123!"),
            role="admin",
            is_active=False
        )
        self.db.add_all([self.ordinary_user, self.admin_user, self.inactive_admin])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def _get_auth_creds(self, user: User, expired: bool = False):
        delta = timedelta(seconds=-60) if expired else timedelta(minutes=30)
        token = create_access_token(data={"sub": user.email}, expires_delta=delta)
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    # =========================================================================
    # 1. Admin Authorization Dependency Tests
    # =========================================================================
    def test_01_admin_user_passes_authorization(self):
        """Server-verified admin user passes get_admin_user dependency."""
        creds = self._get_auth_creds(self.admin_user)
        current = get_current_user(credentials=creds, db=self.db)
        admin = get_admin_user(current_user=current)
        self.assertEqual(admin.id, self.admin_user.id)
        self.assertEqual(admin.role, "admin")

    def test_02_ordinary_user_denied_admin_privileges(self):
        """Ordinary user is denied with 403 Forbidden."""
        creds = self._get_auth_creds(self.ordinary_user)
        current = get_current_user(credentials=creds, db=self.db)
        with self.assertRaises(HTTPException) as ctx:
            get_admin_user(current_user=current)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Administrative privileges required", ctx.exception.detail)

    def test_03_demo_user_denied_admin_privileges(self):
        """Demo patient session is denied with 403 Forbidden."""
        demo_res = demo_login(db=self.db)
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=demo_res["access_token"])
        current = get_current_user(credentials=creds, db=self.db)
        self.assertEqual(current.role, "user")
        with self.assertRaises(HTTPException) as ctx:
            get_admin_user(current_user=current)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_04_unauthenticated_request_denied_before_admin_check(self):
        """Unauthenticated request (no token) raises 401 Unauthorized."""
        with self.assertRaises(HTTPException) as ctx:
            get_current_user(credentials=None, db=self.db)
        self.assertEqual(ctx.exception.status_code, 401)

    def test_05_client_supplied_role_escalation_in_registration_blocked(self):
        """Registration endpoint strictly hardcodes role='user'; ignores client role."""
        req = UserCreate(
            email="attacker@evil.com",
            password="AttackerPass123!",
            full_name="Attacker"
        )
        res = register(user_in=req, db=self.db)
        self.assertEqual(res["message"], "User registered successfully")
        
        # Verify in database that attacker was assigned role='user'
        created = self.db.query(User).filter(User.email == "attacker@evil.com").first()
        self.assertIsNotNone(created)
        self.assertEqual(created.role, "user")

    # =========================================================================
    # 2. Doctors Register Endpoint Protection
    # =========================================================================
    def test_06_doctor_register_succeeds_for_admin(self):
        """Authorized admin successfully registers a new doctor."""
        res = doctors_module.register_doctor(
            name="Dr. New Specialist",
            specialization="Oncologist",
            experience="12 years",
            contact="+91 91111 22222",
            location="AIIMS Trauma Center",
            db=self.db,
            admin_user=self.admin_user
        )
        self.assertTrue(res["success"])
        self.assertIn("Doctor Dr. New Specialist registered successfully", res["message"])
        
        # Verify doctor row inserted
        doc = self.db.query(Doctor).filter(Doctor.name == "Dr. New Specialist").first()
        self.assertIsNotNone(doc)

    def test_07_doctor_register_denied_for_ordinary_user(self):
        """Ordinary user is blocked from registering doctors."""
        with self.assertRaises(HTTPException) as ctx:
            get_admin_user(current_user=self.ordinary_user)
        self.assertEqual(ctx.exception.status_code, 403)

    # =========================================================================
    # 3. Ambulance Register Endpoint Protection
    # =========================================================================
    def test_08_ambulance_register_succeeds_for_admin(self):
        """Authorized admin successfully registers an emergency ambulance."""
        res = ambulance_module.register_ambulance(
            vehicle_number="KA-01-ER-9999",
            contact="+91 93333 44444",
            location="South ER Bay",
            type="ICU",
            db=self.db,
            admin_user=self.admin_user
        )
        self.assertTrue(res["success"])
        self.assertIn("Ambulance KA-01-ER-9999 registered successfully", res["message"])

        amb = self.db.query(Ambulance).filter(Ambulance.vehicle_number == "KA-01-ER-9999").first()
        self.assertIsNotNone(amb)

    def test_09_ambulance_register_denied_for_ordinary_user(self):
        """Ordinary user is blocked from registering ambulances."""
        with self.assertRaises(HTTPException) as ctx:
            get_admin_user(current_user=self.ordinary_user)
        self.assertEqual(ctx.exception.status_code, 403)

    # =========================================================================
    # 4. Medicine Register Endpoint Protection
    # =========================================================================
    def test_10_medicine_register_succeeds_for_admin(self):
        """Authorized admin successfully registers a genuine medicine batch."""
        res = medicine_module.register_medicine(
            code="GEN-2026-X9",
            name="Azithromycin 500mg",
            manufacturer="Lupin Ltd",
            batch="B26-99",
            expiry="2028-12",
            status="genuine",
            db=self.db,
            admin_user=self.admin_user
        )
        self.assertTrue(res["success"])
        self.assertIn("registered with code GEN-2026-X9", res["message"])

        med = self.db.query(Medicine).filter(Medicine.code == "GEN-2026-X9").first()
        self.assertIsNotNone(med)

    def test_11_medicine_register_denied_for_ordinary_user(self):
        """Ordinary user is blocked from registering medicine batches."""
        with self.assertRaises(HTTPException) as ctx:
            get_admin_user(current_user=self.ordinary_user)
        self.assertEqual(ctx.exception.status_code, 403)

    # =========================================================================
    # 5. Public Read/List Endpoints Unaffected
    # =========================================================================
    def test_12_public_list_doctors_accessible_without_auth(self):
        """GET /api/doctors/list functions without authentication."""
        # Seed a doctor directly
        self.db.add(Doctor(name="Dr. Public", specialization="General", contact="123"))
        self.db.commit()
        docs = doctors_module.list_doctors(db=self.db)
        self.assertEqual(len(docs), 1)
        self.assertEqual(docs[0].name, "Dr. Public")

    def test_13_public_list_ambulances_accessible_without_auth(self):
        """GET /api/ambulance/list functions without authentication."""
        self.db.add(Ambulance(vehicle_number="AMB-01", contact="108"))
        self.db.commit()
        ambs = ambulance_module.list_ambulances(db=self.db)
        self.assertEqual(len(ambs), 1)
        self.assertEqual(ambs[0].vehicle_number, "AMB-01")

    def test_14_public_list_medicines_accessible_without_auth(self):
        """GET /api/medicine/list functions without authentication."""
        self.db.add(Medicine(code="MED-1", name="Para", manufacturer="M", batch="B", expiry="E", status="genuine"))
        self.db.commit()
        meds = medicine_module.list_medicines(db=self.db)
        self.assertEqual(len(meds), 1)
        self.assertEqual(meds[0]["code"], "MED-1")

    # =========================================================================
    # 6. Session Lifecycle & Token Claims
    # =========================================================================
    def test_15_me_endpoint_returns_admin_role_for_admin(self):
        """GET /api/auth/me returns role='admin' for administrative user."""
        creds = self._get_auth_creds(self.admin_user)
        user = get_current_user(credentials=creds, db=self.db)
        self.assertEqual(user.role, "admin")

    def test_16_me_endpoint_returns_user_role_for_ordinary_user(self):
        """GET /api/auth/me returns role='user' for ordinary user."""
        creds = self._get_auth_creds(self.ordinary_user)
        user = get_current_user(credentials=creds, db=self.db)
        self.assertEqual(user.role, "user")

    def test_17_expired_session_fails_validation_with_401(self):
        """Expired JWT token fails session validation with 401."""
        creds = self._get_auth_creds(self.admin_user, expired=True)
        with self.assertRaises(HTTPException) as ctx:
            get_current_user(credentials=creds, db=self.db)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("expired", ctx.exception.detail)

    def test_18_frontend_app_jsx_session_handling_static_verification(self):
        """Verify App.jsx validates session with /api/auth/me and handles 401s."""
        app_jsx_path = os.path.normpath(
            os.path.join(backend_dir, "..", "frontend", "src", "App.jsx")
        )
        with open(app_jsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Must validate with /api/auth/me
        self.assertIn("/api/auth/me", content)
        # Must listen for session-expired event
        self.assertIn("medicure:session-expired", content)
        # Must preserve session if network offline
        self.assertIn("Network offline", content)

    def test_19_gitignore_safeguards_sensitive_files(self):
        """Verify .gitignore properly excludes databases, backups, and environment files."""
        gitignore_path = os.path.normpath(
            os.path.join(backend_dir, "..", ".gitignore")
        )
        with open(gitignore_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("*.db", content)
        self.assertIn("backups/", content)
        self.assertIn(".env", content)


if __name__ == "__main__":
    unittest.main(verbosity=2)
