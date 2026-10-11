import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { QuantumField } from "../components/QuantumField";
import { Paper, DisplayFrame, SpecStrip } from "../components/chrome";
import { C, FONT } from "../tokens";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;

const Plate: React.FC<{
  num: string;
  title: string;
  meta: string[];
  mode: "walk2d" | "entangled" | "sweep";
  steps: number;
  fw: number;
  fh: number;
  cellW: number;
  cellH: number;
  fontSize: number;
  enterAt?: number;
  exitAt?: number; // -1 = never exits
  children?: React.ReactNode;
}> = ({ num, title, meta, mode, steps, fw, fh, cellW, cellH, fontSize, enterAt = 0, exitAt = -1, children }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame - enterAt, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const exit = exitAt >= 0
    ? interpolate(frame - exitAt, [0, 16], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easeIn,
      })
    : 0;
  return (
    <div
      style={{
        width: 1240,
        background: C.surface,
        border: `1.5px solid rgba(23,26,33,0.55)`,
        borderRadius: 16,
        padding: "30px 36px 26px",
        boxShadow: "0 30px 70px -40px rgba(11,13,19,0.5)",
        transform: `translateY(${(1 - enter) * 90 - exit * 120}px) translateX(${-exit * 160}px) rotate(${-exit * 1.6}deg)`,
        opacity: Math.min(enter, 1 - exit * 0.9),
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginBottom: 18 }}>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 20,
            letterSpacing: "0.2em",
            color: C.inkSoft,
            opacity: enter,
          }}
        >
          {num}
        </span>
        <span
          style={{
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 52,
            color: C.ink,
            lineHeight: 1,
            transform: `translateY(${(1 - enter) * 24}px)`,
            display: "inline-block",
          }}
        >
          {title}
        </span>
      </div>
      <DisplayFrame pad={26} style={{ height: fh * cellH + 52 }}>
        <QuantumField
          mode={mode}
          steps={steps}
          w={fw}
          h={fh}
          cellW={cellW}
          cellH={cellH}
          fontSize={fontSize}
          revealFrom={enterAt + 14}
          revealSpan={42}
        />
        {children}
      </DisplayFrame>
      <div style={{ marginTop: 20 }}>
        <SpecStrip items={meta} from={enterAt + 30} />
      </div>
    </div>
  );
};

// S4 SPECIMENS — three plates, plate-swap travel (cards, not cuts).
export const S4: React.FC = () => {
  return (
    <Paper>
      <Sequence durationInFrames={290}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Plate
            num="SPECIMEN Nº 01"
            title="Quantum Walk 2-D"
            mode="walk2d"
            steps={9}
            fw={20}
            fh={9}
            cellW={55}
            cellH={52}
            fontSize={40}
            enterAt={4}
            exitAt={268}
            meta={["CIRCUIT walk2d", "QUBITS 11", "STEPS 9", "SHOTS 4096", "◈ measured"]}
          />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={276} durationInFrames={284}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <EntangledPlate />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={548} durationInFrames={247}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Plate
            num="SPECIMEN Nº 03"
            title="Wave Sweep"
            mode="sweep"
            steps={7}
            fw={20}
            fh={9}
            cellW={55}
            cellH={52}
            fontSize={40}
            enterAt={4}
            meta={["CIRCUIT sweep", "QUBITS 7", "STEPS 7", "SHOTS 4096", "◈ measured"]}
          />
        </AbsoluteFill>
      </Sequence>
    </Paper>
  );
};

// Specimen №02 with the diagonal-ridge callout — the entanglement made visible.
const EntangledPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const ridgeAt = 150; // ≈ vo "that diagonal ridge is the entanglement"
  const draw = interpolate(frame - ridgeAt, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const capO = interpolate(frame - (ridgeAt + 16), [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Plate
      num="SPECIMEN Nº 02"
      title="Entangled Pair"
      mode="entangled"
      steps={7}
      fw={20}
      fh={9}
      cellW={55}
      cellH={52}
      fontSize={40}
      enterAt={0}
      exitAt={260}
      meta={["CIRCUIT entangled", "QUBITS 12", "BELL PAIR", "SHOTS 4096", "◈ measured"]}
    >
      {/* ridge trace — a guide line drawn along the correlation diagonal */}
      <svg
        width={1100}
        height={468}
        viewBox="0 0 1100 468"
        style={{ position: "absolute", left: 26, top: 26, pointerEvents: "none" }}
      >
        <line
          x1={150}
          y1={110}
          x2={150 + 560 * draw}
          y2={110 + 250 * draw}
          stroke={C.amber}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.95}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 40,
          fontFamily: FONT.mono,
          fontSize: 19,
          letterSpacing: "0.12em",
          color: C.amber,
          background: "rgba(11,13,19,0.85)",
          padding: "10px 16px",
          borderRadius: 8,
          opacity: capO,
        }}
      >
        a ≠ b walks can't make this
      </div>
    </Plate>
  );
};
