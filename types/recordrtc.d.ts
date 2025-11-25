/**
 * Type definitions for RecordRTC
 * This avoids TypeScript errors when using dynamic import
 */

declare module "recordrtc" {
  export type RecordRTCOptions = {
    type?: "audio" | "video" | "canvas" | "gif";
    mimeType?: string;
    recorderType?: any;
    numberOfAudioChannels?: number;
    desiredSampRate?: number;
    [key: string]: any;
  };

  export default class RecordRTC {
    constructor(stream: MediaStream, options?: RecordRTCOptions);

    static StereoAudioRecorder: any;

    startRecording(): void;
    stopRecording(callback?: () => void): void;
    getBlob(): Blob;
    getDataURL(callback: (dataURL: string) => void): void;
    toURL(): string;
    destroy(): void;
  }
}
