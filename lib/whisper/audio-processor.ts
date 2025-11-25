/**
 * Audio processing utilities for converting and validating audio data
 */

/**
 * Convert Blob to Buffer (for Node.js environments)
 */
export async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Validate audio format
 */
export function isValidAudioFormat(blob: Blob): boolean {
  const validTypes = [
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/mpeg",
    "audio/mp4",
  ];

  return validTypes.includes(blob.type) || blob.type.startsWith("audio/");
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "mp4",
  };

  return mimeMap[mimeType] || "wav";
}

/**
 * Create WAV file header for PCM audio
 * This is a simplified version that assumes 16-bit mono audio at 16kHz
 */
export function createWavHeader(
  dataLength: number,
  sampleRate = 16_000,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  // File length minus 8 bytes
  header.writeUInt32LE(36 + dataLength, 4);
  // WAVE identifier
  header.write("WAVE", 8);
  // fmt chunk identifier
  header.write("fmt ", 12);
  // fmt chunk length (16 for PCM)
  header.writeUInt32LE(16, 16);
  // Audio format (1 for PCM)
  header.writeUInt16LE(1, 20);
  // Number of channels
  header.writeUInt16LE(channels, 22);
  // Sample rate
  header.writeUInt32LE(sampleRate, 24);
  // Byte rate (sampleRate * channels * bitsPerSample / 8)
  header.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28);
  // Block align (channels * bitsPerSample / 8)
  header.writeUInt16LE((channels * bitsPerSample) / 8, 32);
  // Bits per sample
  header.writeUInt16LE(bitsPerSample, 34);
  // data chunk identifier
  header.write("data", 36);
  // data chunk length
  header.writeUInt32LE(dataLength, 40);

  return header;
}

/**
 * Validate audio file size (max 10MB as per spec)
 */
export function isValidAudioSize(sizeInBytes: number, maxSizeMB = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return sizeInBytes <= maxBytes;
}

/**
 * Convert AudioBuffer to WAV format
 * Useful if you need to convert from Web Audio API AudioBuffer
 */
export function audioBufferToWav(audioBuffer: AudioBuffer): Buffer {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numberOfChannels * 2; // 16-bit samples
  const buffer = Buffer.alloc(length);

  let offset = 0;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      // Convert float to 16-bit PCM
      const int16 = Math.max(
        -32_768,
        Math.min(32_767, Math.floor(sample * 32_768))
      );
      buffer.writeInt16LE(int16, offset);
      offset += 2;
    }
  }

  // Add WAV header
  const header = createWavHeader(
    buffer.length,
    audioBuffer.sampleRate,
    numberOfChannels,
    16
  );

  return Buffer.concat([header, buffer]);
}
