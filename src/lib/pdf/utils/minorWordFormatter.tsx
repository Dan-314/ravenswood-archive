// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import { splitEmoji } from "./splitEmoji";

const minorWords = new Set([
  "the",
  "of",
  "in",
  "a",
  "an",
  "and",
  "or",
  "but",
  "for",
  "to",
  "at",
  "by",
  "on",
  "with",
  "from",
  "into",
  "upon",
  "after",
  "before",
]);

const isWordMinor = (word: string, index: number) => {
  return (
    minorWords.has(word) || (index === 0 && minorWords.has(word.toLowerCase()))
  );
};

export const formatWithMinorWords = (text: string): React.ReactElement[] => {
  return text
    .split(/\s+/)
    .reduce((acc: React.ReactElement[], word, wordIndex, words) => {
      const isMinor = isWordMinor(word, wordIndex);
      const prevIsMinor =
        wordIndex > 0 && isWordMinor(words[wordIndex - 1], wordIndex - 1);

      const isStartOfSequence = wordIndex === 0 || isMinor !== prevIsMinor;

      if (isStartOfSequence) {
        const sequence = [];
        for (
          let i = wordIndex;
          i < words.length && isWordMinor(words[i], i) === isMinor;
          i++
        ) {
          sequence.push(words[i]);
        }

        const needsSpace = acc.length > 0;
        acc.push(
          <span key={wordIndex} className={isMinor ? "minor-word" : undefined}>
            {needsSpace && " "}
            {splitEmoji(sequence.join(" "))}
          </span>,
        );
      }

      return acc;
    }, []);
};
