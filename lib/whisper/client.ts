/**
 * Whisper client for speech-to-text transcription
 * Supports whisper.cpp CLI (whisper-cli)
 */

import { exec } from "node:child_process";
import { unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const WHISPER_EXECUTABLE = process.env.WHISPER_EXECUTABLE_PATH || "whisper";
const WHISPER_MODEL = process.env.WHISPER_MODEL || "small";

export type TranscriptionResult = {
  text: string;
  language?: string;
  duration?: number;
};

export class WhisperClient {
  private readonly executable: string;
  private readonly model: string;

  constructor(
    executable: string = WHISPER_EXECUTABLE,
    model: string = WHISPER_MODEL
  ) {
    this.executable = executable;
    this.model = model;
  }

  /**
   * Detect if using whisper.cpp (whisper-cli) or OpenAI whisper
   */
  private isWhisperCpp(): boolean {
    return this.executable.includes("whisper-cli");
  }

  /**
   * Transcribe audio buffer to text
   */
  async transcribe(audioBuffer: Buffer): Promise<TranscriptionResult> {
    const tempFile = path.join(os.tmpdir(), `whisper-${Date.now()}.wav`);

    try {
      // Write buffer to temporary file
      await writeFile(tempFile, audioBuffer);

      let command: string;
      let text: string;

      if (this.isWhisperCpp()) {
        // whisper.cpp CLI outputs directly to stdout
        command = `${this.executable} -m "${this.model}" -nt "${tempFile}"`;

        const { stdout } = await execAsync(command, {
          timeout: 30_000, // 30 second timeout
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        // whisper-cli outputs transcription to stdout
        text = stdout.trim();

        // Clean up temp file
        await this.cleanup(tempFile);
      } else {
        // OpenAI whisper Python CLI
        command = `${this.executable} "${tempFile}" --model ${this.model} --output_format txt --output_dir ${os.tmpdir()}`;

        await execAsync(command, {
          timeout: 30_000,
        });

        // Read the output file
        const outputFile = tempFile.replace(".wav", ".txt");
        const fs = await import("node:fs/promises");
        text = await fs.readFile(outputFile, "utf-8");

        // Clean up temp files
        await this.cleanup(tempFile, outputFile);
      }

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
    const fs = await import("node:fs/promises");
    const buffer = await fs.readFile(filePath);
    return this.transcribe(buffer);
  }

  /**
   * Health check for Whisper
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.isWhisperCpp()) {
        // whisper-cli --help returns 0
        const { stdout: helpOutput } = await execAsync(
          `${this.executable} -h`,
          {
            timeout: 5000,
          }
        );
        return helpOutput.includes("usage");
      }
      await execAsync(`${this.executable} --version`, {
        timeout: 5000,
      });
      return true;
    } catch (error) {
      console.error("Whisper health check failed:", error);
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
      } catch (_error) {
        // Ignore cleanup errors
      }
    }
  }
}

// Export singleton instance
export const whisperClient = new WhisperClient();
