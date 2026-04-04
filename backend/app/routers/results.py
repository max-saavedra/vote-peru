"""
Results router: provides aggregated vote statistics for charts and rankings.
All queries are read-only and support the real-time dashboard.
"""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.candidates import CANDIDATES, CANDIDATES_BY_ID
from app.core.database import get_db
from app.models.vote import Vote
from app.schemas.vote import (
    AgeDistribution,
    CandidateByDemographic,
    CandidateResult,
    CityDistribution,
    LocationDistribution,
    NSEDistribution,
    ResultsResponse,
    SexDistribution,
    TrendPoint,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def safe_percentage(count: int, total: int) -> float:
    """Avoid division by zero when calculating percentages."""
    if total == 0:
        return 0.0
    return round((count / total) * 100, 2)


@router.get("/", response_model=ResultsResponse)
async def get_results(db: AsyncSession = Depends(get_db)):
    """
    Returns complete aggregated results for all dashboard charts.
    Includes candidate rankings, demographics, and trend data.
    """
    # Total vote count
    total_result = await db.execute(select(func.count(Vote.id)))
    total_votes: int = total_result.scalar_one() or 0

    # --- Candidate vote counts ---
    candidate_rows = await db.execute(
        select(Vote.candidate_id, func.count(Vote.id).label("cnt"))
        .group_by(Vote.candidate_id)
        .order_by(func.count(Vote.id).desc())
    )
    candidate_counts = {row.candidate_id: row.cnt for row in candidate_rows}

    candidates_list: list[CandidateResult] = []
    for c in CANDIDATES:
        count = candidate_counts.get(c["id"], 0)
        candidates_list.append(
            CandidateResult(
                candidate_id=c["id"],
                candidate_name=c["name"],
                party_name=c["party"],
                votes=count,
                percentage=safe_percentage(count, total_votes),
            )
        )
    # Sort by votes descending
    candidates_list.sort(key=lambda x: x.votes, reverse=True)

    # --- Age distribution ---
    age_rows = await db.execute(
        select(Vote.age_range, func.count(Vote.id).label("cnt"))
        .where(Vote.age_range.isnot(None))
        .group_by(Vote.age_range)
    )
    age_data = [
        AgeDistribution(age_range=r.age_range, count=r.cnt, percentage=safe_percentage(r.cnt, total_votes))
        for r in age_rows
    ]

    # --- Sex distribution ---
    sex_rows = await db.execute(
        select(Vote.sex, func.count(Vote.id).label("cnt"))
        .where(Vote.sex.isnot(None))
        .group_by(Vote.sex)
    )
    sex_data = [
        SexDistribution(sex=r.sex, count=r.cnt, percentage=safe_percentage(r.cnt, total_votes))
        for r in sex_rows
    ]

    # --- NSE distribution ---
    nse_rows = await db.execute(
        select(Vote.nse, func.count(Vote.id).label("cnt"))
        .where(Vote.nse.isnot(None))
        .group_by(Vote.nse)
        .order_by(Vote.nse)
    )
    nse_data = [
        NSEDistribution(nse=r.nse, count=r.cnt, percentage=safe_percentage(r.cnt, total_votes))
        for r in nse_rows
    ]

    # --- City distribution (top 15) ---
    city_rows = await db.execute(
        select(Vote.city, func.count(Vote.id).label("cnt"))
        .where(Vote.city.isnot(None))
        .group_by(Vote.city)
        .order_by(func.count(Vote.id).desc())
        .limit(15)
    )
    city_data = [
        CityDistribution(city=r.city, count=r.cnt, percentage=safe_percentage(r.cnt, total_votes))
        for r in city_rows
    ]

    # --- Location type distribution ---
    loc_rows = await db.execute(
        select(Vote.location_type, func.count(Vote.id).label("cnt"))
        .where(Vote.location_type.isnot(None))
        .group_by(Vote.location_type)
    )
    location_data = [
        LocationDistribution(
            location_type=r.location_type, count=r.cnt, percentage=safe_percentage(r.cnt, total_votes)
        )
        for r in loc_rows
    ]

    # --- Hourly trend for last 24 hours (top 5 candidates only) ---
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    top5_ids = [c.candidate_id for c in candidates_list[:5]]

    trend_rows = await db.execute(
        select(
            func.strftime("%Y-%m-%dT%H:00", Vote.created_at).label("hour"),
            Vote.candidate_id,
            func.count(Vote.id).label("cnt"),
        )
        .where(Vote.created_at >= cutoff, Vote.candidate_id.in_(top5_ids))
        .group_by("hour", Vote.candidate_id)
        .order_by("hour")
    )

    trend_data: list[TrendPoint] = []
    cumulative: dict[str, int] = {}
    for r in trend_rows:
        cid = r.candidate_id
        cumulative[cid] = cumulative.get(cid, 0) + r.cnt
        cname = CANDIDATES_BY_ID.get(cid, {}).get("name", cid)
        trend_data.append(
            TrendPoint(
                hour=r.hour,
                candidate_id=cid,
                candidate_name=cname,
                cumulative_votes=cumulative[cid],
            )
        )

    return ResultsResponse(
        total_votes=total_votes,
        candidates=candidates_list,
        by_age=age_data,
        by_sex=sex_data,
        by_nse=nse_data,
        by_city=city_data,
        by_location=location_data,
        trend_last_24h=trend_data,
    )


@router.get("/candidates")
async def get_candidates():
    """Return the static list of candidates for the frontend."""
    return CANDIDATES
