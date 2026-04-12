import type { ResolvedCharacter } from "@/lib/botc/types";
import { getImageUrl } from "../utils/scriptUtils";

interface TravellerSectionProps {
  travellers: ResolvedCharacter[];
  title: string;
  assetsUrl: string;
  iconUrlTemplate?: string;
}

export function TravellerSection({
  travellers,
  title,
  assetsUrl,
  iconUrlTemplate,
}: TravellerSectionProps) {
  if (travellers.length === 0) return null;

  return (
    <div className="traveller-section" style={{ backgroundPosition: "30% -100%" }}>
      <p className="traveller-section-title">{title}</p>
      <div className="traveller-list">
        {travellers.map((char) => {
          const imageUrl = getImageUrl(char, assetsUrl, iconUrlTemplate);
          return (
            <div key={char.id} className="traveller-item">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={char.name}
                  className="traveller-icon"
                />
              ) : (
                <div className="traveller-icon-placeholder">
                  {char.name.charAt(0)}
                </div>
              )}
              <div className="traveller-text">
                <span className="traveller-name">{char.name}</span>
                <span className="traveller-ability">{char.ability}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
