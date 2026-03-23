import type { ScriptCharacter, ScriptMetadata, CharacterTeam } from "botc-script-checker";

export type ResolvedCharacter = ScriptCharacter & {
  icon?: string;
  homeScript?: string;
  isCustom?: boolean;
};

export interface ParsedScript {
  metadata: ScriptMetadata | null;
  characters: ResolvedCharacter[];
}

export interface GroupedCharacters {
  townsfolk: ResolvedCharacter[];
  outsider: ResolvedCharacter[];
  minion: ResolvedCharacter[];
  demon: ResolvedCharacter[];
  traveller: ResolvedCharacter[];
  fabled: ResolvedCharacter[];
  loric: ResolvedCharacter[];
}

export type NightMarker = "dawn" | "dusk" | "minioninfo" | "demoninfo";
export type NightOrderEntry = ResolvedCharacter | NightMarker;

export interface NightOrders {
  first: NightOrderEntry[];
  other: NightOrderEntry[];
}

export interface Jinx {
  characters: [string, string];
  reason: string;
}

export const TEAM_ORDER: CharacterTeam[] = [
  "townsfolk",
  "outsider",
  "minion",
  "demon",
  "traveller",
  "fabled",
  "loric",
];

export const TEAM_LABELS: Record<string, string> = {
  townsfolk: "Townsfolk",
  outsider: "Outsiders",
  minion: "Minions",
  demon: "Demons",
  traveller: "Travellers",
  fabled: "Fabled",
  loric: "Loric",
};

export const TEAM_COLORS: Record<string, string> = {
  townsfolk: "#00469e",
  outsider: "#00469e",
  minion: "#580709",
  demon: "#580709",
  traveller: "#390758",
  fabled: "#6b5f05",
  loric: "#1f5807",
};

export interface PdfOptions {
  color: string;
  teensy: boolean;
  appearance: "normal" | "compact" | "super-compact" | "mega-compact";
  titleFont: string;
  iconScale: number;
  overleaf: "infoSheet" | "none";
  showNightSheet: boolean;
  nightSheetOnly: boolean;
  paperSize: "A4" | "Letter";
  includeMargins: boolean;
}

export const DEFAULT_PDF_OPTIONS: PdfOptions = {
  color: "#137415",
  teensy: false,
  appearance: "normal",
  titleFont: "Unlovable",
  iconScale: 1.7,
  overleaf: "none",
  showNightSheet: false,
  nightSheetOnly: false,
  paperSize: "A4",
  includeMargins: false,
};
