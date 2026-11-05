import io
import re
import zipfile
import xml.etree.ElementTree as ET
import pdfplumber
from typing import Optional, Tuple

# Common resume section anchor words (case-insensitive)
RESUME_ANCHORS = {
    'experience', 'work experience', 'employment', 'projects', 'skills', 
    'technical skills', 'education', 'qualifications', 'technologies', 
    'certifications', 'internships', 'career objective', 'summary', 
    'professional summary', 'achievements', 'coursework'
}

def validate_resume_text(text: str) -> Tuple[bool, str]:
    """
    Validates whether extracted text represents a plausible developer resume / CV.
    Returns (is_valid, reason).
    """
    if not text:
        return False, "Could not extract any readable text from the document. Please ensure your PDF or DOCX is not scanned or password-protected."

    # 1. Minimum character length: real resumes have at least 150 characters
    clean_text = text.strip()
    if len(clean_text) < 150:
        return False, "The uploaded document contains too little text to be a resume. Please upload a full developer resume or CV."

    # 2. Check for resume anchor keywords
    lower_text = clean_text.lower()
    matches = [anchor for anchor in RESUME_ANCHORS if re.search(r'\b' + re.escape(anchor) + r'\b', lower_text)]

    # If document has at least 1 standard resume section header, it's accepted
    if len(matches) >= 1:
        return True, ""

    # 3. If no standard headers, check if it contains common developer tech words or contact patterns (email/phone)
    has_contact = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', lower_text) or re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', lower_text))
    common_dev_terms = {'developer', 'engineer', 'software', 'programming', 'python', 'javascript', 'react', 'node', 'java', 'sql', 'github'}
    dev_matches = [term for term in common_dev_terms if re.search(r'\b' + re.escape(term) + r'\b', lower_text)]

    if has_contact and len(dev_matches) >= 2:
        return True, ""

    return False, "The uploaded file does not appear to be a resume or CV. Please upload a document containing your developer experience, skills, and education."

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
