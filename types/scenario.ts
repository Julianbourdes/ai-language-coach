/**
 * Types for role-play scenarios
 */

export type ScenarioCategory = "interview" | "business" | "social" | "casual";

export type ScenarioDifficulty = "beginner" | "intermediate" | "advanced";

export type Scenario = {
  id: string;
  title: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  aiRole: string;
  systemPrompt: string;
  suggestedDuration: number; // in minutes
  focusAreas: string[];
  icon: string;
  tags: string[];
};
