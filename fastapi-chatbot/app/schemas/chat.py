from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender (user, assistant, system)")
    content: str = Field(..., description="The actual message text")

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's current message")
    history: List[ChatMessage] = Field(default=[], description="Previous conversation history")
    user_context: Optional[Dict[str, Any]] = Field(default=None, description="Injected user info from Express")

class ChatResponse(BaseModel):
    answer: str
    status: str = "success"
