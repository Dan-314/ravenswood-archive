import jinxesData from "./jinxes-data.json";
import type { Jinx, ResolvedCharacter } from "./types";

interface JinxData {
  characters: [string, string];
  jinx: string;
  oldJinx?: string;
}

/**
 * Find all jinxes relevant to a set of characters.
 * Uses the global jinxes database, plus any custom jinxes defined on characters.
 */
export function findJinxes(characters: ResolvedCharacter[], useOldJinxes = false): Jinx[] {
  const characterIds = new Set(characters.map((c) => c.id.toLowerCase()));
  const jinxes: Jinx[] = [];
  const seen = new Set<string>();

  // Check global jinxes database
  for (const jinx of jinxesData as JinxData[]) {
    const [char1, char2] = jinx.characters;
    if (characterIds.has(char1) && characterIds.has(char2)) {
      const key = [char1, char2].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      jinxes.push({
        characters: [char1, char2],
        jinx: useOldJinxes && jinx.oldJinx ? jinx.oldJinx : jinx.jinx,
        oldJinx: jinx.oldJinx,
      });
    }
  }

  // Check custom jinxes defined on characters in the script JSON
  for (const char of characters) {
    if (!("jinxes" in char) || !Array.isArray((char as unknown as Record<string, unknown>).jinxes)) continue;
    for (const jinx of (char as unknown as Record<string, unknown>).jinxes as Array<{ id: string; reason: string }>) {
      if (!jinx.id || !jinx.reason) continue;
      const otherId = jinx.id.toLowerCase();
      if (!characterIds.has(otherId)) continue;

      const key = [char.id.toLowerCase(), otherId].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      jinxes.push({
        characters: [char.id.toLowerCase(), otherId],
        jinx: jinx.reason,
      });
    }
  }

  return jinxes;
}
