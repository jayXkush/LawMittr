"""Embedding wrapper — supports Gemini or HuggingFace (free, local) embeddings."""

from langchain_core.embeddings import Embeddings
from config import settings


def get_embedding_model() -> Embeddings:
    """Return a configured embedding model based on the active provider.

    When using Groq as the LLM provider we can't use Gemini embeddings
    (to avoid Google rate-limit issues), so we fall back to a free local
    HuggingFace embedding model instead.
    """
    provider = (settings.MODEL_PROVIDER or "gemini").lower()

    if provider in ("groq", "grok"):
        # Free, runs locally — no API key needed
        from langchain_huggingface import HuggingFaceEmbeddings

        return HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )

    # Default: Gemini embeddings (requires GEMINI_API_KEY)
    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    return GoogleGenerativeAIEmbeddings(
        model=settings.GEMINI_EMBEDDING_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
    )
