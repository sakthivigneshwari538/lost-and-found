"""
Item and ItemImage models — core lost & found posts.
"""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean, Date, DateTime, Enum, ForeignKey, Index, String, Text,
)
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Column

from app.db.base import Base
from app.db.enums import ItemType, ItemCategory, ItemStatus


class Item(Base):
    __tablename__ = "items"

    # ── Primary key ──────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ── Foreign key ──────────────────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Item details ─────────────────────────────────────────────
    type: Mapped[ItemType] = mapped_column(
        Enum(ItemType, name="item_type", create_constraint=True),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[ItemCategory] = mapped_column(
        Enum(ItemCategory, name="item_category", create_constraint=True),
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # ── Found-item specific ──────────────────────────────────────
    kept_at: Mapped[str | None] = mapped_column(String(300), nullable=True)

    # ── Contact & status ─────────────────────────────────────────
    contact_info: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[ItemStatus] = mapped_column(
        Enum(ItemStatus, name="item_status", create_constraint=True),
        nullable=False,
        default=ItemStatus.OPEN,
        index=True,
    )

    # ── Full-text search vector ──────────────────────────────────
    # Maintained via a DB trigger (see migration) for smart-match queries.
    search_vector = Column(TSVECTOR, nullable=True)

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
    user = relationship("User", back_populates="items")
    images = relationship(
        "ItemImage", back_populates="item", cascade="all, delete-orphan", lazy="selectin",
    )
    claims = relationship(
        "Claim", back_populates="item", cascade="all, delete-orphan", lazy="selectin",
    )
    verification_questions = relationship(
        "VerificationQuestion",
        back_populates="item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # ── Table-level indexes ──────────────────────────────────────
    __table_args__ = (
        Index("ix_items_search_vector", search_vector, postgresql_using="gin"),
    )

    def __repr__(self) -> str:
        return f"<Item {self.title!r} ({self.type.value} / {self.status.value})>"


class ItemImage(Base):
    __tablename__ = "item_images"

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

    # ── Image data ───────────────────────────────────────────────
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Timestamps ───────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ────────────────────────────────────────────
    item = relationship("Item", back_populates="images")

    def __repr__(self) -> str:
        return f"<ItemImage item={self.item_id} primary={self.is_primary}>"
