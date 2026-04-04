"""
SQLAlchemy ORM model for a single vote submission.
Stores the candidate choice and demographic data for analytics.
"""

import hashlib
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def hash_email(email: str) -> str:
    """One-way hash of email for deduplication without storing PII."""
    return hashlib.sha256(email.strip().lower().encode()).hexdigest()


class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # We store only the hash of the email, never the raw address
    email_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)

    # Candidate identifier (slug key)
    candidate_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Demographic fields - all optional so voters can skip
    age_range: Mapped[str | None] = mapped_column(String(20))      # "18-24", "25-34", etc.
    sex: Mapped[str | None] = mapped_column(String(20))            # "masculino", "femenino", "otro"
    nse: Mapped[str | None] = mapped_column(String(10))            # "A", "B", "C", "D", "E"
    city: Mapped[str | None] = mapped_column(String(100))          # city name
    region: Mapped[str | None] = mapped_column(String(50))         # "costa", "sierra", "selva"
    location_type: Mapped[str | None] = mapped_column(String(20))  # "peru", "extranjero"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
