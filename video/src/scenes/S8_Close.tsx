import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { QuantumField } from "../components/QuantumField";
import { Paper, SpectrumRule } from "../components/chrome";
import { C, FONT } from "../tokens";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// S8 CLOSE — the field returns beneath the mark. "Art, measured."
export const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = 10 + Math.floor(frame / 30); // keeps breathing under the mark
  const rise = (at: number, s = 16) =>
    interpolate(frame - at, [0, s], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    });
  // gentle fade to black across the final second
  const out = interpolate(frame, [270, 296], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Paper dark>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: 0.42, // field recedes under the mark
        }}
      >
        <QuantumField
          mode="walk2d"
          steps={steps}
          w={48}
          h={18}
          cellW={40}
          cellH={60}
          fontSize={46}
          revealSpan={20}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 650,
            fontSize: 150,
            color: C.surface,
            letterSpacing: "0.015em",
            transform: `translateY(${(1 - rise(6)) * 40}px) scale(${0.96 + rise(6) * 0.04})`,
            opacity: rise(6),
          }}
        >
          GLYPHGENESIS
        </div>
        <div style={{ marginTop: 26 }}>
          <SpectrumRule width={620} height={4} from={20} span={20} />
        </div>
        <div
          style={{
            fontFamily: FONT.body,
            fontStyle: "italic",
            fontSize: 44,
            color: "#b9c0d4",
            marginTop: 26,
            opacity: rise(34),
          }}
        >
          art, measured.
        </div>
        <div
          style={{
            marginTop: 60,
            display: "flex",
            gap: 40,
            fontFamily: FONT.mono,
            fontSize: 20,
            letterSpacing: "0.14em",
            color: "#6d7590",
            opacity: rise(52),
          }}
        >
          <span>github.com/sneldao/glyphgenesis</span>
          <span style={{ color: C.amber }}>·</span>
          <span>glyph.thisyearnofear.com</span>
          <span style={{ color: C.amber }}>·</span>
          <span>monad testnet</span>
        </div>
      </AbsoluteFill>
    </Paper>
  );
};
