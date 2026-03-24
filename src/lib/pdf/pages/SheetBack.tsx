// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { CSSProperties } from "react";
import type { NightOrders, PdfOptions } from "@/lib/botc/types";
import { formatWithMinorWords } from "../utils/minorWordFormatter";
import { NightOrderPanel } from "../components/NightOrderPanel";
import { PlayerCount } from "../components/PlayerCount";
import { createOverlayBackground } from "../utils/colours";
import { PrintablePage } from "../components/PrintablePage";

type SheetBackProps = {
  title: string;
  nightOrders?: NightOrders;
  options: PdfOptions;
  assetsUrl: string;
};

export const SheetBack = ({
  title,
  nightOrders = { first: [], other: [] },
  options,
  assetsUrl,
}: SheetBackProps) => {
  const {
    color,
    includeMargins,
    formatMinorWords,
    displayNightOrder,
    displayPlayerCounts,
    dimensions,
  } = options;

  const renderTitle = () => {
    const parts = title.split("&");
    return parts.map((part, partIndex) => (
      <span key={partIndex}>
        {formatMinorWords ? formatWithMinorWords(part) : part}
        {partIndex < parts.length - 1 && <span className="ampersand">&amp;</span>}
      </span>
    ));
  };

  const overlayBackground = createOverlayBackground(color, 180);

  return (
    <PrintablePage dimensions={dimensions}>
      <div
        className="sheet-backing"
        style={{
          transform: includeMargins ? "scale(0.952)" : undefined,
          "--title-font": options.titleStyle.font,
          "--title-letter-spacing": `${options.titleStyle.letterSpacing}mm`,
          "--title-word-spacing": `${options.titleStyle.wordSpacing}mm`,
          "--title-line-height": `${options.titleStyle.backLineHeight}mm`,
          "--title-margin-top": `${options.titleStyle.marginTop}mm`,
          "--title-margin-bottom": `${options.titleStyle.marginBottom}mm`,
          "--icon-scale": (options.iconScale / 1.7).toString(),
        } as CSSProperties}
      >
        <div className="sheet-background" style={{ backgroundImage: `url(${assetsUrl}/sidebar-desaturated-small.jpg)` }}>
          <div className="title-container">
            <h1 style={{ backgroundImage: `url(${assetsUrl}/parchment_texture.jpg)` }}>{renderTitle()}</h1>
          </div>
        </div>

        <div
          className="sheet-back-overlay"
          style={{ background: overlayBackground }}
        ></div>

        <div className="back-info-container">
          {displayPlayerCounts && <PlayerCount />}

          {displayNightOrder && (
            <NightOrderPanel
              nightOrders={nightOrders}
              assetsUrl={assetsUrl}
              iconUrlTemplate={options.iconUrlTemplate}
            />
          )}
        </div>
      </div>
    </PrintablePage>
  );
};
