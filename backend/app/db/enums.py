"""
PostgreSQL enum types for the Lost and Found portal.

These enums are used across multiple models and are defined here
to keep a single source of truth.
"""

import enum


class UserRole(str, enum.Enum):
    """Roles a user can have in the system."""
    STUDENT = "student"
    ADMIN = "admin"


class ItemType(str, enum.Enum):
    """Whether an item posting is for a lost or found item."""
    LOST = "lost"
    FOUND = "found"


class ItemCategory(str, enum.Enum):
    """Predefined categories for items."""
    ID_CARD = "id_card"
    PHONE = "phone"
    BAG = "bag"
    BOOKS = "books"
    KEYS = "keys"
    WALLET = "wallet"
    ELECTRONICS = "electronics"
    OTHERS = "others"


class ItemStatus(str, enum.Enum):
    """Lifecycle status of an item posting."""
    OPEN = "open"
    CLAIMED = "claimed"
    RETURNED = "returned"
    CLOSED = "closed"


class ClaimStatus(str, enum.Enum):
    """Status of a claim request."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AdminActionType(str, enum.Enum):
    """Types of actions an admin can perform."""
    DELETE_POST = "delete_post"
    APPROVE_CLAIM = "approve_claim"
    REJECT_CLAIM = "reject_claim"
    MARK_RETURNED = "mark_returned"
    BAN_USER = "ban_user"
