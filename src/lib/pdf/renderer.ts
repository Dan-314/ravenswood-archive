// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import { createElement } from "react";
import { readFileSync } from "fs";
import { join } from "path";
import { FancyDoc } from "./FancyDoc";
import { parseScript, calculateNightOrders } from "@/lib/botc";
import type { Script } from "@/lib/botc/types";
import type { PdfOptions } from "@/lib/botc/types";
import { applyTranslationsToScript } from "@/lib/botc/translations";
import { loadTranslations } from "@/lib/botc/load-translations-server";

function loadCSS(): string {
  try {
    // Read the index.css which imports all other CSS files
    const stylesDir = join(process.cwd(), "src/lib/pdf/styles");
    // fonts.css is intentionally excluded: getFontFaces() declares the same
    // @font-face rules with Puppeteer-resolvable absolute URLs, and keeping the
    // concatenated CSS free of @font-face lets appendFallbackFamily() safely
    // append the non-Latin fallback to every font-family declaration.
    const files = [
      "PrintablePage.css",
      "BottomTrimSheet.css",
      "PlayerCount.css",
      "NightOrderPanel.css",
      "CharacterSheet.css",
      "NightSheet.css",
      "SheetBack.css",
      "TravellerSection.css",
      "FancyDoc.css",
    ];
    // Concatenate all CSS files (can't use @import in inline styles)
    let css = "";
    for (const file of files) {
      try {
        css += readFileSync(join(stylesDir, file), "utf-8") + "\n";
      } catch {
        console.warn(`Failed to load CSS file: ${file}`);
      }
    }
    return css;
  } catch (error) {
    console.error("Failed to load PDF CSS:", error);
    return "";
  }
}

// The PDF's display and body fonts are Latin-only, and the serverless Chromium
// build ships with no system fonts, so non-Latin script text (CJK, Thai) has no
// glyphs to fall back to and renders as tofu. Each PDF is a single language, so
// we embed only the one Noto font that covers it and add it as a fallback.
const NOTO_FALLBACK_FAMILY = "Noto Fallback";
const NOTO_FALLBACK_FONTS: Record<string, { file: string; format: string }> = {
  ko: { file: "Noto/NotoSansKR-Regular.otf", format: "opentype" },
  ja: { file: "Noto/NotoSansJP-Regular.otf", format: "opentype" },
  zh_Hans: { file: "Noto/NotoSansSC-Regular.otf", format: "opentype" },
  th: { file: "Noto/NotoSansThai-Regular.ttf", format: "truetype" },
};

function getCjkFontFace(appUrl: string, language: string | undefined): string {
  const font = language ? NOTO_FALLBACK_FONTS[language] : undefined;
  if (!font) return "";
  const base = `${appUrl}/pdf-assets/fonts`;
  return `@font-face { font-family: '${NOTO_FALLBACK_FAMILY}'; src: url('${base}/${font.file}') format('${font.format}'); }`;
}

// Append the non-Latin fallback family to the end of every font-family
// declaration so its glyphs resolve regardless of which Latin font a stack
// requests. When no fallback @font-face is emitted (Latin languages) the unknown
// family is simply ignored by the browser. Safe because the concatenated CSS
// contains no @font-face descriptors (see loadCSS).
function appendFallbackFamily(css: string): string {
  return css.replace(
    /font-family\s*:\s*([^;{}]+)([;}])/g,
    (_match, list: string, end: string) =>
      `font-family: ${list.trim()}, '${NOTO_FALLBACK_FAMILY}'${end}`,
  );
}

function getFontFaces(appUrl: string): string {
  const base = `${appUrl}/pdf-assets/fonts`;
  return `
    @font-face { font-family: 'Alice in Wonderland'; src: url('${base}/AliceInWonderland.ttf') format('truetype'); }
    @font-face { font-family: 'Anglican'; src: url('${base}/Anglican.ttf') format('truetype'); }
    @font-face { font-family: 'Canterbury Regular'; src: url('${base}/CanterburyRegular.ttf') format('truetype'); }
    @font-face { font-family: 'Utm Agin'; src: url('${base}/UtmAgin.ttf') format('truetype'); }
    @font-face { font-family: 'Waters Gothic'; src: url('${base}/WatersGothic.ttf') format('truetype'); }
    @font-face { font-family: 'Dumbledor'; src: url('${base}/Dumbledor/Dumbledor.ttf') format('truetype'); }
    @font-face { font-family: 'Trade Gothic'; src: url('${base}/TradeGothic/TradeGothic.otf') format('opentype'); }
    @font-face { font-family: 'Trade Gothic Bold'; src: url('${base}/TradeGothic/TradeGothicBold.otf') format('opentype'); font-weight: bold; }
    @font-face { font-family: 'Goudy Old Style'; src: url('${base}/GoudyOldStyle/GoudyOldStyle.ttf') format('truetype'); }
  `;
}

export async function renderToHtml(
  rawJson: unknown,
  options: PdfOptions,
  appUrl: string,
  assetsUrl: string,
  scriptType?: "full" | "teensy",
): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");

  let parsed = parseScript(rawJson);
  const translations = options.language && options.language !== "en"
    ? loadTranslations(options.language)
    : null;
  if (translations) {
    parsed = applyTranslationsToScript(parsed, translations);
  }
  const nightOrders = calculateNightOrders(parsed, rawJson as Script, {
    forceInfoSteps: options.showTeensyInfoSteps,
    scriptType,
  });

  const docProps = { script: parsed, options, nightOrders, assetsUrl, translations };

  // React rejects string event handlers, so inject the onerror attribute after render.
  const bodyHtml = renderToStaticMarkup(createElement(FancyDoc, docProps)).replace(
    /<img([^>]*class="[^"]*character-icon[^"]*"[^>]*?)\/?>/g,
    `<img$1 onerror="this.style.visibility='hidden'"/>`,
  );

  const css = loadCSS();
  const fontFaces = getFontFaces(appUrl) + getCjkFontFace(appUrl, options.language);

  // Replace relative image URLs in CSS with absolute URLs for Puppeteer, then
  // append the non-Latin fallback family to every font-family declaration.
  const processedCss = appendFallbackFamily(
    css.replace(/url\(\/pdf-assets\//g, `url(${appUrl}/pdf-assets/`),
  );

  const pageWidth = options.dimensions.width + "mm";
  const pageHeight = options.dimensions.height + "mm";
  const orientation = "portrait";
  const pageSize = options.paperSize === "A4" ? "A4" : "Letter";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Character Sheet PDF</title>
  <style>
    ${fontFaces}

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Trade Gothic', 'Helvetica Neue', Arial, sans-serif, '${NOTO_FALLBACK_FAMILY}';
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0;
      padding: 0;
    }

    :root {
      --page-width: ${pageWidth};
      --page-height: ${pageHeight};
      --print-margin: ${options.dimensions.margin}mm;
      --print-bleed: ${options.dimensions.bleed}mm;
    }

    @page { size: ${pageSize} ${orientation}; margin: 0; }

    ${processedCss}
  </style>
</head>
<body class="pdf-sheet-root">
${bodyHtml}
</body>
</html>`;
}
