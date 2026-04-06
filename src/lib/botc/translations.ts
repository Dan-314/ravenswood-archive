import type { ResolvedCharacter, ParsedScript, Jinx } from "./types";
import { TEAM_LABELS } from "./types";

export interface CharacterTranslation {
  name?: string;
  ability?: string;
  flavor?: string;
  first?: string;
  other?: string;
}

export interface TranslationData {
  roles: Record<string, CharacterTranslation>;
  teams: Record<string, string>;
  nightMarkers: Record<string, string>;
  reminders: Record<string, string>;
  jinxes: Record<string, string>;
}

function normalizeId(id: string): string {
  return id.toLowerCase().replace(/_/g, "");
}

export function applyTranslations(
  characters: ResolvedCharacter[],
  translations: TranslationData,
): ResolvedCharacter[] {
  return characters.map((char) => {
    if (char.isCustom) return char;

    const t = translations.roles[normalizeId(char.id)];
    if (!t) return char;

    return {
      ...char,
      ...(t.name && { name: t.name }),
      ...(t.ability && { ability: t.ability }),
      ...(t.flavor && { flavor: t.flavor }),
      ...(t.first && { firstNightReminder: t.first }),
      ...(t.other && { otherNightReminder: t.other }),
      ...(char.reminders && {
        reminders: char.reminders.map(
          (r) => translations.reminders[r.toLowerCase().replace(/\s+/g, "")] ?? r,
        ),
      }),
    };
  });
}

export function applyTranslationsToScript(
  script: ParsedScript,
  translations: TranslationData,
): ParsedScript {
  return {
    ...script,
    characters: applyTranslations(script.characters, translations),
  };
}

export function translateTeamName(
  team: string,
  translations: TranslationData | null,
): string {
  if (!translations) return TEAM_LABELS[team] ?? team;
  return translations.teams[team] ?? TEAM_LABELS[team] ?? team;
}

export function translateJinxes(
  jinxes: Jinx[],
  translations: TranslationData | null,
): Jinx[] {
  if (!translations) return jinxes;
  return jinxes.map((jinx) => {
    const key = jinx.characters.sort().join("-");
    const translated = translations.jinxes[key];
    if (!translated) return jinx;
    return { ...jinx, jinx: translated };
  });
}

export function translateNightMarker(
  marker: string,
  translations: TranslationData | null,
): string {
  if (!translations) return marker;
  return translations.nightMarkers[marker.toLowerCase().replace(/\s+/g, "")] ?? marker;
}
