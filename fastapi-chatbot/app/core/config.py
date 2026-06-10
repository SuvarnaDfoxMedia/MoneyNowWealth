from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "MoneyNowWealth AI Service"
    API_V1_STR: str = "/api/v1"
    
    # OpenAI Config
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1" 
    
    # CORS Config
    BACKEND_CORS_ORIGINS: List[str] = ["*"] # Adjust in production
    FIRECRAWL_API_KEY: str = ""

    # MongoDB Config
    MONGODB_ATLAS_STRING: str
    MONGO_DB_NAME: str = "moneynow_ai"
    
    # Sitemap for auto-ingestion
    SITEMAP_URL: str = "https://www.moneynowwealth.com/sitemap.xml" 
    LOCAL_SITEMAP_URL: str = "http://localhost:3000/sitemap.xml"
    LOCAL_SITE_URL: str = "http://localhost:3000"
    USE_LOCAL_SITE: bool = False # Toggle this in .env to scrape localhost
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
