"""
VerificationQuestion model — questions set by the finder for claim verification.
"""

import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class VerificationQuestion(Base):
    __tablename__ = "verification_questions"

    # ── Primary key ──────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ── Foreign key ──────────────────────────────────────────────
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Question data ────────────────────────────────────────────
    question: Mapped[str] = mapped_column(String(500), nullable=False)
    expected_answer: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Private — only visible to the finder and admins",
    )
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    # ── Relationships ────────────────────────────────────────────
    item = relationship("Item", back_populates="verification_questions")
    claim_answers = relationship(
        "ClaimAnswer",
        back_populates="question",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<VerificationQuestion {self.question!r}>"
