"use client";

import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { PdfPreview } from "./PdfPreview";
import type { PdfOptions } from "@/lib/botc/types";

interface ScriptPreviewLayoutProps {
  rawJson: unknown;
  options?: PdfOptions;
  defaultColor?: string;
  language?: string;
  scriptType?: "full" | "teensy";
  onAppearanceChange?: (appearance: PdfOptions["appearance"], iconScale: number) => void;
  onNightAppearanceChange?: (nightAppearance: PdfOptions["nightAppearance"]) => void;
  sidebar: ReactNode;
  sidebarPosition?: "left" | "right";
  className?: string;
  /** Show a spinner in the preview pane while keeping the sidebar mounted in
   * a stable tree position (avoids useId hydration mismatches on swap). */
  loading?: boolean;
}

export function ScriptPreviewLayout({
  rawJson,
  options,
  defaultColor,
  language,
  scriptType,
  onAppearanceChange,
  onNightAppearanceChange,
  sidebar,
  sidebarPosition = "right",
  className,
  loading = false,
}: ScriptPreviewLayoutProps) {
  const preview = (
    <div className="flex-1 min-w-0 overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PdfPreview
          rawJson={rawJson}
          options={options}
          defaultColor={defaultColor}
          language={language}
          scriptType={scriptType}
          className="w-full"
          onAppearanceChange={onAppearanceChange}
          onNightAppearanceChange={onNightAppearanceChange}
        />
      )}
    </div>
  );

  const side = (
    <div className={`shrink-0 overflow-y-auto p-4 md:w-80 ${
      sidebarPosition === "left"
        ? "md:border-r border-b md:border-b-0"
        : "md:border-l border-b md:border-b-0 md:order-2"
    }`}>
      {sidebar}
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row ${className ?? ""}`}>
      {side}
      {preview}
    </div>
  );
}
