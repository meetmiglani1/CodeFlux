from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, chat, products

app = FastAPI(
    title=settings.app_name,
    description="OCR + PostgreSQL + AI based product label compliance checker",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"message": settings.app_name, "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
