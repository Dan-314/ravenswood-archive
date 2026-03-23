import { nightOrders } from "botc-script-checker";
import type { Script, ScriptCharacter } from "botc-script-checker";
import type { NightOrderEntry, NightOrders, ParsedScript, NightMarker } from "./types";

const NIGHT_MARKERS: NightMarker[] = ["dawn", "dusk", "minioninfo", "demoninfo"];

type RawCharMap = Map<string, { firstNight?: number; otherNight?: number }>;

function createRawCharMap(rawScript: Script): RawCharMap {
  const map: RawCharMap = new Map();
  for (const el of rawScript) {
    if (typeof el === "object" && el !== null && "id" in el && el.id !== "_meta") {
      const char = el as ScriptCharacter;
      if (char.firstNight !== undefined || char.otherNight !== undefined) {
        map.set(char.id.toLowerCase(), {
          firstNight: char.firstNight,
          otherNight: char.otherNight,
        });
      }
    }
  }
  return map;
}

function getPosition(
  entry: NightOrderEntry,
  nightType: "firstNight" | "otherNight",
  orderList: string[],
  rawCharMap: RawCharMap,
): number {
  const id = typeof entry === "string" ? entry : entry.id;

  // Travellers don't appear in night order
  if (typeof entry !== "string" && entry.team === "traveller") return Infinity;

  const officialIndex = orderList.indexOf(id);
  if (officialIndex !== -1) return officialIndex;

  // Custom character with numeric position
  const customData = rawCharMap.get(id);
  const customValue = nightType === "firstNight" ? customData?.firstNight : customData?.otherNight;
  if (customValue !== undefined && customValue > 0) return customValue;

  return Infinity;
}

function buildNightOrder(
  characters: NightOrderEntry[],
  nightType: "firstNight" | "otherNight",
  rawCharMap: RawCharMap,
): NightOrderEntry[] {
  const orderList = nightType === "firstNight" ? nightOrders.firstNight : nightOrders.otherNight;

  const activeChars = characters.filter(
    (char) => getPosition(char, nightType, orderList, rawCharMap) !== Infinity,
  );

  const markers: NightMarker[] =
    nightType === "firstNight"
      ? ["dusk", "minioninfo", "demoninfo", "dawn"]
      : ["dusk", "dawn"];

  const entries: NightOrderEntry[] = [...activeChars, ...markers];

  entries.sort(
    (a, b) =>
      getPosition(a, nightType, orderList, rawCharMap) -
      getPosition(b, nightType, orderList, rawCharMap),
  );

  return entries;
}

function parseCustomNightOrder(
  order: string[],
  characters: ScriptCharacter[],
): NightOrderEntry[] {
  const entries: NightOrderEntry[] = [];
  for (const entry of order) {
    const foundChar = characters.find((c) => c.id.toLowerCase() === entry.toLowerCase());
    if (foundChar) {
      entries.push(foundChar as NightOrderEntry);
    } else if (NIGHT_MARKERS.includes(entry.toLowerCase() as NightMarker)) {
      entries.push(entry.toLowerCase() as NightMarker);
    }
  }
  return entries;
}

export function calculateNightOrders(
  parsedScript: ParsedScript,
  rawScript: Script,
): NightOrders {
  const rawCharMap = createRawCharMap(rawScript);

  const first = parsedScript.metadata?.firstNight?.length
    ? parseCustomNightOrder(parsedScript.metadata.firstNight, parsedScript.characters)
    : buildNightOrder(parsedScript.characters, "firstNight", rawCharMap);

  const other = parsedScript.metadata?.otherNight?.length
    ? parseCustomNightOrder(parsedScript.metadata.otherNight, parsedScript.characters)
    : buildNightOrder(parsedScript.characters, "otherNight", rawCharMap);

  return { first, other };
}
