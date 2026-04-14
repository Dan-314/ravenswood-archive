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
    const files = [
      "fonts.css",
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
): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");

  let parsed = parseScript(rawJson);
  const translations = options.language && options.language !== "en"
    ? loadTranslations(options.language)
    : null;
  if (translations) {
    parsed = applyTranslationsToScript(parsed, translations);
  }
  const nightOrders = calculateNightOrders(parsed, rawJson as Script);

  const docProps = { script: parsed, options, nightOrders, assetsUrl, translations };

  // React rejects string event handlers, so inject the onerror attribute after render.
  const bodyHtml = renderToStaticMarkup(createElement(FancyDoc, docProps)).replace(
    /<img([^>]*class="[^"]*character-icon[^"]*"[^>]*?)\/?>/g,
    `<img$1 onerror="this.style.visibility='hidden'"/>`,
  );

  const css = loadCSS();
  const fontFaces = getFontFaces(appUrl);

  // Replace relative image URLs in CSS with absolute URLs for Puppeteer
  const processedCss = css.replace(
    /url\(\/pdf-assets\//g,
    `url(${appUrl}/pdf-assets/`,
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
      font-family: 'Trade Gothic', 'Helvetica Neue', Arial, sans-serif;
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
