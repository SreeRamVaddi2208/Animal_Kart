"""JWT authentication & role-based access control for AnimalKart."""

from __future__ import annotations

import os
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

# ── JWT Configuration ────────────────────────────────────────────────

security = HTTPBearer()

SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "120"))


# ── Token helpers ────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """Create a signed JWT with embedded role, partner_id, and kyc_status."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


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
