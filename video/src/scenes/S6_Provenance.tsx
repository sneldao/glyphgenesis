import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { QuantumField } from "../components/QuantumField";
import { Paper, DisplayFrame } from "../components/chrome";
import { C, FONT } from "../tokens";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const fade = (f: number, at: number, s = 12) =>
  interpolate(f - at, [0, s], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const SPEC_LINES = [
  '{',
  '  "mode":    "walk2d",',
  '  "backend": "ionq",',
  '  "shots":   4096,',
  '  "seed":    7,',
  '  "steps":   9,',
  '  "qubits":  11,',
  '  "chain":   "monad-testnet"',
  '}',
];

// S6 PROVENANCE — the circuit spec is the certificate. Typewriter JSON
// (PRECISION device) → mint plate → verify draw → shot-noise jitter.
export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  // PRECISION device: constant cadence, dead stops — machine data
  const typed = Math.floor(Math.max(0, frame - 20) / 3.2);
  const shown = SPEC_LINES.slice(0, typed);

  const arrow = interpolate(frame - 190, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const plateIn = interpolate(frame - 210, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const checkAt = 340;
  const check = interpolate(frame - checkAt, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  // shot-noise: the shots digit jitters when VO says "unrepeatable"
  const jitterAt = 430;
  const jit = interpolate(frame - jitterAt, [0, 8, 46], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const capO = fade(frame, 480, 16);
  const lastOut = interpolate(frame - 600, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeIn,
  });

  return (
    <Paper>
      <AbsoluteFill
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 90,
          opacity: 1 - lastOut,
          transform: `scale(${1 - lastOut * 0.04})`,
        }}
      >
        {/* the certificate — circuit spec, typed */}
        <div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 16,
              letterSpacing: "0.26em",
              color: C.inkSoft,
              marginBottom: 16,
              opacity: fade(frame, 8),
            }}
          >
            CIRCUIT SPEC — STORED IN THE MINT
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 30,
              lineHeight: 1.62,
              color: C.ink,
              background: C.surface,
              border: `1.5px solid rgba(23,26,33,0.5)`,
              borderRadius: 14,
              padding: "26px 34px",
              minWidth: 470,
              minHeight: 320,
              boxShadow: "0 24px 60px -40px rgba(11,13,19,0.45)",
            }}
          >
            {shown.map((l, i) => (
              <div key={i}>
                {l.includes('"shots"') && jit > 0 ? (
                  <ShotLine jitter={jit} frame={frame} />
                ) : (
                  l
                )}
              </div>
            ))}
            <span
              style={{
                opacity: Math.floor(frame / 12) % 2 === 0 ? 1 : 0,
                color: C.teal,
              }}
            >
              ▌
            </span>
          </div>
        </div>

        {/* connector — spec flows into the mint plate */}
        <div style={{ width: 150, position: "relative", height: 4 }}>
          <div
            style={{
              position: "absolute",
              width: 150,
              height: 4,
              background: `linear-gradient(90deg, ${C.teal}, ${C.blue})`,
              transform: `scaleX(${arrow})`,
              transformOrigin: "left",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -4,
              top: -8,
              width: 0,
              height: 0,
              borderLeft: `18px solid ${C.blue}`,
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              opacity: arrow > 0.7 ? 1 : 0,
            }}
          />
        </div>

        {/* the mint plate */}
        <div
          style={{
            transform: `translateY(${(1 - plateIn) * 60}px)`,
            opacity: plateIn,
          }}
        >
          <DisplayFrame pad={22} style={{ width: 400, height: 300 }}>
            <QuantumField
              mode="walk2d"
              steps={9}
              w={13}
              h={8}
              cellW={26}
              cellH={30}
              fontSize={20}
              revealFrom={215}
              revealSpan={30}
            />
          </DisplayFrame>
          <div
            style={{
              marginTop: 14,
              fontFamily: FONT.mono,
              fontSize: 16,
              letterSpacing: "0.22em",
              color: C.inkSoft,
              textAlign: "center",
              opacity: plateIn,
            }}
          >
            MINTED ON MONAD · 0x3F40…Aa97
          </div>

          {/* verify stamp */}
          <svg
            width={130}
            height={130}
            viewBox="0 0 130 130"
            style={{
              position: "absolute",
              right: -46,
              top: 200,
              transform: `rotate(-8deg) scale(${0.7 + check * 0.3})`,
            }}
          >
            <circle
              cx={65}
              cy={65}
              r={56}
              fill="none"
              stroke={C.teal}
              strokeWidth={5}
              strokeDasharray={352}
              strokeDashoffset={352 * (1 - check)}
            />
            <path
              d="M42 66 l16 16 l32 -36"
              fill="none"
              stroke={C.teal}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={80}
              strokeDashoffset={80 * (1 - check)}
            />
          </svg>
        </div>
      </AbsoluteFill>

      {/* unrepeatable caption — raised to clear the caption rail */}
      <div
        style={{
          position: "absolute",
          bottom: 170,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT.body,
          fontStyle: "italic",
          fontSize: 34,
          color: C.inkSoft,
          opacity: capO,
        }}
      >
        the only record of that measurement
      </div>
    </Paper>
  );
};

// the shots value jitters — finite-shot noise made literal
const ShotLine: React.FC<{ jitter: number; frame: number }> = ({ jitter, frame }) => {
  // deterministic pseudo-random from frame — seeded, no wall clock
  const n = Math.abs(Math.sin(frame * 12.9898) * 43758.5453) % 1;
  const val = Math.round(3800 + n * 600);
  const shown = jitter > 0.15 ? String(val).padStart(4, " ") : "4096";
  return (
    <span>
      {'  "shots":   '}
      <span style={{ color: jitter > 0.15 ? C.amber : C.ink }}>{shown},</span>
    </span>
  );
};
