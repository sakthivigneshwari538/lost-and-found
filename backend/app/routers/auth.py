"""
Authentication router — OTP verification before account creation.

Flow:
  1. POST /send-otp     → validates input, stores pending registration, sends OTP email
  2. POST /verify-otp   → verifies OTP, creates the actual user account, returns JWT
  3. POST /resend-otp   → resends a new OTP for a pending registration
  4. POST /login        → login with email + password (for existing users)
  5. GET  /me           → get current user profile (protected)
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.core.email import generate_otp, send_otp_email
from app.core.security import create_access_token, hash_password, verify_password
from app.db.enums import UserRole
from app.db.session import get_db
from app.models.pending_registration import PendingRegistration
from app.models.user import User
from app.schemas.auth import (
    MessageResponse,
    ResendOTP,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
    VerifyOTP,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

OTP_EXPIRY_MINUTES = 10


# ── POST /api/auth/send-otp ─────────────────────────────────────

@router.post(
    "/send-otp",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Send OTP to verify email before account creation",
)
def send_otp(data: UserRegister, db: Session = Depends(get_db)):
    """
    Step 1 of registration.

    - Validates that the email is not already registered.
    - Stores registration data temporarily in pending_registrations.
    - Sends a 6-digit OTP to the user's email.
    - No account is created yet.
    """
    # Check if email already has a real account
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Generate OTP
    otp_code = generate_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # Check if there's already a pending registration for this email
    pending = db.query(PendingRegistration).filter(
        PendingRegistration.email == data.email
    ).first()

    if pending:
        # Update existing pending registration
        pending.full_name = data.full_name
        pending.hashed_password = hash_password(data.password)
        pending.otp_code = otp_code
        pending.otp_expires_at = otp_expires
    else:
        # Create new pending registration
        pending = PendingRegistration(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
            otp_code=otp_code,
            otp_expires_at=otp_expires,
        )
        db.add(pending)

    db.commit()

    # Send OTP email
    email_sent = send_otp_email(
        to_email=data.email,
        otp_code=otp_code,
        user_name=data.full_name,
    )

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again.",
        )

    return MessageResponse(
        message=f"Verification code sent to {data.email}. Enter the code to complete registration."
    )


# ── POST /api/auth/verify-otp ───────────────────────────────────

@router.post(
    "/verify-otp",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Verify OTP and create account",
)
def verify_otp(data: VerifyOTP, db: Session = Depends(get_db)):
    """
    Step 2 of registration.

    - Verifies the OTP code.
    - If correct, creates the actual user account.
    - Deletes the pending registration.
    - Returns a JWT token so the user is logged in immediately.
    """
    # Find pending registration
    pending = db.query(PendingRegistration).filter(
        PendingRegistration.email == data.email
    ).first()

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending registration found. Please register first.",
        )

    # Check OTP code
    if pending.otp_code != data.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )

    # Check expiry
    if datetime.now(timezone.utc) > pending.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Use resend-otp to get a new code.",
        )

    # Double-check no account was created in the meantime
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # ── OTP is valid — create the real user account ──────────────
    user = User(
        email=pending.email,
        full_name=pending.full_name,
        hashed_password=pending.hashed_password,
        role=UserRole.STUDENT,
        is_verified=True,
    )
    db.add(user)

    # Delete the pending registration
    db.delete(pending)
    db.commit()
    db.refresh(user)

    # Return JWT so user is logged in immediately
    access_token = create_access_token(
        user_id=user.id,
        role=user.role.value,
    )

    return Token(access_token=access_token)


# ── POST /api/auth/resend-otp ───────────────────────────────────

@router.post(
    "/resend-otp",
    response_model=MessageResponse,
    summary="Resend OTP for pending registration",
)
def resend_otp(data: ResendOTP, db: Session = Depends(get_db)):
    """
    Resend a new OTP code for a pending registration.
    """
    pending = db.query(PendingRegistration).filter(
        PendingRegistration.email == data.email
    ).first()

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending registration found. Please register first.",
        )

    # Generate new OTP
    otp_code = generate_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)

    pending.otp_code = otp_code
    pending.otp_expires_at = otp_expires
    db.commit()

    # Send OTP email
    email_sent = send_otp_email(
        to_email=data.email,
        otp_code=otp_code,
        user_name=pending.full_name,
    )

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again.",
        )

    return MessageResponse(
        message=f"A new verification code has been sent to {data.email}"
    )


# ── POST /api/auth/login ────────────────────────────────────────

@router.post(
    "/login",
    response_model=Token,
    summary="Login and get a JWT token",
)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with email and password.
    Returns a JWT access token on success.
    """
    # Find user by email
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Create JWT token
    access_token = create_access_token(
        user_id=user.id,
        role=user.role.value,
    )

    return Token(access_token=access_token)


# ── GET /api/auth/me ────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Returns the profile of the currently authenticated user.
    Requires a valid JWT token in the Authorization header.
    """
    return current_user


# ── PUT /api/auth/me ───────────────────────────────────────────────

@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update the current user's profile."""
    if data.full_name is not None:
        current_user.full_name = data.full_name

    db.commit()
    db.refresh(current_user)
    return current_user
