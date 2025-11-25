"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, type TargetLanguage } from "@/lib/types/language-coach";

type LanguageSelectorProps = {
  value: TargetLanguage;
  onChange: (language: TargetLanguage) => void;
  disabled?: boolean;
};

export function LanguageSelector({
  value,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  console.log("[LanguageSelector] Rendering with value:", value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="gap-2"
          disabled={disabled}
          size="sm"
          variant="outline"
        >
          <span className="text-lg">{LANGUAGES[value].flag}</span>
          <span className="hidden sm:inline">{LANGUAGES[value].name}</span>
          <Languages className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Practice Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(LANGUAGES) as TargetLanguage[]).map((lang) => (
          <DropdownMenuItem
            className={value === lang ? "bg-accent" : ""}
            key={lang}
            onClick={() => {
              console.log("[LanguageSelector] Changing language to:", lang);
              onChange(lang);
            }}
          >
            <span className="mr-2 text-lg">{LANGUAGES[lang].flag}</span>
            <span>{LANGUAGES[lang].name}</span>
            {value === lang && (
              <span className="ml-auto text-muted-foreground text-xs">
                Active
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
