import { groupByTeam, getIconUrl, findJinxes } from "@/lib/botc";
import { TEAM_ORDER, TEAM_LABELS, TEAM_COLORS } from "@/lib/botc/types";
import type { ParsedScript, NightOrders, NightOrderEntry, ResolvedCharacter, PdfOptions, Jinx } from "@/lib/botc/types";

interface SheetProps {
  script: ParsedScript;
  options: PdfOptions;
  nightOrders: NightOrders;
  assetsUrl: string;
}

// === Character Sheet ===

export function CharacterSheet({ script, options, assetsUrl }: Omit<SheetProps, "nightOrders">) {
  const grouped = groupByTeam(script.characters);
  const jinxes = findJinxes(script.characters);
  const color = options.color;
  const darkColor = darkenHex(color, 0.3);
  const appearanceClass = options.appearance !== "normal" ? `appearance-${options.appearance}` : "";
  const marginsClass = options.includeMargins ? "with-margins" : "";

  return (
    <div
      className={`sheet-page ${appearanceClass} ${marginsClass}`}
      style={{
        "--accent-color": color,
        "--accent-dark": darkColor,
        "--icon-scale": String(options.iconScale / 1.7),
      } as React.CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sheet-bg" src={`${assetsUrl}/parchment_texture_a4_lightened.jpg`} alt="" />
      <div className="sheet-sidebar">
        <div className="sheet-sidebar-bg" style={{ backgroundImage: `url(${assetsUrl}/sidebar-desaturated-small.jpg)` }} />
        <div className="sheet-sidebar-overlay" style={{ background: `linear-gradient(180deg, ${color}, ${darkColor})` }} />
      </div>
      <div className="sheet-content">
        <div className="sheet-header">
          <span
            className="sheet-title"
            style={{
              fontFamily: `'${options.titleFont}', serif`,
              backgroundImage: `linear-gradient(135deg, ${color}, ${darkColor})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {script.metadata?.name || "Untitled Script"}
          </span>
        </div>

        {script.metadata?.author && (
          <div className="sheet-author">by {script.metadata.author}</div>
        )}

        <div className="characters-grid">
          {(() => {
            const sections = TEAM_ORDER
              .filter((t) => !["fabled", "loric", "traveller"].includes(t))
              .filter((team) => {
                const chars = grouped[team as keyof typeof grouped];
                return chars && chars.length > 0;
              });
            return sections.map((team, i) => (
              <div key={team}>
                <CharacterSection
                  team={team}
                  characters={grouped[team as keyof typeof grouped]}
                  assetsUrl={assetsUrl}
                />
                {i < sections.length - 1 && (
                  <hr className="section-divider" />
                )}
              </div>
            ));
          })()}

          {(jinxes.length > 0 || grouped.fabled.length > 0 || grouped.loric.length > 0 || grouped.traveller.length > 0) && (
            <>
              <hr className="section-divider" />
              <JinxesAndSpecial
                jinxes={jinxes}
                fabled={grouped.fabled}
                loric={grouped.loric}
                travellers={grouped.traveller}
                characters={script.characters}
                assetsUrl={assetsUrl}
                metadata={script.metadata}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CharacterSection({
  team,
  characters,
  assetsUrl,
}: {
  team: string;
  characters: ResolvedCharacter[];
  assetsUrl: string;
}) {
  const mid = Math.ceil(characters.length / 2);
  const left = characters.slice(0, mid);
  const right = characters.slice(mid);

  return (
    <div className="char-section">
      <h2 className="char-section-label">{TEAM_LABELS[team]}</h2>
      <div className="char-columns">
        <div className="char-column">
          {left.map((char) => (
            <CharacterCard key={char.id} character={char} team={team} assetsUrl={assetsUrl} />
          ))}
        </div>
        <div className="char-column">
          {right.map((char) => (
            <CharacterCard key={char.id} character={char} team={team} assetsUrl={assetsUrl} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CharacterCard({
  character,
  team,
  assetsUrl,
}: {
  character: ResolvedCharacter;
  team: string;
  assetsUrl: string;
}) {
  const iconUrl = getIconUrl(character, assetsUrl);
  const ability = renderAbility(character.ability);

  return (
    <div className="char-card">
      <div className="char-icon-wrapper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="char-icon" src={iconUrl} alt="" />
      </div>
      <div className="char-info">
        <div className={`char-name ${team}`}>{character.name}</div>
        <div className="char-ability" dangerouslySetInnerHTML={{ __html: ability }} />
      </div>
    </div>
  );
}

function JinxesAndSpecial({
  jinxes,
  fabled,
  loric,
  travellers,
  characters,
  assetsUrl,
  metadata,
}: {
  jinxes: Jinx[];
  fabled: ResolvedCharacter[];
  loric: ResolvedCharacter[];
  travellers: ResolvedCharacter[];
  characters: ResolvedCharacter[];
  assetsUrl: string;
  metadata: ParsedScript["metadata"];
}) {
  return (
    <div className="jinxes-section">
      <div className="jinxes-list">
        {jinxes.map((jinx) => {
          const char1 = characters.find((c) => c.id === jinx.characters[0]);
          const char2 = characters.find((c) => c.id === jinx.characters[1]);
          return (
            <div key={jinx.characters.join("-")} className="jinx-item">
              <div className="jinx-icons">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {char1 && <img className="jinx-icon" src={getIconUrl(char1, assetsUrl)} alt="" />}
                <span className="jinx-divider">&bull;</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {char2 && <img className="jinx-icon" src={getIconUrl(char2, assetsUrl)} alt="" />}
              </div>
              <div className="jinx-text">{jinx.reason}</div>
            </div>
          );
        })}
        {[...fabled, ...loric].map((char) => (
          <div key={char.id} className="jinx-item loric">
            <div className="jinx-icons">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="jinx-icon" src={getIconUrl(char, assetsUrl)} alt="" />
            </div>
            <div className="jinx-text loric-text">
              <span className="loric-name"><strong>{char.name}</strong></span> — {char.ability}
            </div>
          </div>
        ))}
        {metadata?.bootlegger?.map((rule, i) => (
          <div key={i} className="jinx-item">
            <div className="jinx-text"><strong>Bootlegger:</strong> {rule}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === Night Sheet ===

export function NightSheet({ script, options, nightOrders, assetsUrl }: SheetProps) {
  const color = options.color;
  const darkColor = darkenHex(color, 0.3);

  return (
    <>
      <NightPage
        title="First Night"
        scriptName={script.metadata?.name || "Untitled"}
        entries={nightOrders.first}
        assetsUrl={assetsUrl}
        color={color}
        darkColor={darkColor}
      />
      <NightPage
        title="Other Nights"
        scriptName={script.metadata?.name || "Untitled"}
        entries={nightOrders.other}
        assetsUrl={assetsUrl}
        color={color}
        darkColor={darkColor}
      />
    </>
  );
}

function NightPage({
  title,
  scriptName,
  entries,
  assetsUrl,
  color,
  darkColor,
}: {
  title: string;
  scriptName: string;
  entries: NightOrderEntry[];
  assetsUrl: string;
  color: string;
  darkColor: string;
}) {
  return (
    <div className="night-page" style={{ "--accent-color": color, "--accent-dark": darkColor } as React.CSSProperties}>
      <div className="night-header">
        <div className="night-title">{title}</div>
        <div className="night-script-name">{scriptName}</div>
      </div>
      <div className="night-entries">
        {entries.map((entry, i) => {
          if (typeof entry === "string") {
            return <NightMarkerEntry key={`${entry}-${i}`} marker={entry} assetsUrl={assetsUrl} />;
          }
          const reminder = title === "First Night" ? entry.firstNightReminder : entry.otherNightReminder;
          return (
            <div key={`${entry.id}-${i}`} className="night-entry">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="night-icon" src={getIconUrl(entry, assetsUrl)} alt="" />
              <div className="night-entry-info">
                <div className={`night-entry-name ${entry.team}`} style={{ color: TEAM_COLORS[entry.team] }}>
                  {entry.name}
                </div>
                {reminder && <div className="night-entry-reminder">{reminder}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NightMarkerEntry({ marker }: { marker: string; assetsUrl: string }) {
  const labels: Record<string, string> = {
    dusk: "Dusk",
    dawn: "Dawn",
    minioninfo: "Minion Info",
    demoninfo: "Demon Info",
  };
  const icons: Record<string, string> = {
    dusk: "🌙",
    dawn: "☀️",
    minioninfo: "👹",
    demoninfo: "😈",
  };

  return (
    <div className="night-entry">
      <div className="night-marker-icon">{icons[marker] || "•"}</div>
      <div className="night-entry-info">
        <div className="night-entry-name" style={{ color: "#666" }}>{labels[marker] || marker}</div>
      </div>
    </div>
  );
}

// === Info Sheet (Backing Page) ===

const PLAYER_COUNTS: Record<string, [number, number, number, number]> = {
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

const TEAM_ROWS = ["Townsfolk", "Outsiders", "Minions", "Demons"] as const;

export function InfoSheet({ script, options, assetsUrl }: Omit<SheetProps, "nightOrders">) {
  const jinxes = findJinxes(script.characters);
  const grouped = groupByTeam(script.characters);
  const color = options.color;
  const darkColor = darkenHex(color, 0.3);

  return (
    <div
      className="info-page"
      style={{ "--accent-color": color, "--accent-dark": darkColor } as React.CSSProperties}
    >
      <div className="info-bg" style={{ backgroundImage: `url(${assetsUrl}/sidebar-desaturated-small.jpg)` }} />
      <div className="info-bg-overlay" />

      <div className="info-content">
        {/* Player count + jinxes at bottom */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10mm" }}>
          {jinxes.length > 0 && (
            <div className="info-section">
              <div className="info-section-title">Jinxes</div>
              <div className="info-jinx-list">
                {jinxes.map((jinx) => {
                  const char1 = script.characters.find((c) => c.id === jinx.characters[0]);
                  const char2 = script.characters.find((c) => c.id === jinx.characters[1]);
                  return (
                    <div key={jinx.characters.join("-")} className="info-jinx-item">
                      <div className="info-jinx-icons">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {char1 && <img className="info-jinx-icon" src={getIconUrl(char1, assetsUrl)} alt="" />}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {char2 && <img className="info-jinx-icon" src={getIconUrl(char2, assetsUrl)} alt="" />}
                      </div>
                      <div>
                        <div className="info-jinx-names">{char1?.name} &amp; {char2?.name}</div>
                        <div className="info-jinx-text">{jinx.reason}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="info-player-counts">
            <div className="info-player-counts-inner" style={{ backgroundImage: `url(${assetsUrl}/parchment_texture.jpg)` }}>
              {/* Titles column */}
              <div className="count-column titles">
                <div>&nbsp;</div>
                {TEAM_ROWS.map((name) => (
                  <div key={name} className={["Townsfolk", "Outsiders"].includes(name) ? "good-count" : "evil-count"}>
                    {name}
                  </div>
                ))}
              </div>
              {/* Number columns */}
              {Object.entries(PLAYER_COUNTS).map(([players, counts]) => (
                <div key={players} className="count-column">
                  <div>{players}</div>
                  {counts.map((count, i) => (
                    <div key={i} className={i < 2 ? "good-count" : "evil-count"}>{count}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Title in centre */}
        <div className="info-title-container">
          <div
            className="info-title"
            style={{
              fontFamily: `'${options.titleFont}', serif`,
              backgroundImage: `url(${assetsUrl}/parchment_texture.jpg)`,
            }}
          >
            {script.metadata?.name || "Untitled Script"}
          </div>
        </div>

        {/* Fabled & Loric */}
        {(grouped.fabled.length > 0 || grouped.loric.length > 0) && (
          <div className="info-section">
            <div className="info-section-title">Fabled &amp; Loric</div>
            {[...grouped.fabled, ...grouped.loric].map((char) => (
              <div key={char.id} className="info-jinx-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="info-jinx-icon" src={getIconUrl(char, assetsUrl)} alt="" />
                <div>
                  <div className="info-jinx-names">{char.name}</div>
                  <div className="info-jinx-text">{char.ability}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// === Teensy Layout ===

export function TeensyLayout({ script, options, nightOrders, assetsUrl }: SheetProps) {
  return (
    <div className="teensy-wrapper">
      <CharacterSheet script={script} options={options} assetsUrl={assetsUrl} />
      <CharacterSheet script={script} options={options} assetsUrl={assetsUrl} />
    </div>
  );
}

// === Helpers ===

function renderAbility(ability: string): string {
  return ability.replace(/\[([^\]]+)\]/g, '<span class="setup">[$1]</span>');
}

function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
