'use client';

/**
 * Main Language Coach Chat Component
 * Integrates voice recording, AI chat, and feedback highlighting
 */

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { VoiceRecorder } from './voice/voice-recorder';
import { HighlightText } from './feedback/highlight-text';
import { FeedbackPanel } from './feedback/feedback-panel';
import { ScenariosModal } from './scenarios/scenarios-modal';
import { Button } from './ui/button';
import { useConversationStore } from '@/lib/store/conversation-store';
import { useScenarioStore, LANGUAGES, type Language } from '@/lib/store/scenario-store';
import { Loader2, Send, List, Volume2, VolumeX, Globe } from 'lucide-react';
import { toast } from 'sonner';
import type { Feedback } from '@/types';

export function LanguageCoachChat() {
  const [input, setInput] = useState('');
  const [showScenarios, setShowScenarios] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    messageText: string;
    feedback: Feedback[];
    score: number;
  } | null>(null);

  const lastMessageCountRef = useRef(0);

  const { currentConversation, addMessage, updateMessage, addFeedback, isProcessing } =
    useConversationStore();
  const { selectedScenario, targetLanguage, setTargetLanguage } = useScenarioStore();

  // Use Vercel AI SDK's useChat hook
  // ID changes with language to maintain separate conversations per language
  const { messages, sendMessage, status } = useChat({
    id: `coach-${targetLanguage}-${selectedScenario?.id || 'free'}`,
    transport: new DefaultChatTransport({
      api: '/api/ollama',
      body: {
        scenario: selectedScenario,
        targetLanguage: targetLanguage,
      },
    }),
    onError: (error) => {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please ensure Ollama is running.');
    },
  });

  // Derived loading state
  const isLoading = status === 'streaming' || status === 'submitted';

  // Reset message count when language changes
  useEffect(() => {
    lastMessageCountRef.current = 0;
  }, [targetLanguage, selectedScenario]);

  // TTS: Speak assistant messages when they finish streaming
  useEffect(() => {
    if (!ttsEnabled || typeof window === 'undefined') return;

    // Check if a new assistant message has been added and streaming is complete
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    const hasNewMessage = assistantMessages.length > lastMessageCountRef.current;
    const streamingComplete = status !== 'streaming' && status !== 'submitted';

    if (hasNewMessage && streamingComplete && assistantMessages.length > 0) {
      const latestMessage = assistantMessages[assistantMessages.length - 1];
      const textContent =
        latestMessage.parts
          ?.map((part: any) => part.type === 'text' && part.text)
          .filter(Boolean)
          .join('') || '';

      if (textContent.trim()) {
        // Use Web Speech API to speak the text
        const utterance = new SpeechSynthesisUtterance(textContent);
        utterance.lang = LANGUAGES[targetLanguage].voiceLang;
        utterance.rate = 0.9; // Slightly slower for clarity
        window.speechSynthesis.speak(utterance);
      }

      lastMessageCountRef.current = assistantMessages.length;
    }
  }, [messages, status, ttsEnabled, targetLanguage]);

  // Handle voice transcription
  const handleVoiceTranscription = async (transcription: string, audioUrl?: string) => {
    if (!transcription.trim()) {
      toast.error('No speech detected. Please try again.');
      return;
    }

    // Set transcription in input field for user review
    setInput(transcription);
    toast.success('Transcription complete. Review and press send.');
  };

  // Handle text input
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');

    // Add user message
    sendMessage({ text: userMessage });

    // Request feedback
    await requestFeedback(userMessage);
  };

  // Request feedback for user message
  const requestFeedback = async (text: string) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          context: selectedScenario?.title,
          userLevel: 'intermediate',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get feedback');
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
      console.error('Feedback error:', error);
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
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="border-b bg-white dark:bg-gray-900 p-4 shrink-0">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div>
                <h1 className="text-xl font-semibold">AI Language Coach</h1>
                {selectedScenario && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedScenario.icon} {selectedScenario.title}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value as Language)}
                    className="appearance-none pl-9 pr-8 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    {Object.entries(LANGUAGES).map(([code, lang]) => (
                      <option key={code} value={code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowScenarios(true)}
                  size="sm"
                >
                  <List className="h-4 w-4 mr-2" />
                  Scenarios
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👋</div>
                  <h2 className="text-2xl font-semibold mb-2">Welcome to AI Language Coach!</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {selectedScenario
                      ? `You're practicing: ${selectedScenario.title}`
                      : 'Start practicing your English conversation skills'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    Use the microphone to speak or type your message below
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowScenarios(true)}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Choose a Scenario
                  </Button>
                </div>
              )}

              {messages.map((message) => {
                // Extract text content from message parts
                const textContent = message.parts
                  ?.map((part: any) => part.type === 'text' && part.text)
                  .filter(Boolean)
                  .join('') || '';

                return (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      {message.role === 'user' &&
                      currentFeedback?.messageText === textContent &&
                      currentFeedback.feedback.length > 0 ? (
                        <HighlightText text={textContent} feedback={currentFeedback.feedback} />
                      ) : (
                        <p className="whitespace-pre-wrap">{textContent}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t bg-white dark:bg-gray-900 p-4 shrink-0">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <VoiceRecorder
                  onTranscription={handleVoiceTranscription}
                  onError={handleError}
                  disabled={isLoading}
                />

                <Button
                  type="button"
                  variant={ttsEnabled ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  title={ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
                >
                  {ttsEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message or use the microphone..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />

                <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Speak naturally and get instant feedback on your English
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Feedback Panel */}
        {currentFeedback && currentFeedback.feedback.length > 0 && (
          <div className="w-96 border-l bg-gray-50 dark:bg-gray-900 overflow-y-auto shrink-0">
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
