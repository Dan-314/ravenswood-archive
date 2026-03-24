// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { NightOrders } from "@/lib/botc/types";
import { getImageSrc } from "../utils/nightOrder";

type NightOrderPanelProps = {
  nightOrders: NightOrders;
  assetsUrl: string;
  iconUrlTemplate?: string;
};

export const NightOrderPanel = (props: NightOrderPanelProps) => {
  const firstNightOrder = props.nightOrders.first;
  const otherNightOrder = props.nightOrders.other;
  return (
    <div className="night-orders-container">
      <div className="night-order">
        <p>First Night:</p>
        <div className="icon-row">
          {firstNightOrder.map((item, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={getImageSrc(item, props.assetsUrl, props.iconUrlTemplate)}
              className={typeof item === "string" ? "icon marker-icon" : "icon"}
              alt=""
            />
          ))}
        </div>
      </div>
      <div className="night-order">
        <p>Other Nights:</p>
        <div className="icon-row">
          {otherNightOrder.map((item, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={getImageSrc(item, props.assetsUrl, props.iconUrlTemplate)}
              className={typeof item === "string" ? "icon marker-icon" : "icon"}
              alt=""
            />
          ))}
        </div>
      </div>
    </div>
  );
};
