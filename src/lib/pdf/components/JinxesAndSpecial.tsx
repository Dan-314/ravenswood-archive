// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { Jinx, ResolvedCharacter } from "@/lib/botc/types";
import type { FabledOrLoric } from "../utils/fabledOrLoric";
import { getImageUrl } from "../utils/scriptUtils";

interface JinxesSectionProps {
  jinxes: Jinx[];
  allCharacters: ResolvedCharacter[];
  fabledAndLoric: FabledOrLoric[];
  bootleggerRules: string[];
  assetsUrl: string;
  iconUrlTemplate?: string;
}

export function JinxesAndSpecial({
  jinxes,
  allCharacters,
  fabledAndLoric,
  bootleggerRules,
  assetsUrl,
  iconUrlTemplate,
}: JinxesSectionProps) {
  const characterMap = new Map(
    allCharacters.map((char) => [char.id.toLowerCase(), char]),
  );

  const hasBothJinxesAndFabledLoric =
    jinxes.length > 0 && fabledAndLoric.length > 0;

  const hasJinxesOnly = jinxes.length > 0 && fabledAndLoric.length === 0;
  const hasSpecialOnly = jinxes.length === 0 && fabledAndLoric.length > 0;

  const useTwoColumns =
    hasBothJinxesAndFabledLoric ||
    jinxes.length > 4 ||
    fabledAndLoric.length > 4;

  const all = [...jinxes, ...fabledAndLoric];
  const midpoint = useTwoColumns ? Math.ceil(all.length / 2) : all.length;

  let leftColumn: React.ReactNode[];
  let rightColumn: React.ReactNode[] | undefined;

  if (hasBothJinxesAndFabledLoric) {
    leftColumn = jinxes.map((jinx, i) => (
      <JinxItem
        key={`lc-${i}`}
        jinx={jinx}
        charMap={characterMap}
        assetsUrl={assetsUrl}
        iconUrlTemplate={iconUrlTemplate}
      />
    ));
    rightColumn = fabledAndLoric.map((fl, i) => (
      <FabledLoricItem
        key={`rc-${i}`}
        item={fl}
        bootleggerRules={bootleggerRules}
      />
    ));
  } else if (hasJinxesOnly && useTwoColumns) {
    leftColumn = jinxes
      .slice(0, midpoint)
      .map((jinx, i) => (
        <JinxItem
          key={`lc-${i}`}
          jinx={jinx}
          charMap={characterMap}
          assetsUrl={assetsUrl}
          iconUrlTemplate={iconUrlTemplate}
        />
      ));
    rightColumn = jinxes
      .slice(midpoint)
      .map((jinx, i) => (
        <JinxItem
          key={`rc-${i}`}
          jinx={jinx}
          charMap={characterMap}
          assetsUrl={assetsUrl}
          iconUrlTemplate={iconUrlTemplate}
        />
      ));
  } else if (hasSpecialOnly && useTwoColumns) {
    leftColumn = fabledAndLoric
      .slice(0, midpoint)
      .map((item, i) => (
        <FabledLoricItem
          key={`lc-${i}`}
          item={item}
          bootleggerRules={bootleggerRules}
        />
      ));
    rightColumn = fabledAndLoric
      .slice(midpoint)
      .map((item, i) => (
        <FabledLoricItem
          key={`rc-${i}`}
          item={item}
          bootleggerRules={bootleggerRules}
        />
      ));
  } else if (hasJinxesOnly) {
    leftColumn = jinxes.map((jinx, i) => (
      <JinxItem
        key={`lc-${i}`}
        jinx={jinx}
        charMap={characterMap}
        assetsUrl={assetsUrl}
        iconUrlTemplate={iconUrlTemplate}
      />
    ));
  } else if (hasSpecialOnly) {
    leftColumn = fabledAndLoric.map((item, i) => (
      <FabledLoricItem
        key={`lc-${i}`}
        item={item}
        bootleggerRules={bootleggerRules}
      />
    ));
  } else {
    return null;
  }

  return (
    <div className="jinxes-section">
      <h2 className="section-title"></h2>

      {rightColumn ? (
        <div className="jinxes-list jinxes-two-columns">
          <div className="jinx-column">{leftColumn}</div>
          <div className="jinx-column">{rightColumn}</div>
        </div>
      ) : (
        <div className="jinxes-list">{leftColumn}</div>
      )}
    </div>
  );
}

type JinxItemProps = {
  charMap: Map<string, ResolvedCharacter>;
  jinx: Jinx;
  assetsUrl: string;
  iconUrlTemplate?: string;
};

const JinxItem = ({ charMap, jinx, assetsUrl, iconUrlTemplate }: JinxItemProps) => {
  const char1 = charMap.get(jinx.characters[0]);
  const char2 = charMap.get(jinx.characters[1]);
  return (
    <div className="jinx-item">
      <div className="jinx-icons">
        {char1 && (
          <div className="jinx-icon-wrapper">
            {getImageUrl(char1, assetsUrl, iconUrlTemplate) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(char1, assetsUrl, iconUrlTemplate)!}
                alt={char1.name}
                className="jinx-icon"
              />
            ) : (
              <div className="jinx-icon-placeholder">
                {char1.name.charAt(0)}
              </div>
            )}
          </div>
        )}
        <span className="jinx-divider"></span>
        {char2 && (
          <div className="jinx-icon-wrapper">
            {getImageUrl(char2, assetsUrl, iconUrlTemplate) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(char2, assetsUrl, iconUrlTemplate)!}
                alt={char2.name}
                className="jinx-icon"
              />
            ) : (
              <div className="jinx-icon-placeholder">
                {char2.name.charAt(0)}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="jinx-text">{jinx.jinx}</p>
    </div>
  );
};

function FabledLoricItem({
  item,
  bootleggerRules,
}: {
  item: FabledOrLoric;
  bootleggerRules: string[];
}) {
  const isBootlegger = item.name.toLowerCase() === "bootlegger";
  return (
    <div className="jinx-item loric">
      <div className="loric-spacer"></div>
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.name} className="jinx-icon loric" />
      ) : (
        <div className="jinx-icon-placeholder">{item.name.charAt(0)}</div>
      )}
      <div className="loric-text-container">
        <p className="jinx-text loric-name">{item.name}</p>
        <p className="jinx-text loric-text">{item.note}</p>
        {isBootlegger &&
          bootleggerRules.map((rule, i) => (
            <p key={`bootlegger-rule-${i}`} className="jinx-text loric-text">
              {rule}
            </p>
          ))}
      </div>
    </div>
  );
}
