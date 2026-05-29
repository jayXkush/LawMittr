"""POST /analyze — upload PDF, extract, chunk, embed, and analyze."""

import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from config import settings
from models.schemas import AnalyzeResponse
from services.pdf_extractor import extract_text_from_pdf, get_full_text
from services.chunker import chunk_pages
from services.vector_store import store_chunks
from services.legal_analyzer import analyze_document

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF document for full legal analysis.

    Pipeline: extract text → chunk → embed → store in ChromaDB → run analysis.
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Read and validate size
    content = await file.read()
    if len(content) > settings.max_file_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB} MB",
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Save to disk temporarily
    document_id = str(uuid.uuid4())
    file_path = settings.upload_path / f"{document_id}.pdf"

    try:
        file_path.write_bytes(content)

        # 1. Extract text
        pages = extract_text_from_pdf(file_path)
        full_text = get_full_text(pages)

        if not full_text.strip():
            raise HTTPException(
                status_code=422,
                detail="Could not extract any text from the PDF. The document may be empty or use unsupported encoding.",
            )

        # 2. Chunk text
        chunks = chunk_pages(pages, document_id)

        # 3. Store embeddings in ChromaDB
        store_chunks(document_id, chunks)

        # 4. Run analysis chains
        analysis = await analyze_document(
            full_text,
            chunk_ids=[c.chunk_id for c in chunks],
        )

        return AnalyzeResponse(
            document_id=document_id,
            filename=file.filename or "document.pdf",
            page_count=len(pages),
            text_length=len(full_text),
            analysis=analysis,
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
