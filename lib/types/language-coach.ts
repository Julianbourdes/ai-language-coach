/**
 * Language Coach specific types
 */

import type { ChatScenarioData, TargetLanguage } from "@/lib/db/schema";

// Re-export from schema for convenience
export type { TargetLanguage, ChatScenarioData };

/**
 * Language metadata with display information
 */
export const LANGUAGES: Record<
  TargetLanguage,
  { name: string; flag: string; voiceLang: string }
> = {
  en: { name: "English", flag: "🇬🇧", voiceLang: "en-US" },
  fr: { name: "Français", flag: "🇫🇷", voiceLang: "fr-FR" },
  es: { name: "Español", flag: "🇪🇸", voiceLang: "es-ES" },
};

/**
 * Types for language feedback
 */
export type FeedbackType = "grammar" | "vocabulary" | "style";

export type FeedbackSeverity = "error" | "warning" | "suggestion";

export type LanguageFeedback = {
  id: string;
  type: FeedbackType;
  severity: FeedbackSeverity;
  original: string;
  suggestion: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
};

export type FeedbackRequest = {
  text: string;
  context?: string;
  userLevel?: "beginner" | "intermediate" | "advanced";
  targetLanguage?: TargetLanguage;
};

export type FeedbackResponse = {
  original: string;
  corrections: LanguageFeedback[];
  overallScore: number; // 0-100
  summary: string;
};

/**
 * Language feedback part to be stored in message.parts
 * This is a custom part type for the Vercel AI SDK
 */
export type LanguageFeedbackPart = {
  type: "language-feedback";
  data: FeedbackResponse;
};

/**
 * Audio transcription part for voice messages
 */
export type AudioTranscriptionPart = {
  type: "audio-transcription";
  audioUrl?: string;
  transcription: string;
  timestamp: string;
};

/**
 * Voice recording state
 */
export type VoiceRecordingState = "idle" | "recording" | "transcribing";

/**
 * TTS (Text-to-Speech) state
 */
export type TTSState = {
  isEnabled: boolean;
  isSpeaking: boolean;
  currentMessageId: string | null;
};

/**
 * Language Coach chat context
 * Passed to the chat component to enable language coaching features
 */
export type LanguageCoachContext = {
  targetLanguage: TargetLanguage;
  scenario?: ChatScenarioData | null;
  ttsEnabled: boolean;
  feedbackEnabled: boolean;
};

/**
 * Scenario category for filtering
 */
export type ScenarioCategory =
  | "interview"
  | "business"
  | "social"
  | "travel"
  | "academic";

/**
 * Difficulty level for scenarios
 */
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
