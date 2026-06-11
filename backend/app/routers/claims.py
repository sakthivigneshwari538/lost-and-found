"""
Claims & Verification Questions router.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.enums import ClaimStatus, ItemStatus
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.item import Item
from app.models.claim import Claim, ClaimAnswer
from app.models.verification import VerificationQuestion
from app.schemas.claim import (
    VerificationQuestionCreate,
    VerificationQuestionResponse,
    VerificationQuestionOwnerResponse,
    ClaimCreate,
    ClaimResponse,
    ClaimReview,
)

router = APIRouter(prefix="/api/items", tags=["Claims"])


# ── Helpers ─────────────────────────────────────────────────────

def _get_item_or_404(db: Session, item_id: UUID) -> Item:
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


# ── Verification Questions ──────────────────────────────────────

@router.post(
    "/{item_id}/questions",
    response_model=list[VerificationQuestionOwnerResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add verification questions to an item",
)
def add_questions(
    item_id: UUID,
    questions: list[VerificationQuestionCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add verification questions. Only the item owner can do this."""
    item = _get_item_or_404(db, item_id)

    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the item owner can add questions")

    if len(questions) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 questions allowed")

    # Remove existing questions and replace
    db.query(VerificationQuestion).filter(VerificationQuestion.item_id == item_id).delete()

    new_questions = []
    for i, q in enumerate(questions):
        vq = VerificationQuestion(
            item_id=item_id,
            question=q.question,
            expected_answer=q.expected_answer,
            display_order=i,
        )
        db.add(vq)
        new_questions.append(vq)

    db.commit()
    for q in new_questions:
        db.refresh(q)

    return new_questions


@router.get(
    "/{item_id}/questions",
    response_model=list[VerificationQuestionResponse],
    summary="Get verification questions for an item (public view)",
)
def get_questions(
    item_id: UUID,
    db: Session = Depends(get_db),
):
    """Get verification questions. Hides expected answers."""
    _get_item_or_404(db, item_id)

    questions = (
        db.query(VerificationQuestion)
        .filter(VerificationQuestion.item_id == item_id)
        .order_by(VerificationQuestion.display_order)
        .all()
    )
    return questions


# ── Claims ──────────────────────────────────────────────────────

@router.post(
    "/{item_id}/claims",
    response_model=ClaimResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a claim on an item",
)
def submit_claim(
    item_id: UUID,
    payload: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit a claim. Cannot claim your own item. One claim per user per item."""
    item = _get_item_or_404(db, item_id)

    if item.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot claim your own item")

    if item.status != ItemStatus.OPEN:
        raise HTTPException(status_code=400, detail="This item is no longer open for claims")

    # Check if user already claimed this item
    existing = (
        db.query(Claim)
        .filter(Claim.item_id == item_id, Claim.claimant_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already submitted a claim for this item")

    # Create claim
    claim = Claim(
        item_id=item_id,
        claimant_id=current_user.id,
        message=payload.message,
    )
    db.add(claim)
    db.flush()

    # Create answers
    for ans in payload.answers:
        # Verify question belongs to this item
        question = (
            db.query(VerificationQuestion)
            .filter(
                VerificationQuestion.id == ans.question_id,
                VerificationQuestion.item_id == item_id,
            )
            .first()
        )
        if not question:
            raise HTTPException(status_code=400, detail=f"Question {ans.question_id} not found for this item")

        claim_answer = ClaimAnswer(
            claim_id=claim.id,
            question_id=ans.question_id,
            answer=ans.answer,
        )
        db.add(claim_answer)

    db.commit()
    db.refresh(claim)
    return claim


@router.get(
    "/{item_id}/claims",
    response_model=list[ClaimResponse],
    summary="List claims on an item (owner only)",
)
def list_claims(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all claims on an item. Only the item owner can see them."""
    item = _get_item_or_404(db, item_id)

    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the item owner can view claims")

    claims = (
        db.query(Claim)
        .filter(Claim.item_id == item_id)
        .order_by(Claim.created_at.desc())
        .all()
    )
    return claims


@router.put(
    "/{item_id}/claims/{claim_id}",
    response_model=ClaimResponse,
    summary="Approve or reject a claim",
)
def review_claim(
    item_id: UUID,
    claim_id: UUID,
    payload: ClaimReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Approve or reject a claim. Only the item owner can do this."""
    item = _get_item_or_404(db, item_id)

    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the item owner can review claims")

    claim = db.query(Claim).filter(Claim.id == claim_id, Claim.item_id == item_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status != ClaimStatus.PENDING:
        raise HTTPException(status_code=400, detail="This claim has already been reviewed")

    # Update claim
    claim.status = ClaimStatus(payload.status)
    claim.reviewed_by = current_user.id
    claim.review_note = payload.review_note

    # If approved, update item status and reject other pending claims
    if payload.status == "approved":
        item.status = ItemStatus.CLAIMED

        other_claims = (
            db.query(Claim)
            .filter(
                Claim.item_id == item_id,
                Claim.id != claim_id,
                Claim.status == ClaimStatus.PENDING,
            )
            .all()
        )
        for other in other_claims:
            other.status = ClaimStatus.REJECTED
            other.reviewed_by = current_user.id
            other.review_note = "Another claim was approved"

    db.commit()
    db.refresh(claim)
    return claim
