"""
Administrative User Provisioning Script
Medicure Phase 9C Security Management

Usage:
    python promote_admin.py <user_email>
"""
import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import SessionLocal, User


def promote_user_to_admin(email: str):
    email = email.strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"[ERROR] User with email '{email}' not found in database.")
            print("The user must register an account first before being promoted to admin.")
            sys.exit(1)

        user.role = "admin"
        db.commit()
        print(f"[SUCCESS] User '{email}' (ID: {user.id}) has been successfully granted 'admin' role.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <user_email>")
        sys.exit(1)
    promote_user_to_admin(sys.argv[1])
