// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import { CharacterSheet } from "./pages/CharacterSheet";
import { NightSheet } from "./pages/NightSheet";
import { SheetBack } from "./pages/SheetBack";
import type { NightOrders, ParsedScript, PdfOptions } from "@/lib/botc/types";
import { getFabledOrLoric } from "./utils/fabledOrLoric";
import { groupByTeam, findJinxes } from "@/lib/botc";

export type FancyDocProps = {
  script: ParsedScript;
  options: PdfOptions;
  nightOrders: NightOrders;
  assetsUrl: string;
};

export function FancyDoc({
  script,
  options: rawOptions,
  nightOrders,
  assetsUrl,
}: FancyDocProps) {
  // If a custom font URL is provided, inject a @font-face and override titleStyle.font
  const hasCustomFont = !!rawOptions.titleStyle.customFontUrl;
  const options = hasCustomFont
    ? {
        ...rawOptions,
        titleStyle: { ...rawOptions.titleStyle, font: "CustomTitleFont" },
      }
    : rawOptions;

  const groupedCharacters = groupByTeam(script.characters);
  const jinxes = options.showJinxes
    ? findJinxes(script.characters)
    : [];
  const fabledAndLoric = getFabledOrLoric(
    script.characters,
    assetsUrl,
    options.iconUrlTemplate,
  );

  return (
    <div className="sheet-wrapper">
      {hasCustomFont && (
        <style>{`@font-face { font-family: "CustomTitleFont"; src: url("${rawOptions.titleStyle.customFontUrl}"); }`}</style>
      )}
      {!options.nightSheetOnly && (
        <>
          {Array(options.numberOfCharacterSheets)
            .fill(true)
            .map((_, i) => (
              <div key={i} className={i === 0 ? "" : "print-only"}>
                <CharacterSheet
                  title={script.metadata?.name || "Custom Script"}
                  author={options.showAuthor ? script.metadata?.author : undefined}
                  characters={groupedCharacters}
                  jinxes={jinxes}
                  fabledOrLoric={fabledAndLoric}
                  bootleggerRules={script.metadata?.bootlegger}
                  options={options}
                  assetsUrl={assetsUrl}
                />
                <div style={{ breakAfter: "page" }}></div>

                {options.overleaf && (
                  <>
                    <SheetBack
                      title={script.metadata?.name || "Custom Script"}
                      nightOrders={nightOrders}
                      options={options}
                      assetsUrl={assetsUrl}
                    />
                    <div style={{ breakAfter: "page" }}></div>
                  </>
                )}
              </div>
            ))}
        </>
      )}

      {(options.showNightSheet || options.nightSheetOnly) && (
        <NightSheet
          title={script.metadata?.name || "Custom Script"}
          firstNightOrder={nightOrders.first}
          otherNightOrder={nightOrders.other}
          options={options}
          assetsUrl={assetsUrl}
        />
      )}
    </div>
  );
}
