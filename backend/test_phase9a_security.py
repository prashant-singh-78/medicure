"""
Automated Security, Data Isolation, and Honest Workflow Regression Test Suite
Phase 9A Remediation Verification
"""
import os
import sys
import unittest
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend directory is in path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import Base, User, History, Reminder, get_db
from app.routes.auth import (
    get_jwt_secret_key,
    create_access_token,
    get_current_user,
    get_password_hash,
    demo_login,
)
from app.routes import history as history_module
from app.routes import reminder as reminder_module


class TestPhase9ASecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Configure in-memory SQLite database
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False}
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=cls.engine
        )
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        # Clean tables between tests
        self.db = self.TestingSessionLocal()
        self.db.query(Reminder).delete()
        self.db.query(History).delete()
        self.db.query(User).delete()
        self.db.commit()

        # Seed two distinct test users
        self.user_a = User(
            id=101,
            email="usera@medicure.test",
            full_name="User Alpha",
            hashed_password=get_password_hash("SecurePassword123!"),
            is_active=True
        )
        self.user_b = User(
            id=102,
            email="userb@medicure.test",
            full_name="User Beta",
            hashed_password=get_password_hash("SecurePassword123!"),
            is_active=True
        )
        self.inactive_user = User(
            id=103,
            email="inactive@medicure.test",
            full_name="Inactive User",
            hashed_password=get_password_hash("SecurePassword123!"),
            is_active=False
        )
        self.db.add_all([self.user_a, self.user_b, self.inactive_user])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def _call_get_current_user(self, token: str):
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token) if token else None
        return get_current_user(credentials=creds, db=self.db)

    # =========================================================================
    # 1. JWT Secret Validation Tests
    # =========================================================================
    def test_01_jwt_secret_fails_on_missing_env(self):
        """Fails fast when JWT_SECRET_KEY is missing from environment."""
        orig_key = os.environ.pop("JWT_SECRET_KEY", None)
        orig_fallback = os.environ.pop("SECRET_KEY", None)
        try:
            with self.assertRaises(RuntimeError) as ctx:
                get_jwt_secret_key()
            self.assertIn("CRITICAL SECURITY CONFIGURATION ERROR", str(ctx.exception))
        finally:
            if orig_key:
                os.environ["JWT_SECRET_KEY"] = orig_key
            if orig_fallback:
                os.environ["SECRET_KEY"] = orig_fallback

    def test_02_jwt_secret_fails_on_weak_placeholder(self):
        """Fails fast when JWT_SECRET_KEY is a known weak placeholder."""
        orig_key = os.environ.get("JWT_SECRET_KEY")
        weak_keys = [
            "your_secure_random_jwt_secret_key_here",
            "secret",
            "changeme",
            "default_secret",
            "medicure-ai-fallback-secret-key-2026",
            "short"
        ]
        try:
            for weak in weak_keys:
                os.environ["JWT_SECRET_KEY"] = weak
                with self.assertRaises(RuntimeError) as ctx:
                    get_jwt_secret_key()
                self.assertIn("CRITICAL SECURITY CONFIGURATION ERROR", str(ctx.exception))
        finally:
            if orig_key:
                os.environ["JWT_SECRET_KEY"] = orig_key

    def test_03_jwt_secret_succeeds_on_strong_key(self):
        """Succeeds when JWT_SECRET_KEY is cryptographically strong (>=16 chars)."""
        orig_key = os.environ.get("JWT_SECRET_KEY")
        strong_key = "a_very_strong_production_ready_secret_key_2026_x9f7"
        try:
            os.environ["JWT_SECRET_KEY"] = strong_key
            retrieved = get_jwt_secret_key()
            self.assertEqual(retrieved, strong_key)
        finally:
            if orig_key:
                os.environ["JWT_SECRET_KEY"] = orig_key

    # =========================================================================
    # 2. Token Generation & Verification Tests
    # =========================================================================
    def test_04_token_generation_and_valid_retrieval(self):
        """Valid token successfully authenticates and returns User."""
        token = create_access_token(
            data={"sub": self.user_a.email, "user_id": self.user_a.id},
            expires_delta=timedelta(minutes=15)
        )
        current_user = self._call_get_current_user(token)
        self.assertEqual(current_user.id, self.user_a.id)
        self.assertEqual(current_user.email, self.user_a.email)

    def test_05_missing_token_rejected_with_401(self):
        """Missing token in credentials raises 401."""
        with self.assertRaises(HTTPException) as ctx:
            self._call_get_current_user(None)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("Authentication required", ctx.exception.detail)

    def test_06_token_signature_tampering_rejected(self):
        """Token signed with wrong key is rejected with 401."""
        fake_token = jwt.encode(
            {"sub": self.user_a.email, "exp": datetime.utcnow() + timedelta(hours=1)},
            "attacker-malicious-secret-key-12345678",
            algorithm="HS256"
        )
        with self.assertRaises(HTTPException) as ctx:
            self._call_get_current_user(fake_token)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("Invalid authentication token", ctx.exception.detail)

    def test_07_expired_token_rejected(self):
        """Expired token is rejected with 401."""
        expired_token = create_access_token(
            data={"sub": self.user_a.email},
            expires_delta=timedelta(seconds=-60)  # already expired
        )
        with self.assertRaises(HTTPException) as ctx:
            self._call_get_current_user(expired_token)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("expired", ctx.exception.detail)

    def test_08_token_missing_sub_rejected(self):
        """Token without 'sub' claim is rejected with 401."""
        secret = get_jwt_secret_key()
        invalid_token = jwt.encode(
            {"user_id": 101, "exp": datetime.utcnow() + timedelta(hours=1)},
            secret,
            algorithm="HS256"
        )
        with self.assertRaises(HTTPException) as ctx:
            self._call_get_current_user(invalid_token)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("missing", ctx.exception.detail)

    def test_09_inactive_user_rejected(self):
        """Inactive user is rejected with 403 Forbidden."""
        token = create_access_token(
            data={"sub": self.inactive_user.email},
            expires_delta=timedelta(minutes=15)
        )
        with self.assertRaises(HTTPException) as ctx:
            self._call_get_current_user(token)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Inactive user", ctx.exception.detail)

    def test_10_demo_login_generates_valid_token(self):
        """Demo login route produces valid token for demo user."""
        res = demo_login(db=self.db)
        self.assertIn("access_token", res)
        self.assertEqual(res["token_type"], "bearer")
        
        # Verify token resolves to demo user
        user = self._call_get_current_user(res["access_token"])
        self.assertEqual(user.email, "demo.patient@medicure.org")
        self.assertTrue(user.is_active)

    # =========================================================================
    # 3. History Data Isolation Tests
    # =========================================================================
    def test_11_history_creation_assigns_authenticated_user_id(self):
        """Creating history attaches caller's user_id."""
        item_a = history_module.HistoryLog(
            activity_type="diagnosis",
            title="User A Flu Check",
            details="Negative"
        )
        res = history_module.log_history(
            log=item_a,
            db=self.db,
            current_user=self.user_a
        )
        self.assertEqual(res["status"], "success")
        new_id = res["id"]

        # Inspect database row directly
        db_record = self.db.query(History).filter(History.id == new_id).first()
        self.assertEqual(db_record.user_id, self.user_a.id)

    def test_12_history_read_strictly_isolated_between_users(self):
        """User A sees only User A history; User B sees only User B history."""
        # Seed records for User A, User B, and legacy unassigned
        rec_a = History(user_id=self.user_a.id, activity_type="diagnosis", title="A Disease", details="Result A")
        rec_b = History(user_id=self.user_b.id, activity_type="skin", title="B Lesion", details="Result B")
        rec_legacy = History(user_id=None, activity_type="legacy", title="Legacy Check", details="Legacy")
        self.db.add_all([rec_a, rec_b, rec_legacy])
        self.db.commit()

        # Query as User A
        list_a = history_module.get_history(db=self.db, current_user=self.user_a)
        titles_a = [item.title for item in list_a]
        self.assertIn("A Disease", titles_a)
        self.assertNotIn("B Lesion", titles_a)
        self.assertNotIn("Legacy Check", titles_a)
        self.assertEqual(len(list_a), 1)

        # Query as User B
        list_b = history_module.get_history(db=self.db, current_user=self.user_b)
        titles_b = [item.title for item in list_b]
        self.assertIn("B Lesion", titles_b)
        self.assertNotIn("A Disease", titles_b)
        self.assertNotIn("Legacy Check", titles_b)
        self.assertEqual(len(list_b), 1)

    def test_13_history_clear_only_deletes_calling_user_records(self):
        """Clearing history as User A does not delete User B or legacy records."""
        rec_a1 = History(user_id=self.user_a.id, activity_type="diagnosis", title="A1", details="R1")
        rec_a2 = History(user_id=self.user_a.id, activity_type="diagnosis", title="A2", details="R2")
        rec_b = History(user_id=self.user_b.id, activity_type="diagnosis", title="B1", details="RB")
        rec_legacy = History(user_id=None, activity_type="diagnosis", title="L1", details="RL")
        self.db.add_all([rec_a1, rec_a2, rec_b, rec_legacy])
        self.db.commit()

        # User A clears history
        res = history_module.clear_history(db=self.db, current_user=self.user_a)
        self.assertEqual(res["status"], "success")

        # Verify User A records are gone
        remaining_a = self.db.query(History).filter(History.user_id == self.user_a.id).all()
        self.assertEqual(len(remaining_a), 0)

        # Verify User B and legacy records are intact
        remaining_b = self.db.query(History).filter(History.user_id == self.user_b.id).all()
        self.assertEqual(len(remaining_b), 1)
        self.assertEqual(remaining_b[0].title, "B1")

        remaining_legacy = self.db.query(History).filter(History.user_id == None).all()
        self.assertEqual(len(remaining_legacy), 1)
        self.assertEqual(remaining_legacy[0].title, "L1")

    # =========================================================================
    # 4. Reminder Data Isolation Tests
    # =========================================================================
    def test_14_reminder_creation_assigns_authenticated_user_id(self):
        """Creating reminder assigns caller's user_id."""
        rem_a = reminder_module.ReminderSchema(
            medicine_name="Amoxicillin",
            dosage="500mg",
            time="08:00 AM",
            days="Mon,Wed"
        )
        created_a = reminder_module.add_reminder(
            reminder=rem_a,
            db=self.db,
            current_user=self.user_a
        )
        self.assertEqual(created_a.user_id, self.user_a.id)

        db_rem = self.db.query(Reminder).filter(Reminder.id == created_a.id).first()
        self.assertEqual(db_rem.user_id, self.user_a.id)

    def test_15_reminder_read_strictly_isolated(self):
        """User A sees only User A reminders; User B sees only User B reminders."""
        rem_a = Reminder(user_id=self.user_a.id, medicine_name="Med A", dosage="10mg", time="08:00", days="Daily", is_active=True)
        rem_b = Reminder(user_id=self.user_b.id, medicine_name="Med B", dosage="20mg", time="20:00", days="Daily", is_active=True)
        rem_legacy = Reminder(user_id=None, medicine_name="Med Legacy", dosage="5mg", time="12:00", days="Daily", is_active=True)
        self.db.add_all([rem_a, rem_b, rem_legacy])
        self.db.commit()

        # Query User A
        list_a = reminder_module.get_reminders(db=self.db, current_user=self.user_a)
        names_a = [r.medicine_name for r in list_a]
        self.assertIn("Med A", names_a)
        self.assertNotIn("Med B", names_a)
        self.assertNotIn("Med Legacy", names_a)
        self.assertEqual(len(list_a), 1)

        # Query User B
        list_b = reminder_module.get_reminders(db=self.db, current_user=self.user_b)
        names_b = [r.medicine_name for r in list_b]
        self.assertIn("Med B", names_b)
        self.assertNotIn("Med A", names_b)
        self.assertNotIn("Med Legacy", names_b)
        self.assertEqual(len(list_b), 1)

    def test_16_reminder_cross_tenant_delete_prevented(self):
        """User B cannot delete User A's reminder (must return 404 and leave reminder intact)."""
        rem_a = Reminder(user_id=self.user_a.id, medicine_name="User A Sensitive Med", dosage="50mg", time="09:00", days="Daily", is_active=True)
        self.db.add(rem_a)
        self.db.commit()

        # User B attempts to delete User A's reminder
        with self.assertRaises(HTTPException) as ctx:
            reminder_module.delete_reminder(
                reminder_id=rem_a.id,
                db=self.db,
                current_user=self.user_b
            )
        self.assertEqual(ctx.exception.status_code, 404)

        # Ensure reminder is still in DB
        rem_check = self.db.query(Reminder).filter(Reminder.id == rem_a.id).first()
        self.assertIsNotNone(rem_check)

        # User A successfully deletes own reminder
        res = reminder_module.delete_reminder(
            reminder_id=rem_a.id,
            db=self.db,
            current_user=self.user_a
        )
        self.assertEqual(res["message"], "Reminder deleted successfully")
        self.assertEqual(res["id"], rem_a.id)
        rem_check_after = self.db.query(Reminder).filter(Reminder.id == rem_a.id).first()
        self.assertIsNone(rem_check_after)

    # =========================================================================
    # 5. Honest Workflow Verification (Frontend Static Analysis)
    # =========================================================================
    def test_17_frontend_emergency_sos_honest_workflow(self):
        """Verify EmergencySOS.jsx contains honest notices and no fake dispatch claims."""
        frontend_sos_path = os.path.normpath(
            os.path.join(backend_dir, "..", "frontend", "src", "pages", "EmergencySOS.jsx")
        )
        with open(frontend_sos_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Must NOT claim automated dispatch or SMS broadcast
        self.assertNotIn("EMERGENCY SOS BROADCAST SENT TO DISPATCHERS", content)
        self.assertNotIn("SMS sent to emergency contacts", content)

        # MUST contain honest safety notice and direct dialing tel links
        self.assertIn("CRITICAL LIFE SAFETY NOTICE", content)
        self.assertIn("tel:108", content)
        self.assertIn("tel:112", content)

    def test_18_frontend_doctors_honest_workflow(self):
        """Verify Doctors.jsx contains honest inquiry disclaimer and no fake SMS claims."""
        frontend_doctors_path = os.path.normpath(
            os.path.join(backend_dir, "..", "frontend", "src", "pages", "Doctors.jsx")
        )
        with open(frontend_doctors_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Must NOT claim confirmation SMS sent
        self.assertNotIn("Confirmation SMS sent!", content)

        # MUST contain demo inquiry notice
        self.assertIn("Demonstration Notice:", content)
        self.assertIn("Automated SMS is not active in demo mode", content)
        self.assertIn("tel:", content)

    def test_19_frontend_ambulance_honest_workflow(self):
        """Verify Ambulance.jsx contains direct calling notice and no fake dispatch claims."""
        frontend_amb_path = os.path.normpath(
            os.path.join(backend_dir, "..", "frontend", "src", "pages", "Ambulance.jsx")
        )
        with open(frontend_amb_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Must NOT claim ambulance dispatched
        self.assertNotIn("dispatched to your location", content)

        # MUST contain honest dispatch advice and direct call link
        self.assertIn("National Emergency Ambulance Hotline", content)
        self.assertIn("Automated GPS cellular dispatch is not supported", content)
        self.assertIn("tel:108", content)


if __name__ == "__main__":
    unittest.main(verbosity=2)
