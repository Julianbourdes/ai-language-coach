/**
 * Types for conversations and messages
 */

import type { Feedback } from './feedback';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  transcription?: string;
  feedback?: Feedback[];
}

export interface ConversationStats {
  duration: number; // in seconds
  wordCount: number;
  errorCount: number;
  improvementScore: number; // 0-100
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  scenarioId?: string;
  createdAt: Date;
  updatedAt: Date;
  stats?: ConversationStats;
}
