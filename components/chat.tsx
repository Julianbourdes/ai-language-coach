"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatHeader } from "@/components/chat-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { ChatScenarioData, TargetLanguage, Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage, FeedbackResponse } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { LanguageSelector } from "./language-selector";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { ScenarioSelector } from "./scenario-selector";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialLastContext,
  // Language Coach fields
  initialTargetLanguage,
  initialScenarioData,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
  // Language Coach fields - null means it's a regular chat, not language coach
  initialTargetLanguage?: TargetLanguage | null;
  initialScenarioData?: ChatScenarioData | null;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  // Language Coach state
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(
    initialTargetLanguage || "en"
  );
  const [scenarioData, setScenarioData] = useState<ChatScenarioData | null>(
    initialScenarioData || null
  );
  const targetLanguageRef = useRef(targetLanguage);
  const scenarioDataRef = useRef(scenarioData);

  console.log(
    "[Chat] Current state - targetLanguage:",
    targetLanguage,
    "scenarioData:",
    scenarioData?.title || "Free Conversation"
  );

  // Language Coach mode is always active
  const isLanguageCoachMode = true;

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  useEffect(() => {
    console.log("[Chat] targetLanguage changed to:", targetLanguage);
    targetLanguageRef.current = targetLanguage;
  }, [targetLanguage]);

  useEffect(() => {
    console.log(
      "[Chat] scenarioData changed to:",
      scenarioData?.title || "Free Conversation"
    );
    scenarioDataRef.current = scenarioData;
  }, [scenarioData]);

  const {
    messages,
    setMessages,
    sendMessage: baseSendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        return {
          body: {
            id: request.id,
            message: request.messages.at(-1),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            // Language Coach fields - only send if in language coach mode
            ...(isLanguageCoachMode && {
              targetLanguage: targetLanguageRef.current,
              scenarioId: scenarioDataRef.current?.id,
              scenarioData: scenarioDataRef.current,
            }),
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data);
      }
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        // Check if it's a credit card error
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      }
    },
  });

  // Wrapper for sendMessage that also requests feedback in Language Coach mode
  const sendMessage = useCallback(
    async (message: Parameters<typeof baseSendMessage>[0]) => {
      // Get the message ID - it should be passed from multimodal-input
      const messageId = (message as ChatMessage).id;
      console.log("[Chat] sendMessage called with messageId:", messageId);

      baseSendMessage(message);

      // In Language Coach mode, request feedback for user messages
      if (isLanguageCoachMode && message.role === "user") {
        // Get the text content from the message parts
        const textPart = message.parts.find((p) => p.type === "text");
        if (textPart && "text" in textPart) {
          console.log("[Chat] Requesting feedback for messageId:", messageId);
          try {
            const response = await fetch("/api/feedback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: textPart.text,
                targetLanguage: targetLanguageRef.current,
                context: scenarioDataRef.current?.title,
                messageId, // Include messageId to persist feedback to DB
              }),
            });

            if (response.ok) {
              const feedbackData: FeedbackResponse = await response.json();

              // Add feedback as a part to the user's message in UI state
              // The API also persists it to the DB if messageId was provided
              setMessages((currentMessages) => {
                const lastUserMessageIndex = currentMessages.findLastIndex(
                  (m) => m.role === "user"
                );
                if (lastUserMessageIndex === -1) {
                  return currentMessages;
                }

                const updatedMessages = [...currentMessages];
                const lastUserMessage = updatedMessages[lastUserMessageIndex];

                // Add feedback part to the message
                updatedMessages[lastUserMessageIndex] = {
                  ...lastUserMessage,
                  parts: [
                    ...lastUserMessage.parts,
                    {
                      type: "language-feedback" as const,
                      data: feedbackData,
                    } as any,
                  ],
                };

                return updatedMessages;
              });
            }
          } catch (error) {
            console.error("Failed to get feedback:", error);
            // Don't show error to user - feedback is optional
          }
        }
      }
    },
    [baseSendMessage, setMessages]
  );

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        >
          {/* Language Coach controls in header */}
          {isLanguageCoachMode && !isReadonly && (
            <div className="flex items-center gap-2">
              <LanguageSelector
                disabled={messages.length > 0}
                onChange={(lang) => {
                  console.log("[Chat] setTargetLanguage called with:", lang);
                  setTargetLanguage(lang);
                }}
                value={targetLanguage} // Can't change language once conversation started
              />
              <ScenarioSelector
                disabled={messages.length > 0}
                onChange={(scenario) => {
                  console.log(
                    "[Chat] setScenarioData called with:",
                    scenario?.title || "Free Conversation"
                  );
                  setScenarioData(scenario);
                }}
                value={scenarioData} // Can't change scenario once conversation started
              />
            </div>
          )}
        </ChatHeader>

        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={initialChatModel}
          setMessages={setMessages}
          status={status}
          targetLanguage={isLanguageCoachMode ? targetLanguage : undefined}
          votes={votes}
        />

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              isLanguageCoachMode={isLanguageCoachMode}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={visibilityType}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
              usage={usage}
            />
          )}
        </div>
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
