"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { parseScript, calculateNightOrders } from "@/lib/botc";
import { CharacterSheet, NightSheet, InfoSheet, TeensyLayout } from "@/lib/pdf/sheets";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";
import type { Script } from "botc-script-checker";
import type { PdfOptions } from "@/lib/botc/types";
import "@/lib/pdf/styles.css";

interface PdfPreviewProps {
  rawJson: unknown;
  options?: PdfOptions;
  defaultColor?: string;
  className?: string;
  onAppearanceChange?: (appearance: PdfOptions["appearance"], iconScale: number) => void;
}

const APPEARANCE_LEVELS: PdfOptions["appearance"][] = [
  "normal",
  "compact",
  "super-compact",
  "mega-compact",
];

const ICON_SCALES: Record<PdfOptions["appearance"], number> = {
  normal: 1.7,
  compact: 1.6,
  "super-compact": 1.5,
  "mega-compact": 1.4,
};

function randomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 40 + Math.floor(Math.random() * 30); // 40-70%
  const l = 25 + Math.floor(Math.random() * 15); // 25-40%
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function PdfPreview({ rawJson, options, defaultColor, className, onAppearanceChange }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [initialRandomColor] = useState(() => randomColor());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-adjusted appearance for overflow detection
  const [autoAppearance, setAutoAppearance] = useState<PdfOptions["appearance"] | null>(null);
  const isAdjustingRef = useRef(false);
  const lastCheckedRef = useRef<string | null>(null);

  const baseOptions = options ?? {
    ...DEFAULT_PDF_OPTIONS,
    color: defaultColor || initialRandomColor,
  };

  // Apply auto-adjusted appearance + icon scale
  const pdfOptions = useMemo(() => {
    if (!autoAppearance) return baseOptions;
    return {
      ...baseOptions,
      appearance: autoAppearance,
      iconScale: ICON_SCALES[autoAppearance],
    };
  }, [baseOptions, autoAppearance]);

  const assetsUrl = "/pdf-assets/images";

  const parsed = useMemo(() => parseScript(rawJson), [rawJson]);
  const nightOrders = useMemo(
    () => calculateNightOrders(parsed, rawJson as Script),
    [parsed, rawJson],
  );

  // Reset auto-appearance when base options change
  useEffect(() => {
    setAutoAppearance(null);
    lastCheckedRef.current = null;
    isAdjustingRef.current = false;
  }, [rawJson, baseOptions.appearance, baseOptions.teensy, baseOptions.paperSize]);

  // Overflow detection: auto-bump appearance level if content overflows
  useEffect(() => {
    if (pdfOptions.teensy || pdfOptions.nightSheetOnly) return;

    const timeoutId = setTimeout(() => {
      const inner = innerRef.current;
      if (!inner) return;

      const sheetContent = inner.querySelector(".sheet-content") as HTMLElement;
      if (!sheetContent) return;

      const currentAppearance = pdfOptions.appearance;
      const checkKey = currentAppearance;

      if (lastCheckedRef.current === checkKey) return;

      const hasOverflow = sheetContent.scrollHeight > sheetContent.clientHeight;

      if (hasOverflow && !isAdjustingRef.current) {
        const currentIndex = APPEARANCE_LEVELS.indexOf(currentAppearance);
        const nextIndex = currentIndex + 1;

        if (nextIndex < APPEARANCE_LEVELS.length) {
          isAdjustingRef.current = true;
          const nextAppearance = APPEARANCE_LEVELS[nextIndex];
          setAutoAppearance(nextAppearance);
          onAppearanceChange?.(nextAppearance, ICON_SCALES[nextAppearance]);

          setTimeout(() => {
            isAdjustingRef.current = false;
          }, 100);
        } else {
          lastCheckedRef.current = checkKey;
        }
      } else if (!hasOverflow) {
        lastCheckedRef.current = checkKey;
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pdfOptions.appearance, pdfOptions.teensy, pdfOptions.nightSheetOnly, parsed, onAppearanceChange]);

  // Calculate scale to fit the sheet inside the container
  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const updateScale = () => {
      const page = inner.querySelector(".sheet-page, .night-page, .info-page, .teensy-wrapper") as HTMLElement;
      if (!page) return;
      const pw = page.offsetWidth;
      const cw = container.clientWidth;
      setScale(Math.min(cw / pw, 1));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pdfOptions.teensy, pdfOptions.paperSize]);

  const sheetProps = { script: parsed, options: pdfOptions, nightOrders, assetsUrl };

  // Defer render until client mount when using random color to avoid hydration mismatch
  if (!mounted && !defaultColor && !options) {
    return <div className={`relative overflow-hidden ${className ?? ""}`} />;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      <div
        ref={innerRef}
        className="pdf-sheet-root"
        style={{
          transformOrigin: "top center",
          transform: `scale(${scale})`,
          ...({
            "--page-width": pdfOptions.paperSize === "A4" ? "210mm" : "216mm",
            "--page-height": pdfOptions.paperSize === "A4" ? "297mm" : "279mm",
          } as React.CSSProperties),
        }}
      >
        {pdfOptions.nightSheetOnly ? (
          <NightSheet {...sheetProps} />
        ) : pdfOptions.teensy ? (
          <>
            <TeensyLayout {...sheetProps} />
            {pdfOptions.showNightSheet && <NightSheet {...sheetProps} />}
          </>
        ) : (
          <>
            <CharacterSheet script={parsed} options={pdfOptions} assetsUrl={assetsUrl} />
            {pdfOptions.overleaf === "infoSheet" && (
              <InfoSheet script={parsed} options={pdfOptions} assetsUrl={assetsUrl} />
            )}
            {pdfOptions.showNightSheet && <NightSheet {...sheetProps} />}
          </>
        )}
      </div>
    </div>
  );
}
