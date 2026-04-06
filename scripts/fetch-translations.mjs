#!/usr/bin/env node

// Fetches character translations from the BotC Weblate project
// and writes them as JSON files to public/translations/

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const OUTPUT_DIR = join(PROJECT_ROOT, "public", "translations");

const BASE_URL = "https://translation.botc.app/api";
const PROJECT = "botc-app";
const COMPONENT = "game-content";
const MIN_COMPLETION = 50;

// Weblate doesn't provide native names, so we map them here
const NATIVE_NAMES = {
  zh_Hans: "简体中文",
  pt_PT: "Português (Portugal)",
  pl: "Polski",
  ko: "한국어",
  sv: "Svenska",
  it: "Italiano",
  es_MX: "Español (México)",
  vi: "Tiếng Việt",
  da: "Dansk",
  sr: "Српски",
  es_419: "Español (Latinoamérica)",
  gl: "Galego",
  uk: "Українська",
  ja: "日本語",
  de: "Deutsch",
  nl: "Nederlands",
  fr: "Français",
  ru: "Русский",
  th: "ไทย",
  cs: "Čeština",
  fi: "Suomi",
  nb_NO: "Norsk bokmål",
  ro: "Română",
  tr: "Türkçe",
  he: "עברית",
  hu: "Magyar",
  id: "Bahasa Indonesia",
  sk: "Slovenčina",
  sl: "Slovenščina",
  es: "Español",
  pt_BR: "Português (Brasil)",
};

// grimoire.* keys in app-interface that contain team labels ("Singular|Plural")
const TEAM_GRIMOIRE_KEYS = ["townsfolk", "outsider", "minion", "demon", "traveller", "fabled", "loric"];

// Night marker role keys
const NIGHT_MARKER_IDS = ["dusk", "dawn", "demoninfo", "minioninfo"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const API_TOKEN = process.env.WEBLATE_API_TOKEN;

async function fetchJson(url, retries = 5) {
  const headers = {};
  if (API_TOKEN) headers["Authorization"] = `Token ${API_TOKEN}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after");
      // Cap wait at 60s per retry, use exponential backoff as fallback
      const wait = Math.min(
        retryAfter ? parseInt(retryAfter, 10) * 1000 : Infinity,
        Math.pow(2, attempt + 2) * 1000,
        60_000,
      );
      console.log(`    Rate limited, waiting ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  }
  throw new Error(`Rate limited after ${retries} retries for ${url}`);
}

async function fetchAllUnits(langCode) {
  const units = [];
  // page_size=10000 fetches all ~951 units in a single request (max allowed is 10000)
  let url = `${BASE_URL}/translations/${PROJECT}/${COMPONENT}/${langCode}/units/?format=json&page_size=10000`;
  while (url) {
    const data = await fetchJson(url);
    units.push(...data.results);
    url = data.next;
    if (url) await sleep(500);
  }
  return units;
}

async function getLanguages() {
  const translations = [];
  let url = `${BASE_URL}/components/${PROJECT}/${COMPONENT}/translations/?format=json`;
  while (url) {
    const data = await fetchJson(url);
    translations.push(...data.results);
    url = data.next;
    if (url) await sleep(500);
  }
  return translations;
}

async function fetchTeamLabels(langCode) {
  const teams = {};
  const query = TEAM_GRIMOIRE_KEYS.map((k) => `context:grimoire.${k}`).join("+OR+");
  const url = `${BASE_URL}/translations/${PROJECT}/app-interface/${langCode}/units/?format=json&page_size=100&q=${query}`;
  try {
    const data = await fetchJson(url);
    for (const unit of data.results) {
      const key = unit.context.replace("grimoire.", "");
      const target = unit.target?.[0];
      if (!target || !TEAM_GRIMOIRE_KEYS.includes(key)) continue;
      // Format is "Singular|Plural" — use the plural form for section headers
      const parts = target.split("|");
      teams[key] = parts.length > 1 ? parts[1] : parts[0];
    }
  } catch {
    // app-interface may not have this language — fall back to game-content reminders
  }
  return teams;
}

