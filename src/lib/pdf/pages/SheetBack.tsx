// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { CSSProperties } from "react";
import type { NightOrders, PdfOptions, ResolvedCharacter } from "@/lib/botc/types";
import type { TranslationData } from "@/lib/botc/translations";
import { translateUiLabel, translateTeamName } from "@/lib/botc/translations";
import { formatWithMinorWords } from "../utils/minorWordFormatter";
import { NightOrderPanel } from "../components/NightOrderPanel";
import { PlayerCount } from "../components/PlayerCount";
import { createOverlayBackground } from "../utils/colours";
import { PrintablePage } from "../components/PrintablePage";
import { splitEmojiSegments } from "../utils/splitEmoji";
import { TravellerSection } from "../components/TravellerSection";

type SheetBackProps = {
  title: string;
  nightOrders?: NightOrders;
  travellers?: ResolvedCharacter[];
  options: PdfOptions;
  assetsUrl: string;
  translations?: TranslationData | null;
};

export const SheetBack = ({
  title,
  nightOrders = { first: [], other: [] },
  travellers = [],
  options,
  assetsUrl,
  translations,
}: SheetBackProps) => {
  const {
    color,
    includeMargins,
    formatMinorWords,
    displayNightOrder,
    displayPlayerCounts,
    displayTravellers,
    dimensions,
  } = options;

  const textureStyle: CSSProperties = { backgroundImage: `url(${assetsUrl}/parchment_texture.jpg)` };

  const renderTitle = () => {
    const parts = title.split("&");
    return parts.map((part, partIndex) => (
      <span key={partIndex}>
        {formatMinorWords ? formatWithMinorWords(part, textureStyle) : splitEmojiSegments(part).map((seg, i) =>
          seg.type === "text" ? (
            <span key={i} className="title-text" style={textureStyle}>{seg.content}</span>
          ) : (
            <span key={i}>{seg.content}</span>
          )
        )}
        {partIndex < parts.length - 1 && <span className="ampersand title-text" style={textureStyle}>&amp;</span>}
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
        <div className="sheet-background" style={{ backgroundImage: `url(${assetsUrl}/${options.background})` }}>
          <div className="title-container">
            <h1>{renderTitle()}</h1>
          </div>
        </div>

        <div
          className="sheet-back-overlay"
          style={{ background: overlayBackground }}
        ></div>

        <div className="back-info-container">
          {displayPlayerCounts && (
            <PlayerCount
              playersLabel={translateUiLabel("players", "Players", translations ?? null)}
              translations={translations}
            />
          )}

          {displayTravellers && travellers.length > 0 && (
            <TravellerSection
              travellers={travellers}
              title={translateTeamName("traveller", translations ?? null)}
              assetsUrl={assetsUrl}
              iconUrlTemplate={options.iconUrlTemplate}
            />
          )}

          {displayNightOrder && (
            <NightOrderPanel
              nightOrders={nightOrders}
              assetsUrl={assetsUrl}
              iconUrlTemplate={options.iconUrlTemplate}
              firstNightLabel={translateUiLabel("firstNight", "First Night:", translations ?? null)}
              otherNightsLabel={translateUiLabel("otherNights", "Other Nights:", translations ?? null)}
            />
          )}
        </div>
        {options.backgroundAttribution && (
          <div className="background-attribution back-attribution">{options.backgroundAttribution}</div>
        )}
      </div>
    </PrintablePage>
  );
};
