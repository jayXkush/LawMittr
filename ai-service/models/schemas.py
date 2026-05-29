"""Pydantic request/response schemas for the AI service."""

from pydantic import BaseModel, Field
from typing import Optional


# ── Analysis response models ──────────────────────────────────────

class RiskyClause(BaseModel):
    clause: str = Field(description="Quoted text of the risky clause")
    risk_level: str = Field(description="high | medium | low")
    explanation: str = Field(description="Why this clause is risky")
    page: Optional[int] = Field(default=None, description="Page number where clause appears")
    source_chunk_ids: list[str] = Field(default_factory=list)


class Obligation(BaseModel):
    party: str = Field(description="The party who bears the obligation")
    obligation: str = Field(description="Description of the obligation")
    source_text: str = Field(default="", description="Quoted source text")
    page: Optional[int] = Field(default=None, description="Page number")


class DocumentAnalysis(BaseModel):
    summary: str = Field(description="Concise legal summary")
    risky_clauses: list[RiskyClause] = Field(default_factory=list)
    obligations: list[Obligation] = Field(default_factory=list)
    simple_explanation: str = Field(description="Plain-language explanation")


class AnalyzeResponse(BaseModel):
    document_id: str
    filename: str
    page_count: int
    text_length: int
    analysis: DocumentAnalysis


# ── Chat models ───────────────────────────────────────────────────

class ChatRequest(BaseModel):
    document_id: str
    question: str = Field(min_length=1, max_length=2000)


class Citation(BaseModel):
    text: str = Field(description="Relevant source text from document")
    page: Optional[int] = Field(default=None)
    chunk_id: str = Field(default="")
    relevance_score: float = Field(default=0.0)


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation] = Field(default_factory=list)


# ── Health ────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "ai-service"
