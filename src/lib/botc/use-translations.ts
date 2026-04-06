"use client";

import { useState, useEffect } from "react";
import type { TranslationData } from "./translations";

const cache = new Map<string, TranslationData>();

export function useTranslations(language: string | null): {
  translations: TranslationData | null;
  loading: boolean;
} {
  const [translations, setTranslations] = useState<TranslationData | null>(
    language && language !== "en" ? (cache.get(language) ?? null) : null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!language || language === "en") {
      setTranslations(null);
      setLoading(false);
      return;
    }

    const cached = cache.get(language);
    if (cached) {
      setTranslations(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/translations/${language}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load translations for ${language}`);
        return res.json();
      })
      .then((data: TranslationData) => {
        cache.set(language, data);
        if (!cancelled) {
          setTranslations(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTranslations(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  return { translations, loading };
}
