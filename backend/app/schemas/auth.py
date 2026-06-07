"""
Pydantic schemas for authentication endpoints.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ── Request schemas ─────────────────────────────────────────────

class UserRegister(BaseModel):
    """Request body for POST /api/auth/register."""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=150)
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Request body for POST /api/auth/login."""
    email: EmailStr
    password: str


# ── Response schemas ────────────────────────────────────────────

class Token(BaseModel):
    """Response for POST /api/auth/login."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public user profile — never includes the password hash."""
    id: UUID
    email: str
    full_name: str
    role: str
    is_verified: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


class VerifyOTP(BaseModel):
    """Request body for POST /api/auth/verify-email."""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)


class ResendOTP(BaseModel):
    """Request body for POST /api/auth/resend-otp."""
    email: EmailStr
