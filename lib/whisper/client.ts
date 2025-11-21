/**
 * Whisper client for speech-to-text transcription
 * Note: This uses a simple approach that works with whisper.cpp command-line tool
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const WHISPER_EXECUTABLE = process.env.WHISPER_EXECUTABLE_PATH || 'whisper';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'small';

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

export class WhisperClient {
  private readonly executable: string;
  private readonly model: string;

  constructor(executable: string = WHISPER_EXECUTABLE, model: string = WHISPER_MODEL) {
    this.executable = executable;
    this.model = model;
  }

  /**
   * Transcribe audio buffer to text
   */
  async transcribe(audioBuffer: Buffer): Promise<TranscriptionResult> {
    const tempFile = path.join(os.tmpdir(), `whisper-${Date.now()}.wav`);

    try {
      // Write buffer to temporary file
      await writeFile(tempFile, audioBuffer);

      // Execute whisper command
      // Note: Adjust command based on your whisper installation
      // For whisper.cpp: whisper -m model.bin -f input.wav
      // For OpenAI whisper: whisper input.wav --model small
      const command = `${this.executable} "${tempFile}" --model ${this.model} --output_format txt --output_dir ${os.tmpdir()}`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
      });

      // Read the output file
      const outputFile = tempFile.replace('.wav', '.txt');
      const fs = await import('fs/promises');
      const text = await fs.readFile(outputFile, 'utf-8');

      // Clean up temp files
      await this.cleanup(tempFile, outputFile);

      return {
        text: text.trim(),
      };
    } catch (error) {
      // Clean up on error
      await this.cleanup(tempFile);

      if (error instanceof Error) {
        throw new Error(`Transcription failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Alternative: Transcribe from file path
   */
  async transcribeFile(filePath: string): Promise<TranscriptionResult> {
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(filePath);
    return this.transcribe(buffer);
  }

  /**
   * Health check for Whisper
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`${this.executable} --version`, {
        timeout: 5000,
      });
      return true;
    } catch (error) {
      console.error('Whisper health check failed:', error);
      return false;
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanup(...files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await unlink(file);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}

// Export singleton instance
export const whisperClient = new WhisperClient();
