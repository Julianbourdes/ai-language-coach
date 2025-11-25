"use client";

import { Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatScenarioData } from "@/lib/db/schema";

type ScenarioSelectorProps = {
  value: ChatScenarioData | null;
  onChange: (scenario: ChatScenarioData | null) => void;
  disabled?: boolean;
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function ScenarioSelector({
  value,
  onChange,
  disabled = false,
}: ScenarioSelectorProps) {
  console.log(
    "[ScenarioSelector] Rendering with value:",
    value?.title || "Free Conversation"
  );

  const [isOpen, setIsOpen] = useState(false);
  const [scenarios, setScenarios] = useState<ChatScenarioData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadScenarios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/scenarios/default-scenarios.json");
      const data = await response.json();
      setScenarios(data);
    } catch (error) {
      console.error("Failed to load scenarios:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && scenarios.length === 0) {
      loadScenarios();
    }
  }, [isOpen, scenarios.length, loadScenarios]);

  function handleSelect(scenario: ChatScenarioData) {
    console.log("[ScenarioSelector] Selecting scenario:", scenario.title);
    onChange(scenario);
    setIsOpen(false);
  }

  function _handleClear() {
    console.log("[ScenarioSelector] Clearing scenario");
    onChange(null);
  }

  return (
    <>
      <Button
        className="gap-2"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="outline"
      >
        <span className="text-lg">{value ? value.icon : "💬"}</span>
        <span className="hidden max-w-[150px] truncate sm:inline">
          {value ? value.title : "Free Conversation"}
        </span>
      </Button>

      <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
        <AlertDialogContent className="max-h-[80vh] max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Choose a Practice Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Select a scenario to practice specific conversation skills. The AI
              will play the described role.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ScrollArea className="h-[50vh] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Free conversation option */}
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    value ? "" : "ring-2 ring-primary"
                  }`}
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💬</span>
                      <CardTitle className="text-lg">
                        Free Conversation
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Practice natural conversation without a specific scenario
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">All levels</Badge>
                  </CardContent>
                </Card>

                {/* Scenario cards */}
                {scenarios.map((scenario) => (
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      value?.id === scenario.id ? "ring-2 ring-primary" : ""
                    }`}
                    key={scenario.id}
                    onClick={() => handleSelect(scenario)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{scenario.icon}</span>
                        <CardTitle className="text-lg">
                          {scenario.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {scenario.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={DIFFICULTY_COLORS[scenario.difficulty]}
                          variant="secondary"
                        >
                          {scenario.difficulty}
                        </Badge>
                        <div className="flex items-center text-muted-foreground text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          {scenario.suggestedDuration} min
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {scenario.focusAreas.slice(0, 3).map((area) => (
                          <Badge
                            className="text-xs"
                            key={area}
                            variant="outline"
                          >
                            {area.replace(/-/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setIsOpen(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
