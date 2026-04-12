"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { PdfOptions } from "@/lib/botc/types";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";
import { downloadPdf } from "@/lib/pdf/download-pdf";
import { PdfOptionsForm } from "@/lib/pdf/PdfOptionsForm";
import { ScriptPreviewLayout } from "../ScriptPreviewLayout";
import { randomColor } from "@/lib/pdf/utils/colours";
import { mergePreferences, type UserPreferences } from "@/lib/useUserPreferences";

interface CustomiseViewProps {
  rawJson: unknown;
  scriptName: string;
  defaultColor?: string;
  scriptId?: string;
  initialPreferences?: Partial<UserPreferences> | null;
}

function buildInitialOptions(defaultColor?: string, preferences?: Partial<UserPreferences> | null): PdfOptions {
  if (preferences) {
    return {
      ...mergePreferences(preferences),
      color: defaultColor || preferences.color || DEFAULT_PDF_OPTIONS.color,
    };
  }
  return {
    ...DEFAULT_PDF_OPTIONS,
    color: defaultColor || randomColor(),
  };
}

export function CustomiseView({ rawJson, scriptName, defaultColor, scriptId, initialPreferences }: CustomiseViewProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<PdfOptions>(() =>
    buildInitialOptions(defaultColor, initialPreferences),
  );

  const update = <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      await downloadPdf({ rawJson, options, filename: scriptName, scriptId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScriptPreviewLayout
      rawJson={rawJson}
      options={options}
      onAppearanceChange={(appearance: PdfOptions["appearance"], iconScale: number) => {
        setOptions((prev) => ({ ...prev, appearance, iconScale }));
      }}
      onNightAppearanceChange={(nightAppearance: PdfOptions["nightAppearance"]) => {
        setOptions((prev) => ({ ...prev, nightAppearance }));
      }}
      className="md:h-[calc(100vh-4rem)]"
      sidebarPosition="left"
      sidebar={
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg">Customise PDF</h2>

          <PdfOptionsForm options={options} onUpdate={update} />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button onClick={handleDownload} disabled={downloading} className="gap-1.5 w-full">
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      }
    />
  );
}
