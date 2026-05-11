from db.database import Base
import uuid, datetime
from sqlalchemy import Column, String, Text, DateTime, Float, Integer
class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    video_url = Column(String, nullable=False)
    content = Column(Text, default="")
    position = Column(Integer, default=0)
    last_timestamp = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
