import fitz  # PyMuPDF
from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import hashlib
from typing import List, Dict, Any
import io

class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
            length_function=len,
            is_separator_regex=False,
        )

    def extract_text_from_pdf(self, file_content: bytes) -> str:
        doc = fitz.open(stream=file_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    def extract_text_from_docx(self, file_content: bytes) -> str:
        doc = Document(io.BytesIO(file_content))
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text

    def get_content_hash(self, content: bytes) -> str:
        return hashlib.md5(content).hexdigest()

    def process_file(self, filename: str, content: bytes) -> List[Dict[str, Any]]:
        file_extension = filename.split(".")[-1].lower()
        
        if file_extension == "pdf":
            text = self.extract_text_from_pdf(content)
        elif file_extension == "docx":
            text = self.extract_text_from_docx(content)
        else:
            # Fallback to plain text
            text = content.decode("utf-8", errors="ignore")

        if not text.strip():
            return []

        chunks = self.text_splitter.split_text(text)
        content_hash = self.get_content_hash(content)

        processed_chunks = []
        for i, chunk in enumerate(chunks):
            processed_chunks.append({
                "content": chunk,
                "metadata": {
                    "filename": filename,
                    "file_type": file_extension,
                    "chunk_index": i,
                    "content_hash": content_hash
                }
            })
        
        return processed_chunks

document_processor = DocumentProcessor()
