from collections.abc import AsyncIterator
from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine
from sqlmodel import Session
import os

from app.core.config import settings


def get_engine():
    # Use environment variable if available, otherwise use settings
    database_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    print(f"🔍 Database URL: {database_url}")
    return create_engine(database_url, echo=settings.DEBUG)


engine = get_engine()


def get_db_session() -> Generator[Session, None, None]:
    try:
        with Session(engine) as session:
            yield session
    except Exception as e:
        print(f"❌ Database session error: {e}")
        raise


