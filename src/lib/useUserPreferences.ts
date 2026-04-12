"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PdfOptions } from "@/lib/botc/types";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";
import type { Json } from "@/lib/supabase/types";

/** Subset of PdfOptions that users can save as defaults */
export type UserPreferences = Omit<
  PdfOptions,
  "logo" | "showLogo" | "iconUrlTemplate" | "numberOfCharacterSheets" | "dimensions" | "backgroundAttribution"
>;

const PREFERENCE_KEYS: (keyof UserPreferences)[] = [
  "color",
  "showTitle",
  "showAuthor",
  "showJinxes",
  "showSwirls",
  "includeMargins",
  "solidTitle",
  "appearance",
  "nightAppearance",
  "overleaf",
  "displayNightOrder",
  "displayPlayerCounts",
  "displayTravellers",
  "showNightSheet",
  "nightSheetOnly",
  "iconScale",
  "formatMinorWords",
  "inlineJinxIcons",
  "titleStyle",
  "paperSize",
  "background",
  "language",
];

/** Pick only saveable keys from a full PdfOptions object */
export function toUserPreferences(opts: PdfOptions): UserPreferences {
  const prefs = {} as Record<string, unknown>;
  for (const key of PREFERENCE_KEYS) {
    prefs[key] = opts[key];
  }
  return prefs as UserPreferences;
}

/** Merge saved preferences over DEFAULT_PDF_OPTIONS */
export function mergePreferences(saved: Partial<UserPreferences>): PdfOptions {
  return { ...DEFAULT_PDF_OPTIONS, ...saved };
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<Partial<UserPreferences> | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", user.id)
        .single();

      if (!cancelled) {
        setPreferences(data?.preferences as Partial<UserPreferences> ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const save = useCallback(async (prefs: UserPreferences) => {
    if (!userId) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, preferences: prefs as unknown as Json, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (!error) {
      setPreferences(prefs);
    }

    return error;
  }, [userId]);

  const clear = useCallback(async () => {
    if (!userId) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", userId);

    if (!error) {
      setPreferences(null);
    }

    return error;
  }, [userId]);

  return { preferences, loading, save, clear, isSignedIn: userId !== null };
}
