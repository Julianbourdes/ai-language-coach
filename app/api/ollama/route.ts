/**
 * API route for chat with Ollama using Vercel AI SDK
 */

import { NextRequest } from 'next/server';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { getLanguageModel, checkOllamaHealth } from '@/lib/ollama/client';
import { languageCoachPrompt, generateRolePlayPrompt } from '@/lib/ollama/prompts';
import type { Scenario } from '@/types';

export const maxDuration = 60;

/**
 * POST /api/ollama
 * Chat with streaming response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, scenario }: { messages: UIMessage[]; scenario?: Scenario } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine system prompt based on scenario
    let systemPrompt = languageCoachPrompt;
    if (scenario) {
      systemPrompt = generateRolePlayPrompt(scenario);
    }

    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages);

    // Limit context to last 10 messages for performance
    const contextMessages = modelMessages.slice(-10);

    // Stream the response
    const result = streamText({
      model: getLanguageModel(),
      system: systemPrompt,
      messages: contextMessages,
      temperature: 0.7,
    });

    // Return streaming response in UI format
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Ollama chat error:', error);

    return new Response(
      JSON.stringify({
        error: 'Chat failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET /api/ollama
 * Health check for Ollama service
 */
export async function GET() {
  try {
    const isHealthy = await checkOllamaHealth();

    if (isHealthy) {
      return new Response(
        JSON.stringify({ status: 'healthy', service: 'ollama' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          status: 'unhealthy',
          service: 'ollama',
          message: 'Ollama service is not available. Please run: ollama serve',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        service: 'ollama',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
