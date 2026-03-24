// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { ResolvedCharacter, Jinx } from "@/lib/botc/types";
import { getJinxedCharacters, getImageUrl } from "../utils/scriptUtils";

interface CharacterSectionProps {
  title: string;
  characters: ResolvedCharacter[];
  charNameColor: string;
  jinxes: Jinx[];
  allCharacters: ResolvedCharacter[];
  inlineJinxIcons: "none" | "primary" | "both";
  assetsUrl: string;
  iconUrlTemplate?: string;
}

const BALANCE_POINT = 8;

export function CharacterSection({
  title,
  characters,
  charNameColor,
  jinxes,
  allCharacters: allChars,
  inlineJinxIcons,
  assetsUrl,
  iconUrlTemplate,
}: CharacterSectionProps) {
  const justifyContent =
    characters.length > BALANCE_POINT
      ? "space-between"
      : characters.length % 2 === 0
        ? "space-around"
        : "flex-start";

  const midpoint = calculateMidpoint(characters);

  return (
    <div className="character-section">
      <h2 className="section-title">{title}</h2>
      <div className="character-list">
        <div className="character-column" style={{ justifyContent }}>
          {characters.slice(0, midpoint).map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              color={charNameColor}
              assetsUrl={assetsUrl}
              iconUrlTemplate={iconUrlTemplate}
              jinxedCharacters={getJinxedCharacters(
                char,
                jinxes,
                allChars,
                inlineJinxIcons,
              )}
            />
          ))}
        </div>
        <div className="character-column" style={{ justifyContent }}>
          {characters.slice(midpoint).map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              color={charNameColor}
              assetsUrl={assetsUrl}
              iconUrlTemplate={iconUrlTemplate}
              jinxedCharacters={getJinxedCharacters(
                char,
                jinxes,
                allChars,
                inlineJinxIcons,
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CharacterCardProps {
  character: ResolvedCharacter;
  color: string;
  jinxedCharacters: ResolvedCharacter[];
  assetsUrl: string;
  iconUrlTemplate?: string;
}

function CharacterCard({
  character,
  color,
  jinxedCharacters,
  assetsUrl,
  iconUrlTemplate,
}: CharacterCardProps) {
  const renderAbility = (ability: string) => {
    const match = ability.match(/^(.*?)(\[.*?\])$/);

    if (match) {
      const [, beforeBrackets, brackets] = match;
      return (
        <>
          {beforeBrackets}
          <strong className="setup-ability">{brackets}</strong>
        </>
      );
    }

    return ability;
  };

  const imageUrl = getImageUrl(character, assetsUrl, iconUrlTemplate);
  return (
    <div className="character-card">
      <div className="character-icon-wrapper">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={character.name} className="character-icon" />
        ) : (
          <div className="character-icon-placeholder" style={{ color }}>
            {character.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="character-info">
        <h3 className="character-name" style={{ color }}>
          {character.name}
          {jinxedCharacters.length > 0 && (
            <span className="inline-jinx-icons">
              {jinxedCharacters.map((jinxedChar) => {
                const jinxImageUrl = getImageUrl(jinxedChar, assetsUrl, iconUrlTemplate);
                return jinxImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={jinxedChar.id}
                    src={jinxImageUrl}
                    alt={jinxedChar.name}
                    className="inline-jinx-icon"
                    title={`Jinxed with ${jinxedChar.name}`}
                  />
                ) : (
                  <span
                    key={jinxedChar.id}
                    className="inline-jinx-icon-placeholder"
                    title={`Jinxed with ${jinxedChar.name}`}
                  >
                    {jinxedChar.name.charAt(0)}
                  </span>
                );
              })}
            </span>
          )}
        </h3>
        <p className="character-ability">{renderAbility(character.ability)}</p>
      </div>
    </div>
  );
}

function calculateMidpoint(characters: ResolvedCharacter[]): number {
  const midpoint = Math.ceil(characters.length / 2);

  if (characters.length % 2 === 0 || characters.length <= BALANCE_POINT) {
    return midpoint;
  }
  const leftWeightedMidpoint = midpoint;
  const rightWeightedMidpoint = midpoint - 1;

  const largerFirstHalf = characters.slice(0, leftWeightedMidpoint);
  const largerSecondHalf = characters.slice(rightWeightedMidpoint - 1);

  const totalAbilityLengthFirstHalf = largerFirstHalf.reduce(
    (sum, char) => sum + char.ability.length,
    0,
  );
  const totalAbilityLengthSecondHalf = largerSecondHalf.reduce(
    (sum, char) => sum + char.ability.length,
    0,
  );

  return totalAbilityLengthFirstHalf < totalAbilityLengthSecondHalf
    ? leftWeightedMidpoint
    : rightWeightedMidpoint;
}
