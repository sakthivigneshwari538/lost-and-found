"""
Claim and ClaimAnswer models — claim verification workflow.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime, Enum, ForeignKey, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import ClaimStatus


class Claim(Base):
    __tablename__ = "claims"

    # ── Primary key ──────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ── Foreign keys ─────────────────────────────────────────────
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    claimant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Claim details ────────────────────────────────────────────
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    proof_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Status & review ──────────────────────────────────────────
    status: Mapped[ClaimStatus] = mapped_column(
        Enum(ClaimStatus, name="claim_status", create_constraint=True),
        nullable=False,
        default=ClaimStatus.PENDING,
        index=True,
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Timestamps ───────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ────────────────────────────────────────────
    item = relationship("Item", back_populates="claims")
    claimant = relationship(
        "User",
        back_populates="claims",
        foreign_keys=[claimant_id],
    )
    reviewer = relationship(
        "User",
        foreign_keys=[reviewed_by],
        lazy="selectin",
    )
    answers = relationship(
        "ClaimAnswer",
        back_populates="claim",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # ── Constraints ──────────────────────────────────────────────
    __table_args__ = (
        UniqueConstraint("item_id", "claimant_id", name="uq_claim_per_user_per_item"),
    )

    def __repr__(self) -> str:
        return f"<Claim item={self.item_id} by={self.claimant_id} ({self.status.value})>"


class ClaimAnswer(Base):
    __tablename__ = "claim_answers"

    # ── Primary key ──────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ── Foreign keys ─────────────────────────────────────────────
    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("claims.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("verification_questions.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Answer data ──────────────────────────────────────────────
    answer: Mapped[str] = mapped_column(String(500), nullable=False)

    # ── Relationships ────────────────────────────────────────────
    claim = relationship("Claim", back_populates="answers")
    question = relationship("VerificationQuestion", back_populates="claim_answers")

    # ── Constraints ──────────────────────────────────────────────
    __table_args__ = (
        UniqueConstraint("claim_id", "question_id", name="uq_one_answer_per_question"),
    )

    def __repr__(self) -> str:
        return f"<ClaimAnswer claim={self.claim_id} question={self.question_id}>"
