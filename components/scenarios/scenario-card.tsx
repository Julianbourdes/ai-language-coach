"use client";

/**
 * Card component for displaying a scenario
 */

import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Scenario } from "@/types";

type ScenarioCardProps = {
  scenario: Scenario;
  isSelected?: boolean;
  onClick?: () => void;
  onSelect?: (scenario: Scenario) => void;
};

export function ScenarioCard({
  scenario,
  isSelected,
  onClick,
  onSelect,
}: ScenarioCardProps) {
  const handleClick = () => {
    onClick?.();
    onSelect?.(scenario);
  };

  return (
    <Card
      className={`group cursor-pointer p-6 transition-all hover:shadow-lg ${
        isSelected ? "border-2 border-primary bg-primary/5" : ""
      }`}
      onClick={handleClick}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="text-4xl">{scenario.icon}</div>
          <Badge variant={getDifficultyVariant(scenario.difficulty)}>
            {scenario.difficulty}
          </Badge>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="mb-2 font-semibold text-lg transition-colors group-hover:text-primary">
            {scenario.title}
          </h3>
          <p className="line-clamp-2 text-gray-600 text-sm dark:text-gray-400">
            {scenario.description}
          </p>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-gray-500 text-sm dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{scenario.suggestedDuration} min</span>
          </div>
          <div className="capitalize">{scenario.category}</div>
        </div>

        {/* Focus Areas */}
        <div className="flex flex-wrap gap-1">
          {scenario.focusAreas.slice(0, 3).map((area) => (
            <Badge className="text-xs" key={area} variant="outline">
              {area}
            </Badge>
          ))}
          {scenario.focusAreas.length > 3 && (
            <Badge className="text-xs" variant="outline">
              +{scenario.focusAreas.length - 3}
            </Badge>
          )}
        </div>

        {/* Action */}
        {!isSelected && (
          <Button
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            variant="default"
          >
            Start Practice
          </Button>
        )}
        {isSelected && (
          <div className="text-center font-medium text-primary text-sm">
            ✓ Currently Selected
          </div>
        )}
      </div>
    </Card>
  );
}

function getDifficultyVariant(
  difficulty: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (difficulty) {
    case "beginner":
      return "secondary";
    case "intermediate":
      return "default";
    case "advanced":
      return "destructive";
    default:
      return "outline";
  }
}
