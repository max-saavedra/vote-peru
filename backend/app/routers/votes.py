"""
Votes router: handles vote submission and duplicate checking.
Applies IP-based rate limiting as a first line of defense before DB checks.
"""

import hashlib
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.candidates import VALID_CANDIDATE_IDS
from app.core.config import settings
from app.core.database import get_db
from app.models.vote import Vote, hash_email
from app.schemas.vote import VoteCreate, VoteResponse

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()
security = HTTPBearer()

async def verify_recaptcha(token: str) -> bool:
    """Verify reCAPTCHA v3 token. Returns True if score is acceptable."""
    if not settings.RECAPTCHA_ENABLED or not settings.RECAPTCHA_SECRET_KEY:
        return True  # Skip verification if not configured

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={"secret": settings.RECAPTCHA_SECRET_KEY, "response": token},
            )
            result = resp.json()
            return result.get("success") and result.get("score", 0) >= settings.RECAPTCHA_MIN_SCORE
    except Exception as e:
        logger.warning("reCAPTCHA verification failed: %s", e)
        return False  # Fail closed: deny if we can't verify


def verify_supabase_jwt(token: str) -> str:
    """Verify Supabase JWT and return email."""
    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="Supabase no configurado")
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Token no contiene email")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Autenticación expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Autenticación inválida")


@router.post("/", response_model=VoteResponse, status_code=status.HTTP_200_OK)
@limiter.limit(f"{settings.VOTES_PER_HOUR_PER_IP}/hour")
async def submit_vote(
    request: Request,
    vote_data: VoteCreate,
    db: AsyncSession = Depends(get_db),
    auth: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Submit a vote. One vote per unique email address verified via Google Supabase.
    The raw email is never stored - only a SHA-256 hash.
    """
    # Verify JWT and extract email
    email = verify_supabase_jwt(auth.credentials)

    # Validate candidate exists
    if vote_data.candidate_id not in VALID_CANDIDATE_IDS:
        raise HTTPException(status_code=400, detail="Candidato no válido")

    # Verify reCAPTCHA if enabled
    if settings.RECAPTCHA_ENABLED:
        if not vote_data.recaptcha_token:
            raise HTTPException(status_code=400, detail="Token de seguridad requerido")
        if not await verify_recaptcha(vote_data.recaptcha_token):
            raise HTTPException(status_code=400, detail="Verificación de seguridad fallida")

    # Hash the email for deduplication - never store raw email
    email_hash = hash_email(email)

    # Check if this email already voted
    existing = await db.execute(select(Vote).where(Vote.email_hash == email_hash))
    existing_vote = existing.scalar_one_or_none()

    if existing_vote:
        return VoteResponse(
            success=False,
            message="Este correo electrónico ya ha registrado un voto.",
            already_voted=True,
        )

    # Create and persist the vote
    new_vote = Vote(
        email_hash=email_hash,
        candidate_id=vote_data.candidate_id,
        age_range=vote_data.age_range,
        sex=vote_data.sex,
        nse=vote_data.nse,
        city=vote_data.city,
        region=vote_data.region,
        location_type=vote_data.location_type,
    )

    db.add(new_vote)
    await db.commit()

    logger.info("New vote registered for candidate: %s", vote_data.candidate_id)
    return VoteResponse(success=True, message="¡Tu voto ha sido registrado exitosamente!")


@router.get("/check/{email_hash}", response_model=dict)
async def check_voted(email_hash: str, db: AsyncSession = Depends(get_db)):
    """
    Check if an email hash has already voted.
    The frontend sends the hash, not the raw email.
    """
    result = await db.execute(select(Vote.id).where(Vote.email_hash == email_hash))
    voted = result.scalar_one_or_none() is not None
    return {"voted": voted}
