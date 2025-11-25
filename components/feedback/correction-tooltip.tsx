"use client";

/**
 * Tooltip component to display correction details
 */

import { AlertCircle, AlertTriangle, Lightbulb, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { LanguageFeedback } from "@/lib/types/language-coach";

// Alias for backward compatibility
type Feedback = LanguageFeedback;

type CorrectionTooltipProps = {
  feedback: Feedback;
  position: { x: number; y: number };
  onClose: () => void;
};

export function CorrectionTooltip({
  feedback,
  position,
  onClose,
}: CorrectionTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const Icon = getIconForType(feedback.type);
  const severityColor = getSeverityColor(feedback.severity);

  return (
    <>
      {/* Backdrop */}
      <button
        aria-label="Close tooltip"
        className="fixed inset-0 z-40 border-none bg-black/20"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
        tabIndex={0}
        type="button"
      />

      {/* Tooltip */}
      <div
        className="fade-in slide-in-from-top-2 fixed z-50 w-80 animate-in rounded-lg border border-gray-200 bg-white p-4 shadow-lg duration-200 dark:border-gray-700 dark:bg-gray-800"
        ref={tooltipRef}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -100%)",
        }}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${severityColor}`} />
            <span className="font-semibold text-sm capitalize">
              {feedback.type}{" "}
              {feedback.severity !== "error" && `(${feedback.severity})`}
            </span>
          </div>
          <button
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Original Text */}
        <div className="mb-3">
          <div className="mb-1 text-gray-500 text-xs dark:text-gray-400">
            Original:
          </div>
          <div className="rounded bg-gray-50 p-2 text-gray-600 text-sm line-through dark:bg-gray-900 dark:text-gray-300">
            {feedback.original}
          </div>
        </div>

        {/* Suggestion */}
        <div className="mb-3">
          <div className="mb-1 text-gray-500 text-xs dark:text-gray-400">
            Suggestion:
          </div>
          <div className="rounded bg-green-50 p-2 font-medium text-green-700 text-sm dark:bg-green-950 dark:text-green-400">
            {feedback.suggestion}
          </div>
        </div>

        {/* Explanation */}
        <div>
          <div className="mb-1 text-gray-500 text-xs dark:text-gray-400">
            Why:
          </div>
          <div className="text-gray-700 text-sm dark:text-gray-300">
            {feedback.explanation}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Get icon component for feedback type
 */
function getIconForType(type: string) {
  switch (type) {
    case "grammar":
      return AlertCircle;
    case "vocabulary":
      return AlertTriangle;
    case "style":
      return Lightbulb;
    default:
      return AlertCircle;
  }
}

/**
 * Get color class for severity
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case "error":
      return "text-red-600 dark:text-red-400";
    case "warning":
      return "text-yellow-600 dark:text-yellow-400";
    case "suggestion":
      return "text-blue-600 dark:text-blue-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}
