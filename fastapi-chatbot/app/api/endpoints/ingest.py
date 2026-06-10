from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.schemas.ingest import IngestResponse, SitemapIngestResponse, WebsiteIngestResponse
from app.services.document_processor import document_processor
from app.services.vector_store import vector_store
from app.services.web_crawler import web_crawler
from loguru import logger
import hashlib
from typing import List

router = APIRouter()

@router.post("/upload", response_model=IngestResponse)
async def upload_company_document(file: UploadFile = File(...)):
    """
    Upload a PDF or DOCX document to Nova's knowledge base.
    """
    try:
        logger.info(f"Received file upload: {file.filename}")
        
        # 1. Read file content
        content = await file.read()
        content_hash = hashlib.md5(content).hexdigest()
        
        # 2. Check if content changed
        if not vector_store.has_content_changed(file.filename, content_hash):
            return IngestResponse(
                status="skipped",
                message=f"Document '{file.filename}' has not changed. Skipping re-processing.",
                filename=file.filename,
                total_chunks=0,
                collection_name="knowledge_chunks"
            )
        
        # 3. Process and Chunk
        chunks = document_processor.process_file(file.filename, content)
        
        if not chunks:
            raise HTTPException(status_code=400, detail="Document is empty or could not be parsed.")

        # 4. Store in Vector DB (with smart update)
        total_chunks = vector_store.upsert_document(file.filename, chunks, content_hash)
        
        return IngestResponse(
            status="success",
            message=f"Document '{file.filename}' successfully processed and stored.",
            filename=file.filename,
            total_chunks=total_chunks,
            collection_name="knowledge_chunks"
        )
    except Exception as e:
        logger.error(f"Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/url", response_model=IngestResponse)
async def ingest_url(url: str = Query(..., description="The website URL to ingest")):
    """
    Scrape and ingest a single web page into Nova's knowledge base.
    """
    try:
        logger.info(f"Ingesting URL: {url}")
        
        # 1. Fetch and clean content
        text_content = await web_crawler.fetch_page_content(url)
        if not text_content:
            raise HTTPException(status_code=400, detail=f"Could not extract content from {url}")
        
        content_bytes = text_content.encode('utf-8')
        content_hash = hashlib.md5(content_bytes).hexdigest()

        # 2. Check if changed
        if not vector_store.has_content_changed(url, content_hash):
             return IngestResponse(
                status="skipped",
                message=f"URL content has not changed. Skipping.",
                url=url,
                total_chunks=0,
                collection_name="knowledge_chunks"
            )

        # 3. Chunk the text
        # Reuse process_file but pass text content
        chunks = document_processor.process_file(url, content_bytes)
        
        # 4. Upsert
        total_chunks = vector_store.upsert_document(url, chunks, content_hash)

        return IngestResponse(
            status="success",
            message=f"Website content from '{url}' successfully indexed.",
            url=url,
            total_chunks=total_chunks,
            collection_name="knowledge_chunks"
        )
    except Exception as e:
        logger.error(f"URL Ingestion Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sitemap", response_model=SitemapIngestResponse)
async def ingest_sitemap(sitemap_url: str = Query(..., description="The sitemap.xml URL")):
    """
    Automated ingestion of all URLs found in a sitemap.
    """
    try:
        logger.info(f"Starting sitemap ingestion: {sitemap_url}")
        urls = await web_crawler.get_urls_from_sitemap(sitemap_url)
        
        if not urls:
             raise HTTPException(status_code=400, detail="No URLs found in sitemap.")

        updated_count = 0
        total_chunks_added = 0
        
        for url in urls:
            try:
                # Same logic as /url but in a loop
                text_content = await web_crawler.fetch_page_content(url)
                if not text_content: continue
                
                content_bytes = text_content.encode('utf-8')
                content_hash = hashlib.md5(content_bytes).hexdigest()
                
                if vector_store.has_content_changed(url, content_hash):
                    chunks = document_processor.process_file(url, content_bytes)
                    total_chunks_added += vector_store.upsert_document(url, chunks, content_hash)
                    updated_count += 1
            except Exception as url_err:
                logger.error(f"Failed to process URL {url} from sitemap: {str(url_err)}")
                continue

        return SitemapIngestResponse(
            status="success",
            total_urls=len(urls),
            updated_urls=updated_count,
            total_chunks=total_chunks_added
        )
    except Exception as e:
        logger.error(f"Sitemap Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/website", response_model=WebsiteIngestResponse)
async def ingest_entire_website(url: str = Query(..., description="The website home URL (e.g. https://moneynow.in)")):
    """
    Smart ingestion of an entire website. 
    Uses Firecrawl Discovery -> Sitemap Fallback -> Local Fallback.
    """
    try:
        logger.info(f"Starting smart website ingestion for: {url}")
        
        # 1. Use the Triple-Layer Discovery Service
        discovered_pages = await web_crawler.smart_crawl(url)
        
        if not discovered_pages:
            raise HTTPException(status_code=400, detail="Could not find any pages to ingest.")

        updated_count = 0
        total_chunks_added = 0
        
        for page in discovered_pages:
            page_url = page['url']
            text_content = page['content']
            
            try:
                content_bytes = text_content.encode('utf-8')
                content_hash = hashlib.md5(content_bytes).hexdigest()
                
                # Check if changed before processing
                if vector_store.has_content_changed(page_url, content_hash):
                    chunks = document_processor.process_file(page_url, content_bytes)
                    total_chunks_added += vector_store.upsert_document(page_url, chunks, content_hash)
                    updated_count += 1
                else:
                    logger.info(f"Page {page_url} unchanged. Skipping.")
            except Exception as page_err:
                logger.error(f"Failed to index page {page_url}: {str(page_err)}")
                continue

        return WebsiteIngestResponse(
            status="success",
            message=f"Website ingestion complete for {url}",
            pages_found=len(discovered_pages),
            pages_updated=updated_count,
            total_chunks=total_chunks_added
        )
    except Exception as e:
        logger.error(f"Website Ingestion Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