function normalizeId(id) {
  return id.toLowerCase().replace(/_/g, "");
}

function buildTranslationData(units) {
  const data = {
    roles: {},
    teams: {},
    nightMarkers: {},
    reminders: {},
    jinxes: {},
  };

  for (const unit of units) {
    const ctx = unit.context;
    const target = unit.target?.[0];
    if (!target) continue;

    if (ctx.startsWith("roles.")) {
      const parts = ctx.split(".");
      // roles.{id}.{field}
      if (parts.length === 3) {
        const [, rawId, field] = parts;
        const id = normalizeId(rawId);

        // Night marker roles
        if (NIGHT_MARKER_IDS.includes(id) && field === "name") {
          data.nightMarkers[id] = target;
          continue;
        }

        // Regular character roles
        if (!data.roles[id]) data.roles[id] = {};
        if (field === "name") data.roles[id].name = target;
        else if (field === "ability") data.roles[id].ability = target;
        else if (field === "flavor") data.roles[id].flavor = target;
        else if (field === "first") data.roles[id].first = target;
        else if (field === "other") data.roles[id].other = target;
      }
    } else if (ctx.startsWith("reminders.")) {
      const key = ctx.slice("reminders.".length);
      // All reminders
      data.reminders[key] = target;
    } else if (ctx.startsWith("jinxes.")) {
      const key = ctx.slice("jinxes.".length);
      data.jinxes[key] = target;
    }
  }

  return data;
}

async function main() {
  console.log("Fetching available languages...");
  const languages = await getLanguages();

  // Filter by completion threshold, exclude English (source language)
  const qualifying = languages.filter(
    (l) =>
      l.language_code !== "en" &&
      l.translated_percent >= MIN_COMPLETION
  );

  console.log(
    `Found ${qualifying.length} languages with >=${MIN_COMPLETION}% completion:`
  );
  for (const l of qualifying) {
    console.log(`  ${l.language_code} - ${l.language.name} (${Math.round(l.translated_percent)}%)`);
  }

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest = [];

  const resume = process.argv.includes("--resume");

  for (const lang of qualifying) {
    const code = lang.language_code;
    const outPath = join(OUTPUT_DIR, `${code}.json`);

    if (resume && existsSync(outPath)) {
      console.log(`\nSkipping ${code} (already exists)`);
      manifest.push({
        code,
        name: lang.language.name,
        nativeName: NATIVE_NAMES[code] || lang.language.name,
        completion: Math.round(lang.translated_percent),
      });
      continue;
    }

    console.log(`\nFetching ${code} (${lang.language.name})...`);

    const units = await fetchAllUnits(code);
    console.log(`  ${units.length} units fetched`);

    const translationData = buildTranslationData(units);

    // Fetch team labels from app-interface component (has all teams including demon)
    const teamLabels = await fetchTeamLabels(code);
    Object.assign(translationData.teams, teamLabels);

    const roleCount = Object.keys(translationData.roles).length;
    console.log(`  ${roleCount} roles, ${Object.keys(translationData.jinxes).length} jinxes, ${Object.keys(translationData.reminders).length} reminders`);

    writeFileSync(outPath, JSON.stringify(translationData, null, 2) + "\n");
    console.log(`  Written to ${outPath}`);

    manifest.push({
      code,
      name: lang.language.name,
      nativeName: NATIVE_NAMES[code] || lang.language.name,
      completion: Math.round(lang.translated_percent),
    });

    // Pause between languages to avoid rate limiting
    await sleep(500);
  }

  // Sort manifest by native name
  manifest.sort((a, b) => a.nativeName.localeCompare(b.nativeName));

  const manifestPath = join(OUTPUT_DIR, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nManifest written to ${manifestPath}`);
  console.log(`Done! ${manifest.length} languages processed.`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
