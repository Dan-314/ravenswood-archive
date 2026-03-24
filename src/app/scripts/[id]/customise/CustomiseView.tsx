"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { PdfOptions } from "@/lib/botc/types";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";
import { PdfOptionsForm } from "@/lib/pdf/PdfOptionsForm";
import { ScriptPreviewLayout } from "../ScriptPreviewLayout";

interface CustomiseViewProps {
  rawJson: unknown;
  scriptName: string;
  defaultColor?: string;
}

export function CustomiseView({ rawJson, scriptName, defaultColor }: CustomiseViewProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<PdfOptions>({
    ...DEFAULT_PDF_OPTIONS,
    color: defaultColor || DEFAULT_PDF_OPTIONS.color,
  });

  const update = <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawJson,
          options,
          filename: scriptName,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scriptName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
      className="h-[calc(100vh-4rem)]"
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
