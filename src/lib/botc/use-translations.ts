"use client";

import { useState, useEffect } from "react";
import type { TranslationData } from "./translations";

const cache = new Map<string, TranslationData>();

export function useTranslations(language: string | null): {
  translations: TranslationData | null;
  loading: boolean;
} {
  const isActive = !!language && language !== "en";
  const cached = isActive ? (cache.get(language) ?? null) : null;

  const [state, setState] = useState({
    lang: language,
    translations: cached,
    resolved: !isActive || cached !== null,
  });

  // Reset when language prop changes (React-supported "adjust state from props" pattern)
  if (state.lang !== language) {
    const newCached = isActive ? (cache.get(language) ?? null) : null;
    setState({
      lang: language,
      translations: newCached,
      resolved: !isActive || newCached !== null,
    });
  }

  useEffect(() => {
    if (!isActive || cache.has(language)) return;

    let cancelled = false;

    fetch(`/translations/${language}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load translations for ${language}`);
        return res.json();
      })
      .then((data: TranslationData) => {
        cache.set(language, data);
        if (!cancelled) {
          setState({ lang: language, translations: data, resolved: true });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ lang: language, translations: null, resolved: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language, isActive]);

  return {
    translations: state.translations,
    loading: isActive && !state.resolved,
  };
}
