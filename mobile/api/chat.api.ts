import { api } from "./axios";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    message: string;
    timestamp: string;
  };
}

export interface SuggestionsResponse {
  success: boolean;
  data: string[];
}

// Send a message to the chatbot
export const sendChatMessage = async (
  message: string,
  history: ChatMessage[] = []
): Promise<string> => {
  const response = await api.post<SendMessageResponse>("/chat/message", {
    message,
    history: history.map((m) => ({ role: m.role, content: m.content })),
  });
  return response.data.data.message;
};

// Get suggested questions
export const getSuggestions = async (): Promise<string[]> => {
  const response = await api.get<SuggestionsResponse>("/chat/suggestions");
  return response.data.data;
};
