from pydantic import BaseModel
from typing import List, Optional

class IngestResponse(BaseModel):
    status: str
    message: str
    filename: Optional[str] = None
    url: Optional[str] = None
    total_chunks: int
    collection_name: str

class SitemapIngestResponse(BaseModel):
    status: str
    total_urls: int
    updated_urls: int
    total_chunks: int

class WebsiteIngestResponse(BaseModel):
    status: str
    message: str
    pages_found: int
    pages_updated: int
    total_chunks: int

class DocumentMetadata(BaseModel):
    source: str
    filename: Optional[str] = None
    url: Optional[str] = None
    file_type: str
    chunk_index: int
    content_hash: str
