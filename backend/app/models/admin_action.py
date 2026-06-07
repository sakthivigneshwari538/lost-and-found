"""
AdminAction model — audit log for admin operations.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import AdminActionType


class AdminAction(Base):
    __tablename__ = "admin_actions"

    # ── Primary key ──────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ── Foreign key ──────────────────────────────────────────────
    admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Action details ───────────────────────────────────────────
    action_type: Mapped[AdminActionType] = mapped_column(
        Enum(AdminActionType, name="admin_action_type", create_constraint=True),
        nullable=False,
    )
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        comment="ID of the affected item, claim, or user",
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Timestamps ───────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ────────────────────────────────────────────
    admin = relationship("User", back_populates="admin_actions")

    def __repr__(self) -> str:
        return f"<AdminAction {self.action_type.value} by={self.admin_id}>"
