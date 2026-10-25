import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from app.database import get_db, User
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

INSECURE_PLACEHOLDERS = {
    "medicure-ai-fallback-secret-key-2026",
    "your_secret_key_here",
    "your_jwt_secret_here",
    "your_secure_random_jwt_secret_key_here",
    "secret",
    "changeme",
    "default_secret",
    ""
}

security = HTTPBearer(auto_error=False)


def get_jwt_secret_key() -> str:
    """
    Retrieve and validate JWT secret key from environment variable.
    Fails safely and immediately if missing, too short (< 16 characters),
    or containing insecure default placeholders.
    """
    secret = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")
    if not secret:
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET_KEY environment variable is not set. "
            "Configure a secure random key in backend/.env before running the server."
        )
    clean_secret = secret.strip()
    if clean_secret.lower() in INSECURE_PLACEHOLDERS:
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: Insecure placeholder detected in JWT_SECRET_KEY. "
            "Please generate and configure a cryptographically secure random key."
        )
    if len(clean_secret) < 16:
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET_KEY is too short (minimum 16 characters required)."
        )
    return clean_secret


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    secret = get_jwt_secret_key()
    return jwt.encode(to_encode, secret, algorithm=ALGORITHM)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI reusable dependency: strictly validates JWT token signature, expiration,
    and user claims from the Authorization Bearer header.
    Returns the authenticated User record from the database.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer token in Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        secret = get_jwt_secret_key()
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims: subject ('sub') is missing.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature or malformed encoding.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account.",
        )
    return user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Authorize only server-verified administrative users.
    Fails closed with HTTP 403 Forbidden for any non-admin user or demo user.
    Never trusts client-supplied roles, request bodies, or headers.
    """
    if getattr(current_user, "role", "user") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required. Access denied."
        )
    return current_user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Optional authentication dependency; returns User if token valid, else None."""
    if not credentials or not credentials.credentials:
        return None
    try:
        secret = get_jwt_secret_key()
        payload = jwt.decode(credentials.credentials, secret, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email:
            return db.query(User).filter(User.email == email, User.is_active == True).first()
    except Exception:
        pass
    return None


@router.post("/register")
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role="user",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "email": new_user.email}


@router.post("/login")
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if not db_user or not verify_password(user_in.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": db_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": db_user.email,
            "full_name": db_user.full_name,
            "role": getattr(db_user, "role", "user")
        }
    }


@router.post("/demo")
def demo_login(db: Session = Depends(get_db)):
    """Provide authenticated access with legitimate JWT for frontend demo login."""
    demo_email = "demo.patient@medicure.org"
    db_user = db.query(User).filter(User.email == demo_email).first()
    if not db_user:
        db_user = User(
            email=demo_email,
            hashed_password=get_password_hash("DemoPatient2026!"),
            full_name="Demo Patient",
            role="user",
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    access_token = create_access_token(data={"sub": db_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": db_user.email,
            "full_name": db_user.full_name,
            "role": "user"
        }
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": getattr(current_user, "role", "user"),
        "is_active": current_user.is_active
    }
