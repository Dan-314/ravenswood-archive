"use client";

import { type ReactNode, useState } from "react";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { LanguageSelectContext } from "./SidebarLanguageSelect";
import { ScriptPreviewLayout } from "./ScriptPreviewLayout";
import { useUserPreferences, mergePreferences } from "@/lib/useUserPreferences";
import type { PdfOptions } from "@/lib/botc/types";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";

interface ScriptDetailClientProps {
  rawJson: unknown;
  defaultColor?: string;
  scriptType?: "full" | "teensy";
  sidebar: ReactNode;
}

export function ScriptDetailClient({
  rawJson,
  defaultColor,
  scriptType,
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
    <LanguageSelectContext.Provider
      value={{
        language: options.language,
        onChange: (lang) => setOptions((prev) => ({ ...prev, language: lang })),
      }}
    >
      <LanguageProvider language={options.language}>{sidebar}</LanguageProvider>
    </LanguageSelectContext.Provider>
  );

  // While preferences load, ScriptPreviewLayout shows a spinner in the preview
  // pane (avoids wrong-colors flash) while keeping the sidebar in a stable tree
  // position so useId-based hydration doesn't break when loading flips.
  return (
    <ScriptPreviewLayout
      rawJson={rawJson}
      options={options}
      scriptType={scriptType}
      sidebarPosition="left"
      sidebar={languageSidebar}
      loading={prefsLoading}
    />
  );
}
