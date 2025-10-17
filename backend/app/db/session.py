from collections.abc import AsyncIterator
from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine
from sqlmodel import Session

from app.core.config import settings


def get_engine():
    return create_engine(settings.DATABASE_URL, echo=settings.DEBUG)


engine = get_engine()


def get_db_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


