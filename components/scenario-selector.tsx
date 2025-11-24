"use client";

import { useState, useEffect } from "react";
import { BookOpen, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatScenarioData } from "@/lib/db/schema";

interface ScenarioSelectorProps {
  value: ChatScenarioData | null;
  onChange: (scenario: ChatScenarioData | null) => void;
  disabled?: boolean;
}

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
  const [isOpen, setIsOpen] = useState(false);
  const [scenarios, setScenarios] = useState<ChatScenarioData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && scenarios.length === 0) {
      loadScenarios();
    }
  }, [isOpen, scenarios.length]);

  async function loadScenarios() {
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
  }

  function handleSelect(scenario: ChatScenarioData) {
    onChange(scenario);
    setIsOpen(false);
  }

  function handleClear() {
    onChange(null);
  }

  return (
    <>
      {value ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsOpen(true)}
            disabled={disabled}
          >
            <span className="text-lg">{value.icon}</span>
            <span className="hidden sm:inline max-w-[150px] truncate">
              {value.title}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Choose Scenario</span>
        </Button>
      )}

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh]">
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free conversation option */}
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !value ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💬</span>
                      <CardTitle className="text-lg">Free Conversation</CardTitle>
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
                    key={scenario.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      value?.id === scenario.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleSelect(scenario)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{scenario.icon}</span>
                        <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {scenario.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge
                          className={DIFFICULTY_COLORS[scenario.difficulty]}
                          variant="secondary"
                        >
                          {scenario.difficulty}
                        </Badge>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {scenario.suggestedDuration} min
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {scenario.focusAreas.slice(0, 3).map((area) => (
                          <Badge key={area} variant="outline" className="text-xs">
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

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
