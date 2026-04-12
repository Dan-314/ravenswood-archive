// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { ResolvedCharacter } from "@/lib/botc/types";
import { getImageUrl } from "./scriptUtils";

export type FabledOrLoric = { name: string; note: string; image?: string };

export function getFabledOrLoric(
  characters: ResolvedCharacter[],
  assetsUrl: string,
  iconUrlTemplate?: string,
): FabledOrLoric[] {
  const fabled = characters.filter((char) => char.team === "fabled");
  const loric = characters.filter((char) => char.team === "loric");

  const getImage = (char: ResolvedCharacter) =>
    getImageUrl(char, assetsUrl, iconUrlTemplate) ?? undefined;

  return [
    ...loric.map((lo) => ({
      name: lo.name,
      note: lo.ability,
      image: getImage(lo),
    })),
    ...fabled.map((fb) => ({
      name: fb.name,
      note: fb.ability,
      image: getImage(fb),
    })),
  ];
}
