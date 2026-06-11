"""
Lost and Found Portal — FastAPI Application Entry Point.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import auth, items, claims

# ── Create app ──────────────────────────────────────────────────
app = FastAPI(
    title="Lost and Found Portal",
    description="A portal for college students to report and find lost items.",
    version="1.0.0",
)

# ── CORS middleware (allow all origins for development) ──────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include routers ─────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(claims.router)

# ── Serve uploaded files ────────────────────────────────────────
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ── Health check ────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health_check():
    """Check if the API server is running."""
    return {"status": "ok", "message": "Lost and Found Portal is running"}
