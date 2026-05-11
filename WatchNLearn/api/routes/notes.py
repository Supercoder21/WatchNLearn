from fastapi import APIRouter
from pydantic import BaseModel
from db.database import Session
from api.models import Note
from sqlalchemy import Column, String, Text, DateTime, Float, Integer
router = APIRouter()

class NoteIn(BaseModel):
    title: str
    video_url: str
    content: str = ""
    last_timestamp: float = 0.0

@router.get("/notes")
def list_notes():
    with Session() as s:
        notes = s.query(Note).all()
        return [{"id": n.id, "title": n.title, "video_url": n.video_url} for n in notes]

@router.post("/notes")
def create_note(data: NoteIn):
    with Session() as s:
        note = Note(**data.dict())
        s.add(note)
        s.commit()
        s.refresh(note)
        return {"id": note.id}

@router.get("/notes/{id}")
def get_note(id: str):
    with Session() as s:
        n = s.get(Note, id)
        return {"id": n.id, "title": n.title, "video_url": n.video_url, "content": n.content, "last_timestamp": n.last_timestamp or 0.0}

@router.put("/notes/{id}")
def update_note(id: str, data: NoteIn):
    with Session() as s:
        n = s.get(Note, id)
        n.title = data.title
        n.video_url = data.video_url
        n.content = data.content
        n.last_timestamp = data.last_timestamp
        s.commit()

@router.delete("/notes/{id}")
def delete_note(id: str):
    with Session() as s:
        s.delete(s.get(Note, id))
        s.commit()
