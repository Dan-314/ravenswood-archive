import { readFileSync } from "fs";
import { join } from "path";
import type { TranslationData } from "./translations";

export function loadTranslations(language: string): TranslationData | null {
  if (!language || language === "en") return null;

  try {
    const filePath = join(process.cwd(), "public", "translations", `${language}.json`);
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content) as TranslationData;
  } catch {
    return null;
  }
}
