"""LawMittr AI Service — FastAPI entry point."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import HealthResponse
from routers.analyze import router as analyze_router
from routers.chat import router as chat_router

app = FastAPI(
    title="LawMittr AI Service",
    description="AI-powered legal document analysis using RAG architecture",
    version="1.0.0",
)

def _parse_origins(value: str | None) -> list[str]:
    if not value:
        return []
    return [o.strip() for o in value.split(",") if o.strip()]


# CORS — allow frontend + backend to call this service
allowed_origins = _parse_origins(os.getenv("ALLOWED_ORIGINS"))
if not allowed_origins:
    # Dev-safe fallback only
    allowed_origins = ["http://localhost:5000", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(analyze_router, tags=["Analysis"])
app.include_router(chat_router, tags=["Chat"])


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Service health check."""
    return HealthResponse(status="ok", service="ai-service")
