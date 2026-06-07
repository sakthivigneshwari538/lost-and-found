"""
Database session and engine configuration.

Reads DATABASE_URL from environment variables (or .env file).
Provides:
  - `engine`       : the SQLAlchemy engine
  - `SessionLocal` : a session factory
  - `get_db()`     : FastAPI dependency that yields a session per request
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment / .env file."""
    DATABASE_URL: str = "postgresql+psycopg://postgres:root@localhost:5432/lost_and_found"

    # ── JWT Auth ─────────────────────────────────────────────────
    SECRET_KEY: str = "change-this-to-a-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Email (SMTP) ─────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "Lost and Found Portal"

    class Config:
        env_file = ".env"


settings = Settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # verify connections before use
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    """FastAPI dependency — yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
