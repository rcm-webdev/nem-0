import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.routes import chat, memories, profile, recommendations, checkin

app = FastAPI(title="Nem-0 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(memories.router)
app.include_router(profile.router)
app.include_router(recommendations.router)
app.include_router(checkin.router)


@app.get("/healthz")
async def healthz():
    return {"message": "Nem-0 API is running"}


@app.get("/")
async def root():
    return {"message": "Nem-0 API is running"}


dist_dir = os.path.join(os.path.dirname(__file__), "..", "mini-boss", "dist")
if os.path.isdir(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")
