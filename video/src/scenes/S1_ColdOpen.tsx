import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { QuantumField } from "../components/QuantumField";
import { Paper, SpectrumRule } from "../components/chrome";
import { C, FONT } from "../tokens";

// S1 COLD OPEN — the real walk2d statevector evolving, full-frame dark
// measurement display. Wordmark lands late over the living field.
export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = 2 + Math.floor(frame / 14); // 2 → ~23 over the scene — real time evolution

  const titleAt = 196;
  const word = "GLYPHGENESIS";
  const subO = interpolate(frame - (titleAt + 34), [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glow = 0.5 + Math.sin(frame / 26) * 0.15; // idle life on the mark

  return (
    <Paper dark>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <QuantumField
          mode="walk2d"
          steps={steps}
          w={48}
          h={18}
          cellW={40}
          cellH={60}
          fontSize={46}
          revealSpan={10}
        />
      </AbsoluteFill>

      {/* wordmark — lower-third, editorial left anchor */}
      <div
        style={{
          position: "absolute",
          left: 140,
          bottom: 150,
          textShadow: `0 0 40px rgba(11,13,19,${glow})`,
        }}
      >
        <div style={{ display: "flex", overflow: "hidden" }}>
          {word.split("").map((ch, i) => {
            const at = titleAt + i * 2;
            const y = interpolate(frame - at, [0, 14], [1.15, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: (t) => 1 - Math.pow(1 - t, 3),
            });
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 600,
                  fontSize: 104,
                  letterSpacing: "0.02em",
                  color: C.surface,
                  transform: `translateY(${y * 100}%)`,
                  display: "inline-block",
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{ marginTop: 22 }}>
          <SpectrumRule width={560} height={4} from={titleAt + 20} span={18} origin="left" />
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 19,
            letterSpacing: "0.3em",
            color: "#8b93a8",
            marginTop: 18,
            opacity: subO,
          }}
        >
          a generative-art instrument
        </div>
      </div>
    </Paper>
  );
};
