from pymongo import MongoClient
from openai import OpenAI
from app.core.config import settings
from typing import List, Dict, Any
from loguru import logger

class VectorStoreService:
    def __init__(self):
        self.client = MongoClient(settings.MONGODB_ATLAS_STRING)
        self.db = self.client[settings.MONGO_DB_NAME]
        self.collection = self.db["knowledge_chunks"]
        self.hashes_collection = self.db["source_hashes"] # New collection for deduplication
        self.openai_client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )

    def get_embedding(self, text: str) -> List[float]:
        # Using the same model as specified in settings, or a default embedding model
        # Note: OpenRouter might not support embeddings directly if using a custom base URL
        # We might need to use standard OpenAI for embeddings if OpenRouter doesn't provide them.
        # However, many users use text-embedding-3-small.
        
        response = self.openai_client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding

    def upsert_document(self, source_id: str, chunks: List[Dict[str, Any]], content_hash: str):
        """
        Deletes existing chunks for the source_id (filename or URL) and inserts new ones.
        Updates the content hash to avoid future redundant processing.
        """
        try:
            # 1. Delete existing chunks for this source
            delete_result = self.collection.delete_many({"metadata.source": source_id})
            logger.info(f"Deleted {delete_result.deleted_count} existing chunks for {source_id}")

            # 2. Prepare new chunks with embeddings
            documents = []
            for chunk in chunks:
                embedding = self.get_embedding(chunk["content"])
                doc = {
                    "content": chunk["content"],
                    "metadata": chunk["metadata"],
                    "embedding": embedding
                }
                # Ensure source is in metadata for deletion next time
                doc["metadata"]["source"] = source_id
                documents.append(doc)

            # 3. Batch insert
            if documents:
                self.collection.insert_many(documents)
                
                # 4. Update the hash record
                self.hashes_collection.update_one(
                    {"source": source_id},
                    {"$set": {"hash": content_hash}},
                    upsert=True
                )
                logger.info(f"Successfully inserted {len(documents)} chunks for {source_id}")
            
            return len(documents)
        except Exception as e:
            logger.error(f"Error in upsert_document: {str(e)}")
            raise e

    def has_content_changed(self, source_id: str, new_hash: str) -> bool:
        """
        Checks if the content of a source has changed compared to the stored hash.
        """
        record = self.hashes_collection.find_one({"source": source_id})
        if not record:
            return True # New source
        
        return record.get("hash") != new_hash

    def search_similar(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Performs a vector search in MongoDB Atlas.
        Note: This requires a Vector Search Index to be created in Atlas UI.
        """
        logger.info(f"Searching vector store for: {query}")
        query_embedding = self.get_embedding(query)
        
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index", # Name of your index in Atlas
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": 100,
                    "limit": limit
                }
            },
            {
                "$project": {
                    "content": 1,
                    "metadata": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        results = list(self.collection.aggregate(pipeline))
        logger.info(f"Found {len(results)} relevant context chunks.")
        return results

vector_store = VectorStoreService()
