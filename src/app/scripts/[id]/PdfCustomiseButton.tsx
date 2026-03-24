"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Loader2, Settings2 } from "lucide-react";
import type { PdfOptions } from "@/lib/botc/types";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";
import { PdfOptionsForm } from "@/lib/pdf/PdfOptionsForm";
import { PdfPreview } from "./PdfPreview";

interface PdfCustomiseButtonProps {
  rawJson: unknown;
  scriptName: string;
  defaultColor?: string;
}

export function PdfCustomiseButton({ rawJson, scriptName, defaultColor }: PdfCustomiseButtonProps) {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5" />
        }
      >
        <Settings2 className="h-4 w-4" />
        Customise &amp; Download PDF
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customise PDF</DialogTitle>
          <DialogDescription>
            Configure the character sheet PDF for &ldquo;{scriptName}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Left side: Options */}
          <div className="sm:w-[340px] shrink-0 flex flex-col gap-4">
            <PdfOptionsForm options={options} onUpdate={update} />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Right side: Live preview */}
          <PdfPreview
            rawJson={rawJson}
            options={options}
            className="flex-1 min-h-[400px] sm:min-h-[500px] bg-muted rounded-lg"
            onAppearanceChange={(appearance, iconScale) => {
              setOptions((prev) => ({ ...prev, appearance, iconScale }));
            }}
          />
        </div>

        <DialogFooter>
          <Button onClick={handleDownload} disabled={downloading} className="gap-1.5">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
