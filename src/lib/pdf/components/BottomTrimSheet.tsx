// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { CSSProperties } from "react";
import {
  normalizeColors,
  createGradient,
  createOverlayBackground,
} from "../utils/colours";
import { PrintablePage } from "./PrintablePage";
import type { PdfOptions } from "@/lib/botc/types";

export type BottomTrimSheetProps = {
  options: PdfOptions;
  assetsUrl: string;
  children: React.ReactNode;
};

export const BottomTrimSheet = ({
  options,
  assetsUrl,
  children,
}: BottomTrimSheetProps) => {
  const { color, includeMargins, dimensions } = options;
  const colors = normalizeColors(color);
  const gradient = createGradient(colors, 20);
  const overlayBackground = createOverlayBackground(color, 180);

  return (
    <PrintablePage dimensions={dimensions}>
      <div
        className="bottom-trim-sheet"
        style={{
          transform: includeMargins ? "scale(0.952)" : undefined,
          "--header-gradient": gradient,
          "--title-font": options.titleStyle.font,
          "--title-letter-spacing": `${options.titleStyle.letterSpacing}mm`,
          "--title-word-spacing": `${options.titleStyle.wordSpacing}mm`,
          "--title-line-height": `${options.titleStyle.lineHeight}mm`,
          "--title-margin-top": `${options.titleStyle.marginTop}mm`,
          "--title-margin-bottom": `${options.titleStyle.marginBottom}mm`,
          "--icon-scale": (options.iconScale / 1.7).toString(),
        } as CSSProperties}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="character-sheet-background"
          src={`${assetsUrl}/parchment_texture_a4_lightened.jpg`}
          alt=""
        />
        <div className="sheet-content">{children}</div>
        <div className="spacer"></div>
        <div className="info-footer-container">
          <div className="info-author-credit">
            <p>&copy; Steven Medway bloodontheclocktower.com</p>
            <p>Script template by John Forster ravenswoodstudio.xyz</p>
          </div>
          {options.backgroundAttribution && (
            <div className="background-attribution footer-attribution">{options.backgroundAttribution}</div>
          )}
          <div className="info-footer-background" style={{ backgroundImage: `url(${assetsUrl}/${options.background})` }}></div>
          <div
            className="info-footer-overlay"
            style={{ background: overlayBackground }}
          ></div>
        </div>
      </div>
    </PrintablePage>
  );
};
