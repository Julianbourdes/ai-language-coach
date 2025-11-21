'use client';

/**
 * Tooltip component to display correction details
 */

import { useEffect, useRef } from 'react';
import { X, AlertCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import type { Feedback } from '@/types';

interface CorrectionTooltipProps {
  feedback: Feedback;
  position: { x: number; y: number };
  onClose: () => void;
}

export function CorrectionTooltip({ feedback, position, onClose }: CorrectionTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const Icon = getIconForType(feedback.type);
  const severityColor = getSeverityColor(feedback.severity);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${severityColor}`} />
            <span className="font-semibold text-sm capitalize">
              {feedback.type} {feedback.severity !== 'error' && `(${feedback.severity})`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Original Text */}
        <div className="mb-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original:</div>
          <div className="text-sm line-through text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded">
            {feedback.original}
          </div>
        </div>

        {/* Suggestion */}
        <div className="mb-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suggestion:</div>
          <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 p-2 rounded font-medium">
            {feedback.suggestion}
          </div>
        </div>

        {/* Explanation */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Why:</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
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
    case 'grammar':
      return AlertCircle;
    case 'vocabulary':
      return AlertTriangle;
    case 'style':
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
    case 'error':
      return 'text-red-600 dark:text-red-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'suggestion':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}
