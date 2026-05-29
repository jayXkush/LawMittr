"""Text chunking for RAG pipeline using LangChain text splitters."""

from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import settings
from services.pdf_extractor import PageText


class TextChunk:
    """A chunk of text with metadata."""

    def __init__(self, chunk_id: str, text: str, page: int, index: int):
        self.chunk_id = chunk_id
        self.text = text
        self.page = page
        self.index = index


def chunk_pages(pages: list[PageText], document_id: str) -> list[TextChunk]:
    """
    Split extracted page texts into overlapping chunks for embedding.

    Each chunk retains its source page number for citation tracking.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    chunks: list[TextChunk] = []
    global_index = 0

    for page in pages:
        if not page.text.strip():
            continue

        splits = splitter.split_text(page.text)
        for split_text in splits:
            chunk_id = f"{document_id}_chunk_{global_index}"
            chunks.append(
                TextChunk(
                    chunk_id=chunk_id,
                    text=split_text,
                    page=page.page_num,
                    index=global_index,
                )
            )
            global_index += 1

    return chunks
