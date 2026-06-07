"""Quick verification script for the database schema setup."""

from alembic.config import Config

# 1. Verify Alembic config
c = Config("alembic.ini")
print("[OK] Alembic config loaded")
print(f"  Script location: {c.get_main_option('script_location')}")
print(f"  DB URL: {c.get_main_option('sqlalchemy.url')}")

# 2. Verify all models are registered in Base.metadata
from app.db.base import Base
from app.models import (
    User, Item, ItemImage, VerificationQuestion,
    Claim, ClaimAnswer, Notification, AdminAction,
)

tables = Base.metadata.tables
print(f"\n[OK] {len(tables)} tables registered:")
for name, t in tables.items():
    cols = [c.name for c in t.columns]
    print(f"  {name}: {cols}")

# 3. Verify relationships
print("\n[OK] Relationships check:")
print(f"  User.items          -> {User.items.property.mapper.class_.__tablename__}")
print(f"  User.claims         -> {User.claims.property.mapper.class_.__tablename__}")
print(f"  User.notifications  -> {User.notifications.property.mapper.class_.__tablename__}")
print(f"  User.admin_actions  -> {User.admin_actions.property.mapper.class_.__tablename__}")
print(f"  Item.images         -> {Item.images.property.mapper.class_.__tablename__}")
print(f"  Item.claims         -> {Item.claims.property.mapper.class_.__tablename__}")
print(f"  Item.ver_questions  -> {Item.verification_questions.property.mapper.class_.__tablename__}")
print(f"  Claim.answers       -> {Claim.answers.property.mapper.class_.__tablename__}")

# 4. Verify enums
from app.db.enums import (
    UserRole, ItemType, ItemCategory, ItemStatus, ClaimStatus, AdminActionType,
)
print("\n[OK] Enums:")
print(f"  UserRole:        {[e.value for e in UserRole]}")
print(f"  ItemType:        {[e.value for e in ItemType]}")
print(f"  ItemCategory:    {[e.value for e in ItemCategory]}")
print(f"  ItemStatus:      {[e.value for e in ItemStatus]}")
print(f"  ClaimStatus:     {[e.value for e in ClaimStatus]}")
print(f"  AdminActionType: {[e.value for e in AdminActionType]}")

print("\n[PASS] All checks passed! Database schema is ready.")

