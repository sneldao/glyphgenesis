import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { QuantumField } from "../components/QuantumField";
import { Paper, DisplayFrame } from "../components/chrome";
import { C, FONT } from "../tokens";

const rise = (frame: number, at: number, span = 14) =>
  interpolate(frame - at, [0, span], [52, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
const fade = (frame: number, at: number, span = 10) =>
  interpolate(frame - at, [0, span], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// S2 THESIS — paper ground, stacked type. VO: "the artwork is the quantum
// measurement". Small live field chip keeps the instrument breathing.
export const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const l1 = ["the", "artwork", "is"];
  const l2 = ["the", "quantum", "measurement"];
  const chipSteps = 8 + Math.floor(frame / 30); // slow evolution

  return (
    <Paper>
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 190 }}>
        <div style={{ display: "flex", gap: 26, overflow: "hidden", paddingBottom: 8 }}>
          {l1.map((w, i) => (
            <span
              key={i}
              style={{
                fontFamily: FONT.body,
                fontStyle: "italic",
                fontSize: 74,
                color: C.inkSoft,
                transform: `translateY(${rise(frame, 18 + i * 5)}px)`,
                opacity: fade(frame, 18 + i * 5),
                display: "inline-block",
              }}
            >
              {w}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 26, overflow: "hidden", marginTop: 6 }}>
          {l2.map((w, i) => (
            <span
              key={i}
              style={{
                fontFamily: FONT.display,
                fontWeight: 650,
                fontSize: 106,
                lineHeight: 1.02,
                color: i === 1 ? C.blue : C.ink,
                transform: `translateY(${rise(frame, 40 + i * 6, 16)}px)`,
                opacity: fade(frame, 40 + i * 6),
                display: "inline-block",
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </AbsoluteFill>

      {/* continuity chip — the instrument never stops measuring */}
      <div
        style={{
          position: "absolute",
          right: 130,
          bottom: 90,
          transform: `translateY(${rise(frame, 80, 20)}px)`,
          opacity: fade(frame, 80, 14),
        }}
      >
        <DisplayFrame pad={26} style={{ width: 470, height: 300 }}>
          <QuantumField
            mode="walk2d"
            steps={chipSteps}
            w={16}
            h={9}
            cellW={26}
            cellH={30}
            fontSize={22}
            revealSpan={18}
          />
        </DisplayFrame>
      </div>
    </Paper>
  );
};
