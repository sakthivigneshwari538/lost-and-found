"""
Models package — import all models here so that Alembic and SQLAlchemy
can discover them via a single import.

Usage:
    from app.models import User, Item, Claim  # etc.
"""

from app.models.user import User
from app.models.item import Item, ItemImage
from app.models.verification import VerificationQuestion
from app.models.claim import Claim, ClaimAnswer
from app.models.notification import Notification
from app.models.admin_action import AdminAction
from app.models.pending_registration import PendingRegistration

__all__ = [
    "User",
    "Item",
    "ItemImage",
    "VerificationQuestion",
    "Claim",
    "ClaimAnswer",
    "Notification",
    "AdminAction",
    "PendingRegistration",
]
