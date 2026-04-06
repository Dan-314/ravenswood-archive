import type { Script, ScriptCharacter, ScriptMetadata, ParsedScript, ResolvedCharacter, GroupedCharacters } from "./types";
import localRoles from "../../../roles.json";
import { ALL_CHARACTERS_WITH_REMINDERS } from "./all-characters";

const LOCAL_CHARACTERS: Record<string, ScriptCharacter> = {};
for (const role of localRoles as ScriptCharacter[]) {
  if (role.id) {
    LOCAL_CHARACTERS[role.id.toLowerCase().replace(/_/g, "")] = role;
  }
}

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
  // Use ALL_CHARACTERS_WITH_REMINDERS as primary source (has night reminder text),
  // fall back to local roles.json
  const withReminders = ALL_CHARACTERS_WITH_REMINDERS[normalizedId] ?? ALL_CHARACTERS_WITH_REMINDERS[id.toLowerCase()];
  const base = LOCAL_CHARACTERS[normalizedId] ?? LOCAL_CHARACTERS[id.toLowerCase()];
  if (!withReminders && !base) {
    console.warn(`Character not found: ${id}`);
    return null;
  }
  return { ...base, ...withReminders };
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

const TPI_CDN_BASE = "https://release.botc.app/resources/characters";

export function getIconUrl(character: ResolvedCharacter, _assetsUrl?: string): string {
  // Custom character with image URL
  if (character.image) {
    if (typeof character.image === "string") return character.image;
    if (Array.isArray(character.image) && character.image.length > 0) return character.image[0];
  }

  // Official character — use TPI CDN
  const edition = character.edition ?? null;
  if (edition) {
    const alignment =
      character.team === "townsfolk" || character.team === "outsider" ? "_g" :
      character.team === "minion" || character.team === "demon" ? "_e" :
      "";
    return `${TPI_CDN_BASE}/${edition}/${character.id}${alignment}.webp`;
  }

  // Fallback for characters without an edition (e.g. custom characters with icon field)
  if ("icon" in character && character.icon) {
    return character.icon;
  }
  return "";
}
