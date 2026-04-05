"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe config management.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_ENV: str = "production"
    SECRET_KEY: str = "change-this-to-a-random-secret-in-production"

    # Database - SQLite for simplicity, easy to switch to Postgres
    DATABASE_URL: str = "sqlite+aiosqlite:///./voto_peru.db"

    # Redis for rate limiting and queuing (optional, falls back gracefully)
    REDIS_URL: str = "redis://localhost:6379"

    # CORS - frontend origins
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://vote-peru.vercel.app",
        # Add your Vercel/Netlify URL here
    ]

    # reCAPTCHA v3
    RECAPTCHA_SECRET_KEY: str = ""
    RECAPTCHA_ENABLED: bool = False  # set True in production with real key
    RECAPTCHA_MIN_SCORE: float = 0.5

    # Supabase Auth
    SUPABASE_JWT_SECRET: str = ""

    # Vote rate limiting per IP
    VOTES_PER_HOUR_PER_IP: int = 3  # prevent burst abuse before email check

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
