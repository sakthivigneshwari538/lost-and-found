"""
PendingRegistration model — temporary storage for unverified signups.

The actual user account is only created after OTP verification.
This record is deleted once verification succeeds or expires.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PendingRegistration(Base):
    __tablename__ = "pending_registrations"

    # ── Primary key ──────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ── Registration data (held until OTP is verified) ───────────
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True,
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # ── OTP ──────────────────────────────────────────────────────
    otp_code: Mapped[str] = mapped_column(String(6), nullable=False)
    otp_expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
    )

    # ── Timestamps ───────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<PendingRegistration {self.email}>"
