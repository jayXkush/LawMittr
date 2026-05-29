"""RAG pipeline — retrieval + LLM generation for document Q&A."""

from config import settings
from services.model_client import get_model_client
from services.vector_store import retrieve_relevant_chunks
from prompts.legal_prompts import CHAT_PROMPT


def rag_query(document_id: str, question: str) -> dict:
    """
    Run a RAG query: retrieve relevant chunks, then generate an answer.

    Returns dict with 'answer' and 'citations'.
    """
    # 1. Retrieve relevant chunks
    chunks = retrieve_relevant_chunks(document_id, question)

    if not chunks:
        return {
            "answer": "I couldn't find relevant information in the document to answer your question. "
            "The document may not have been analyzed yet, or the question may be outside the document's scope.",
            "citations": [],
        }

    # 2. Build context from retrieved chunks
    context_parts: list[str] = []
    for chunk in chunks:
        page_ref = f"[Page {chunk['page']}] " if chunk.get("page") else ""
        context_parts.append(f"{page_ref}{chunk['text']}")

    context = "\n\n---\n\n".join(context_parts)

    # 3. Generate answer using the configured model provider (Gemini or Groq)
    client = get_model_client()
    prompt = CHAT_PROMPT.format(context=context, question=question)
    answer = client.invoke(prompt)

    # 4. Format citations
    citations = [
        {
            "text": chunk["text"][:300],  # Truncate for response size
            "page": chunk.get("page"),
            "chunk_id": chunk["chunk_id"],
            "relevance_score": chunk["relevance_score"],
        }
        for chunk in chunks[:4]  # Top 4 citations
    ]

    return {"answer": answer, "citations": citations}
