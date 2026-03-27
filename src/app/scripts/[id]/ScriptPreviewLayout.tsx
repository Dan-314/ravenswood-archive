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
