"use client";

/**
 * Scenarios selection page
 */

import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScenarioCard } from "@/components/scenarios/scenario-card";
import { Button } from "@/components/ui/button";
import { useConversationStore } from "@/lib/store/conversation-store";
import { useScenarioStore } from "@/lib/store/scenario-store";
import type { Scenario } from "@/types";

export default function ScenariosPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { scenarios, setScenarios, selectScenario } = useScenarioStore();
  const { startNewConversation } = useConversationStore();

  // Load scenarios on mount
  useEffect(() => {
    async function loadScenarios() {
      try {
        const response = await fetch("/scenarios/default-scenarios.json");
        const data: Scenario[] = await response.json();
        setScenarios(data);
      } catch (error) {
        console.error("Failed to load scenarios:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (scenarios.length === 0) {
      loadScenarios();
    } else {
      setIsLoading(false);
    }
  }, [scenarios.length, setScenarios]);

  const handleSelectScenario = (scenario: Scenario) => {
    selectScenario(scenario);
    startNewConversation(scenario.id, `${scenario.title} Practice`);
    router.push("/");
  };

  const handleFreeConversation = () => {
    selectScenario(null);
    startNewConversation();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            className="mb-4"
            onClick={() => router.push("/")}
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chat
          </Button>

          <h1 className="mb-2 font-bold text-3xl">
            Choose a Practice Scenario
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select a role-play scenario to practice specific situations, or
            start a free conversation.
          </p>
        </div>

        {/* Free Conversation Option */}
        <div className="mb-8">
          <Button
            className="w-full sm:w-auto"
            onClick={handleFreeConversation}
            size="lg"
            variant="outline"
          >
            💬 Start Free Conversation
          </Button>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              onSelect={handleSelectScenario}
              scenario={scenario}
            />
          ))}
        </div>

        {/* Empty State */}
        {scenarios.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No scenarios available. Please check your configuration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
