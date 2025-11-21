/**
 * API route for generating language feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getLanguageModel } from '@/lib/ollama/client';
import { feedbackAnalyzerPrompt } from '@/lib/ollama/prompts';
import { nanoid } from 'nanoid';
import type { FeedbackRequest, FeedbackResponse, Feedback } from '@/types';

export const maxDuration = 60;

/**
 * POST /api/feedback
 * Analyze text and return corrections
 */
export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { text, context, userLevel = 'intermediate' } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided for analysis' },
        { status: 400 }
      );
    }

    // Validate text length (reasonable limit)
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters.' },
        { status: 400 }
      );
    }

    // Prepare the analysis prompt
    const analysisPrompt = `${feedbackAnalyzerPrompt}

User level: ${userLevel}
${context ? `Context: ${context}` : ''}

Text to analyze:
"${text}"

Return ONLY a valid JSON array of corrections. If there are no corrections needed, return an empty array [].`;

    // Generate feedback
    const result = await generateText({
      model: getLanguageModel(),
      prompt: analysisPrompt,
      temperature: 0.3, // Lower temperature for more consistent JSON
      maxOutputTokens: 1500,
    });

    let corrections: Feedback[] = [];

    try {
      // Parse the JSON response
      const parsed = JSON.parse(result.text);

      if (Array.isArray(parsed)) {
        // Add IDs to each correction
        corrections = parsed.map((correction) => ({
          ...correction,
          id: nanoid(),
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse feedback JSON:', result.text);
      // If parsing fails, return empty corrections
      corrections = [];
    }

    // Calculate overall score
    const errorCount = corrections.filter((c) => c.severity === 'error').length;
    const warningCount = corrections.filter((c) => c.severity === 'warning').length;
    const suggestionCount = corrections.filter((c) => c.severity === 'suggestion').length;

    // Simple scoring: 100 - (errors * 10 + warnings * 5 + suggestions * 2)
    const overallScore = Math.max(
      0,
      Math.min(100, 100 - (errorCount * 10 + warningCount * 5 + suggestionCount * 2))
    );

    // Generate summary
    let summary = 'Great job!';
    if (errorCount > 0) {
      summary = `Found ${errorCount} grammar error${errorCount > 1 ? 's' : ''} to fix.`;
    } else if (warningCount > 0) {
      summary = `Good! A few improvements suggested.`;
    } else if (suggestionCount > 0) {
      summary = `Excellent! Just some minor style suggestions.`;
    }

    const response: FeedbackResponse = {
      original: text,
      corrections,
      overallScore,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Feedback generation error:', error);

    return NextResponse.json(
      {
        error: 'Feedback generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
