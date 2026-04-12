import type { ResolvedCharacter, ScriptCharacter, ParsedScript, Jinx } from "./types";
import { TEAM_LABELS } from "./types";
import { ALL_CHARACTERS_WITH_REMINDERS } from "./all-characters";
import localRoles from "../../../roles.json";

const FULL_CHARACTERS: Record<string, ScriptCharacter> = {};
for (const role of localRoles as ScriptCharacter[]) {
  if (role.id) {
    const nid = role.id.toLowerCase().replace(/_/g, "");
    FULL_CHARACTERS[nid] = {
      ...role,
      ...(ALL_CHARACTERS_WITH_REMINDERS[nid] as Partial<ScriptCharacter>),
    };
  }
}

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
  ui?: Record<string, string>;
}

export function normalizeId(id: string): string {
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

export function translateUiLabel(
  key: string,
  fallback: string,
  translations: TranslationData | null,
): string {
  if (!translations) return fallback;
  return translations.ui?.[key] ?? fallback;
}

const TPI_CDN_BASE = "https://release.botc.app/resources/characters";

function getCharacterImage(char: ScriptCharacter): string {
  const edition = char.edition ?? null;
  if (!edition) return "";
  const alignment =
    char.team === "townsfolk" || char.team === "outsider" ? "_g" :
    char.team === "minion" || char.team === "demon" ? "_e" :
    "";
  return `${TPI_CDN_BASE}/${edition}/${char.id}${alignment}.webp`;
}

function buildTranslatedEntry(
  id: string,
  translations: TranslationData,
  language: string,
  customImage?: string,
): Record<string, unknown> | null {
  const nid = normalizeId(id);
  const char = FULL_CHARACTERS[nid];
  if (!char) return null;
  const t = translations.roles[nid];

  const reminders = char.reminders?.map(
    (r) => translations.reminders[r.toLowerCase().replace(/\s+/g, "")] ?? r,
  );

  const image = customImage || getCharacterImage(char);

  return {
    id: `${language}_${id}`,
    name: t?.name ?? char.name,
    team: char.team,
    ability: t?.ability ?? char.ability,
    ...(image && { image }),
    ...(char.firstNightReminder !== undefined && {
      firstNightReminder: t?.first ?? char.firstNightReminder,
    }),
    ...(char.otherNightReminder !== undefined && {
      otherNightReminder: t?.other ?? char.otherNightReminder,
    }),
    ...(reminders && { reminders }),
    ...(char.setup !== undefined && { setup: char.setup }),
  };
}

export function translateRawJson(
  rawJson: unknown,
  translations: TranslationData,
  language: string,
): unknown {
  if (!Array.isArray(rawJson)) return rawJson;

  return rawJson.map((entry: unknown) => {
    if (typeof entry === "string") {
      return buildTranslatedEntry(entry, translations, language) ?? entry;
    }

    if (typeof entry !== "object" || entry === null || !("id" in entry)) {
      return entry;
    }

    const obj = entry as { id: string; image?: string; [key: string]: unknown };

    if (obj.id === "_meta") return entry;
    if ("team" in obj && "ability" in obj) return entry;

    const customImage = typeof obj.image === "string" ? obj.image : undefined;
    return buildTranslatedEntry(obj.id, translations, language, customImage) ?? entry;
  });
}

export function translateNightMarker(
  marker: string,
  translations: TranslationData | null,
): string {
  if (!translations) return marker;
  return translations.nightMarkers[marker.toLowerCase().replace(/\s+/g, "")] ?? marker;
}
