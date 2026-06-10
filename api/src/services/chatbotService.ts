import axios from "axios";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000/api/v1";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  user_context?: any;
}

export const chatWithNova = async (data: ChatRequest) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/chat/nova`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error calling Nova AI Service:", error.response?.data || error.message);
    throw new Error("Nova AI Service is currently unavailable.");
  }
};
