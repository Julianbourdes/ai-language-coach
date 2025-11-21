/**
 * Zustand store for managing scenarios
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Scenario } from '@/types';

interface ScenarioState {
  // State
  scenarios: Scenario[];
  selectedScenario: Scenario | null;

  // Actions
  setScenarios: (scenarios: Scenario[]) => void;
  selectScenario: (scenario: Scenario | null) => void;
  addCustomScenario: (scenario: Scenario) => void;
  deleteScenario: (scenarioId: string) => void;
  getScenarioById: (scenarioId: string) => Scenario | undefined;
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      // Initial state
      scenarios: [],
      selectedScenario: null,

      // Set scenarios (typically loaded from JSON)
      setScenarios: (scenarios) => set({ scenarios }),

      // Select a scenario for the next conversation
      selectScenario: (scenario) => set({ selectedScenario: scenario }),

      // Add a custom user-created scenario
      addCustomScenario: (scenario) => {
        const { scenarios } = get();
        set({ scenarios: [...scenarios, scenario] });
      },

      // Delete a scenario (only custom ones should be deletable)
      deleteScenario: (scenarioId) => {
        const { scenarios, selectedScenario } = get();

        const updatedScenarios = scenarios.filter((s) => s.id !== scenarioId);

        set({
          scenarios: updatedScenarios,
          selectedScenario:
            selectedScenario?.id === scenarioId ? null : selectedScenario,
        });
      },

      // Get a scenario by ID
      getScenarioById: (scenarioId) => {
        const { scenarios } = get();
        return scenarios.find((s) => s.id === scenarioId);
      },
    }),
    {
      name: 'scenario-storage',
    }
  )
);
