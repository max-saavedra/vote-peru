"""Health check endpoint for load balancers and uptime monitors."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}
