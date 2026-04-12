"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { parseScript, calculateNightOrders } from "@/lib/botc";
import { FancyDoc } from "@/lib/pdf/FancyDoc";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";
import type { Script } from "@/lib/botc/types";
import type { PdfOptions } from "@/lib/botc/types";
import { useTranslations } from "@/lib/botc/use-translations";
import { applyTranslationsToScript } from "@/lib/botc/translations";
import { useBackgrounds, pickRandomBackground } from "@/lib/pdf/useBackgrounds";
import { randomColor } from "@/lib/pdf/utils/colours";
import "@/lib/pdf/styles/index.css";

interface PdfPreviewProps {
  rawJson: unknown;
  options?: PdfOptions;
  defaultColor?: string;
  className?: string;
  language?: string;
  onAppearanceChange?: (appearance: PdfOptions["appearance"], iconScale: number) => void;
  onNightAppearanceChange?: (nightAppearance: PdfOptions["nightAppearance"]) => void;
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

const NIGHT_APPEARANCE_LEVELS: PdfOptions["nightAppearance"][] = [
  "normal",
  "compact",
  "super-compact",
  "mega-compact",
];

export function PdfPreview({ rawJson, options, defaultColor, className, language, onAppearanceChange, onNightAppearanceChange }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);
  const [initialRandomColor] = useState(() => randomColor());
  const backgrounds = useBackgrounds();
  const [initialRandomBackground, setInitialRandomBackground] = useState("");
  const [mounted, setMounted] = useState(false);
  const [autoAppearance, setAutoAppearance] = useState<PdfOptions["appearance"] | null>(null);
  const [autoIconScale, setAutoIconScale] = useState<number | null>(null);
  const [autoNightAppearance, setAutoNightAppearance] = useState<PdfOptions["nightAppearance"] | null>(null);

  useEffect(() => {
    Promise.all([
      document.fonts.load('12px "Trade Gothic"'),
      document.fonts.load('12px "Goudy Old Style"'),
    ]).then(() => setMounted(true));
  }, []);

  // Pick a random background once backgrounds load
  if (backgrounds.length > 0 && !initialRandomBackground) {
    setInitialRandomBackground(pickRandomBackground(backgrounds));
  }

  const isAdjustingRef = useRef(false);
  const lastCheckedRef = useRef<string | null>(null);

  const pdfOptions = useMemo<PdfOptions>(() => {
    const base = {
      ...DEFAULT_PDF_OPTIONS,
      ...(options ?? { color: defaultColor || initialRandomColor }),
    };
    if (!base.background && initialRandomBackground) {
      base.background = initialRandomBackground;
      base.backgroundAttribution = backgrounds.find(
        (b) => b.value === initialRandomBackground
      )?.attribution;
    }
    if (!onAppearanceChange && autoAppearance) {
      base.appearance = autoAppearance;
      if (autoIconScale !== null) base.iconScale = autoIconScale;
    }
    if (!onNightAppearanceChange && autoNightAppearance) {
      base.nightAppearance = autoNightAppearance;
    }
    return base;
  }, [options, defaultColor, initialRandomColor, initialRandomBackground, backgrounds, onAppearanceChange, autoAppearance, autoIconScale, onNightAppearanceChange, autoNightAppearance]);

  const assetsUrl = "/pdf-assets/images";

  const effectiveLanguage = options?.language ?? language ?? "en";
  const { translations } = useTranslations(effectiveLanguage !== "en" ? effectiveLanguage : null);

  const rawParsed = useMemo(() => parseScript(rawJson), [rawJson]);
  const parsed = useMemo(
    () => translations ? applyTranslationsToScript(rawParsed, translations) : rawParsed,
    [rawParsed, translations],
  );
  const nightOrders = useMemo(
    () => calculateNightOrders(parsed, rawJson as Script),
    [parsed, rawJson],
  );

  // Overflow detection: auto-bump appearance level if content overflows
  const appearanceRef = useRef(pdfOptions.appearance);

  useEffect(() => {
    appearanceRef.current = pdfOptions.appearance;
  });

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
  }, [pdfOptions.appearance, pdfOptions.nightSheetOnly, parsed, onAppearanceChange, mounted]);

  // Night sheet overflow detection: auto-bump nightAppearance level
  const nightAppearanceRef = useRef(pdfOptions.nightAppearance);
  const isNightAdjustingRef = useRef(false);

  useEffect(() => {
    nightAppearanceRef.current = pdfOptions.nightAppearance;
  });

  useEffect(() => {
    if (!pdfOptions.showNightSheet && !pdfOptions.nightSheetOnly) return;

    isNightAdjustingRef.current = false;

    const timeoutId = setTimeout(() => {
      const inner = innerRef.current;
      if (!inner) return;

      const nightSheets = inner.querySelectorAll(".bottom-trim-sheet");
      let hasOverflow = false;

      for (const sheet of nightSheets) {
        const nightOrder = sheet.querySelector(".night-sheet-order");
        if (!nightOrder) continue;

        const sheetRect = sheet.getBoundingClientRect();
        const lastEntry = nightOrder.lastElementChild;
        if (!lastEntry) continue;

        const lastEntryRect = lastEntry.getBoundingClientRect();
        if (lastEntryRect.bottom > sheetRect.bottom) {
          hasOverflow = true;
          break;
        }
      }

      if (hasOverflow && !isNightAdjustingRef.current) {
        const currentIndex = NIGHT_APPEARANCE_LEVELS.indexOf(nightAppearanceRef.current);
        const nextIndex = currentIndex + 1;

        if (nextIndex < NIGHT_APPEARANCE_LEVELS.length) {
          isNightAdjustingRef.current = true;
          const nextAppearance = NIGHT_APPEARANCE_LEVELS[nextIndex];
          if (onNightAppearanceChange) {
            onNightAppearanceChange(nextAppearance);
          } else {
            setAutoNightAppearance(nextAppearance);
          }

          setTimeout(() => {
            isNightAdjustingRef.current = false;
          }, 100);
        }
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [pdfOptions.nightAppearance, pdfOptions.showNightSheet, pdfOptions.nightSheetOnly, parsed, onNightAppearanceChange, mounted]);

  // Reset night appearance when script changes
  const [prevParsed, setPrevParsed] = useState(parsed);
  if (prevParsed !== parsed) {
    setPrevParsed(parsed);
    if (autoNightAppearance !== null) {
      setAutoNightAppearance(null);
    }
  }

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
    observer.observe(inner);
    return () => observer.disconnect();
  }, [pdfOptions.paperSize, mounted]);

  if (!mounted) {
    return <div className={`relative overflow-hidden ${className ?? ""}`} />;
  }

  const docProps = { script: parsed, options: pdfOptions, nightOrders, assetsUrl, translations };

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
