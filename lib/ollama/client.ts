/**
 * Ollama client configuration using ollama-ai-provider-v2
 */

import { ollama } from 'ollama-ai-provider-v2';

// Get configuration from environment
const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const modelName = process.env.OLLAMA_MODEL || 'llama3.1:8b';

/**
 * Get language model instance
 * Simple direct usage as per ollama-ai-provider-v2 docs
 */
export function getLanguageModel() {
  return ollama(modelName);
}

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
