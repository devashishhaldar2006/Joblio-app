import io
import re
import zipfile
import xml.etree.ElementTree as ET
import pdfplumber
from typing import Optional, Tuple

# Clear, standard resume section headers (require isolated header lines or prominent section markers)
PRIMARY_RESUME_SECTIONS = [
    r'(?:work\s+)?experience',
    r'employment(?:\s+history)?',
    r'(?:technical\s+|core\s+)?skills(?:\s*&(?:\s*abilities)?)?',
    r'projects?',
    r'education(?:\s+and\s+qualifications)?',
    r'certifications?',
    r'internships?',
    r'(?:professional\s+)?summary',
    r'career\s+objective',
    r'achievements?'
]

# Words that strongly indicate non-resume administrative or institutional documents
NOTICE_BLACKLIST = [
    r'circular',
    r'holiday\s+notice',
    r'declared\s+holiday',
    r'office\s+order',
    r'academic\s+calendar',
    r'memo(?:randum)?',
    r'advisory',
    r'timetable',
    r'fee\s+structure',
    r're-?opening\s+date',
    r'institution\s+remains\s+closed',
    r'college\s+will\s+remain\s+closed',
    r'school\s+will\s+remain\s+closed',
    r'university\s+will\s+remain\s+closed',
    r'on\s+account\s+of\b',
    r'pursuant\s+to\b',
    r'gazetted\s+holiday'
]

def validate_resume_text(text: str) -> Tuple[bool, str]:
    """
    Strictly validates whether extracted text represents a legitimate developer resume / CV.
    Rejects circulars, notices, assignments, and non-candidate institutional documents.
    Returns (is_valid, reason).
    """
    if not text:
        return False, "Could not extract any readable text from the document. Please ensure your PDF or DOCX is not an unreadable scan or password-protected."

    clean_text = text.strip()
    lower_text = clean_text.lower()

    # 1. Immediate disqualification: Institutional notice / circular / memo patterns
    for blacklist_pattern in NOTICE_BLACKLIST:
        if re.search(r'\b' + blacklist_pattern, lower_text):
            return False, "The uploaded file appears to be an institutional notice, announcement, or administrative circular rather than a developer resume. Please upload your personal resume or CV."

    # 2. Minimum character length: Real developer resumes are typically 300+ characters
    if len(clean_text) < 220:
        return False, "The uploaded document contains too little text to be a resume. Please upload a full developer resume or CV."

    # 3. Check for Contact Information (Email or Phone number is standard on genuine resumes)
    has_email = bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b', clean_text))
    has_phone = bool(re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', clean_text))
    has_contact = has_email or has_phone

    # 4. Check for Distinct Structural Section Headers
    # Real resumes organize content with section headings like "Experience", "Skills", "Education", "Projects"
    section_matches = []
    for pattern in PRIMARY_RESUME_SECTIONS:
        # Match as an isolated line, start of line, or punctuated header (e.g. "Skills:", "## Projects", "EXPERIENCE")
        if re.search(rf'(?:^|\n|\r)\s*(?:[#\-*•]\s*)?{pattern}(?:\s*[:\-|–]|\s*$)', lower_text, re.MULTILINE):
            section_matches.append(pattern)
        elif re.search(rf'\b{pattern}\s*:', lower_text):
            section_matches.append(pattern)

    # Count distinct section header matches
    section_count = len(set(section_matches))

    # 5. Check for Technical Developer Keywords
    common_dev_terms = {
        'python', 'javascript', 'typescript', 'react', 'node', 'node.js', 'java', 'c++', 'c#',
        'sql', 'html', 'css', 'git', 'github', 'docker', 'aws', 'rest api', 'fastapi',
        'express', 'mongodb', 'postgresql', 'backend', 'frontend', 'full stack', 'developer', 'engineer'
    }
    dev_matches = [term for term in common_dev_terms if re.search(rf'\b{re.escape(term)}\b', lower_text)]

    # Evaluation Rules:
    # A. Solid resume: Has contact info + at least 2 distinct section headers (e.g. Skills + Education)
    if has_contact and section_count >= 2:
        return True, ""

    # B. Developer resume without explicit phone/email (or redacted): Has at least 2 section headers + at least 2 technical keywords
    if section_count >= 2 and len(dev_matches) >= 2:
        return True, ""

    # C. One section header (e.g., Skills or Projects) + contact info + multiple technical skills
    if section_count >= 1 and has_contact and len(dev_matches) >= 3:
        return True, ""

    # D. Strong technical density with contact info (e.g. one-page developer summary)
    if has_contact and len(dev_matches) >= 5:
        return True, ""

    return False, "The uploaded document does not appear to be a developer resume or CV. A valid resume must contain your contact details, skills, projects, and education."

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
