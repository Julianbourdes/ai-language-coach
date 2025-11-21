/**
 * Ollama client configuration using ollama-ai-provider
 */

import { ollama } from 'ollama-ai-provider';

// Get configuration from environment
const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const modelName = process.env.OLLAMA_MODEL || 'llama3.1:8b';

/**
 * Configured Ollama provider instance
 */
export const ollamaProvider = ollama(baseURL);

/**
 * Default model for language coaching
 */
export const languageModel = ollamaProvider(modelName);

/**
 * Health check for Ollama service
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${baseURL}/api/tags`);
    return response.ok;
  } catch (error) {
    console.error('Ollama health check failed:', error);
    return false;
  }
}

/**
 * Get available models from Ollama
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${baseURL}/api/tags`);
    if (!response.ok) return [];

    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch (error) {
    console.error('Failed to fetch available models:', error);
    return [];
  }
}
