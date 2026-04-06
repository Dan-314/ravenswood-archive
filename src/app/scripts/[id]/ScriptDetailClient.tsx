"use client";

import { type ReactNode, useState } from "react";
import { LanguageSelect } from "@/components/LanguageSelect";
import { ScriptPreviewLayout } from "./ScriptPreviewLayout";

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
  const [language, setLanguage] = useState("en");

  return (
    <ScriptPreviewLayout
      rawJson={rawJson}
      defaultColor={defaultColor}
      language={language}
      sidebarPosition="left"
      sidebar={
        <>
          {sidebar}
          <div className="flex items-center gap-2 mt-4">
            <label className="text-sm text-muted-foreground shrink-0">Language:</label>
            <div className="flex-1">
              <LanguageSelect value={language} onChange={setLanguage} />
            </div>
          </div>
        </>
      }
    />
  );
}
