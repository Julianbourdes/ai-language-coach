'use client';

/**
 * Voice recorder component for capturing audio
 */

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversationStore } from '@/lib/store/conversation-store';
import type RecordRTC from 'recordrtc';

interface VoiceRecorderProps {
  onTranscription: (transcription: string, audioUrl?: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscription, onError, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { setRecording, setTranscribing } = useConversationStore();

  const startRecording = useCallback(async () => {
    try {
      // Dynamic import to avoid SSR issues with RecordRTC
      const RecordRTCModule = await import('recordrtc');
      const RecordRTCClass = RecordRTCModule.default;

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create recorder
      const recorder = new RecordRTCClass(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: RecordRTCClass.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);

      let errorMessage = 'Failed to access microphone';

      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please enable microphone access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        }
      }

      onError?.(errorMessage);
    }
  }, [onError, setRecording]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    return new Promise<void>((resolve) => {
      recorderRef.current!.stopRecording(async () => {
        const blob = recorderRef.current!.getBlob();

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);
        setRecording(false);
        setIsTranscribing(true);
        setTranscribing(true);

        try {
          // Send to transcription API
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Transcription failed');
          }

          const data = await response.json();

          // Create audio URL for playback
          const audioUrl = URL.createObjectURL(blob);

          // Call the callback with transcription
          onTranscription(data.transcription, audioUrl);
        } catch (error) {
          console.error('Transcription error:', error);
          onError?.(
            error instanceof Error
              ? error.message
              : 'Failed to transcribe audio. Please try again.'
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
      type="button"
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      variant={isRecording ? 'destructive' : 'outline'}
      size="icon"
      className="relative"
      title={
        isTranscribing
          ? 'Transcribing...'
          : isRecording
            ? 'Stop recording'
            : 'Start recording'
      }
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <>
          <Square className="h-4 w-4" fill="currentColor" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
