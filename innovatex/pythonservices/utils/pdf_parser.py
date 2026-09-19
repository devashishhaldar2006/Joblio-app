import io
import re
import pdfplumber
from typing import Optional

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from uploaded PDF bytes using pdfplumber, cleans up excessive whitespace.
    """
    extracted_text = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)

    raw_text = "\n".join(extracted_text)
    # Clean up whitespace and special non-printable characters
    cleaned = re.sub(r'[ \t]+', ' ', raw_text)
    cleaned = re.sub(r'\n\s*\n', '\n\n', cleaned)
    return cleaned.strip()
