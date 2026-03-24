// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

const PLAYER_COUNTS: Record<string, number[]> = {
  "5": [3, 0, 1, 1],
  "6": [3, 1, 1, 1],
  "7": [5, 0, 1, 1],
  "8": [5, 1, 1, 1],
  "9": [5, 2, 1, 1],
  "10": [7, 0, 2, 1],
  "11": [7, 1, 2, 1],
  "12": [7, 2, 2, 1],
  "13": [9, 0, 3, 1],
  "14": [9, 1, 3, 1],
  "15+": [9, 2, 3, 1],
};

export type PlayerCountProps = {
  background?: boolean;
};

export const PlayerCount = ({ background = true }: PlayerCountProps) => {
  return (
    <div
      className={`player-count-container ${
        background ? "with-background" : ""
      }`}
    >
      <div className="count-column titles">
        <div className="row-title">Players</div>
        <div className="row-title good-count">Townsfolk</div>
        <div className="row-title good-count">Outsiders</div>
        <div className="row-title evil-count">Minions</div>
        <div className="row-title evil-count">Demons</div>
      </div>
      {Object.entries(PLAYER_COUNTS).map(([playerCount, teamCounts]) => (
        <div key={playerCount} className="count-column">
          <div className="player-count">{playerCount}</div>
          <div className="good-count">{teamCounts[0]}</div>
          <div className="good-count">{teamCounts[1]}</div>
          <div className="evil-count">{teamCounts[2]}</div>
          <div className="evil-count">{teamCounts[3]}</div>
        </div>
      ))}
    </div>
  );
};
