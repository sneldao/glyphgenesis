import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { getField, densityOrder, glyphFor, phaseHue } from "../fields";
import { FONT } from "../tokens";

// A real quantum field rendered as DOM glyphs. Cells appear in descending
// probability order — the field literally accumulates like a measurement.
export const QuantumField: React.FC<{
  mode: "walk2d" | "entangled" | "sweep";
  steps: number;
  w: number;
  h: number;
  cellW: number;
  cellH: number;
  fontSize: number;
  color?: boolean; // phase→hue when true (and phase data exists)
  revealFrom?: number; // frame offset where accumulation starts
  revealSpan?: number; // frames to fully accumulate
  jitterSeed?: number;
}> = ({
  mode,
  steps,
  w,
  h,
  cellW,
  cellH,
  fontSize,
  color = true,
  revealFrom = 0,
  revealSpan = 24,
  jitterSeed = 0,
}) => {
  const frame = useCurrentFrame();
  const { field, phase } = getField(mode, Math.max(1, steps), w, h, color);
  const order = densityOrder(field);
  const total = w * h;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${w}, ${cellW}px)`,
        gridTemplateRows: `repeat(${h}, ${cellH}px)`,
        fontFamily: FONT.mono,
        fontSize,
        lineHeight: `${cellH}px`,
        textAlign: "center",
        userSelect: "none",
      }}
    >
      {field.map((row, y) =>
        row.map((v, x) => {
          const g = glyphFor(v);
          const rank = order[y][x];
          // density-ordered accumulation; low-density cells arrive last
          const at = revealFrom + (rank / total) * revealSpan;
          const o = g
            ? interpolate(frame - at, [0, 6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;
          const ph = phase?.[y]?.[x] ?? 0;
          const hue = color ? phaseHue(ph) : 140;
          const light = 38 + v * 42;
          const sat = color ? 78 : 55;
          const jx = Math.sin((y * 31 + x * 17 + jitterSeed) * 1.7) * 0.5;
          return (
            <div
              key={`${x}-${y}`}
              style={{
                color: `hsl(${hue} ${sat}% ${light}%)`,
                opacity: o,
                transform: `translateX(${jx}px)`,
                textShadow: v > 0.5 ? `0 0 ${10 * v}px hsl(${hue} 80% 55% / 0.55)` : "none",
              }}
            >
              {g}
            </div>
          );
        })
      )}
    </div>
  );
};
