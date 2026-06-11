"""
Pydantic schemas for Item CRUD endpoints.
"""

from datetime import date, datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field


# ── Request schemas ─────────────────────────────────────────────

class ItemCreate(BaseModel):
    """Request body for POST /api/items."""
    type: str = Field(..., pattern="^(lost|found)$", description="'lost' or 'found'")
    title: str = Field(..., min_length=3, max_length=200)
    category: str = Field(..., description="Item category")
    description: str | None = Field(None, max_length=2000)
    location: str = Field(..., min_length=2, max_length=300)
    event_date: date
    kept_at: str | None = Field(None, max_length=300, description="Where the found item is kept")
    contact_info: str | None = Field(None, max_length=200)


class ItemUpdate(BaseModel):
    """Request body for PUT /api/items/{id}. All fields optional."""
    title: str | None = Field(None, min_length=3, max_length=200)
    category: str | None = None
    description: str | None = Field(None, max_length=2000)
    location: str | None = Field(None, min_length=2, max_length=300)
    event_date: date | None = None
    kept_at: str | None = Field(None, max_length=300)
    contact_info: str | None = Field(None, max_length=200)
    status: str | None = Field(None, pattern="^(open|claimed|returned|closed)$")


# ── Response schemas ────────────────────────────────────────────

class ImageResponse(BaseModel):
    """Image attached to an item."""
    id: UUID
    image_url: str
    is_primary: bool

    model_config = {"from_attributes": True}


class ItemOwnerResponse(BaseModel):
    """Minimal user info shown on item cards."""
    id: UUID
    full_name: str
    email: str

    model_config = {"from_attributes": True}


class ItemResponse(BaseModel):
    """Full item response."""
    id: UUID
    type: str
    title: str
    category: str
    description: str | None
    location: str
    event_date: date
    kept_at: str | None
    contact_info: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    user: ItemOwnerResponse
    images: list[ImageResponse] = []

    model_config = {"from_attributes": True}


class ItemListResponse(BaseModel):
    """Paginated list of items."""
    items: list[ItemResponse]
    total: int
    page: int
    limit: int
    pages: int
