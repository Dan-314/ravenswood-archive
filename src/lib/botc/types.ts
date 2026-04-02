export type CharacterTeam = "townsfolk" | "outsider" | "minion" | "demon" | "traveller" | "fabled" | "loric";

export interface ScriptCharacter {
  id: string;
  name: string;
  image?: string | string[];
  team: CharacterTeam;
  edition?: string;
  ability: string;
  flavor?: string;
  firstNight?: number;
  firstNightReminder?: string;
  otherNight?: number;
  otherNightReminder?: string;
  reminders?: string[];
  remindersGlobal?: string[];
  setup?: boolean;
  jinxes?: { id: string; reason: string }[];
  special?: { type: string; name: string; [k: string]: unknown }[];
}

export interface ScriptMetadata {
  id: "_meta";
  name: string;
  author?: string;
  logo?: string;
  hideTitle?: boolean;
  background?: string;
  almanac?: string;
  bootlegger?: string[];
  firstNight?: string[];
  otherNight?: string[];
  [k: string]: unknown;
}

export type Script = (string | ScriptCharacter | ScriptMetadata | { id: string; [key: string]: unknown })[];

export type ResolvedCharacter = ScriptCharacter & {
  icon?: string;
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
  jinx: string;
  oldJinx?: string;
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

export interface TitleStyle {
  font: string;
  letterSpacing: number;
  wordSpacing: number;
  lineHeight: number;
  backLineHeight: number;
  marginTop: number;
  marginBottom: number;
  customFontUrl: string;
}

export interface PageDimensions {
  width: number;
  height: number;
  margin: number;
  bleed: number;
}

export interface PdfOptions {
  color: string | string[];
  logo: string;
  showLogo: boolean;
  showTitle: boolean;
  showAuthor: boolean;
  showJinxes: boolean;
  showSwirls: boolean;
  includeMargins: boolean;
  solidTitle: boolean;
  appearance: "normal" | "compact" | "super-compact" | "mega-compact";
  overleaf: boolean;
  displayNightOrder: boolean;
  displayPlayerCounts: boolean;
  showNightSheet: boolean;
  nightSheetOnly: boolean;
  iconScale: number;
  formatMinorWords: boolean;
  numberOfCharacterSheets: number;
  inlineJinxIcons: "none" | "primary" | "both";
  iconUrlTemplate: string;
  titleStyle: TitleStyle;
  dimensions: PageDimensions;
  paperSize: "A4" | "Letter";
}

export const DEFAULT_PDF_OPTIONS: PdfOptions = {
  color: "#137415",
  logo: "",
  showLogo: false,
  showTitle: true,
  showAuthor: true,
  showJinxes: true,
  showSwirls: true,
  includeMargins: false,
  solidTitle: false,
  appearance: "normal",
  overleaf: false,
  displayNightOrder: true,
  displayPlayerCounts: true,
  showNightSheet: true,
  nightSheetOnly: false,
  iconScale: 1.7,
  formatMinorWords: false,
  numberOfCharacterSheets: 1,
  inlineJinxIcons: "both",
  iconUrlTemplate: "",
  titleStyle: {
    font: "Unlovable",
    letterSpacing: 0,
    wordSpacing: -3,
    lineHeight: 16,
    backLineHeight: 35,
    marginTop: 0,
    marginBottom: 0,
    customFontUrl: "",
  },
  dimensions: {
    width: 210,
    height: 297,
    margin: 0,
    bleed: 0,
  },
  paperSize: "A4",
};
