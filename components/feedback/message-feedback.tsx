"use client";

/**
 * Compact feedback display for messages in chat
 */

import { AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type {
  FeedbackResponse,
  LanguageFeedback,
} from "@/lib/types/language-coach";
import { HighlightText } from "./highlight-text";

type MessageFeedbackProps = {
  text: string;
  feedback: FeedbackResponse;
  className?: string;
};

export function MessageFeedback({
  text,
  feedback,
  className = "",
}: MessageFeedbackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const errorCount = feedback.corrections.filter(
    (c) => c.severity === "error"
  ).length;
  const warningCount = feedback.corrections.filter(
    (c) => c.severity === "warning"
  ).length;
  const suggestionCount = feedback.corrections.filter(
    (c) => c.severity === "suggestion"
  ).length;

  const hasIssues = feedback.corrections.length > 0;

  return (
    <div className={`rounded-lg border bg-muted/30 ${className}`}>
      {/* Header with score and toggle */}
      <button
        className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent p-3 text-left transition-colors hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        type="button"
      >
        <div className="flex items-center gap-3">
          {hasIssues ? (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              Score: {feedback.overallScore}%
            </span>
            <Progress className="h-2 w-20" value={feedback.overallScore} />
          </div>
          {hasIssues && (
            <div className="flex gap-1">
              {errorCount > 0 && (
                <Badge className="text-xs" variant="destructive">
                  {errorCount} error{errorCount > 1 ? "s" : ""}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge
                  className="bg-yellow-100 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  variant="secondary"
                >
                  {warningCount} warning{warningCount > 1 ? "s" : ""}
                </Badge>
              )}
              {suggestionCount > 0 && (
                <Badge className="text-xs" variant="secondary">
                  {suggestionCount} tip{suggestionCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-3 border-t p-3">
          {/* Highlighted text */}
          <div className="rounded-lg bg-background p-3">
            <HighlightText feedback={feedback.corrections} text={text} />
          </div>

          {/* Summary */}
          {feedback.summary && (
            <p className="text-muted-foreground text-sm">{feedback.summary}</p>
          )}

          {/* Corrections list */}
          {hasIssues && (
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground text-xs uppercase">
                Corrections
              </p>
              {feedback.corrections.map((correction, index) => (
                <CorrectionItem
                  correction={correction}
                  key={correction.id || index}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CorrectionItem({ correction }: { correction: LanguageFeedback }) {
  const severityColors = {
    error: "border-l-red-500",
    warning: "border-l-yellow-500",
    suggestion: "border-l-blue-500",
  };

  return (
    <div
      className={`border-l-2 ${severityColors[correction.severity]} rounded-r-lg bg-background p-2 text-sm`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-muted-foreground line-through">
              {correction.original}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {correction.suggestion}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            {correction.explanation}
          </p>
        </div>
        <Badge className="shrink-0 text-xs capitalize" variant="outline">
          {correction.type}
        </Badge>
      </div>
    </div>
  );
}
