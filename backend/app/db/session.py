from collections.abc import AsyncIterator
from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import Session
import os

from app.core.config import settings


def get_engine():
    # Use environment variable if available, otherwise use settings
    database_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    print(f"Database URL: {database_url}")
    return create_engine(database_url, echo=settings.DEBUG)


def get_async_engine():
    # Convert postgresql:// to postgresql+asyncpg:// for async support
    database_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql+psycopg2://"):
        database_url = database_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    
    print(f"Async Database URL: {database_url}")
    return create_async_engine(database_url, echo=settings.DEBUG)


engine = get_engine()
# async_engine = get_async_engine()  # Commented out since we're not using async sessions
# async_session_maker = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)


def get_db_session() -> Generator[Session, None, None]:
    try:
        with Session(engine) as session:
            yield session
    except Exception as e:
        print(f"Database session error: {e}")
        raise


async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        except Exception as e:
            print(f"Async database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


