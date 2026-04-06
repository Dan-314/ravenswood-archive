"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Shuffle, ChevronDown, ChevronUp } from "lucide-react";
import type { PdfOptions } from "@/lib/botc/types";
import { LanguageSelect } from "@/components/LanguageSelect";

function randomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 40 + Math.floor(Math.random() * 30);
  const l = 25 + Math.floor(Math.random() * 15);
  const f = (n: number) => {
    const sp = (s / 100), lp = (l / 100);
    const a = sp * Math.min(lp, 1 - lp);
    const k = (n + h / 30) % 12;
    const c = lp - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const TPI_CDN = "https://release.botc.app/resources/editions";

const EDITION_LOGOS: { label: string; value: string }[] = [
  { label: "None", value: "" },
  { label: "Trouble Brewing", value: `${TPI_CDN}/tb/logo.webp` },
  { label: "Bad Moon Rising", value: `${TPI_CDN}/bmr/logo.webp` },
  { label: "Sects & Violets", value: `${TPI_CDN}/snv/logo.webp` },
];

const TITLE_FONTS = [
  "Dumbledor",
  "Unlovable",
  "Alice in Wonderland",
  "Anglican",
  "Canterbury Regular",
  "Utm Agin",
  "Waters Gothic",
];

interface PdfOptionsFormProps {
  options: PdfOptions;
  onUpdate: <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => void;
}

export function PdfOptionsForm({ options, onUpdate }: PdfOptionsFormProps) {
  const update = onUpdate;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const colorValue = Array.isArray(options.color) ? options.color[0] : options.color;

  return (
    <div className="flex flex-col gap-4">
      {/* Language */}
      <div className="flex flex-col gap-1.5">
        <Label>Language</Label>
        <LanguageSelect value={options.language} onChange={(v) => update("language", v)} />
      </div>

      {/* Appearance & Paper Size */}
      <div className="grid grid-cols-2 gap-4">
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

        <div className="flex flex-col gap-1.5">
          <Label>Paper Size</Label>
          <Select
            value={options.paperSize}
            onValueChange={(v) => {
              if (!v) return;
              const ps = v as "A4" | "Letter";
              update("paperSize", ps);
              update("dimensions", {
                ...options.dimensions,
                width: ps === "A4" ? 210 : 216,
                height: ps === "A4" ? 297 : 279,
              });
            }}
          >
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

      {/* Jinx Icons & Font */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Inline Jinx Icons</Label>
          <Select value={options.inlineJinxIcons} onValueChange={(v) => v && update("inlineJinxIcons", v as "none" | "primary" | "both")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="primary">Primary only</SelectItem>
              <SelectItem value="both">Both characters</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Title Font</Label>
          <Select value={options.titleStyle.font} onValueChange={(v) => v && update("titleStyle", { ...options.titleStyle, font: v })}>
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

      {/* Colour */}
      <div className="flex flex-col gap-1.5">
        <Label>Colour</Label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={colorValue}
            onChange={(e) => update("color", e.target.value)}
            className="h-8 w-10 rounded border border-input cursor-pointer"
          />
          <Input
            value={colorValue}
            onChange={(e) => update("color", e.target.value)}
            className="flex-1 h-8"
            placeholder="#137415"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => update("color", randomColor())}
            title="Randomise colour"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Advanced options toggle (mobile only) */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="md:hidden flex items-center gap-1 text-sm text-muted-foreground"
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {showAdvanced ? "Fewer options" : "More options"}
      </button>

      <div className={`flex flex-col gap-4 ${showAdvanced ? "" : "hidden"} md:flex md:flex-col md:gap-4`}>
        {/* Icon Scale */}
        <div className="flex flex-col gap-1.5">
          <Label>Icon Scale ({options.iconScale.toFixed(1)})</Label>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={options.iconScale}
            onChange={(e) => update("iconScale", parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Edition logo */}
        <div className="flex flex-col gap-1.5">
          <Label>Edition logo</Label>
          <Select
            value={options.showLogo && EDITION_LOGOS.some((e) => e.value === options.logo) ? options.logo : "none"}
            onValueChange={(v) => {
              if (!v || v === "none") {
                update("showLogo", false);
              } else {
                update("logo", v);
                update("showLogo", true);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {EDITION_LOGOS.filter((e) => e.value !== "").map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Show/hide toggles */}
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={options.showTitle} onCheckedChange={(checked) => update("showTitle", !!checked)} />
            <span className="text-sm">Show title</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={options.showAuthor} onCheckedChange={(checked) => update("showAuthor", !!checked)} />
            <span className="text-sm">Show author</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={options.showSwirls} onCheckedChange={(checked) => update("showSwirls", !!checked)} />
            <span className="text-sm">Show swirl dividers</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={options.showJinxes} onCheckedChange={(checked) => update("showJinxes", !!checked)} />
            <span className="text-sm">Show jinxes</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={options.solidTitle} onCheckedChange={(checked) => update("solidTitle", !!checked)} />
            <span className="text-sm">Solid title (no blend)</span>
          </label>
        </div>

        {/* Overleaf & Night Sheet */}
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={options.overleaf} onCheckedChange={(checked) => update("overleaf", !!checked)} />
            <span className="text-sm">Include back page (overleaf)</span>
          </label>

          {options.overleaf && (
            <div className="ml-6 flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={options.displayNightOrder} onCheckedChange={(checked) => update("displayNightOrder", !!checked)} />
                <span className="text-sm">Night order on back page</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={options.displayPlayerCounts} onCheckedChange={(checked) => update("displayPlayerCounts", !!checked)} />
                <span className="text-sm">Player counts on back page</span>
              </label>
            </div>
          )}

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
            <span className="text-sm">Night sheet only</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={options.includeMargins} onCheckedChange={(checked) => update("includeMargins", !!checked)} />
            <span className="text-sm">Include margins</span>
          </label>
        </div>
      </div>
    </div>
  );
}
