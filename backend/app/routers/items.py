"""
Items router — CRUD for lost and found posts.
"""

import math
import os
import uuid as uuid_mod
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_current_user
from app.db.enums import ItemCategory, ItemStatus, ItemType
from app.db.session import get_db
from app.models.item import Item, ItemImage
from app.models.user import User
from app.schemas.item import (
    ItemCreate,
    ItemListResponse,
    ItemResponse,
    ItemUpdate,
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/api/items", tags=["Items"])


# ── POST /api/items ─────────────────────────────────────────────

@router.post(
    "",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a lost or found item post",
)
def create_item(
    data: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new lost or found item post."""
    # Validate enums
    try:
        item_type = ItemType(data.type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid type: {data.type}")

    try:
        item_category = ItemCategory(data.category)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid category: {data.category}")

    item = Item(
        user_id=current_user.id,
        type=item_type,
        title=data.title,
        category=item_category,
        description=data.description,
        location=data.location,
        event_date=data.event_date,
        kept_at=data.kept_at,
        contact_info=data.contact_info,
        status=ItemStatus.OPEN,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return item


# ── GET /api/items ──────────────────────────────────────────────

@router.get(
    "",
    response_model=ItemListResponse,
    summary="List items with filters and pagination",
)
def list_items(
    db: Session = Depends(get_db),
    type: str | None = Query(None, description="Filter: 'lost' or 'found'"),
    category: str | None = Query(None, description="Filter by category"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
    search: str | None = Query(None, description="Search in title and description"),
    user_id: str | None = Query(None, description="Filter by user ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
):
    """List items with optional filters and pagination. Public endpoint."""
    query = db.query(Item)

    # Filter by user
    if user_id:
        try:
            query = query.filter(Item.user_id == UUID(user_id))
        except ValueError:
            pass

    # Apply filters
    if type:
        try:
            query = query.filter(Item.type == ItemType(type))
        except ValueError:
            pass

    if category:
        try:
            query = query.filter(Item.category == ItemCategory(category))
        except ValueError:
            pass

    if status_filter:
        try:
            query = query.filter(Item.status == ItemStatus(status_filter))
        except ValueError:
            pass

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Item.title.ilike(search_term),
                Item.description.ilike(search_term),
                Item.location.ilike(search_term),
            )
        )

    # Order by newest first
    query = query.order_by(Item.created_at.desc())

    # Count total
    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1

    # Paginate
    items = query.offset((page - 1) * limit).limit(limit).all()

    return ItemListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


# ── GET /api/items/my-items ─────────────────────────────────────

@router.get(
    "/my-items",
    response_model=list[ItemResponse],
    summary="Get current user's items",
)
def get_my_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all items posted by the current user."""
    items = (
        db.query(Item)
        .filter(Item.user_id == current_user.id)
        .order_by(Item.created_at.desc())
        .all()
    )
    return items


# ── GET /api/items/{id} ─────────────────────────────────────────

@router.get(
    "/{item_id}",
    response_model=ItemResponse,
    summary="Get a single item by ID",
)
def get_item(item_id: UUID, db: Session = Depends(get_db)):
    """Get a single item by its ID. Public endpoint."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


# ── PUT /api/items/{id} ─────────────────────────────────────────

@router.put(
    "/{item_id}",
    response_model=ItemResponse,
    summary="Update an item (owner only)",
)
def update_item(
    item_id: UUID,
    data: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update an item. Only the owner can update their own items."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own items")

    # Update fields
    update_data = data.model_dump(exclude_unset=True)

    if "category" in update_data and update_data["category"] is not None:
        try:
            update_data["category"] = ItemCategory(update_data["category"])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category: {update_data['category']}")

    if "status" in update_data and update_data["status"] is not None:
        try:
            update_data["status"] = ItemStatus(update_data["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {update_data['status']}")

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item


# ── DELETE /api/items/{id} ──────────────────────────────────────

@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an item (owner or admin)",
)
def delete_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete an item. Owner or admin can delete."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    is_owner = item.user_id == current_user.id
    is_admin = current_user.role.value == "admin"

    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="You can only delete your own items")

    db.delete(item)
    db.commit()


# ── POST /api/items/{id}/images ────────────────────────────────

@router.post(
    "/{item_id}/images",
    response_model=ItemResponse,
    summary="Upload images for an item (owner only)",
)
async def upload_item_images(
    item_id: UUID,
    files: list[UploadFile] = File(..., description="Image files to upload"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload one or more images to an item. Only the owner can upload."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only upload images to your own items")

    # Validate files
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    for f in files:
        if f.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {f.content_type}. Allowed: JPEG, PNG, WebP, GIF",
            )

    is_first = len(item.images) == 0

    for i, f in enumerate(files):
        # Generate unique filename
        ext = os.path.splitext(f.filename or "image.jpg")[1] or ".jpg"
        filename = f"{uuid_mod.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        # Save file
        content = await f.read()
        with open(filepath, "wb") as out:
            out.write(content)

        # Create DB record
        img = ItemImage(
            item_id=item.id,
            image_url=f"/uploads/{filename}",
            is_primary=(is_first and i == 0),
        )
        db.add(img)

    db.commit()
    db.refresh(item)
    return item


# ── GET /api/items/{id}/matches ────────────────────────────────

@router.get(
    "/{item_id}/matches",
    response_model=list[ItemResponse],
    summary="Get smart match suggestions for an item",
)
def get_matches(
    item_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Find potential matches for an item.
    A lost item matches found items and vice versa.
    Matches by: same category, keyword similarity, date proximity, location.
    Returns top 6 matches scored by relevance.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Opposite type
    opposite_type = ItemType.FOUND if item.type == ItemType.LOST else ItemType.LOST

    # Base query: opposite type, open status only
    query = db.query(Item).filter(
        Item.type == opposite_type,
        Item.status == ItemStatus.OPEN,
        Item.id != item_id,
    )

    # Must be same category
    query = query.filter(Item.category == item.category)

    candidates = query.order_by(Item.created_at.desc()).limit(20).all()

    # Score each candidate
    scored = []
    title_words = set(item.title.lower().split())
    desc_words = set((item.description or "").lower().split())
    location_words = set(item.location.lower().split())

    for c in candidates:
        score = 10  # Base score for same category

        # Title keyword match
        c_title_words = set(c.title.lower().split())
        common_title = title_words & c_title_words
        score += len(common_title) * 5

        # Description keyword match
        c_desc_words = set((c.description or "").lower().split())
        common_desc = desc_words & c_desc_words - {"the", "a", "an", "is", "in", "at", "on", "of", "to", "and", "or", "it", "my", "i"}
        score += len(common_desc) * 2

        # Location match
        c_location_words = set(c.location.lower().split())
        common_loc = location_words & c_location_words - {"near", "the", "at", "in"}
        score += len(common_loc) * 8

        # Date proximity (closer = better, within 14 days)
        day_diff = abs((item.event_date - c.event_date).days)
        if day_diff <= 1:
            score += 15
        elif day_diff <= 3:
            score += 10
        elif day_diff <= 7:
            score += 5
        elif day_diff <= 14:
            score += 2

        scored.append((score, c))

    # Sort by score descending, return top 6
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:6]]
