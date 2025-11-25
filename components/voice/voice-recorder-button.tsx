"use client";

/**
 * Voice recorder button component for the chat input
 * Simplified version that works with the template's MultimodalInput
 */

import { Loader2, Mic, Square } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type RecordRTC from "recordrtc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type VoiceRecorderButtonProps = {
  onTranscription: (transcription: string) => void;
  disabled?: boolean;
};

export function VoiceRecorderButton({
  onTranscription,
  disabled,
}: VoiceRecorderButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Dynamic import to avoid SSR issues with RecordRTC
      const RecordRTCModule = await import("recordrtc");
      const RecordRTCClass = RecordRTCModule.default;

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create recorder with WAV format for Whisper compatibility
      const recorder = new RecordRTCClass(stream, {
        type: "audio",
        mimeType: "audio/wav",
        recorderType: RecordRTCClass.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16_000,
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);

      let errorMessage = "Failed to access microphone";

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Microphone permission denied. Please enable microphone access in your browser settings.";
        } else if (error.name === "NotFoundError") {
          errorMessage =
            "No microphone found. Please connect a microphone and try again.";
        }
      }

      toast.error(errorMessage);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recorderRef.current) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      recorderRef.current?.stopRecording(async () => {
        const blob = recorderRef.current?.getBlob();

        // Stop all tracks
        if (streamRef.current) {
          for (const track of streamRef.current.getTracks()) {
            track.stop();
          }
          streamRef.current = null;
        }

        setIsRecording(false);

        if (!blob) {
          toast.error("Failed to capture audio. Please try again.");
          resolve();
          return;
        }

        setIsTranscribing(true);

        try {
          // Send to transcription API
          const formData = new FormData();
          formData.append("audio", blob, "recording.wav");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Transcription failed");
          }

          const data = await response.json();

          // Call the callback with transcription
          onTranscription(data.transcription);
        } catch (error) {
          console.error("Transcription error:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to transcribe audio. Please try again."
          );
        } finally {
          setIsTranscribing(false);
          recorderRef.current = null;
        }

        resolve();
      });
    });
  }, [onTranscription]);

  const handleClick = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <Button
      className={`aspect-square h-8 rounded-lg p-1 transition-colors ${
        isRecording
          ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          : "hover:bg-accent"
      }`}
      disabled={disabled || isTranscribing}
      onClick={handleClick}
      title={
        isTranscribing
          ? "Transcribing..."
          : isRecording
            ? "Stop recording"
            : "Start voice recording"
      }
      type="button"
      variant="ghost"
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <div className="relative">
          <Square className="h-4 w-4" fill="currentColor" />
          <span className="-top-1 -right-1 absolute flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        </div>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
