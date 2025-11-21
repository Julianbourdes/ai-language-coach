/**
 * Types for feedback and language corrections
 */

export type FeedbackType = 'grammar' | 'vocabulary' | 'style';

export type FeedbackSeverity = 'error' | 'warning' | 'suggestion';

export interface Feedback {
  id: string;
  type: FeedbackType;
  severity: FeedbackSeverity;
  original: string;
  suggestion: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
}

export interface FeedbackRequest {
  text: string;
  context?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  targetLanguage?: string;
}

export interface FeedbackResponse {
  original: string;
  corrections: Feedback[];
  overallScore: number; // 0-100
  summary: string;
}
