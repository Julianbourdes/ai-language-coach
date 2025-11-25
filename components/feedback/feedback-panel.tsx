"use client";

/**
 * Panel component to display feedback summary
 */

import { AlertCircle, AlertTriangle, Lightbulb } from "lucide-react";
import type { Feedback } from "@/types";

type FeedbackPanelProps = {
  feedback: Feedback[];
  overallScore?: number;
  className?: string;
};

export function FeedbackPanel({
  feedback,
  overallScore,
  className = "",
}: FeedbackPanelProps) {
  if (!feedback || feedback.length === 0) {
    return (
      <div
        className={`rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950 ${className}`}
      >
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <Lightbulb className="h-5 w-5" />
          <span className="font-medium">Perfect! No corrections needed.</span>
        </div>
      </div>
    );
  }

  const errors = feedback.filter((f) => f.severity === "error");
  const warnings = feedback.filter((f) => f.severity === "warning");
  const suggestions = feedback.filter((f) => f.severity === "suggestion");

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Score */}
      {overallScore !== undefined && (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-gray-700 text-sm dark:text-gray-300">
              Overall Score
            </span>
            <span className="font-bold text-gray-900 text-lg dark:text-gray-100">
              {overallScore}/100
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-2 rounded-full transition-all ${getScoreColor(overallScore)}`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Counters */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
          <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium text-xs">Errors</span>
          </div>
          <div className="mt-1 font-bold text-2xl text-red-900 dark:text-red-300">
            {errors.length}
          </div>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
          <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium text-xs">Warnings</span>
          </div>
          <div className="mt-1 font-bold text-2xl text-yellow-900 dark:text-yellow-300">
            {warnings.length}
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
            <Lightbulb className="h-4 w-4" />
            <span className="font-medium text-xs">Tips</span>
          </div>
          <div className="mt-1 font-bold text-2xl text-blue-900 dark:text-blue-300">
            {suggestions.length}
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-2">
        <div className="font-medium text-gray-700 text-sm dark:text-gray-300">
          Feedback Details
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {feedback.map((item) => (
            <div
              className={`rounded-lg border p-3 ${getFeedbackCardStyle(item.severity)}`}
              key={item.id}
            >
              <div className="flex items-start gap-2">
                {getIcon(item.type, item.severity)}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 font-medium text-gray-600 text-xs capitalize dark:text-gray-400">
                    {item.type} • {item.severity}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 line-through dark:text-gray-400">
                      {item.original}
                    </span>
                    {" → "}
                    <span className="font-medium text-green-700 dark:text-green-400">
                      {item.suggestion}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-600 text-xs dark:text-gray-400">
                    {item.explanation}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) {
    return "bg-green-500";
  }
  if (score >= 60) {
    return "bg-yellow-500";
  }
  return "bg-red-500";
}

function getFeedbackCardStyle(severity: string): string {
  switch (severity) {
    case "error":
      return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
    case "warning":
      return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
    case "suggestion":
      return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
    default:
      return "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700";
  }
}

function getIcon(type: string, severity: string) {
  const Icon =
    type === "grammar"
      ? AlertCircle
      : type === "vocabulary"
        ? AlertTriangle
        : Lightbulb;
  const colorClass =
    severity === "error"
      ? "text-red-600 dark:text-red-400"
      : severity === "warning"
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-blue-600 dark:text-blue-400";

  return <Icon className={`h-4 w-4 flex-shrink-0 ${colorClass}`} />;
}
