// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { NightOrderEntry } from "@/lib/botc/types";
import { getImageUrl } from "./scriptUtils";

export function getImageSrc(
  entry: NightOrderEntry,
  assetsUrl: string,
  iconUrlTemplate?: string,
): string | undefined {
  if (typeof entry === "string") {
    return entry === "dawn"
      ? `${assetsUrl}/dawn-icon.png`
      : entry === "dusk"
        ? `${assetsUrl}/dusk-icon.png`
        : entry === "minioninfo"
          ? `${assetsUrl}/minioninfo.png`
          : `${assetsUrl}/demoninfo.png`;
  }
  return getImageUrl(entry, assetsUrl, iconUrlTemplate) ?? undefined;
}
