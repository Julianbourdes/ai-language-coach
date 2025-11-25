import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getChatById, updateChatLanguageCoachSettings } from "@/lib/db/queries";
import type { ChatScenarioData, TargetLanguage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";

export const maxDuration = 60;

/**
 * PATCH /api/chat-settings
 * Update chat language coach settings (language, scenario)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const { chatId, targetLanguage, scenarioId, scenarioData } = body as {
      chatId: string;
      targetLanguage?: TargetLanguage;
      scenarioId?: string | null;
      scenarioData?: ChatScenarioData | null;
    };

    if (!chatId) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    // Verify user owns this chat
    const chat = await getChatById({ id: chatId });
    if (!chat) {
      return new ChatSDKError("not_found:chat").toResponse();
    }
    if (chat.userId !== session.user.id) {
      return new ChatSDKError("forbidden:chat").toResponse();
    }

    // Update settings
    await updateChatLanguageCoachSettings({
      chatId,
      targetLanguage,
      scenarioId,
      scenarioData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update chat settings:", error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return new ChatSDKError("offline:chat").toResponse();
  }
}
