"""
Pydantic schemas for Claims & Verification Questions.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Verification Questions ──────────────────────────────────────

class VerificationQuestionCreate(BaseModel):
    """Request body for creating a verification question."""
    question: str = Field(..., min_length=3, max_length=500)
    expected_answer: str | None = Field(None, max_length=500)


class VerificationQuestionResponse(BaseModel):
    """Public response — hides expected_answer from claimants."""
    id: UUID
    question: str
    display_order: int

    model_config = {"from_attributes": True}


class VerificationQuestionOwnerResponse(BaseModel):
    """Owner/admin response — includes expected_answer."""
    id: UUID
    question: str
    expected_answer: str
    display_order: int

    model_config = {"from_attributes": True}


# ── Claim Answers ───────────────────────────────────────────────

class ClaimAnswerCreate(BaseModel):
    """Answer to a verification question."""
    question_id: UUID
    answer: str = Field(..., min_length=1, max_length=500)


class ClaimAnswerResponse(BaseModel):
    """Response for a claim answer."""
    id: UUID
    question_id: UUID
    answer: str
    question: VerificationQuestionOwnerResponse | None = None

    model_config = {"from_attributes": True}


# ── Claims ──────────────────────────────────────────────────────

class ClaimCreate(BaseModel):
    """Request body for submitting a claim."""
    message: str | None = Field(None, max_length=2000)
    answers: list[ClaimAnswerCreate] = []


class ClaimReview(BaseModel):
    """Request body for reviewing (approve/reject) a claim."""
    status: str = Field(..., pattern="^(approved|rejected)$")
    review_note: str | None = Field(None, max_length=1000)


class ClaimantResponse(BaseModel):
    """Minimal claimant info."""
    id: UUID
    full_name: str
    email: str

    model_config = {"from_attributes": True}


class ClaimResponse(BaseModel):
    """Full claim response."""
    id: UUID
    item_id: UUID
    claimant: ClaimantResponse
    message: str | None
    status: str
    review_note: str | None
    created_at: datetime
    updated_at: datetime
    answers: list[ClaimAnswerResponse] = []

    model_config = {"from_attributes": True}
