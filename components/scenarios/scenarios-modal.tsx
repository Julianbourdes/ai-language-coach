"use client";

/**
 * Scenarios selection modal
 */

import { X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useScenarioStore } from "@/lib/store/scenario-store";
import type { Scenario } from "@/types";
import { ScenarioCard } from "./scenario-card";

type ScenariosModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ScenariosModal({ isOpen, onClose }: ScenariosModalProps) {
  const { scenarios, setScenarios, selectScenario, selectedScenario } =
    useScenarioStore();

  useEffect(() => {
    // Load scenarios from JSON file
    const loadScenarios = async () => {
      try {
        const response = await fetch("/scenarios/default-scenarios.json");
        const data = await response.json();
        setScenarios(data);
      } catch (error) {
        console.error("Failed to load scenarios:", error);
      }
    };

    if (scenarios.length === 0) {
      loadScenarios();
    }
  }, [scenarios.length, setScenarios]);

  const handleSelectScenario = (scenario: Scenario) => {
    selectScenario(scenario);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="font-semibold text-2xl">
              Choose a Practice Scenario
            </h2>
            <p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
              Select a scenario to practice specific conversation situations
            </p>
          </div>
          <Button
            className="rounded-full"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: "calc(90vh - 120px)" }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Free conversation option */}
            <button
              className={`rounded-lg border-2 p-6 text-left transition-all hover:shadow-md ${
                selectedScenario
                  ? "border-gray-200 dark:border-gray-700"
                  : "border-primary bg-primary/5"
              }`}
              onClick={() => {
                selectScenario(null);
                onClose();
              }}
              type="button"
            >
              <div className="mb-3 text-4xl">💬</div>
              <h3 className="mb-2 font-semibold text-lg">Free Conversation</h3>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                Practice open conversation without a specific scenario
              </p>
            </button>

            {/* Scenario cards */}
            {scenarios.map((scenario) => (
              <ScenarioCard
                isSelected={selectedScenario?.id === scenario.id}
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                scenario={scenario}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
