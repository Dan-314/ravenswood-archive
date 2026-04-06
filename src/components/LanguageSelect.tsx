"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageEntry {
  code: string;
  name: string;
  nativeName: string;
  completion: number;
}

interface LanguageSelectProps {
  value: string;
  onChange: (language: string) => void;
}

let manifestCache: LanguageEntry[] | null = null;

function formatLabel(lang: LanguageEntry) {
  if (lang.completion >= 100) return lang.nativeName;
  return `${lang.nativeName} — ${lang.completion}%`;
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const [languages, setLanguages] = useState<LanguageEntry[]>(manifestCache ?? []);

  useEffect(() => {
    if (manifestCache) return;

    fetch("/translations/manifest.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load manifest");
        return res.json();
      })
      .then((data: LanguageEntry[]) => {
        manifestCache = data;
        setLanguages(data);
      })
      .catch(() => {
        // No translations available — component shows only English
      });
  }, []);

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
        {languages.filter((l) => l.code !== "en@pirate").map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {formatLabel(lang)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
