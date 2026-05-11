from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


engine = create_engine("sqlite:///watchnlearn.db")
Session = sessionmaker(bind=engine)
Base = declarative_base()

from api.models import Note
Base.metadata.create_all(engine)
