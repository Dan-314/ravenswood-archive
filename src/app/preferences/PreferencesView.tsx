"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Check, RotateCcw } from "lucide-react";
import type { PdfOptions } from "@/lib/botc/types";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";
import { PdfOptionsForm } from "@/lib/pdf/PdfOptionsForm";
import { ScriptPreviewLayout } from "@/app/scripts/[id]/ScriptPreviewLayout";
import { SAMPLE_SCRIPT } from "@/lib/botc/sampleScript";
import {
  useUserPreferences,
  mergePreferences,
  toUserPreferences,
} from "@/lib/useUserPreferences";

export function PreferencesView() {
  const { preferences, loading, save, clear, isSignedIn } = useUserPreferences();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedOptions = loading ? null : (preferences ? mergePreferences(preferences) : DEFAULT_PDF_OPTIONS);
  const [options, setOptions] = useState<PdfOptions | null>(resolvedOptions);

  // Sync options when preferences finish loading (only once)
  if (resolvedOptions && !options) {
    setOptions(resolvedOptions);
  }

  const update = <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => {
    setOptions((prev) => prev ? { ...prev, [key]: value } : prev);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!options) return;
    setSaving(true);
    setError(null);
    const err = await save(toUserPreferences(options));
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
    }
    setSaving(false);
  };

  if (loading || !options) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScriptPreviewLayout
      rawJson={SAMPLE_SCRIPT}
      options={options}
      onAppearanceChange={(appearance, iconScale) => {
        setOptions((prev) => prev ? { ...prev, appearance, iconScale } : prev);
      }}
      onNightAppearanceChange={(nightAppearance) => {
        setOptions((prev) => prev ? { ...prev, nightAppearance } : prev);
      }}
      className="md:h-[calc(100vh-4rem)]"
      sidebarPosition="left"
      sidebar={
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-lg">Default Preferences</h2>
            <p className="text-sm text-muted-foreground mt-1">
              These settings apply when you open any script.
            </p>
          </div>

          <PdfOptionsForm options={options} onUpdate={update} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !isSignedIn}
              className="gap-1.5 flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              title="Reset to defaults"
              disabled={saving || !isSignedIn}
              onClick={async () => {
                setError(null);
                const err = await clear();
                if (err) {
                  setError(err.message);
                } else {
                  setOptions(DEFAULT_PDF_OPTIONS);
                  setSaved(false);
                }
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      }
    />
  );
}
