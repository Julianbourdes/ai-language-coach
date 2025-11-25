/**
 * Types for feedback and language corrections
 */

export type FeedbackType = "grammar" | "vocabulary" | "style";

export type FeedbackSeverity = "error" | "warning" | "suggestion";

export type Feedback = {
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
  targetLanguage?: string;
};

export type FeedbackResponse = {
  original: string;
  corrections: Feedback[];
  overallScore: number; // 0-100
  summary: string;
};
