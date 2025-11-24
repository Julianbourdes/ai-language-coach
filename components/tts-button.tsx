"use client";

/**
 * Text-to-Speech button component for reading messages aloud
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGES, type TargetLanguage } from "@/lib/types/language-coach";

interface TTSButtonProps {
  text: string;
  language: TargetLanguage;
  disabled?: boolean;
  size?: "default" | "sm" | "icon";
}

export function TTSButton({
  text,
  language,
  disabled = false,
  size = "icon",
}: TTSButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Select the best voice for the language
  const selectBestVoice = useCallback((langCode: string) => {
    if (typeof window === "undefined") return null;

    const voices = window.speechSynthesis.getVoices();
    const langVoices = voices.filter((v) =>
      v.lang.toLowerCase().startsWith(langCode.toLowerCase())
    );

    if (langVoices.length === 0) return null;

    // Priority: Premium/Enhanced voices > Local voices > Any voice
    const premiumKeywords = ["premium", "enhanced", "neural", "natural"];
    const premiumVoice = langVoices.find((v) =>
      premiumKeywords.some((k) => v.name.toLowerCase().includes(k))
    );

    if (premiumVoice) return premiumVoice;

    // Prefer local voices
    const localVoice = langVoices.find((v) => v.localService);
    if (localVoice) return localVoice;

    return langVoices[0];
  }, []);

  const handleSpeak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // If already speaking, stop
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsLoading(true);

    const langConfig = LANGUAGES[language];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langConfig.voiceLang;

    // Get voices - might need to wait for them to load
    const setVoiceAndSpeak = () => {
      const voice = selectBestVoice(langConfig.voiceLang.split("-")[0]);
      if (voice) {
        utterance.voice = voice;
      }

      // Slightly slower rate for language learning
      utterance.rate = 0.95;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsLoading(false);
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsLoading(false);
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // Check if voices are loaded
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = () => {
        setVoiceAndSpeak();
      };
    }
  }, [text, language, isSpeaking, selectBestVoice]);

  const buttonSize = size === "sm" ? "h-6 w-6" : size === "icon" ? "h-8 w-8" : "";

  return (
    <Button
      type="button"
      onClick={handleSpeak}
      disabled={disabled || !text}
      variant="ghost"
      size="icon"
      className={`${buttonSize} transition-colors ${
        isSpeaking
          ? "text-primary hover:text-primary/80"
          : "text-muted-foreground hover:text-foreground"
      }`}
      title={isSpeaking ? "Stop speaking" : "Read aloud"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSpeaking ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}
