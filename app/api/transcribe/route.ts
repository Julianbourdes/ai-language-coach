/**
 * API route for audio transcription using Whisper
 */

import { NextRequest, NextResponse } from 'next/server';
import { whisperClient } from '@/lib/whisper/client';
import { blobToBuffer, isValidAudioFormat, isValidAudioSize } from '@/lib/whisper/audio-processor';

const MAX_FILE_SIZE_MB = 10;

/**
 * POST /api/transcribe
 * Transcribe audio file to text
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file format
    if (!isValidAudioFormat(audioFile)) {
      return NextResponse.json(
        { error: 'Invalid audio format. Please provide a valid audio file.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidAudioSize(audioFile.size, MAX_FILE_SIZE_MB)) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit` },
        { status: 400 }
      );
    }

    // Convert to buffer
    const buffer = await blobToBuffer(audioFile);

    // Transcribe
    const result = await whisperClient.transcribe(buffer);

    return NextResponse.json({
      transcription: result.text,
      timestamp: new Date().toISOString(),
      language: result.language,
    });
  } catch (error) {
    console.error('Transcription error:', error);

    return NextResponse.json(
      {
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transcribe
 * Health check for Whisper service
 */
export async function GET() {
  try {
    const isHealthy = await whisperClient.healthCheck();

    if (isHealthy) {
      return NextResponse.json({ status: 'healthy', service: 'whisper' });
    } else {
      return NextResponse.json(
        { status: 'unhealthy', service: 'whisper', message: 'Whisper service is not available' },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'whisper',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
