"use client";

import { type ReactNode, useState } from "react";
import { Loader2 } from "lucide-react";
import { LanguageSelect } from "@/components/LanguageSelect";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { ScriptPreviewLayout } from "./ScriptPreviewLayout";
import { useUserPreferences, mergePreferences } from "@/lib/useUserPreferences";
import type { PdfOptions } from "@/lib/botc/types";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";

interface ScriptDetailClientProps {
  rawJson: unknown;
  defaultColor?: string;
  sidebar: ReactNode;
}

export function ScriptDetailClient({
  rawJson,
  defaultColor,
  sidebar,
}: ScriptDetailClientProps) {
  const { preferences, loading: prefsLoading } = useUserPreferences();
  const [options, setOptions] = useState<PdfOptions>({
    ...DEFAULT_PDF_OPTIONS,
    color: defaultColor || DEFAULT_PDF_OPTIONS.color,
  });

  // Apply user preferences once loaded (runs once when prefsLoading flips to false)
  const [prefsApplied, setPrefsApplied] = useState(false);
  if (!prefsLoading && preferences && !prefsApplied) {
    setPrefsApplied(true);
    setOptions({
      ...mergePreferences(preferences),
      color: defaultColor || preferences.color || DEFAULT_PDF_OPTIONS.color,
    });
  }

  const languageSidebar = (
    <LanguageProvider language={options.language}>
      {sidebar}
      <div className="flex items-center gap-2 mt-4">
        <label className="text-sm text-muted-foreground shrink-0">Language:</label>
        <div className="flex-1">
          <LanguageSelect
            value={options.language}
            onChange={(lang) => setOptions((prev) => ({ ...prev, language: lang }))}
          />
        </div>
      </div>
    </LanguageProvider>
  );

  // Show skeleton for preview area while preferences load to avoid wrong-colors flash
  if (prefsLoading) {
    return (
      <div className="flex flex-col md:flex-row">
        <div className="shrink-0 overflow-y-auto p-4 md:w-80 md:border-r border-b md:border-b-0">
          {languageSidebar}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <ScriptPreviewLayout
      rawJson={rawJson}
      options={options}
      sidebarPosition="left"
      sidebar={languageSidebar}
    />
  );
}
