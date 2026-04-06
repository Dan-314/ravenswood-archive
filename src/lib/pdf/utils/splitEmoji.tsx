import type { ReactElement } from "react";

// Emoji regex covering common emoji ranges (Unicode Emoji_Presentation + modifiers/ZWJ sequences)
const EMOJI_RE = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu;

export type TitleSegment = { type: "text"; content: string } | { type: "emoji"; content: string };

export function splitEmojiSegments(text: string): TitleSegment[] {
  const segments: TitleSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(EMOJI_RE)) {
    const idx = match.index!;
    if (idx > last) segments.push({ type: "text", content: text.slice(last, idx) });
    segments.push({ type: "emoji", content: match[0] });
    last = idx + match[0].length;
  }
  if (last < text.length) segments.push({ type: "text", content: text.slice(last) });
  return segments;
}

/** Convenience wrapper: returns ReactElements with emojis outside gradient context */
export function splitEmoji(text: string): (string | ReactElement)[] {
  const segments = splitEmojiSegments(text);
  if (segments.length === 1 && segments[0].type === "text") return [text];
  return segments.map((seg, i) =>
    seg.type === "text" ? (
      <span key={i} className="title-text">{seg.content}</span>
    ) : (
      <span key={i}>{seg.content}</span>
    )
  );
}
