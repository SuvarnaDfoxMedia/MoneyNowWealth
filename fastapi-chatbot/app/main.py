from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import chat, ingest
from app.core.config import settings
import asyncio
from app.services.web_crawler import web_crawler
from app.services.vector_store import vector_store
from app.services.document_processor import document_processor
import hashlib
from loguru import logger
from contextlib import asynccontextmanager

async def run_auto_ingestion():
    """Background task to sync website content using the Triple-Layer Smart Crawl strategy."""
    if settings.USE_LOCAL_SITE:
        base_url = settings.LOCAL_SITE_URL
    else:
        base_url = settings.SITEMAP_URL.replace('/sitemap.xml', '') if settings.SITEMAP_URL else "https://www.moneynowwealth.com"
    
    logger.info(f"🚀 Starting automatic website sync for {base_url}...")
    try:
        # Use the Triple-Layer Discovery Service
        discovered_pages = await web_crawler.smart_crawl(base_url)
        
        if not discovered_pages:
            logger.warning("No pages discovered during auto-sync.")
            return

        updated_count = 0
        for page in discovered_pages:
            url = page['url']
            text_content = page['content']
            
            try:
                content_bytes = text_content.encode('utf-8')
                content_hash = hashlib.md5(content_bytes).hexdigest()
                
                if vector_store.has_content_changed(url, content_hash):
                    chunks = document_processor.process_file(url, content_bytes)
                    vector_store.upsert_document(url, chunks, content_hash)
                    updated_count += 1
            except Exception as e:
                logger.error(f"Failed to sync {url}: {str(e)}")
        
        logger.info(f"✅ Auto-sync complete. Updated {updated_count} pages.")
    except Exception as e:
        logger.error(f"Auto-ingestion failed: {str(e)}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run ingestion in the background so it doesn't block startup
    asyncio.create_task(run_auto_ingestion())
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(ingest.router, prefix=f"{settings.API_V1_STR}/ingest", tags=["ingest"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
