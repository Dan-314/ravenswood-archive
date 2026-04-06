import type { CSSProperties, ReactElement } from "react";

// Emoji regex covering common emoji ranges (Unicode Emoji_Presentation + modifiers/ZWJ sequences)
const EMOJI_RE = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu;

const EMOJI_STYLE: CSSProperties = {
  WebkitTextFillColor: "initial",
  backgroundClip: "initial",
  WebkitBackgroundClip: "initial",
  background: "none",
};

export function splitEmoji(text: string): (string | ReactElement)[] {
  const parts: (string | ReactElement)[] = [];
  let last = 0;
  for (const match of text.matchAll(EMOJI_RE)) {
    const idx = match.index!;
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push(
      <span key={idx} style={EMOJI_STYLE}>
        {match[0]}
      </span>
    );
    last = idx + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
