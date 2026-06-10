from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.openai_service import openai_service
from loguru import logger

router = APIRouter()

@router.post("/nova", response_model=ChatResponse)
async def chat_with_nova(request: ChatRequest):
    try:
        logger.info(f"Received chat request: {request.message}")
        
        answer = openai_service.generate_nova_response(request)
        
        return ChatResponse(answer=answer)
    except Exception as e:
        logger.error(f"Error in Nova chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Something went wrong with Nova. Please try again.")
