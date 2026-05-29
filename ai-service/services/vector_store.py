"""FAISS vector store management for document embeddings."""

import os
from pathlib import Path
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from config import settings
from services.chunker import TextChunk
from services.embeddings import get_embedding_model

def _get_index_path(document_id: str) -> Path:
    """Get the path to a document's FAISS index directory."""
    path = settings.chroma_path / f"faiss_{document_id}"
    path.mkdir(parents=True, exist_ok=True)
    return path

def store_chunks(document_id: str, chunks: list[TextChunk]) -> None:
    """Embed and store text chunks in a per-document FAISS index."""
    if not chunks:
        return

    embedding_model = get_embedding_model()
    
    docs = [
        Document(
            page_content=c.text,
            metadata={"chunk_id": c.chunk_id, "page": c.page, "index": c.index}
        )
        for c in chunks
    ]
    
    # Create the FAISS index
    vectorstore = FAISS.from_documents(docs, embedding_model)
    
    # Persist to disk
    index_path = _get_index_path(document_id)
    vectorstore.save_local(str(index_path))

def retrieve_relevant_chunks(
    document_id: str,
    query: str,
    top_k: int | None = None,
) -> list[dict]:
    """
    Retrieve the most relevant chunks for a query from a document's FAISS index.

    Returns list of dicts with keys: chunk_id, text, page, relevance_score.
    """
    if top_k is None:
        top_k = settings.RETRIEVAL_TOP_K

    index_path = _get_index_path(document_id)
    if not (index_path / "index.faiss").exists():
        return []

    embedding_model = get_embedding_model()
    
    # Allow dangerous deserialization because we created the files locally
    try:
        vectorstore = FAISS.load_local(
            str(index_path), 
            embedding_model, 
            allow_dangerous_deserialization=True
        )
    except Exception:
        return []

    # FAISS similarity search returns (document, score)
    # L2 distance is returned, we need to convert to a similarity score (0 to 1)
    results = vectorstore.similarity_search_with_score(query, k=top_k)

    chunks: list[dict] = []
    for doc, score in results:
        # FAISS score is usually L2 distance (lower is better).
        # We can normalize it somewhat, or just invert it roughly.
        # But for UI display, let's just make it a pseudo-percentage.
        # A simple normalization for L2: 1 / (1 + L2)
        relevance = round(1.0 / (1.0 + float(score)), 4)
        
        chunks.append({
            "chunk_id": doc.metadata.get("chunk_id", ""),
            "text": doc.page_content,
            "page": doc.metadata.get("page"),
            "relevance_score": relevance,
        })

    return chunks

def delete_collection(document_id: str) -> None:
    """Delete a document's vector store index from disk."""
    import shutil
    index_path = _get_index_path(document_id)
    if index_path.exists():
        try:
            shutil.rmtree(index_path)
        except Exception:
            pass
