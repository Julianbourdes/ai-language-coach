'use client';

/**
 * Card component for displaying a scenario
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { Scenario } from '@/types';

interface ScenarioCardProps {
  scenario: Scenario;
  isSelected?: boolean;
  onClick?: () => void;
  onSelect?: (scenario: Scenario) => void;
}

export function ScenarioCard({ scenario, isSelected, onClick, onSelect }: ScenarioCardProps) {
  const handleClick = () => {
    onClick?.();
    onSelect?.(scenario);
  };

  return (
    <Card
      className={`p-6 hover:shadow-lg transition-all cursor-pointer group ${
        isSelected ? 'border-2 border-primary bg-primary/5' : ''
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
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
            {scenario.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {scenario.description}
          </p>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{scenario.suggestedDuration} min</span>
          </div>
          <div className="capitalize">{scenario.category}</div>
        </div>

        {/* Focus Areas */}
        <div className="flex flex-wrap gap-1">
          {scenario.focusAreas.slice(0, 3).map((area) => (
            <Badge key={area} variant="outline" className="text-xs">
              {area}
            </Badge>
          ))}
          {scenario.focusAreas.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{scenario.focusAreas.length - 3}
            </Badge>
          )}
        </div>

        {/* Action */}
        {!isSelected && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full"
            variant="default"
          >
            Start Practice
          </Button>
        )}
        {isSelected && (
          <div className="text-center text-sm font-medium text-primary">
            ✓ Currently Selected
          </div>
        )}
      </div>
    </Card>
  );
}

function getDifficultyVariant(
  difficulty: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (difficulty) {
    case 'beginner':
      return 'secondary';
    case 'intermediate':
      return 'default';
    case 'advanced':
      return 'destructive';
    default:
      return 'outline';
  }
}
