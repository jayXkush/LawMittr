"""PDF text extraction using PyMuPDF with OCR fallback via pytesseract."""

import fitz  # PyMuPDF
from pathlib import Path
from typing import Optional

# pytesseract + PIL for OCR on image-only pages
try:
    import pytesseract
    from PIL import Image
    import io

    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


class PageText:
    """Extracted text for a single page."""

    def __init__(self, page_num: int, text: str, is_ocr: bool = False):
        self.page_num = page_num  # 1-indexed
        self.text = text
        self.is_ocr = is_ocr


def extract_text_from_pdf(file_path: Path) -> list[PageText]:
    """
    Extract text from a PDF file.

    Uses PyMuPDF for native text extraction. If a page yields little or no
    text (< 50 chars), falls back to OCR via pytesseract (if available).
    """
    doc = fitz.open(str(file_path))
    pages: list[PageText] = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text").strip()

        # OCR fallback for scanned / image-only pages
        if len(text) < 50 and OCR_AVAILABLE:
            text = _ocr_page(page)
            pages.append(PageText(page_num=page_num + 1, text=text, is_ocr=True))
        else:
            pages.append(PageText(page_num=page_num + 1, text=text, is_ocr=False))

    doc.close()
    return pages


def _ocr_page(page: fitz.Page) -> str:
    """Render page to image and run OCR."""
    pix = page.get_pixmap(dpi=300)
    img_bytes = pix.tobytes("png")
    image = Image.open(io.BytesIO(img_bytes))
    text: str = pytesseract.image_to_string(image)
    return text.strip()


def get_full_text(pages: list[PageText]) -> str:
    """Concatenate all page texts with page markers."""
    parts: list[str] = []
    for p in pages:
        if p.text:
            parts.append(f"[Page {p.page_num}]\n{p.text}")
    return "\n\n".join(parts)


def get_page_count(file_path: Path) -> int:
    """Quick page count without full extraction."""
    doc = fitz.open(str(file_path))
    count = len(doc)
    doc.close()
    return count
