// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { NightMarker, NightOrderEntry, PdfOptions } from "@/lib/botc/types";
import type { TranslationData } from "@/lib/botc/translations";
import { translateUiLabel } from "@/lib/botc/translations";
import { getImageSrc } from "../utils/nightOrder";
import { teamColours } from "../utils/colours";
import { BottomTrimSheet } from "../components/BottomTrimSheet";
import { splitEmoji } from "../utils/splitEmoji";

export type NightSheetProps = {
  title: string;
  firstNightOrder?: NightOrderEntry[];
  otherNightOrder?: NightOrderEntry[];
  options: PdfOptions;
  assetsUrl: string;
  translations?: TranslationData | null;
};

const BASE_FONT_MM = 11;
const MAX_CHARS = 30;
const MIN_FONT_MM = 7;

function nightTitleStyle(title: string): React.CSSProperties | undefined {
  if (title.length <= MAX_CHARS) return undefined;
  const scaled = BASE_FONT_MM * (MAX_CHARS / title.length);
  const fontSize = Math.max(scaled, MIN_FONT_MM);
  return { fontSize: `${fontSize.toFixed(1)}mm` };
}

export const NightSheet = ({
  title,
  firstNightOrder,
  otherNightOrder,
  options,
  assetsUrl,
  translations,
}: NightSheetProps) => {
  const nightAppearanceClass =
    options.nightAppearance && options.nightAppearance !== "normal"
      ? `night-appearance-${options.nightAppearance}`
      : "";

  return (
    <>
      {firstNightOrder && (
        <BottomTrimSheet options={options} assetsUrl={assetsUrl}>
          <div className={nightAppearanceClass}>
            <div className="night-sheet-heading">
              <h3 className="night-title">{translateUiLabel("firstNight", "First Night", translations ?? null)}</h3>
              <h3 className="script-title" style={nightTitleStyle(title)}>{splitEmoji(title)}</h3>
            </div>
            <div className="night-sheet-order">
              {firstNightOrder.map((reminder, i) => (
                <NightSheetEntry
                  key={i}
                  entry={reminder}
                  night="first"
                  assetsUrl={assetsUrl}
                  iconUrlTemplate={options.iconUrlTemplate}
                  translations={translations}
                />
              ))}
            </div>
          </div>
        </BottomTrimSheet>
      )}
      {otherNightOrder && (
        <BottomTrimSheet options={options} assetsUrl={assetsUrl}>
          <div className={nightAppearanceClass}>
            <div className="night-sheet-heading">
              <h3 className="night-title">{translateUiLabel("otherNights", "Other Nights", translations ?? null)}</h3>
              <h3 className="script-title" style={nightTitleStyle(title)}>{splitEmoji(title)}</h3>
            </div>
            <div className="night-sheet-order">
              {otherNightOrder.map((reminder, i) => (
                <NightSheetEntry
                  key={i}
                  entry={reminder}
                  night="other"
                  assetsUrl={assetsUrl}
                  iconUrlTemplate={options.iconUrlTemplate}
                  translations={translations}
                />
              ))}
            </div>
          </div>
        </BottomTrimSheet>
      )}
    </>
  );
};

type NightSheetEntryProps = {
  entry: NightOrderEntry;
  night: "first" | "other";
  assetsUrl: string;
  iconUrlTemplate?: string;
  translations?: TranslationData | null;
};

const ReminderIcon = ({ assetsUrl }: { assetsUrl: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img className="reminder-icon" src={`${assetsUrl}/reminder.png`} alt="" />
);

export const NightSheetEntry = (props: NightSheetEntryProps) => {
  const src = getImageSrc(props.entry, props.assetsUrl, props.iconUrlTemplate);
  const { reminderText, name } = getReminderText(props.entry, props.night, props.translations);
  const colour =
    typeof props.entry === "string" ? "#222" : teamColours[props.entry.team];
  if (!reminderText) {
    return null;
  }

  const replaceReminders = (str: string) =>
    str.split(":reminder:").map((u, i) => (i % 2 === 0 ? u : <ReminderIcon key={`r-${i}`} assetsUrl={props.assetsUrl} />));

  const renderText = (text: string) => {
    const withBold = text
      .split("*")
      .map((t, i) => (i % 2 === 0 ? t : <strong key={`b-${i}`}>{t}</strong>))
      .map((t) => (typeof t === "string" ? replaceReminders(t) : t));
    return <>{withBold}</>;
  };

  const isMarker = typeof props.entry === "string";

  return (
    <div className="night-sheet-entry">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} className={isMarker ? "marker-icon" : undefined} alt="" />
      <div className="night-sheet-entry-text">
        <p className="reminder-name" style={{ color: colour }}>
          {name}
        </p>
        <p className="reminder-text">{renderText(reminderText)}</p>
      </div>
    </div>
  );
};

const getReminderText = (entry: NightOrderEntry, night: "first" | "other", translations?: TranslationData | null) => {
  if (typeof entry === "object") {
    const reminderText =
      night === "first" ? entry.firstNightReminder : entry.otherNightReminder;
    const name = entry.name;
    return { reminderText, name };
  } else {
    const reminder = NON_CHARACTER_REMINDERS[entry];
    const translated = translations?.roles?.[entry];
    const reminderText = (night === "first"
      ? (translated?.first ?? reminder.first)
      : (translated?.other ?? reminder.other ?? ""));
    const name = translations?.nightMarkers?.[entry] ?? reminder.name;
    return { reminderText, name };
  }
};

const NON_CHARACTER_REMINDERS: Record<
  NightMarker,
  { first: string; name: string; other?: string }
> = {
  dusk: {
    first: "Start the Night Phase.",
    name: "Dusk",
    other: "Start the Night Phase.",
  },
  dawn: {
    first: "Wait for a few seconds. End the Night Phase.",
    name: "Dawn",
    other: "Wait for a few seconds. End the Night Phase.",
  },
  demoninfo: {
    first:
      "If there are 7 or more players, wake the Demon: Show the *THESE ARE YOUR MINIONS* token. Point to all Minions. Show the *THESE CHARACTERS ARE NOT IN PLAY* token. Show 3 not-in-play good character tokens.",
    name: "Demon Info",
  },
  minioninfo: {
    first:
      "If there are 7 or more players, wake all Minions: Show the *THIS IS THE DEMON* token. Point to the Demon. Show the *THESE ARE YOUR MINIONS* token. Point to the other Minions.",
    name: "Minion Info",
  },
};
