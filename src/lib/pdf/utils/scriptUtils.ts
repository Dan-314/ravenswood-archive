// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { ResolvedCharacter, Jinx } from "@/lib/botc/types";
import { getIconUrl } from "@/lib/botc/parse-script";

export function resolveIconUrl(template: string, id: string): string | null {
  if (!template) return null;
  return template.replace("{id}", id);
}

export const getImageUrl = (
  character: ResolvedCharacter,
  assetsUrl: string,
  iconUrlTemplate?: string,
): string | null => {
  // Use custom image if provided on the character
  if (character.image) {
    if (typeof character.image === "string") {
      return character.image;
    }
    if (Array.isArray(character.image) && character.image.length > 0) {
      return character.image[0];
    }
  }
  // Fall back to icon URL template if provided
  if (iconUrlTemplate) {
    return resolveIconUrl(iconUrlTemplate, character.id);
  }
  // Default: use Supabase-based icon URL
  return getIconUrl(character);
};

export function getJinxedCharacters(
  character: ResolvedCharacter,
  jinxes: Jinx[],
  allCharacters: ResolvedCharacter[],
  mode: "none" | "primary" | "both" = "both",
): ResolvedCharacter[] {
  if (mode === "none") {
    return [];
  }

  const jinxedCharacterIds: string[] = [];

  jinxes.forEach((jinx) => {
    if (jinx.characters[0] === character.id) {
      jinxedCharacterIds.push(jinx.characters[1]);
    } else if (jinx.characters[1] === character.id && mode === "both") {
      jinxedCharacterIds.push(jinx.characters[0]);
    }
  });

  return allCharacters.filter((char) => jinxedCharacterIds.includes(char.id));
}
