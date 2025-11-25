import { customProvider } from "ai";
import { ollama } from "ollama-ai-provider-v2";
import { isTestEnvironment } from "../constants";

// Get Ollama model from environment
const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        // Main chat model - Ollama for language coaching
        "chat-model": ollama(ollamaModel),
        // For now, use the same model for all purposes
        // In the future, we can add cloud models via env vars
        "chat-model-reasoning": ollama(ollamaModel),
        "title-model": ollama(ollamaModel),
        "artifact-model": ollama(ollamaModel),
      },
    });

/**
 * Health check for Ollama service
 */
export async function checkOllamaHealth(): Promise<boolean> {
  const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  try {
    const response = await fetch(`${baseURL}/api/tags`);
    return response.ok;
  } catch (error) {
    console.error("Ollama health check failed:", error);
    return false;
  }
}
