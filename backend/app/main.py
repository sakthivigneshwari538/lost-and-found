"""
Lost and Found Portal — FastAPI Application Entry Point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth

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


# ── Health check ────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health_check():
    """Check if the API server is running."""
    return {"status": "ok", "message": "Lost and Found Portal is running"}
