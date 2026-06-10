from openai import OpenAI
from app.core.config import settings
from app.schemas.chat import ChatRequest, ChatMessage
import json
from app.services.vector_store import vector_store
from loguru import logger

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )
        self.load_prompts()

    def load_prompts(self):
        import yaml
        import os
        prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "nova_system.yaml")
        try:
            with open(prompt_path, "r") as f:
                self.prompts = yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load prompts from YAML: {str(e)}")
            self.prompts = {}

    def generate_nova_response(self, request: ChatRequest) -> str:
        # 1. Load Base Prompt
        system_prompt = self.prompts.get("base_prompt", "You are Nova, a financial AI.")

        # 2. Tiered Identity Logic
        if request.user_context:
            # --- MEMBER LOGIC (PRIVATE BOT) ---
            user_name = request.user_context.get("name", "User")
            plan = request.user_context.get("subscription", {}).get("plan_name", "Free")
            context_str = json.dumps(request.user_context, indent=2)
            
            logger.info(f"📥 INJECTING USER CONTEXT (MEMBER):\n{context_str}")
            
            member_template = self.prompts.get("member_logic", "")
            system_prompt += "\n" + member_template.format(
                user_name=user_name,
                plan=plan,
                context_str=context_str
            )
        else:
            # --- GUEST LOGIC (PUBLIC BOT) ---
            logger.info("👤 USER IS GUEST: Using Public Bot logic.")
            system_prompt += "\n" + self.prompts.get("guest_logic", "")

        # 3. Knowledge Base (RAG)
        try:
            logger.info(f"🔍 RETRIEVING KNOWLEDGE FOR: {request.message}")
            search_results = vector_store.search_similar(request.message, limit=3)
            if search_results:
                knowledge_texts = [res.get("content", "") for res in search_results if res.get("content")]
                knowledge_str = "\n\n---\n\n".join(knowledge_texts)
                system_prompt += f"\n\n### 5. RELEVANT KNOWLEDGE (RAG):\n{knowledge_str}"
                
                for i, chunk in enumerate(knowledge_texts):
                    logger.info(f"📖 CHUNK {i+1}: {chunk[:200]}...") 
                logger.info(f"✅ Injected {len(search_results)} knowledge chunks.")
            else:
                logger.info("📂 NO RELEVANT KNOWLEDGE FOUND.")
                system_prompt += "\n\n### 5. RELEVANT KNOWLEDGE: No specific documents found. Rely on general financial literacy."
        except Exception as e:
            logger.error(f"Vector search failed: {str(e)}")
            system_prompt += "\n\n### 5. RELEVANT KNOWLEDGE: Currently unavailable."

        # 4. Format messages for OpenAI
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history
        for msg in request.history:
            messages.append({"role": msg.role, "content": msg.content})
            
        # Add current message
        messages.append({"role": "user", "content": request.message})

        # 5. Call OpenAI
        response = self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )

        return response.choices[0].message.content

openai_service = OpenAIService()
