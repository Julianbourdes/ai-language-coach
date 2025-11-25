"use client";

/**
 * Voice recorder component for capturing audio
 */

import { Loader2, Mic, Square } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type RecordRTC from "recordrtc";
import { Button } from "@/components/ui/button";
import { useConversationStore } from "@/lib/store/conversation-store";

type VoiceRecorderProps = {
  onTranscription: (transcription: string, audioUrl?: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
};

export function VoiceRecorder({
  onTranscription,
  onError,
  disabled,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { setRecording, setTranscribing } = useConversationStore();

  const startRecording = useCallback(async () => {
    try {
      // Dynamic import to avoid SSR issues with RecordRTC
      const RecordRTCModule = await import("recordrtc");
      const RecordRTCClass = RecordRTCModule.default;

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create recorder
      // Use WAV format for compatibility with whisper-cli
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
      setRecording(true);
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

      onError?.(errorMessage);
    }
  }, [onError, setRecording]);

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
        setRecording(false);

        if (!blob) {
          onError?.("Failed to capture audio. Please try again.");
          resolve();
          return;
        }

        setIsTranscribing(true);
        setTranscribing(true);

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

          // Create audio URL for playback
          const audioUrl = URL.createObjectURL(blob);

          // Call the callback with transcription
          onTranscription(data.transcription, audioUrl);
        } catch (error) {
          console.error("Transcription error:", error);
          onError?.(
            error instanceof Error
              ? error.message
              : "Failed to transcribe audio. Please try again."
          );
        } finally {
          setIsTranscribing(false);
          setTranscribing(false);
          recorderRef.current = null;
        }

        resolve();
      });
    });
  }, [onTranscription, onError, setRecording, setTranscribing]);

  const handleClick = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <Button
      className="relative"
      disabled={disabled || isTranscribing}
      onClick={handleClick}
      size="icon"
      title={
        isTranscribing
          ? "Transcribing..."
          : isRecording
            ? "Stop recording"
            : "Start recording"
      }
      type="button"
      variant={isRecording ? "destructive" : "outline"}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <>
          <Square className="h-4 w-4" fill="currentColor" />
          <span className="-top-1 -right-1 absolute flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
