"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { parseScript, calculateNightOrders } from "@/lib/botc";
import { FancyDoc } from "@/lib/pdf/FancyDoc";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";
import type { Script } from "botc-script-checker";
import type { PdfOptions } from "@/lib/botc/types";
import "@/lib/pdf/styles/index.css";

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
  const s = 40 + Math.floor(Math.random() * 30);
  const l = 25 + Math.floor(Math.random() * 15);
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
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);
  const [initialRandomColor] = useState(() => randomColor());
  const [mounted, setMounted] = useState(false);
  const [autoAppearance, setAutoAppearance] = useState<PdfOptions["appearance"] | null>(null);
  const [autoIconScale, setAutoIconScale] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      document.fonts.load('12px "Trade Gothic"'),
      document.fonts.load('12px "Goudy Old Style"'),
    ]).then(() => setMounted(true));
  }, []);

  const isAdjustingRef = useRef(false);
  const lastCheckedRef = useRef<string | null>(null);

  const pdfOptions = useMemo<PdfOptions>(() => {
    const base = {
      ...DEFAULT_PDF_OPTIONS,
      ...(options ?? { color: defaultColor || initialRandomColor }),
    };
    if (!onAppearanceChange && autoAppearance) {
      base.appearance = autoAppearance;
      if (autoIconScale !== null) base.iconScale = autoIconScale;
    }
    return base;
  }, [options, defaultColor, initialRandomColor, onAppearanceChange, autoAppearance, autoIconScale]);

  const assetsUrl = "/pdf-assets/images";

  const parsed = useMemo(() => parseScript(rawJson), [rawJson]);
  const nightOrders = useMemo(
    () => calculateNightOrders(parsed, rawJson as Script),
    [parsed, rawJson],
  );

  // Overflow detection: auto-bump appearance level if content overflows
  const appearanceRef = useRef(pdfOptions.appearance);
  appearanceRef.current = pdfOptions.appearance;

  useEffect(() => {
    if (pdfOptions.nightSheetOnly) return;

    lastCheckedRef.current = null;
    isAdjustingRef.current = false;

    const timeoutId = setTimeout(() => {
      const inner = innerRef.current;
      if (!inner) return;

      const sheetContent = inner.querySelector(".character-sheet .sheet-content") as HTMLElement;
      if (!sheetContent) return;

      const hasOverflow = sheetContent.scrollHeight > sheetContent.clientHeight;

      if (hasOverflow && !isAdjustingRef.current) {
        const currentIndex = APPEARANCE_LEVELS.indexOf(appearanceRef.current);
        const nextIndex = currentIndex + 1;

        if (nextIndex < APPEARANCE_LEVELS.length) {
          isAdjustingRef.current = true;
          const nextAppearance = APPEARANCE_LEVELS[nextIndex];
          if (onAppearanceChange) {
            onAppearanceChange(nextAppearance, ICON_SCALES[nextAppearance]);
          } else {
            setAutoAppearance(nextAppearance);
            setAutoIconScale(ICON_SCALES[nextAppearance]);
          }

          setTimeout(() => {
            isAdjustingRef.current = false;
          }, 100);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pdfOptions.appearance, pdfOptions.nightSheetOnly, parsed, onAppearanceChange]);

  // Calculate scale to fit the sheet inside the container
  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const updateScale = () => {
      const page = inner.querySelector(".printable-page") as HTMLElement;
      if (!page) return;
      const pw = page.offsetWidth;
      const cw = container.clientWidth;
      const s = Math.min(cw / pw, 1);
      setScale(s);
      setScaledHeight(inner.scrollHeight * s);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pdfOptions.paperSize, mounted]);

  if (!mounted) {
    return <div className={`relative overflow-hidden ${className ?? ""}`} />;
  }

  const docProps = { script: parsed, options: pdfOptions, nightOrders, assetsUrl };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ""}`}
      style={scaledHeight !== undefined ? { height: scaledHeight } : undefined}
    >
      <div
        ref={innerRef}
        className="pdf-sheet-root"
        style={{
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          ...({
            "--page-width": pdfOptions.dimensions.width + "mm",
            "--page-height": pdfOptions.dimensions.height + "mm",
            "--print-margin": pdfOptions.dimensions.margin + "mm",
            "--print-bleed": pdfOptions.dimensions.bleed + "mm",
          } as React.CSSProperties),
        }}
      >
        <FancyDoc {...docProps} />
      </div>
    </div>
  );
}
