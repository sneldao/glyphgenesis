import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { QuantumField } from "../components/QuantumField";
import { Paper, DisplayFrame } from "../components/chrome";
import { C, FONT } from "../tokens";
import { walkMarginal } from "../fields";

const in_ = (frame: number, at: number, span = 14) => {
  const p = interpolate(frame - at, [0, span], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  return { opacity: p, transform: `translateY(${(1 - p) * 34}px)` };
};
const pop = (frame: number, at: number, span = 10) =>
  interpolate(frame - at, [0, span], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Station: React.FC<{ at: number; label: string; children: React.ReactNode }> = ({
  at,
  label,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: 360, ...in_(frame, at, 16) }}>
      <div
        style={{
          height: 330,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 16,
          letterSpacing: "0.28em",
          color: C.inkSoft,
          textAlign: "center",
          marginTop: 16,
          borderTop: `1px solid rgba(23,26,33,0.3)`,
          paddingTop: 12,
          opacity: pop(frame, at + 10),
        }}
      >
        {label}
      </div>
    </div>
  );
};

const Wire: React.FC<{ at: number; w?: number }> = ({ at, w = 300 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - at, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width: w,
        height: 2,
        background: C.inkSoft,
        transform: `scaleX(${p})`,
        transformOrigin: "left",
      }}
    />
  );
};

// S3 PIPELINE — spec → circuit → counts → field. Station entrances ride
// the VO; the phase→hue colorize is the payoff beat.
export const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const marg = React.useMemo(() => walkMarginal(6).slice(22, 42), []);
  const max = Math.max(...marg);
  const colorize = interpolate(frame - 460, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Paper>
      <AbsoluteFill
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
        }}
      >
        {/* 1 — circuit spec (PRECISION device: machine data, dead stops) */}
        <Station at={60} label="CIRCUIT SPEC">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {["('h',  0)", "('ry', θ, 1)", "('mcx', c, t)"].map((g, i) => (
              <div
                key={i}
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 30,
                  color: C.ink,
                  background: C.surface,
                  border: `1.5px solid ${C.ink}`,
                  borderRadius: 8,
                  padding: "10px 22px",
                  opacity: pop(frame, 74 + i * 6, 2), // dead-stop pop — licensed
                }}
              >
                {g}
              </div>
            ))}
          </div>
        </Station>

        {/* 2 — compiled circuit */}
        <Station at={170} label="QISKIT CIRCUIT">
          <div style={{ display: "flex", flexDirection: "column", gap: 30, position: "relative" }}>
            {[0, 1, 2, 3].map((r) => (
              <Wire key={r} at={186 + r * 5} />
            ))}
            {/* H gate */}
            <div
              style={{
                position: "absolute",
                left: 60,
                top: -14,
                width: 32,
                height: 32,
                background: C.blue,
                color: "#fff",
                fontFamily: FONT.mono,
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                opacity: pop(frame, 208),
              }}
            >
              H
            </div>
            {/* RY gate */}
            <div
              style={{
                position: "absolute",
                left: 130,
                top: 46,
                width: 32,
                height: 32,
                background: C.teal,
                color: "#fff",
                fontFamily: FONT.mono,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                opacity: pop(frame, 216),
              }}
            >
              Ry
            </div>
            {/* controlled op */}
            <div
              style={{
                position: "absolute",
                left: 200,
                top: 76,
                width: 10,
                height: 90,
                borderLeft: `2px solid ${C.ink}`,
                opacity: pop(frame, 224),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 196,
                top: 71,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: C.ink,
                opacity: pop(frame, 224),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 190,
                top: 158,
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: `2.5px solid ${C.red}`,
                opacity: pop(frame, 230),
              }}
            />
          </div>
        </Station>

        {/* 3 — real measurement counts */}
        <Station at={250} label="4096 SHOTS">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 220,
            }}
          >
            {marg.map((p, i) => {
              const h = (p / max) * 210 + 2;
              const g = interpolate(frame - (266 + i * 2.2), [0, 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: (t) => 1 - Math.pow(1 - t, 3),
              });
              return (
                <div
                  key={i}
                  style={{
                    width: 12,
                    height: h,
                    background:
                      p / max > 0.7
                        ? `linear-gradient(${C.blue}, ${C.violet})`
                        : "rgba(23,26,33,0.55)",
                    borderRadius: 2,
                    transform: `scaleY(${g})`,
                    transformOrigin: "bottom",
                  }}
                />
              );
            })}
          </div>
        </Station>

        {/* 4 — the field, mono → spectral at the payoff */}
        <Station at={350} label="DENSITY FIELD">
          <DisplayFrame pad={24} style={{ width: 330, height: 280 }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", opacity: 1 - colorize }}>
                <QuantumField
                  mode="walk2d"
                  steps={8}
                  w={11}
                  h={8}
                  cellW={25}
                  cellH={28}
                  fontSize={20}
                  color={false}
                  revealFrom={360}
                  revealSpan={40}
                />
              </div>
              <div style={{ opacity: colorize }}>
                <QuantumField
                  mode="walk2d"
                  steps={8}
                  w={11}
                  h={8}
                  cellW={25}
                  cellH={28}
                  fontSize={20}
                  color={true}
                  revealFrom={360}
                  revealSpan={40}
                />
              </div>
            </div>
          </DisplayFrame>
        </Station>
      </AbsoluteFill>
    </Paper>
  );
};
