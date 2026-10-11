import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { FONT } from "../tokens";
import caps from "../data/captions.json";

type Cap = { text: string; start: number; end: number };

// Caption rail — verbatim VO text, timed by ElevenLabs character alignment.
// Lower-third pill: legible on both paper and measurement-display scenes.
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const active = (caps as Cap[]).find((c) => frame >= c.start && frame < c.end);
  if (!active) return null;

  const inA = interpolate(frame - active.start, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outA = interpolate(frame - active.end, [-5, 0], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const o = Math.min(inA, outA);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 64,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 33,
          fontStyle: "italic",
          color: "#f4f0e6",
          background: "rgba(11,13,19,0.82)",
          padding: "12px 28px",
          borderRadius: 10,
          letterSpacing: "0.01em",
          opacity: o,
          transform: `translateY(${(1 - inA) * 10}px)`,
          maxWidth: 1500,
          textAlign: "center",
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
