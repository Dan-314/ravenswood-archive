// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import { CharacterSheet } from "./pages/CharacterSheet";
import { NightSheet } from "./pages/NightSheet";
import { SheetBack } from "./pages/SheetBack";
import type { ParsedScript, PdfOptions, NightOrders } from "@/lib/botc/types";
import { getFabledOrLoric } from "./utils/fabledOrLoric";
import { groupByTeam, findJinxes } from "@/lib/botc";

type TeensyDocProps = {
  script: ParsedScript;
  options: PdfOptions;
  nightOrders: NightOrders;
  assetsUrl: string;
};

export const TeensyDoc = ({
  script,
  options: rawOptions,
  nightOrders,
  assetsUrl,
}: TeensyDocProps) => {
  const hasCustomFont = !!rawOptions.titleStyle.customFontUrl;
  const options = hasCustomFont
    ? {
        ...rawOptions,
        titleStyle: { ...rawOptions.titleStyle, font: "CustomTitleFont" },
      }
    : rawOptions;

  const numberOfSheets =
    options.numberOfCharacterSheets + (options.numberOfCharacterSheets % 2);

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
    <div className="sheet-wrapper teensy">
      {hasCustomFont && (
        <style>{`@font-face { font-family: "CustomTitleFont"; src: url("${rawOptions.titleStyle.customFontUrl}"); }`}</style>
      )}
      {Array.from({ length: numberOfSheets }).map(
        (_, i) =>
          !(i % 2) && (
            <div
              key={i}
              className={i + 2 >= numberOfSheets ? "" : "print-only"}
            >
              <div className="teensy-sheet-pair">
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
                {i + 1 !== options.numberOfCharacterSheets && (
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
                )}
                {options.overleaf &&
                  i + 1 === options.numberOfCharacterSheets &&
                  options.showNightSheet && (
                    <NightSheet
                      title={script.metadata?.name || "Custom Script"}
                      firstNightOrder={nightOrders.first}
                      otherNightOrder={undefined}
                      options={options}
                      assetsUrl={assetsUrl}
                    />
                  )}
              </div>
              <div style={{ breakAfter: "page" }}></div>
              <div className="teensy-sheet-pair">
                {options.overleaf && (
                  <>
                    {i + 1 === options.numberOfCharacterSheets &&
                      options.showNightSheet && (
                        <NightSheet
                          title={script.metadata?.name || "Custom Script"}
                          firstNightOrder={undefined}
                          otherNightOrder={nightOrders.other}
                          options={options}
                          assetsUrl={assetsUrl}
                        />
                      )}
                    <SheetBack
                      title={script.metadata?.name || "Custom Script"}
                      nightOrders={nightOrders}
                      options={options}
                      assetsUrl={assetsUrl}
                    />
                    {i + 1 !== options.numberOfCharacterSheets && (
                      <SheetBack
                        title={script.metadata?.name || "Custom Script"}
                        nightOrders={nightOrders}
                        options={options}
                        assetsUrl={assetsUrl}
                      />
                    )}
                  </>
                )}
              </div>
              {i + 2 < numberOfSheets && <div style={{ breakAfter: "page" }}></div>}
            </div>
          ),
      )}
      {options.showNightSheet &&
        (!(options.numberOfCharacterSheets % 2) ||
          !options.overleaf) && (
          <div
            className={`teensy-night-sheet ${!options.overleaf ? "teensy-sheet-pair" : ""}`}
          >
            <NightSheet
              title={script.metadata?.name || "Custom Script"}
              firstNightOrder={nightOrders.first}
              otherNightOrder={nightOrders.other}
              options={options}
              assetsUrl={assetsUrl}
            />
          </div>
        )}
    </div>
  );
};
