/**
 * Types for conversations and messages
 */

import type { Feedback } from "./feedback";

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  audioUrl?: string;
  transcription?: string;
  feedback?: Feedback[];
};

export type ConversationStats = {
  duration: number; // in seconds
  wordCount: number;
  errorCount: number;
  improvementScore: number; // 0-100
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  scenarioId?: string;
  createdAt: Date;
  updatedAt: Date;
  stats?: ConversationStats;
};
