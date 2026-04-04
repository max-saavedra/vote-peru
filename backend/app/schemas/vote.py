"""
Pydantic schemas for request validation and response serialization.
"""

import re
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, field_validator


# Valid options for demographic fields
AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
SEX_OPTIONS = ["masculino", "femenino", "otro", "prefiero_no_decir"]
NSE_OPTIONS = ["A", "B", "C", "D", "E"]
LOCATION_TYPES = ["peru", "extranjero"]
REGIONS = ["costa", "sierra", "selva"]


class VoteCreate(BaseModel):
    candidate_id: str
    recaptcha_token: Optional[str] = None

    # Optional demographics
    age_range: Optional[Literal["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]] = None
    sex: Optional[Literal["masculino", "femenino", "otro", "prefiero_no_decir"]] = None
    nse: Optional[Literal["A", "B", "C", "D", "E"]] = None
    city: Optional[str] = None
    region: Optional[Literal["costa", "sierra", "selva"]] = None
    location_type: Optional[Literal["peru", "extranjero"]] = None

    @field_validator("candidate_id")
    @classmethod
    def validate_candidate(cls, v: str) -> str:
        # Sanitize: only allow alphanumeric and hyphens
        if not re.match(r"^[a-z0-9\-]{2,80}$", v):
            raise ValueError("candidate_id invalido")
        return v

    @field_validator("city")
    @classmethod
    def sanitize_city(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # Strip to prevent injection, limit length
        return v.strip()[:100]


class VoteResponse(BaseModel):
    success: bool
    message: str
    already_voted: bool = False


class CandidateResult(BaseModel):
    candidate_id: str
    candidate_name: str
    party_name: str
    votes: int
    percentage: float


class AgeDistribution(BaseModel):
    age_range: str
    count: int
    percentage: float


class SexDistribution(BaseModel):
    sex: str
    count: int
    percentage: float


class NSEDistribution(BaseModel):
    nse: str
    count: int
    percentage: float


class CityDistribution(BaseModel):
    city: str
    count: int
    percentage: float


class LocationDistribution(BaseModel):
    location_type: str
    count: int
    percentage: float


class CandidateByDemographic(BaseModel):
    candidate_id: str
    candidate_name: str
    count: int
    percentage: float


class TrendPoint(BaseModel):
    hour: str
    candidate_id: str
    candidate_name: str
    cumulative_votes: int


class ResultsResponse(BaseModel):
    total_votes: int
    candidates: list[CandidateResult]
    by_age: list[AgeDistribution]
    by_sex: list[SexDistribution]
    by_nse: list[NSEDistribution]
    by_city: list[CityDistribution]
    by_location: list[LocationDistribution]
    trend_last_24h: list[TrendPoint]
