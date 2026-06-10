import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const askNova = async (message: string, history: ChatMessage[]) => {
  try {
    const response = await axios.post(
      `${API_URL}/nova`,
      { message, history },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error("Nova Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to get response from Nova.");
  }
};
