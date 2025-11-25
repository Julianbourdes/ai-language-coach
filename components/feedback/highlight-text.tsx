"use client";

/**
 * Component to display text with highlighted feedback segments
 */

import { useState } from "react";
import type { LanguageFeedback } from "@/lib/types/language-coach";
import { CorrectionTooltip } from "./correction-tooltip";

// Alias for backward compatibility
type Feedback = LanguageFeedback;

type HighlightTextProps = {
  text: string;
  feedback: Feedback[];
  className?: string;
};

type TextSegment = {
  text: string;
  feedback?: Feedback;
  index: number;
};

export function HighlightText({
  text,
  feedback,
  className = "",
}: HighlightTextProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Create segments from text and feedback
  const segments = createTextSegments(text, feedback);

  const handleSegmentClick = (
    event: React.MouseEvent,
    feedbackItem: Feedback
  ) => {
    event.preventDefault();
    setSelectedFeedback(feedbackItem);

    // Get position for tooltip
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleCloseTooltip = () => {
    setSelectedFeedback(null);
    setTooltipPosition(null);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="whitespace-pre-wrap">
        {segments.map((segment) => {
          if (segment.feedback) {
            const severityClass = getSeverityClass(segment.feedback.severity);
            const feedbackItem = segment.feedback;

            return (
              <button
                className={`${severityClass} group relative cursor-pointer border-none bg-transparent p-0 font-inherit`}
                key={`feedback-${segment.index}`}
                onClick={(e) => handleSegmentClick(e, feedbackItem)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSegmentClick(
                      e as unknown as React.MouseEvent,
                      feedbackItem
                    );
                  }
                }}
                title="Click for details"
                type="button"
              >
                {segment.text}
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-current opacity-50 group-hover:opacity-100" />
              </button>
            );
          }

          return <span key={`text-${segment.index}`}>{segment.text}</span>;
        })}
      </div>

      {selectedFeedback && tooltipPosition && (
        <CorrectionTooltip
          feedback={selectedFeedback}
          onClose={handleCloseTooltip}
          position={tooltipPosition}
        />
      )}
    </div>
  );
}

/**
 * Create text segments from feedback positions
 */
function createTextSegments(text: string, feedback: Feedback[]): TextSegment[] {
  if (!feedback || feedback.length === 0) {
    return [{ text, index: 0 }];
  }

  // Sort feedback by start position
  const sortedFeedback = [...feedback].sort(
    (a, b) => a.startIndex - b.startIndex
  );

  const segments: TextSegment[] = [];
  let currentIndex = 0;

  for (const fb of sortedFeedback) {
    // Add text before feedback
    if (currentIndex < fb.startIndex) {
      segments.push({
        text: text.slice(currentIndex, fb.startIndex),
        index: currentIndex,
      });
    }

    // Add highlighted segment
    segments.push({
      text: text.slice(fb.startIndex, fb.endIndex),
      feedback: fb,
      index: fb.startIndex,
    });

    currentIndex = fb.endIndex;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    segments.push({
      text: text.slice(currentIndex),
      index: currentIndex,
    });
  }

  return segments;
}

/**
 * Get CSS class for severity
 */
function getSeverityClass(severity: string): string {
  switch (severity) {
    case "error":
      return "text-red-600 dark:text-red-400 font-medium";
    case "warning":
      return "text-yellow-600 dark:text-yellow-400";
    case "suggestion":
      return "text-blue-600 dark:text-blue-400";
    default:
      return "";
  }
}
