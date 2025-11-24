'use client';

/**
 * Component to display text with highlighted feedback segments
 */

import { useState } from 'react';
import type { LanguageFeedback } from '@/lib/types/language-coach';
import { CorrectionTooltip } from './correction-tooltip';

// Alias for backward compatibility
type Feedback = LanguageFeedback;

interface HighlightTextProps {
  text: string;
  feedback: Feedback[];
  className?: string;
}

interface TextSegment {
  text: string;
  feedback?: Feedback;
  index: number;
}

export function HighlightText({ text, feedback, className = '' }: HighlightTextProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Create segments from text and feedback
  const segments = createTextSegments(text, feedback);

  const handleSegmentClick = (event: React.MouseEvent, feedback: Feedback) => {
    event.preventDefault();
    setSelectedFeedback(feedback);

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
        {segments.map((segment, idx) => {
          if (segment.feedback) {
            const severityClass = getSeverityClass(segment.feedback.severity);

            return (
              <span
                key={idx}
                className={`${severityClass} cursor-pointer relative group`}
                onClick={(e) => handleSegmentClick(e, segment.feedback!)}
                title="Click for details"
              >
                {segment.text}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-current opacity-50 group-hover:opacity-100" />
              </span>
            );
          }

          return <span key={idx}>{segment.text}</span>;
        })}
      </div>

      {selectedFeedback && tooltipPosition && (
        <CorrectionTooltip
          feedback={selectedFeedback}
          position={tooltipPosition}
          onClose={handleCloseTooltip}
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
  const sortedFeedback = [...feedback].sort((a, b) => a.startIndex - b.startIndex);

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
    case 'error':
      return 'text-red-600 dark:text-red-400 font-medium';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'suggestion':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return '';
  }
}
