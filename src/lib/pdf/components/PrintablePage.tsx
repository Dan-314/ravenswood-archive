// Ported from botc-character-sheet by John Forster (MIT License)
// Copyright (c) 2025 John Forster

import type { CSSProperties } from "react";
import type { PageDimensions } from "@/lib/botc/types";

type PrintablePageProps = {
  children: React.ReactNode;
  dimensions: PageDimensions;
};

const PRINT_GUIDE_IMAGE_SIZE = 20; // in mm

export const PrintablePage = (props: PrintablePageProps) => {
  const { margin, bleed, width, height } = props.dimensions;
  return (
    <div
      className="printable-page"
      style={{
        "--page-width": width + "mm",
        "--page-height": height + "mm",
        "--print-margin": margin + "mm",
        "--print-bleed": bleed + "mm",
        "--print-guide-size": PRINT_GUIDE_IMAGE_SIZE + "mm",
      } as CSSProperties}
    >
      {props.children}
      {(margin > 0 || bleed > 0) && (
        <>
          <PrintGuides dimensions={props.dimensions} position="top-left" />
          <PrintGuides dimensions={props.dimensions} position="top-right" />
          <PrintGuides dimensions={props.dimensions} position="bottom-left" />
          <PrintGuides dimensions={props.dimensions} position="bottom-right" />
        </>
      )}
    </div>
  );
};

type PrintGuidesProps = {
  dimensions: PageDimensions;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

const ROTATIONS = {
  "top-left": 0,
  "top-right": 90,
  "bottom-right": 180,
  "bottom-left": 270,
} as const;

const STROKE_WIDTH = 2.5;

const PrintGuides = ({ dimensions, position }: PrintGuidesProps) => {
  const rotation = ROTATIONS[position];
  const viewboxSize = PRINT_GUIDE_IMAGE_SIZE * 10;
  const innerDimension = dimensions.margin * 10;
  const outerDimension = (dimensions.margin + dimensions.bleed) * 10;
  const thinStroke = STROKE_WIDTH;

  const location: CSSProperties = {
    left: position.includes("left") ? 0 : undefined,
    right: position.includes("right") ? 0 : undefined,
    top: position.includes("top") ? 0 : undefined,
    bottom: position.includes("bottom") ? 0 : undefined,
  };

  return (
    <div
      className="print-guides-overlay"
      style={{ rotate: `${rotation}deg`, ...location }}
    >
      <svg
        viewBox={`0 0 ${viewboxSize} ${viewboxSize}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Vertical trim */}
        <DoubleLine
          x1={outerDimension}
          y1={0}
          x2={outerDimension}
          y2={innerDimension + (dimensions.bleed * 10) / 2}
          stroke="black"
          strokeWidth={thinStroke}
          thickWidth={thinStroke * 2}
        />
        {/* Horizontal trim */}
        <DoubleLine
          x1={0}
          y1={outerDimension}
          x2={innerDimension + (dimensions.bleed * 10) / 2}
          y2={outerDimension}
          stroke="black"
          strokeWidth={thinStroke}
          thickWidth={thinStroke * 2}
        />

        {/* Horizontal Bleed */}
        <line
          x1={innerDimension}
          y1={innerDimension}
          x2={0}
          y2={innerDimension}
          stroke="black"
          strokeWidth={thinStroke}
          strokeDasharray="2,2"
        />
        {/* Vertical Bleed */}
        <line
          x1={innerDimension}
          y1={innerDimension}
          x2={innerDimension}
          y2={0}
          stroke="black"
          strokeWidth={thinStroke}
          strokeDasharray="2,2"
        />
      </svg>
    </div>
  );
};

function DoubleLine(
  props: React.SVGProps<SVGLineElement> & { thickWidth: number },
) {
  const { thickWidth, ...lineProps } = props;
  return (
    <>
      <line {...lineProps} stroke="#eee" strokeWidth={thickWidth} />
      <line {...lineProps} />
    </>
  );
}
