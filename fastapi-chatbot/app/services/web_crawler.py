import httpx
from bs4 import BeautifulSoup
from loguru import logger
from typing import List, Optional, Dict, Any
import re
import xml.etree.ElementTree as ET
from firecrawl import FirecrawlApp
from app.core.config import settings
import asyncio

class WebCrawlerService:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        self.firecrawl = None
        if settings.FIRECRAWL_API_KEY:
            self.firecrawl = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)

    async def fetch_page_content(self, url: str) -> Optional[str]:
        """
        Fetches page content for a single URL. 
        Tries Firecrawl first, falls back to local BeautifulSoup scraper.
        """
        # 1. Try Firecrawl
        if self.firecrawl and ("localhost" not in url and "127.0.0.1" not in url):
            try:
                logger.info(f"Attempting Firecrawl scrape for: {url}")
                result = self.firecrawl.scrape_url(url, params={'formats': ['markdown']})
                if result and (result.get('markdown') or result.get('content')):
                    return result.get('markdown') or result.get('content')
            except Exception as e:
                logger.error(f"Firecrawl scrape failed for {url}: {str(e)}")

        # 2. Fallback: Local Standard Scraper
        return await self.local_scrape(url)

    async def local_scrape(self, url: str) -> Optional[str]:
        """
        Standard BS4 scraper for local development or as a final fallback.
        """
        try:
            logger.info(f"Using local fallback scraper for: {url}")
            async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                # Remove noise
                for element in soup(["script", "style", "header", "footer", "nav", "aside", "noscript"]):
                    element.decompose()

                # Try to find main content
                main_content = soup.find('main') or soup.find('article') or soup.find(id='content') or soup.body
                if not main_content: return None

                text = main_content.get_text(separator=' ')
                # Clean whitespace
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                return '\n'.join(chunk for chunk in chunks if chunk)
        except Exception as e:
            logger.error(f"Local scraper error for {url}: {str(e)}")
            return None

    async def get_urls_from_sitemap(self, sitemap_url: str) -> List[str]:
        """
        Parses a sitemap.xml to extract URLs.
        """
        try:
            async with httpx.AsyncClient(headers=self.headers, follow_redirects=True) as client:
                response = await client.get(sitemap_url)
                response.raise_for_status()
                
                root = ET.fromstring(response.content)
                namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
                urls = [loc.text for loc in root.findall('.//ns:loc', namespace) if loc.text]
                return urls
        except Exception as e:
            logger.warning(f"Could not parse sitemap {sitemap_url}: {str(e)}")
            return []

    async def smart_crawl(self, base_url: str) -> List[Dict[str, str]]:
        """
        Triple-Layer Discovery Strategy:
        1. Firecrawl Discovery (Crawl API)
        2. Sitemap Fallback
        3. Local Scraper Fallback
        Returns a list of dictionaries with 'url' and 'content'.
        """
        results = []

        # --- Layer 1: Firecrawl Discovery ---
        if self.firecrawl and ("localhost" not in base_url and "127.0.0.1" not in base_url):
            try:
                logger.info(f"Starting Layer 1: Firecrawl Discovery Crawl for {base_url}")
                # firecrawl-py crawl_url is often a sync call that polls or returns a job ID 
                # Depending on the version, we might need to handle the wait.
                # Here we assume a standard blocking call or use the scrape version if it supports crawl
                crawl_result = self.firecrawl.crawl_url(
                    base_url, 
                    params={
                        'limit': 50, 
                        'scrapeOptions': {'formats': ['markdown']}
                    }
                )
                
                if crawl_result and 'data' in crawl_result:
                    for page in crawl_result['data']:
                        if page.get('markdown') or page.get('content'):
                            results.append({
                                'url': page.get('url', base_url),
                                'content': page.get('markdown') or page.get('content')
                            })
                    if results:
                        logger.info(f"Layer 1 Success: Found {len(results)} pages via Discovery.")
                        return results
            except Exception as e:
                logger.error(f"Layer 1 (Discovery) failed: {str(e)}")

        # --- Layer 2: Sitemap Fallback ---
        logger.info(f"Moving to Layer 2: Sitemap Fallback for {base_url}")
        sitemap_url = base_url.rstrip('/') + '/sitemap.xml'
        urls = await self.get_urls_from_sitemap(sitemap_url)
        
        if urls:
            logger.info(f"Found {len(urls)} URLs in sitemap. Scraping individually...")
            for url in urls[:50]: # Limit for safety
                content = await self.fetch_page_content(url)
                if content:
                    results.append({'url': url, 'content': content})
            if results:
                return results

        # --- Layer 3: Local Fallback (Mini-Crawl) ---
        logger.info(f"Moving to Layer 3: Local Mini-Crawl Fallback for {base_url}")
        try:
            async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=30.0) as client:
                response = await client.get(base_url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 1. Get Home Page Content
                home_content = await self.local_scrape(base_url)
                if home_content:
                    results.append({'url': base_url, 'content': home_content})

                # 2. Find Internal Links for "Mini-Crawl"
                internal_urls = set()
                for a in soup.find_all('a', href=True):
                    href = a['href']
                    # Normalize links (e.g., /blog -> http://localhost:3000/blog)
                    if href.startswith('/'):
                        full_url = base_url.rstrip('/') + href
                    elif href.startswith(base_url):
                        full_url = href
                    else:
                        continue
                    
                    # Skip common non-content pages
                    if any(x in full_url for x in ['#', 'mailto:', 'tel:', '.png', '.jpg', '.pdf']):
                        continue
                    
                    internal_urls.add(full_url)

                # 3. Scrape Discovered Links (Limited to 15 for safety)
                logger.info(f"Layer 3 discovered {len(internal_urls)} internal links. Starting mini-crawl...")
                count = 0
                for url in internal_urls:
                    if count >= 15: break # Safety limit
                    if url == base_url: continue # Skip if already done
                    
                    content = await self.local_scrape(url)
                    if content:
                        results.append({'url': url, 'content': content})
                        count += 1
                        
        except Exception as e:
            logger.error(f"Layer 3 Mini-Crawl failed: {str(e)}")
            # Last ditch: try single page if mini-crawl failed
            content = await self.local_scrape(base_url)
            if content:
                results.append({'url': base_url, 'content': content})
        
        return results

web_crawler = WebCrawlerService()

