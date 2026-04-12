import { useState, useEffect } from "react";

export interface BackgroundOption {
  value: string;
  label: string;
  attribution?: string;
}

let cachedBackgrounds: BackgroundOption[] | null = null;
let fetchPromise: Promise<BackgroundOption[]> | null = null;

function fetchBackgrounds(): Promise<BackgroundOption[]> {
  if (!fetchPromise) {
    fetchPromise = fetch("/api/backgrounds")
      .then((r) => r.json())
      .then((res: { data: BackgroundOption[] }) => {
        cachedBackgrounds = res.data;
        return res.data;
      });
  }
  return fetchPromise;
}

export function useBackgrounds() {
  const [backgrounds, setBackgrounds] = useState<BackgroundOption[]>(
    cachedBackgrounds ?? []
  );
  useEffect(() => {
    if (!cachedBackgrounds) {
      fetchBackgrounds().then(setBackgrounds);
    }
  }, []);
  return backgrounds;
}

export function pickRandomBackground(backgrounds: BackgroundOption[]): string {
  if (backgrounds.length === 0) return "";
  return backgrounds[Math.floor(Math.random() * backgrounds.length)].value;
}
