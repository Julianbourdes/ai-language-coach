/**
 * Zustand store for managing scenarios
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Scenario } from '@/types';

export type Language = 'en' | 'fr' | 'es';

export const LANGUAGES: Record<Language, { name: string; flag: string; voiceLang: string }> = {
  en: { name: 'English', flag: '🇬🇧', voiceLang: 'en-US' },
  fr: { name: 'Français', flag: '🇫🇷', voiceLang: 'fr-FR' },
  es: { name: 'Español', flag: '🇪🇸', voiceLang: 'es-ES' },
};

interface ScenarioState {
  // State
  scenarios: Scenario[];
  selectedScenario: Scenario | null;
  targetLanguage: Language;

  // Actions
  setScenarios: (scenarios: Scenario[]) => void;
  selectScenario: (scenario: Scenario | null) => void;
  setTargetLanguage: (language: Language) => void;
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
      targetLanguage: 'en' as Language,

      // Set scenarios (typically loaded from JSON)
      setScenarios: (scenarios) => set({ scenarios }),

      // Select a scenario for the next conversation
      selectScenario: (scenario) => set({ selectedScenario: scenario }),

      // Set target language
      setTargetLanguage: (language) => set({ targetLanguage: language }),

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
