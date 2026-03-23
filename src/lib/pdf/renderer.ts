import { createElement } from "react";
import { readFileSync } from "fs";
import { join } from "path";
import { CharacterSheet, NightSheet, InfoSheet, TeensyLayout } from "./sheets";
import { parseScript, calculateNightOrders } from "@/lib/botc";
import type { Script } from "botc-script-checker";
import type { PdfOptions } from "@/lib/botc/types";

function loadCSS(): string {
  try {
    const cssPath = join(process.cwd(), "src/lib/pdf/styles.css");
    return readFileSync(cssPath, "utf-8");
  } catch (error) {
    console.error("Failed to load PDF CSS:", error);
    return "";
  }
}

function getFontFaces(appUrl: string): string {
  const base = `${appUrl}/pdf-assets/fonts`;
  return `
    @font-face {
      font-family: 'Unlovable';
      src: url('${base}/LHF_Unlovable.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Alice in Wonderland';
      src: url('${base}/AliceInWonderland.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Anglican';
      src: url('${base}/Anglican.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Canterbury Regular';
      src: url('${base}/CanterburyRegular.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Utm Agin';
      src: url('${base}/UtmAgin.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Waters Gothic';
      src: url('${base}/WatersGothic.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Dumbledor';
      src: url('${base}/Dumbledor/Dumbledor.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Trade Gothic';
      src: url('${base}/TradeGothic/TradeGothic.otf') format('opentype');
    }
    @font-face {
      font-family: 'Goudy Old Style';
      src: url('${base}/GoudyOldStyle/GoudyOldStyle.ttf') format('truetype');
    }
  `;
}

export async function renderToHtml(
  rawJson: unknown,
  options: PdfOptions,
  appUrl: string,
  assetsUrl: string,
): Promise<string> {
  // Dynamic import to avoid Next.js Turbopack blocking react-dom/server in route handlers
  const { renderToStaticMarkup } = await import("react-dom/server");

  const parsed = parseScript(rawJson);
  const nightOrders = calculateNightOrders(parsed, rawJson as Script);

  const sheetProps = { script: parsed, options, nightOrders, assetsUrl };

  let bodyHtml: string;

  if (options.nightSheetOnly) {
    bodyHtml = renderToStaticMarkup(createElement(NightSheet, sheetProps));
  } else if (options.teensy) {
    bodyHtml = renderToStaticMarkup(createElement(TeensyLayout, sheetProps));
    if (options.showNightSheet) {
      bodyHtml += renderToStaticMarkup(createElement(NightSheet, sheetProps));
    }
  } else {
    bodyHtml = renderToStaticMarkup(
      createElement(CharacterSheet, { script: parsed, options, assetsUrl }),
    );
    if (options.overleaf === "infoSheet") {
      bodyHtml += renderToStaticMarkup(createElement(InfoSheet, { script: parsed, options, assetsUrl }));
    }
    if (options.showNightSheet) {
      bodyHtml += renderToStaticMarkup(createElement(NightSheet, sheetProps));
    }
  }

  const css = loadCSS();
  const fontFaces = getFontFaces(appUrl);

  const pageSize = options.paperSize === "A4" ? "A4" : "Letter";
  const orientation = options.teensy ? "landscape" : "portrait";
  const pageWidth = options.paperSize === "A4" ? "210mm" : "216mm";
  const pageHeight = options.paperSize === "A4" ? "297mm" : "279mm";

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
    }

    @page { size: ${pageSize} ${orientation}; margin: 0; }

    ${css}
  </style>
</head>
<body class="pdf-sheet-root">
${bodyHtml}
</body>
</html>`;
}
