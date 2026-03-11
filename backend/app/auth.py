"""JWT authentication & role-based access control for AnimalKart."""

from __future__ import annotations

import os
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from dotenv import load_dotenv

# ── JWT Configuration ────────────────────────────────────────────────

load_dotenv()

security = HTTPBearer()

SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "5d3f33ae6b57de10888d403c542e765f9f75be0ba7b794d6c1cdfd48529995f5")
ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))

REFRESH_SECRET_KEY: str = os.getenv(
    "JWT_REFRESH_SECRET_KEY",
    "61e2da009c32b97e66060fdcde74a63351845c6b2169b3ad472981df32e1ed1c",
)
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("JWT_REFRESH_EXPIRE_DAYS", "7"))


# ── Token helpers ────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """Create a signed JWT with embedded role, partner_id, and kyc_status."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh token for silent renewal."""
    to_encode = {
        "sub": data.get("sub"),
        "partner_id": data.get("partner_id"),
        "type": "refresh",
    }
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


def verify_refresh_token(token: str) -> dict:
    """Decode and verify a refresh token; returns the JWT payload dict."""
    try:
        payload: dict = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Decode and verify a Bearer token; returns the JWT payload dict."""
    token = credentials.credentials
    try:
        payload: dict = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── Role-based dependencies ──────────────────────────────────────────

def get_current_user(payload: dict = Depends(verify_token)) -> dict:
    """Return the current authenticated user's JWT payload."""
    return payload


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Only allow users whose token has role == 'admin'."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_investor(user: dict = Depends(get_current_user)) -> dict:
    """Only allow users whose token has role == 'investor' AND approved KYC."""
    if user.get("role") != "investor":
        raise HTTPException(status_code=403, detail="Investor access required")
    if user.get("kyc_status") != "approved":
        raise HTTPException(status_code=403, detail="KYC not approved")
    return user


def require_agent(user: dict = Depends(get_current_user)) -> dict:
    """Only allow users whose token has role == 'agent'."""
    if user.get("role") != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    return user
