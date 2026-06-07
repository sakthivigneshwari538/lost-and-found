"""
SQLAlchemy declarative base.

All models inherit from this Base so that Alembic can auto-detect them.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass
