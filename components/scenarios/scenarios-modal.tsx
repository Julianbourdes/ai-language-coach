'use client';

/**
 * Scenarios selection modal
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScenarioCard } from './scenario-card';
import { useScenarioStore } from '@/lib/store/scenario-store';
import type { Scenario } from '@/types';

interface ScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScenariosModal({ isOpen, onClose }: ScenariosModalProps) {
  const { scenarios, setScenarios, selectScenario, selectedScenario } = useScenarioStore();

  useEffect(() => {
    // Load scenarios from JSON file
    const loadScenarios = async () => {
      try {
        const response = await fetch('/scenarios/default-scenarios.json');
        const data = await response.json();
        setScenarios(data);
      } catch (error) {
        console.error('Failed to load scenarios:', error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">Choose a Practice Scenario</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Select a scenario to practice specific conversation situations
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free conversation option */}
            <button
              onClick={() => {
                selectScenario(null);
                onClose();
              }}
              className={`text-left p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                !selectedScenario
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-lg font-semibold mb-2">Free Conversation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Practice open conversation without a specific scenario
              </p>
            </button>

            {/* Scenario cards */}
            {scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isSelected={selectedScenario?.id === scenario.id}
                onClick={() => handleSelectScenario(scenario)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
