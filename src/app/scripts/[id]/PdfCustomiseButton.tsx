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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2, Settings2 } from "lucide-react";
import type { PdfOptions } from "@/lib/botc/types";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";
import { PdfPreview } from "./PdfPreview";

interface PdfCustomiseButtonProps {
  rawJson: unknown;
  scriptName: string;
  defaultColor?: string;
}

const TITLE_FONTS = [
  "Dumbledor",
  "Unlovable",
  "Alice in Wonderland",
  "Anglican",
  "Canterbury Regular",
  "Utm Agin",
  "Waters Gothic",
];

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
            {/* Layout */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Layout</Label>
                <Select value={options.teensy ? "teensy" : "full"} onValueChange={(v) => v !== null && update("teensy", v === "teensy")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full (Portrait)</SelectItem>
                    <SelectItem value="teensy">Teensy (Landscape)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Appearance</Label>
                <Select value={options.appearance} onValueChange={(v) => v && update("appearance", v as PdfOptions["appearance"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="super-compact">Super Compact</SelectItem>
                    <SelectItem value="mega-compact">Mega Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Color & Font */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={options.color}
                    onChange={(e) => update("color", e.target.value)}
                    className="h-8 w-10 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={options.color}
                    onChange={(e) => update("color", e.target.value)}
                    className="flex-1 h-8"
                    placeholder="#137415"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Title Font</Label>
                <Select value={options.titleFont} onValueChange={(v) => v && update("titleFont", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TITLE_FONTS.map((font) => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Icon Scale & Paper Size */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Icon Scale ({options.iconScale.toFixed(1)})</Label>
                <input
                  type="range"
                  min="1.4"
                  max="1.7"
                  step="0.1"
                  value={options.iconScale}
                  onChange={(e) => update("iconScale", parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Paper Size</Label>
                <Select value={options.paperSize} onValueChange={(v) => v && update("paperSize", v as "A4" | "Letter")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Back page */}
            <div className="flex flex-col gap-1.5">
              <Label>Back Page</Label>
              <Select value={options.overleaf} onValueChange={(v) => v && update("overleaf", v as PdfOptions["overleaf"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="infoSheet">Info Sheet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options.showNightSheet}
                  onCheckedChange={(checked) => {
                    update("showNightSheet", !!checked);
                    if (checked) update("nightSheetOnly", false);
                  }}
                />
                <span className="text-sm">Include night sheet</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options.nightSheetOnly}
                  onCheckedChange={(checked) => {
                    update("nightSheetOnly", !!checked);
                    if (checked) update("showNightSheet", false);
                  }}
                />
                <span className="text-sm">Night sheet only (for professional printing)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options.includeMargins}
                  onCheckedChange={(checked) => update("includeMargins", !!checked)}
                />
                <span className="text-sm">Include margins</span>
              </label>
            </div>

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
