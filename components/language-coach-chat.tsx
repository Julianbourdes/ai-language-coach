"use client";

/**
 * Main Language Coach Chat Component
 * Integrates voice recording, AI chat, and feedback highlighting
 */

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Globe, List, Loader2, Send, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useConversationStore } from "@/lib/store/conversation-store";
import {
  LANGUAGES,
  type Language,
  useScenarioStore,
} from "@/lib/store/scenario-store";
import type { Feedback } from "@/types";
import { FeedbackPanel } from "./feedback/feedback-panel";
import { HighlightText } from "./feedback/highlight-text";
import { ScenariosModal } from "./scenarios/scenarios-modal";
import { Button } from "./ui/button";
import { VoiceRecorder } from "./voice/voice-recorder";

export function LanguageCoachChat() {
  const [input, setInput] = useState("");
  const [showScenarios, setShowScenarios] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    messageText: string;
    feedback: Feedback[];
    score: number;
  } | null>(null);

  const lastMessageCountRef = useRef(0);
  const [_voicesLoaded, setVoicesLoaded] = useState(false);

  const {
    currentConversation: _currentConversation,
    addMessage: _addMessage,
    updateMessage: _updateMessage,
    addFeedback: _addFeedback,
    isProcessing: _isProcessing,
  } = useConversationStore();
  const { selectedScenario, targetLanguage, setTargetLanguage } =
    useScenarioStore();

  // Load voices on mount (browsers load voices asynchronously)
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };

    // Load immediately if available
    loadVoices();

    // Also listen for voiceschanged event (Chrome, Edge)
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  // Use Vercel AI SDK's useChat hook
  // ID changes with language to maintain separate conversations per language
  const { messages, sendMessage, status } = useChat({
    id: `coach-${targetLanguage}-${selectedScenario?.id || "free"}`,
    transport: new DefaultChatTransport({
      api: "/api/ollama",
      body: {
        scenario: selectedScenario,
        targetLanguage,
      },
    }),
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please ensure Ollama is running.");
    },
  });

  // Derived loading state
  const isLoading = status === "streaming" || status === "submitted";

  // Reset message count when language changes
  useEffect(() => {
    lastMessageCountRef.current = 0;
  }, []);

  // Helper function to select the best voice for a language
  const selectBestVoice = useCallback((langCode: string) => {
    if (typeof window === "undefined") {
      return null;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      return null;
    }

    // Priority order for voice selection:
    // 1. Enhanced/Premium voices (often marked with specific keywords)
    // 2. Neural voices (higher quality)
    // 3. Local voices (better performance)
    // 4. Any voice matching the language

    const langVoices = voices.filter((voice) =>
      voice.lang.startsWith(langCode)
    );

    // Look for premium/enhanced voices first
    const premiumKeywords = [
      "premium",
      "enhanced",
      "neural",
      "natural",
      "google",
      "microsoft",
    ];
    const premiumVoice = langVoices.find((voice) =>
      premiumKeywords.some((keyword) =>
        voice.name.toLowerCase().includes(keyword)
      )
    );
    if (premiumVoice) {
      return premiumVoice;
    }

    // Prefer local voices for better performance
    const localVoice = langVoices.find((voice) => voice.localService);
    if (localVoice) {
      return localVoice;
    }

    // Return any matching voice
    return langVoices[0] || null;
  }, []);

  // TTS: Speak assistant messages when they finish streaming
  useEffect(() => {
    if (!ttsEnabled || typeof window === "undefined") {
      return;
    }

    // Check if a new assistant message has been added and streaming is complete
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const hasNewMessage =
      assistantMessages.length > lastMessageCountRef.current;
    const streamingComplete = status !== "streaming" && status !== "submitted";

    if (hasNewMessage && streamingComplete && assistantMessages.length > 0) {
      const latestMessage = assistantMessages.at(-1);
      if (!latestMessage) {
        return;
      }
      const textContent =
        latestMessage.parts
          ?.map((part: any) => part.type === "text" && part.text)
          .filter(Boolean)
          .join("") || "";

      if (textContent.trim()) {
        // Use Web Speech API to speak the text
        const utterance = new SpeechSynthesisUtterance(textContent);
        const langCode = LANGUAGES[targetLanguage].voiceLang;
        utterance.lang = langCode;

        // Select the best available voice
        const bestVoice = selectBestVoice(langCode.split("-")[0]);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        // Audio settings for more natural speech
        utterance.rate = 0.95; // Slightly slower for clarity
        utterance.pitch = 1.0; // Natural pitch
        utterance.volume = 1.0; // Full volume

        window.speechSynthesis.speak(utterance);
      }

      lastMessageCountRef.current = assistantMessages.length;
    }
  }, [messages, status, ttsEnabled, targetLanguage, selectBestVoice]);

  // Handle voice transcription
  const handleVoiceTranscription = (
    transcription: string,
    _audioUrl?: string
  ) => {
    if (!transcription.trim()) {
      toast.error("No speech detected. Please try again.");
      return;
    }

    // Set transcription in input field for user review
    setInput(transcription);
    toast.success("Transcription complete. Review and press send.");
  };

  // Handle text input
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input;
    setInput("");

    // Add user message
    sendMessage({ text: userMessage });

    // Request feedback
    await requestFeedback(userMessage);
  };

  // Request feedback for user message
  const requestFeedback = async (text: string) => {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          context: selectedScenario?.title,
          userLevel: "intermediate",
          targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get feedback");
      }

      const data = await response.json();

      // Store feedback for display
      if (data.corrections && data.corrections.length > 0) {
        setCurrentFeedback({
          messageText: text,
          feedback: data.corrections,
          score: data.overallScore,
        });
      }
    } catch (error) {
      console.error("Feedback error:", error);
      // Don't show error toast for feedback - it's optional
    }
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Main Chat Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <div className="shrink-0 border-b bg-white p-4 dark:bg-gray-900">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <div>
                <h1 className="font-semibold text-xl">AI Language Coach</h1>
                {selectedScenario && (
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    {selectedScenario.icon} {selectedScenario.title}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    className="cursor-pointer appearance-none rounded-md border border-gray-300 bg-white py-2 pr-8 pl-9 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    onChange={(e) =>
                      setTargetLanguage(e.target.value as Language)
                    }
                    value={targetLanguage}
                  >
                    {Object.entries(LANGUAGES).map(([code, lang]) => (
                      <option key={code} value={code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  <Globe className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-gray-500" />
                </div>
                <Button
                  onClick={() => setShowScenarios(true)}
                  size="sm"
                  variant="outline"
                >
                  <List className="mr-2 h-4 w-4" />
                  Scenarios
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-4xl space-y-4">
              {messages.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mb-4 text-6xl">👋</div>
                  <h2 className="mb-2 font-semibold text-2xl">
                    Welcome to AI Language Coach!
                  </h2>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    {selectedScenario
                      ? `You're practicing: ${selectedScenario.title}`
                      : "Start practicing your English conversation skills"}
                  </p>
                  <p className="mb-4 text-gray-500 text-sm dark:text-gray-500">
                    Use the microphone to speak or type your message below
                  </p>
                  <Button
                    onClick={() => setShowScenarios(true)}
                    variant="outline"
                  >
                    <List className="mr-2 h-4 w-4" />
                    Choose a Scenario
                  </Button>
                </div>
              )}

              {messages.map((message) => {
                // Extract text content from message parts
                const textContent =
                  message.parts
                    ?.map((part: any) => part.type === "text" && part.text)
                    .filter(Boolean)
                    .join("") || "";

                return (
                  <div
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    key={message.id}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      {message.role === "user" &&
                      currentFeedback?.messageText === textContent &&
                      currentFeedback.feedback.length > 0 ? (
                        <HighlightText
                          feedback={currentFeedback.feedback}
                          text={textContent}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{textContent}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t bg-white p-4 dark:bg-gray-900">
            <div className="mx-auto max-w-4xl">
              <form className="flex gap-2" onSubmit={handleSubmit}>
                <VoiceRecorder
                  disabled={isLoading}
                  onError={handleError}
                  onTranscription={handleVoiceTranscription}
                />

                <Button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  size="icon"
                  title={
                    ttsEnabled
                      ? "Disable text-to-speech"
                      : "Enable text-to-speech"
                  }
                  type="button"
                  variant={ttsEnabled ? "default" : "outline"}
                >
                  {ttsEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>

                <input
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800"
                  disabled={isLoading}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message or use the microphone..."
                  type="text"
                  value={input}
                />

                <Button
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  type="submit"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>

              <p className="mt-2 text-center text-gray-500 text-xs dark:text-gray-400">
                Speak naturally and get instant feedback on your English
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Feedback Panel */}
        {currentFeedback && currentFeedback.feedback.length > 0 && (
          <div className="w-96 shrink-0 overflow-y-auto border-l bg-gray-50 dark:bg-gray-900">
            <div className="p-4">
              <FeedbackPanel
                feedback={currentFeedback.feedback}
                overallScore={currentFeedback.score}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scenarios Modal */}
      <ScenariosModal
        isOpen={showScenarios}
        onClose={() => setShowScenarios(false)}
      />
    </>
  );
}
