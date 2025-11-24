export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

// For now, only Ollama model is available
// Cloud models can be added later via environment variables
export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Ollama (Local)",
    description: "Local AI model for private language coaching - llama3.1:8b",
  },
];
