import { ALL_CHARACTERS } from "botc-script-checker";
import type { Script, ScriptCharacter, ScriptMetadata } from "botc-script-checker";
import type { ParsedScript, ResolvedCharacter, GroupedCharacters } from "./types";
import { TEAM_ORDER } from "./types";

export function parseScript(rawJson: unknown): ParsedScript {
  if (!Array.isArray(rawJson)) {
    throw new Error("Script must be an array");
  }

  const script = rawJson as Script;
  let metadata: ScriptMetadata | null = null;
  const characters: ResolvedCharacter[] = [];

  for (const element of script) {
    if (typeof element === "string") {
      const resolved = resolveCharacter(element);
      if (resolved) characters.push(resolved);
    } else if (typeof element === "object" && element !== null && "id" in element) {
      const el = element as { id: string; [key: string]: unknown };
      if (el.id === "_meta") {
        metadata = element as ScriptMetadata;
      } else if ("team" in el && "ability" in el) {
        // Custom character with full definition
        characters.push({
          ...(element as ScriptCharacter),
          team: (el.team as string) === "traveler" ? "traveller" : (el.team as ScriptCharacter["team"]),
          isCustom: true,
        });
      } else {
        // Official character as object with just id
        const resolved = resolveCharacter(el.id);
        if (resolved) characters.push(resolved);
      }
    }
  }

  // If metadata includes bootlegger rules but bootlegger isn't in script, add it
  if (metadata?.bootlegger?.length && !characters.find((c) => c.id.toLowerCase() === "bootlegger")) {
    const bootlegger = resolveCharacter("bootlegger");
    if (bootlegger) characters.push(bootlegger);
  }

  return { metadata, characters };
}

function resolveCharacter(id: string): ResolvedCharacter | null {
  const normalizedId = id.toLowerCase().replace(/_/g, "");
  const char = ALL_CHARACTERS[normalizedId] ?? ALL_CHARACTERS[id.toLowerCase()];
  if (!char) {
    console.warn(`Character not found: ${id}`);
    return null;
  }
  return { ...char };
}

export function groupByTeam(characters: ResolvedCharacter[]): GroupedCharacters {
  const grouped: GroupedCharacters = {
    townsfolk: [],
    outsider: [],
    minion: [],
    demon: [],
    traveller: [],
    fabled: [],
    loric: [],
  };

  for (const char of characters) {
    const team = char.team as keyof GroupedCharacters;
    if (grouped[team]) {
      grouped[team].push(char);
    }
  }

  return grouped;
}

const ICON_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdf-assets`;

export function getIconUrl(character: ResolvedCharacter, _assetsUrl?: string): string {
  // Custom character with image URL
  if (character.image) {
    if (typeof character.image === "string") return character.image;
    if (Array.isArray(character.image) && character.image.length > 0) return character.image[0];
  }
  // Official character — use icon filename from ALL_CHARACTERS
  if ("icon" in character && character.icon) {
    return `${ICON_STORAGE_URL}/${character.icon}`;
  }
  // Fallback: try id-based URL
  return `${ICON_STORAGE_URL}/${character.id}.png`;
}
