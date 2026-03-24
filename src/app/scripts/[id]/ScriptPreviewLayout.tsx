"use client";

import { type ReactNode } from "react";
import { PdfPreview } from "./PdfPreview";
import type { PdfOptions } from "@/lib/botc/types";

interface ScriptPreviewLayoutProps {
  rawJson: unknown;
  options?: PdfOptions;
  defaultColor?: string;
  onAppearanceChange?: (appearance: PdfOptions["appearance"], iconScale: number) => void;
  sidebar: ReactNode;
  sidebarPosition?: "left" | "right";
  className?: string;
}

export function ScriptPreviewLayout({
  rawJson,
  options,
  defaultColor,
  onAppearanceChange,
  sidebar,
  sidebarPosition = "right",
  className,
}: ScriptPreviewLayoutProps) {
  const preview = (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <PdfPreview
        rawJson={rawJson}
        options={options}
        defaultColor={defaultColor}
        className="w-full"
        onAppearanceChange={onAppearanceChange}
      />
    </div>
  );

  const side = (
    <div className={`shrink-0 w-80 overflow-y-auto p-4 ${sidebarPosition === "left" ? "border-r" : "border-l"}`}>
      {sidebar}
    </div>
  );

  return (
    <div className={`flex ${className ?? ""}`}>
      {sidebarPosition === "left" ? (
        <>
          {side}
          {preview}
        </>
      ) : (
        <>
          {preview}
          {side}
        </>
      )}
    </div>
  );
}
