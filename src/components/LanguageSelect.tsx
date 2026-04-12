"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useTranslationManifest, type LanguageEntry } from "@/lib/hooks/use-translation-manifest";

interface LanguageSelectProps {
  value: string;
  onChange: (language: string) => void;
}

function formatLabel(lang: LanguageEntry) {
  return `${lang.nativeName} — ${lang.completion}%`;
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const languages = useTranslationManifest();

  const selected = value === "en"
    ? "English"
    : languages.find((l) => l.code === value);
  const displayText = typeof selected === "string"
    ? selected
    : selected ? formatLabel(selected) : value;

  return (
    <Select value={value} onValueChange={(v) => { if (v) onChange(v); }}>
      <SelectTrigger>
        <span className="truncate">{displayText}</span>
      </SelectTrigger>
      <SelectContent className="w-auto min-w-[var(--anchor-width)]">
        <SelectItem value="en">English</SelectItem>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {formatLabel(lang)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
