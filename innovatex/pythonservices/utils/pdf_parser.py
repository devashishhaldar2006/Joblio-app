import io
import re
import zipfile
import xml.etree.ElementTree as ET
import pdfplumber
from typing import Optional

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts readable text from uploaded resume bytes.
    Supports PDF (via pdfplumber), DOCX (via internal XML parsing), and Plain Text/Markdown.
    """
    extracted_text = []

    # 1. Try PDF parsing if header matches PDF signature or default
    if file_bytes.startswith(b'%PDF'):
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text.append(text)
            if extracted_text:
                raw_text = "\n".join(extracted_text)
                cleaned = re.sub(r'[ \t]+', ' ', raw_text)
                return re.sub(r'\n\s*\n', '\n\n', cleaned).strip()
        except Exception as e:
            print(f"[DocumentParser] PDF parsing warning: {e}")

    # 2. Try DOCX parsing (PK zip archive signature)
    if file_bytes.startswith(b'PK'):
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                if 'word/document.xml' in z.namelist():
                    xml_content = z.read('word/document.xml')
                    tree = ET.fromstring(xml_content)
                    # Extract all text elements (w:t)
                    namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                    texts = [node.text for node in tree.iterfind('.//w:t', namespaces) if node.text]
                    if texts:
                        raw_text = " ".join(texts)
                        cleaned = re.sub(r'[ \t]+', ' ', raw_text)
                        return re.sub(r'\n\s*\n', '\n\n', cleaned).strip()
        except Exception as e:
            print(f"[DocumentParser] DOCX parsing warning: {e}")

    # 3. Fallback: try plain text / markdown utf-8 decoding
    try:
        decoded = file_bytes.decode('utf-8', errors='ignore').strip()
        if len(decoded) > 20:
            cleaned = re.sub(r'[ \t]+', ' ', decoded)
            return re.sub(r'\n\s*\n', '\n\n', cleaned).strip()
    except Exception:
        pass

    # 4. Final attempt with pdfplumber if signature was ambiguous
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text.append(text)
        if extracted_text:
            raw_text = "\n".join(extracted_text)
            cleaned = re.sub(r'[ \t]+', ' ', raw_text)
            return re.sub(r'\n\s*\n', '\n\n', cleaned).strip()
    except Exception:
        pass

    return ""

