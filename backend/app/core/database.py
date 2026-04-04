"""
Async database engine and session management using SQLAlchemy.
Supports SQLite for development and PostgreSQL for production.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# 1. Configuración base común
engine_kwargs = {
    "echo": settings.APP_ENV == "development",
}

# 2. Lógica condicional según el motor de base de datos
if "sqlite" in settings.DATABASE_URL:
    # Específico para SQLite
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Específico para PostgreSQL (u otros con pooling)
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

# 3. Crear el engine pasando solo los argumentos válidos
engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

# engine = create_async_engine(
#     settings.DATABASE_URL,
#     # SQLite needs check_same_thread=False; postgres ignores it
#     connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
#     echo=settings.APP_ENV == "development",
#     pool_size=10 if "postgresql" in settings.DATABASE_URL else 1,
#     max_overflow=20 if "postgresql" in settings.DATABASE_URL else 0,
# )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def create_tables():
    """Create all database tables if they don't exist."""
    # Import models so SQLAlchemy registers them before create_all
    from app.models import vote  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """FastAPI dependency that yields a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
