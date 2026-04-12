"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslations } from "@/lib/botc/use-translations";
import { useTranslationManifest } from "@/lib/hooks/use-translation-manifest";
import { translateRawJson } from "@/lib/botc/translations";
import { CopyJsonButton } from "./CopyJsonButton";
import { DownloadJsonButton } from "./DownloadJsonButton";

interface TranslatedJsonButtonsProps {
  rawJson: unknown;
  scriptId: string;
  name: string;
  versionLabel?: string;
}

export function TranslatedJsonButtons({
  rawJson,
  scriptId,
  name,
  versionLabel,
}: TranslatedJsonButtonsProps) {
  const language = useLanguage();
  const { translations } = useTranslations(language);
  const manifest = useTranslationManifest();

  const languageName = useMemo(() => {
    if (language === "en") return "English";
    return manifest.find((l) => l.code === language)?.nativeName ?? language;
  }, [language, manifest]);

  const translatedJson = useMemo(() => {
    if (!translations) return rawJson;
    return translateRawJson(rawJson, translations, language);
  }, [rawJson, translations, language]);

  const jsonString = useMemo(
    () => JSON.stringify(translatedJson, null, 2),
    [translatedJson],
  );

  const blob = useMemo(
    () => `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`,
    [jsonString],
  );

  const langSuffix = language && language !== "en" ? ` (${languageName})` : "";
  const downloadName = versionLabel
    ? `${name} ${versionLabel}${langSuffix}.json`
    : `${name}${langSuffix}.json`;

  return (
    <>
      <DownloadJsonButton scriptId={scriptId} blob={blob} downloadName={downloadName} />
      <CopyJsonButton json={jsonString} scriptId={scriptId} />
    </>
  );
}
