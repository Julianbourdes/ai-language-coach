"use client";

/**
 * Compact feedback display for messages in chat
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { FeedbackResponse, LanguageFeedback } from "@/lib/types/language-coach";
import { HighlightText } from "./highlight-text";

interface MessageFeedbackProps {
  text: string;
  feedback: FeedbackResponse;
  className?: string;
}

export function MessageFeedback({ text, feedback, className = "" }: MessageFeedbackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const errorCount = feedback.corrections.filter((c) => c.severity === "error").length;
  const warningCount = feedback.corrections.filter((c) => c.severity === "warning").length;
  const suggestionCount = feedback.corrections.filter((c) => c.severity === "suggestion").length;

  const hasIssues = feedback.corrections.length > 0;

  return (
    <div className={`rounded-lg border bg-muted/30 ${className}`}>
      {/* Header with score and toggle */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {hasIssues ? (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Score: {feedback.overallScore}%
            </span>
            <Progress
              value={feedback.overallScore}
              className="w-20 h-2"
            />
          </div>
          {hasIssues && (
            <div className="flex gap-1">
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errorCount} error{errorCount > 1 ? "s" : ""}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {warningCount} warning{warningCount > 1 ? "s" : ""}
                </Badge>
              )}
              {suggestionCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {suggestionCount} tip{suggestionCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t p-3 space-y-3">
          {/* Highlighted text */}
          <div className="rounded-lg bg-background p-3">
            <HighlightText text={text} feedback={feedback.corrections} />
          </div>

          {/* Summary */}
          {feedback.summary && (
            <p className="text-sm text-muted-foreground">{feedback.summary}</p>
          )}

          {/* Corrections list */}
          {hasIssues && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Corrections
              </p>
              {feedback.corrections.map((correction, index) => (
                <CorrectionItem key={correction.id || index} correction={correction} />
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
      className={`border-l-2 ${severityColors[correction.severity]} bg-background rounded-r-lg p-2 text-sm`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="line-through text-muted-foreground">
              {correction.original}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {correction.suggestion}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{correction.explanation}</p>
        </div>
        <Badge variant="outline" className="text-xs capitalize shrink-0">
          {correction.type}
        </Badge>
      </div>
    </div>
  );
}
