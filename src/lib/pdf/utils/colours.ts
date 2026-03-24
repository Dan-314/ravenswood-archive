// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { CharacterTeam } from "botc-script-checker";

export function parseRgb(hex: string): [number, number, number] {
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6) {
    throw new Error(`Invalid HEX color: ${hex}`);
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

export function rgbString(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function darken(color: string, darkenFactor: number) {
  const [r, g, b] = parseRgb(color);
  const rDark = Math.round(r * darkenFactor);
  const gDark = Math.round(g * darkenFactor);
  const bDark = Math.round(b * darkenFactor);
  return rgbString(rDark, gDark, bDark);
}

export const teamColours: Record<CharacterTeam, string> = {
  townsfolk: "#00469e",
  outsider: "#00469e",
  minion: "#580709",
  demon: "#580709",
  fabled: "#6b5f05ff",
  traveller: "#390758ff",
  loric: "#1f5807",
};

export function normalizeColors(color: string | string[]): string[] {
  if (Array.isArray(color)) {
    return color;
  }
  return [color];
}

export function isMultiColor(color: string | string[]): boolean {
  const colors = normalizeColors(color);
  return colors.length >= 2;
}

export function createGradient(colors: string[], angle: number = 20): string {
  if (colors.length === 0) {
    return "transparent";
  }

  if (colors.length === 1) {
    const colorDark = darken(colors[0], 0.4);
    return `linear-gradient(${angle}deg, ${colors[0]} 50%, ${colorDark})`;
  }

  const stops = colors
    .map((color, index) => {
      const percentage = (index / (colors.length - 1)) * 100;
      return `${color} ${percentage}%`;
    })
    .join(", ");

  return `linear-gradient(${angle}deg, ${stops})`;
}

export function createOverlayBackground(
  color: string | string[],
  angle: number = 90,
): string {
  const colors = normalizeColors(color);

  if (colors.length === 1) {
    return colors[0];
  }

  const stops = colors
    .map((c, index) => {
      const percentage = (index / (colors.length - 1)) * 100;
      return `${c} ${percentage}%`;
    })
    .join(", ");

  return `linear-gradient(${angle}deg, ${stops})`;
}
