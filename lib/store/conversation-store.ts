/**
 * Zustand store for managing conversations
 */

import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Conversation,
  ConversationStats,
  Feedback,
  Message,
} from "@/types";

// Regex pattern for word splitting (top-level for performance)
const WORD_SPLIT_REGEX = /\s+/;

type ConversationState = {
  // State
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isRecording: boolean;
  isTranscribing: boolean;
  isProcessing: boolean;

  // Actions
  startNewConversation: (scenarioId?: string, title?: string) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  addFeedback: (messageId: string, feedback: Feedback[]) => void;
  setRecording: (isRecording: boolean) => void;
  setTranscribing: (isTranscribing: boolean) => void;
  setProcessing: (isProcessing: boolean) => void;
  endConversation: () => void;
  loadConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  clearCurrentConversation: () => void;
};

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentConversation: null,
      conversations: [],
      isRecording: false,
      isTranscribing: false,
      isProcessing: false,

      // Start a new conversation
      startNewConversation: (scenarioId?: string, title?: string) => {
        const newConversation: Conversation = {
          id: nanoid(),
          title: title || `Conversation ${new Date().toLocaleDateString()}`,
          messages: [],
          scenarioId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set({ currentConversation: newConversation });
      },

      // Add a new message to the current conversation
      addMessage: (message) => {
        const { currentConversation } = get();
        if (!currentConversation) {
          return;
        }

        const newMessage: Message = {
          ...message,
          id: nanoid(),
          timestamp: new Date(),
        };

        const updatedConversation: Conversation = {
          ...currentConversation,
          messages: [...currentConversation.messages, newMessage],
          updatedAt: new Date(),
        };

        set({ currentConversation: updatedConversation });
      },

      // Update an existing message
      updateMessage: (messageId, updates) => {
        const { currentConversation } = get();
        if (!currentConversation) {
          return;
        }

        const updatedMessages = currentConversation.messages.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        );

        const updatedConversation: Conversation = {
          ...currentConversation,
          messages: updatedMessages,
          updatedAt: new Date(),
        };

        set({ currentConversation: updatedConversation });
      },

      // Add feedback to a message
      addFeedback: (messageId, feedback) => {
        const { currentConversation } = get();
        if (!currentConversation) {
          return;
        }

        const updatedMessages = currentConversation.messages.map((msg) =>
          msg.id === messageId ? { ...msg, feedback } : msg
        );

        const updatedConversation: Conversation = {
          ...currentConversation,
          messages: updatedMessages,
          updatedAt: new Date(),
        };

        set({ currentConversation: updatedConversation });
      },

      // Set recording state
      setRecording: (isRecording) => set({ isRecording }),

      // Set transcribing state
      setTranscribing: (isTranscribing) => set({ isTranscribing }),

      // Set processing state
      setProcessing: (isProcessing) => set({ isProcessing }),

      // End the current conversation and save it
      endConversation: () => {
        const { currentConversation, conversations } = get();
        if (!currentConversation) {
          return;
        }

        // Calculate stats
        const stats = calculateConversationStats(currentConversation);
        const finalConversation: Conversation = {
          ...currentConversation,
          stats,
          updatedAt: new Date(),
        };

        // Add to conversations list or update existing
        const existingIndex = conversations.findIndex(
          (c) => c.id === finalConversation.id
        );
        let updatedConversations: Conversation[];

        if (existingIndex >= 0) {
          updatedConversations = [...conversations];
          updatedConversations[existingIndex] = finalConversation;
        } else {
          updatedConversations = [finalConversation, ...conversations];
        }

        set({
          conversations: updatedConversations,
          currentConversation: null,
        });
      },

      // Load a conversation from history
      loadConversation: (conversationId) => {
        const { conversations } = get();
        const conversation = conversations.find((c) => c.id === conversationId);

        if (conversation) {
          set({ currentConversation: conversation });
        }
      },

      // Delete a conversation
      deleteConversation: (conversationId) => {
        const { conversations, currentConversation } = get();

        const updatedConversations = conversations.filter(
          (c) => c.id !== conversationId
        );

        set({
          conversations: updatedConversations,
          currentConversation:
            currentConversation?.id === conversationId
              ? null
              : currentConversation,
        });
      },

      // Clear current conversation without saving
      clearCurrentConversation: () => {
        set({ currentConversation: null });
      },
    }),
    {
      name: "conversation-storage",
      // Only persist conversations, not UI states
      partialize: (state) => ({
        conversations: state.conversations,
      }),
    }
  )
);

/**
 * Calculate conversation statistics
 */
function calculateConversationStats(
  conversation: Conversation
): ConversationStats {
  const userMessages = conversation.messages.filter((m) => m.role === "user");

  // Calculate duration (time between first and last message)
  const lastMessage = conversation.messages.at(-1);
  const firstMessage = conversation.messages[0];
  const duration =
    lastMessage && firstMessage
      ? (lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime()) /
        1000
      : 0;

  // Count words in user messages
  const wordCount = userMessages.reduce((count, message) => {
    return count + message.content.split(WORD_SPLIT_REGEX).length;
  }, 0);

  // Count errors from feedback
  const errorCount = userMessages.reduce((count, message) => {
    const errors =
      message.feedback?.filter((f) => f.severity === "error").length || 0;
    return count + errors;
  }, 0);

  // Calculate improvement score (simple algorithm)
  // Higher score for more words, fewer errors
  const improvementScore = Math.max(
    0,
    Math.min(100, Math.round(100 - (errorCount / Math.max(1, wordCount)) * 100))
  );

  return {
    duration,
    wordCount,
    errorCount,
    improvementScore,
  };
}
