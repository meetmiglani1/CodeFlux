from sqlmodel import SQLModel, create_engine

from app.config import settings

engine = create_engine(settings.database_url, echo=settings.debug)


def init_db():
    from app.models import db_models  # noqa: F401
    SQLModel.metadata.create_all(engine)
