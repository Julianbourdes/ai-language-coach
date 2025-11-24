import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { TargetLanguage, ChatScenarioData } from "@/lib/db/schema";
import { generateUUID } from "@/lib/utils";
import { auth } from "../(auth)/auth";

// Load scenarios from JSON (server-side)
import scenariosJson from "@/public/scenarios/default-scenarios.json";

interface PageProps {
  searchParams: Promise<{
    lang?: string;
    scenario?: string;
    coach?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");
  const chatModel = modelIdFromCookie?.value ?? DEFAULT_CHAT_MODEL;

  // Parse search params for Language Coach mode
  const params = await searchParams;
  const isCoachMode = params.coach === "true" || params.lang !== undefined;

  // Get language (default to 'en' in coach mode)
  let targetLanguage: TargetLanguage | undefined;
  if (isCoachMode) {
    const langParam = params.lang as string | undefined;
    if (langParam === "en" || langParam === "fr" || langParam === "es") {
      targetLanguage = langParam;
    } else {
      targetLanguage = "en";
    }
  }

  // Get scenario data if specified
  let scenarioData: ChatScenarioData | null = null;
  if (params.scenario && isCoachMode) {
    const scenarios = scenariosJson as ChatScenarioData[];
    scenarioData = scenarios.find((s) => s.id === params.scenario) || null;
  }

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={chatModel}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
        // Language Coach fields - only set if in coach mode
        initialTargetLanguage={isCoachMode ? targetLanguage : undefined}
        initialScenarioData={isCoachMode ? scenarioData : undefined}
      />
      <DataStreamHandler />
    </>
  );
}
