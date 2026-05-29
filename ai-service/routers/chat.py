"""POST /chat — ask follow-up questions about an analyzed document."""

from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse
from services.rag_pipeline import rag_query

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest):
    """
    Ask a question about a previously analyzed document.

    Uses RAG: retrieves relevant chunks from ChromaDB, then generates
    an answer with Gemini, including source citations.
    """
    try:
        result = rag_query(request.document_id, request.question)

        return ChatResponse(
            answer=result["answer"],
            citations=[
                {
                    "text": c["text"],
                    "page": c.get("page"),
                    "chunk_id": c.get("chunk_id", ""),
                    "relevance_score": c.get("relevance_score", 0.0),
                }
                for c in result.get("citations", [])
            ],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat query failed: {str(e)}")
