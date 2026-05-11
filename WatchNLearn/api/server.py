from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api.routes import notes

app = FastAPI()

app.mount("/static", StaticFiles(directory="web"), name="static")

app.include_router(notes.router)

@app.get("/app")
def serve_app():
    return FileResponse("web/index.html")
