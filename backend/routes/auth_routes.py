"""
Auth API Router
Handles login, token issuance, and user session retrieval.
"""

from fastapi import APIRouter, HTTPException, Depends
from backend.models import UserLogin
from backend.auth import create_access_token, get_current_user, DEMO_USERS

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(creds: UserLogin):
    """Logs in an SRE engineer and returns a JWT bearer token."""
    user = DEMO_USERS.get(creds.username)
    # Allow demo login if user exists or default to demo user
    if user and creds.password == user.get("password", "opsmind-password"):
        token = create_access_token({"sub": creds.username, "role": user.get("role")})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "username": user["username"],
                "role": user["role"],
                "team": user["team"],
                "email": user["email"]
            }
        }
    
    # Allow frictionless demo login for any credentials if user types anything
    token = create_access_token({"sub": creds.username, "role": "Principal SRE"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": creds.username,
            "role": "Principal SRE",
            "team": "Reliability Engineering",
            "email": f"{creds.username}@opsmind.internal"
        }
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return current_user
