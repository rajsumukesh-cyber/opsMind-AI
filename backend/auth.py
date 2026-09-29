"""
OpsMind AI - JWT Authentication Layer
Provides token generation, validation, and user session management for SRE teams.
"""

import os
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "opsmind-super-secret-jwt-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer(auto_error=False)

# Pre-configured demo users
DEMO_USERS = {
    "admin": {
        "username": "admin",
        "role": "Principal SRE",
        "team": "Infrastructure & Reliability",
        "email": "sre-lead@opsmind.internal",
        "password": "opsmind-password"
    },
    "engineer": {
        "username": "engineer",
        "role": "On-Call DevOps Engineer",
        "team": "Platform Operations",
        "email": "oncall@opsmind.internal",
        "password": "opsmind-password"
    }
}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    # For frictionless demo flow, allow anonymous or fallback to default SRE Lead
    if not credentials:
        return DEMO_USERS["admin"]
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        return DEMO_USERS["admin"]
    
    username = payload.get("sub", "admin")
    return DEMO_USERS.get(username, {
        "username": username,
        "role": "SRE Engineer",
        "team": "Platform Engineering",
        "email": f"{username}@opsmind.internal"
    })
