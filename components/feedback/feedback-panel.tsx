'use client';

/**
 * Panel component to display feedback summary
 */

import { AlertCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import type { Feedback } from '@/types';

interface FeedbackPanelProps {
  feedback: Feedback[];
  overallScore?: number;
  className?: string;
}

export function FeedbackPanel({ feedback, overallScore, className = '' }: FeedbackPanelProps) {
  if (!feedback || feedback.length === 0) {
    return (
      <div className={`p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 ${className}`}>
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <Lightbulb className="h-5 w-5" />
          <span className="font-medium">Perfect! No corrections needed.</span>
        </div>
      </div>
    );
  }

  const errors = feedback.filter((f) => f.severity === 'error');
  const warnings = feedback.filter((f) => f.severity === 'warning');
  const suggestions = feedback.filter((f) => f.severity === 'suggestion');

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Score */}
      {overallScore !== undefined && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Score
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {overallScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getScoreColor(overallScore)}`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Counters */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Errors</span>
          </div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-300 mt-1">
            {errors.length}
          </div>
        </div>

        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Warnings</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300 mt-1">
            {warnings.length}
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
            <Lightbulb className="h-4 w-4" />
            <span className="text-xs font-medium">Tips</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
            {suggestions.length}
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Feedback Details
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {feedback.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border ${getFeedbackCardStyle(item.severity)}`}
            >
              <div className="flex items-start gap-2">
                {getIcon(item.type, item.severity)}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium capitalize text-gray-600 dark:text-gray-400 mb-1">
                    {item.type} • {item.severity}
                  </div>
                  <div className="text-sm">
                    <span className="line-through text-gray-600 dark:text-gray-400">
                      {item.original}
                    </span>
                    {' → '}
                    <span className="font-medium text-green-700 dark:text-green-400">
                      {item.suggestion}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getFeedbackCardStyle(severity: string): string {
  switch (severity) {
    case 'error':
      return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
    case 'suggestion':
      return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    default:
      return 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700';
  }
}

function getIcon(type: string, severity: string) {
  const Icon = type === 'grammar' ? AlertCircle : type === 'vocabulary' ? AlertTriangle : Lightbulb;
  const colorClass =
    severity === 'error'
      ? 'text-red-600 dark:text-red-400'
      : severity === 'warning'
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-blue-600 dark:text-blue-400';

  return <Icon className={`h-4 w-4 flex-shrink-0 ${colorClass}`} />;
}
