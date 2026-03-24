// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { CSSProperties } from "react";
import {
  teamColours,
  normalizeColors,
  createGradient,
  createOverlayBackground,
} from "../utils/colours";
import type { GroupedCharacters, Jinx, PdfOptions } from "@/lib/botc/types";
import type { FabledOrLoric } from "../utils/fabledOrLoric";
import { JinxesAndSpecial } from "../components/JinxesAndSpecial";
import { CharacterSection } from "./CharacterSection";
import { PrintablePage } from "../components/PrintablePage";

interface CharacterSheetProps {
  title: string;
  author?: string;
  characters: GroupedCharacters;
  jinxes: Jinx[];
  fabledOrLoric?: FabledOrLoric[];
  bootleggerRules?: string[];
  options: PdfOptions;
  assetsUrl: string;
}

export function CharacterSheet({
  title,
  author,
  characters,
  jinxes = [],
  fabledOrLoric = [],
  bootleggerRules = [],
  options,
  assetsUrl,
}: CharacterSheetProps) {
  const {
    color,
    logo,
    showLogo,
    showTitle,
    showSwirls,
    includeMargins,
    solidTitle,
    iconScale,
    appearance,
    inlineJinxIcons,
    iconUrlTemplate,
    dimensions,
  } = options;
  const sections = [
    {
      key: "townsfolk",
      title: "Townsfolk",
      chars: characters.townsfolk,
      color: teamColours["townsfolk"],
    },
    {
      key: "outsider",
      title: "Outsiders",
      chars: characters.outsider,
      color: teamColours["outsider"],
    },
    {
      key: "minion",
      title: "Minions",
      chars: characters.minion,
      color: teamColours["minion"],
    },
    {
      key: "demon",
      title: "Demons",
      chars: characters.demon,
      color: teamColours["demon"],
    },
  ].filter((section) => section.chars.length > 0);

  const colors = normalizeColors(color);
  const gradient = createGradient(colors, 20);

  const appearanceClass =
    appearance !== "normal" ? `appearance-${appearance}` : "";
  const sheetClassName = ["character-sheet", appearanceClass]
    .filter(Boolean)
    .join(" ");

  return (
    <PrintablePage dimensions={dimensions}>
      <div
        className={sheetClassName}
        id="character-sheet"
        style={
          {
            "--header-gradient": gradient,
            "--sidebar-width": options.teensy ? "10mm" : "15mm",
            "--title-font": options.titleStyle.font,
            "--title-letter-spacing": `${options.titleStyle.letterSpacing}mm`,
            "--title-word-spacing": `${options.titleStyle.wordSpacing}mm`,
            "--title-line-height": `${options.titleStyle.lineHeight}mm`,
            "--title-margin-top": `${options.titleStyle.marginTop}mm`,
            "--title-margin-bottom": `${options.titleStyle.marginBottom}mm`,
            "--icon-scale": (iconScale / 1.7).toString(),
            transform: includeMargins ? "scale(0.952)" : undefined,
          } as CSSProperties
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="character-sheet-background"
          src={`${assetsUrl}/parchment_texture_a4_lightened.jpg`}
          alt=""
        />
        <Sidebar color={color} assetsUrl={assetsUrl} />
        <div className="sheet-content">
          <Header
            showSwirls={showSwirls}
            showTitle={showTitle}
            title={title}
            author={author}
            logo={showLogo ? logo : undefined}
            solidHeader={solidTitle}
            assetsUrl={assetsUrl}
          />

          <div className="characters-grid">
            {sections.map((section, i) => (
              <div key={section.key}>
                <CharacterSection
                  title={section.title.toUpperCase()}
                  characters={section.chars}
                  charNameColor={section.color}
                  jinxes={jinxes}
                  allCharacters={[
                    ...characters.townsfolk,
                    ...characters.outsider,
                    ...characters.minion,
                    ...characters.demon,
                  ]}
                  inlineJinxIcons={inlineJinxIcons}
                  assetsUrl={assetsUrl}
                  iconUrlTemplate={iconUrlTemplate}
                />
                {i < sections.length - 1 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${assetsUrl}/divider.png`} className="section-divider" alt="" />
                )}
              </div>
            ))}
            {(jinxes.length > 0 || fabledOrLoric.length > 0) && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${assetsUrl}/divider.png`} className="section-divider" alt="" />
                <JinxesAndSpecial
                  fabledAndLoric={fabledOrLoric}
                  jinxes={jinxes}
                  allCharacters={[
                    ...characters.townsfolk,
                    ...characters.outsider,
                    ...characters.minion,
                    ...characters.demon,
                  ]}
                  bootleggerRules={bootleggerRules}
                  assetsUrl={assetsUrl}
                  iconUrlTemplate={iconUrlTemplate}
                />
              </>
            )}
          </div>

          <div className="sheet-footer">
            <span className="asterisk">*</span>Not the first night
          </div>
          <div className="author-credit">
            <p>&copy; Steven Medway bloodontheclocktower.com</p>
          </div>
        </div>
      </div>
    </PrintablePage>
  );
}

function Header({
  showSwirls,
  showTitle,
  title,
  author,
  logo,
  solidHeader = false,
  assetsUrl,
}: {
  showSwirls: boolean;
  showTitle: boolean;
  title: string;
  author?: string;
  logo?: string;
  solidHeader?: boolean;
  assetsUrl: string;
}) {
  if (!showTitle && !logo && !showSwirls) {
    return null;
  }

  return (
    <>
      <h1 className="sheet-header">
        {showSwirls && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${assetsUrl}/black-swirl-divider.png`}
            className="swirl-divider"
            alt=""
          />
        )}

        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="script-logo" src={logo} alt="" />
        )}
        {showTitle && (
          <span
            style={{
              mixBlendMode: solidHeader ? "normal" : "multiply",
            }}
          >
            {title}
          </span>
        )}
        {showSwirls && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${assetsUrl}/black-swirl-divider.png`}
            className="swirl-divider flip"
            alt=""
          />
        )}
      </h1>
      {author && <h2 className="sheet-author">by {author}</h2>}
    </>
  );
}

function Sidebar({ color, assetsUrl }: { color: string | string[]; assetsUrl: string }) {
  const overlayBackground = createOverlayBackground(color, 180);
  return (
    <div className="sidebar-container">
      <div className="sidebar-background" style={{ backgroundImage: `url(${assetsUrl}/sidebar-desaturated-small.jpg)` }}></div>
      <div
        className="sidebar-overlay"
        style={{ background: overlayBackground }}
      ></div>
    </div>
  );
}
