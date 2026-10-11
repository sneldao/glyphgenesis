import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { C, SPECTRUM, GRID_BG } from "../tokens";
import { EASE_OUT } from "../motion";

// ── Paper ground with ruled grid ──────────────────────────────────────
export const Paper: React.FC<{ dark?: boolean; children?: React.ReactNode }> = ({
  dark,
  children,
}) => (
  <AbsoluteFill
    style={{
      background: dark ? C.display : C.paper,
      backgroundImage: dark ? undefined : GRID_BG,
    }}
  >
    {children}
  </AbsoluteFill>
);

// ── Spectrum rule — the divider motif. Draws via scaleX, EASE_OUT. ────
export const SpectrumRule: React.FC<{
  width: number;
  height?: number;
  from: number;
  span?: number;
  origin?: "left" | "center";
}> = ({ width, height = 4, from, span = 18, origin = "center" }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - from, [0, span], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => t, // eased via transform below
  });
  const e = 1 - Math.pow(1 - p, 3); // ease-out on scale
  return (
    <div
      style={{
        width,
        height,
        background: `linear-gradient(90deg, ${SPECTRUM.join(",")})`,
        transform: `scaleX(${e})`,
        transformOrigin: origin === "center" ? "50% 50%" : "0% 50%",
        borderRadius: height / 2,
      }}
    />
  );
};

// ── Dark measurement-display chrome ───────────────────────────────────
export const DisplayFrame: React.FC<{
  label?: string;
  children?: React.ReactNode;
  pad?: number;
  style?: React.CSSProperties;
}> = ({ label, children, pad = 0, style }) => (
  <div
    style={{
      background: C.display,
      border: `1px solid ${C.displayEdge}`,
      borderRadius: 16,
      padding: pad,
      position: "relative",
      overflow: "hidden",
      boxShadow:
        "0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 60px -30px rgba(11,13,19,0.55)",
      ...style,
    }}
  >
    {/* vignette + faint scan texture */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,0.5) 100%)",
        pointerEvents: "none",
      }}
    />
    {label && (
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 22,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 15,
          letterSpacing: "0.22em",
          color: "#3fbf7f",
          zIndex: 2,
        }}
      >
        ▸ {label}
      </div>
    )}
    {children}
  </div>
);

// ── Specimen metadata strip (real engine metadata) ────────────────────
export const SpecStrip: React.FC<{
  items: string[];
  from: number;
  light?: boolean;
  size?: number;
}> = ({ items, from, light, size = 17 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: size,
        letterSpacing: "0.14em",
        color: light ? "#8b93a8" : C.inkSoft,
        borderTop: `1px solid ${light ? C.displayEdge : "rgba(23,26,33,0.3)"}`,
        paddingTop: 14,
      }}
    >
      {items.map((it, i) => {
        const o = interpolate(frame - (from + i * 4), [0, 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span key={i} style={{ opacity: o, display: "flex" }}>
            {i > 0 && <span style={{ margin: "0 14px", color: C.amber }}>·</span>}
            <span style={{ color: i === 0 ? C.blue : undefined }}>{it}</span>
          </span>
        );
      })}
    </div>
  );
};

// ── SLIT — the signature transition. A point flares at the boundary,
// splits into a horizontal spectral line that opens like a slit,
// revealing the next scene beneath. Converge→expand = measurement. ────
export const Slit: React.FC<{ span?: number; flashColor?: string }> = ({
  span = 16,
  flashColor = "#fff",
}) => {
  const frame = useCurrentFrame();
  // 0..span: dot flare (0-5) → line opens (4-span)
  const dot = interpolate(frame, [0, 4, 8], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const open = interpolate(frame, [4, span], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => t * t * (3 - 2 * t),
  });
  const half = (1 - open) * 50; // 50 → 0 = fully open
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          clipPath: `polygon(0 0, 100% 0, 100% ${half}%, 0 ${half}%)`,
          background: `linear-gradient(90deg, ${SPECTRUM.join(",")})`,
          opacity: open >= 1 ? 0 : 1,
        }}
      />
      <AbsoluteFill
        style={{
          clipPath: `polygon(0 ${100 - half}%, 100% ${100 - half}%, 100% 100%, 0 100%)`,
          background: `linear-gradient(90deg, ${SPECTRUM.join(",")})`,
          opacity: open >= 1 ? 0 : 1,
        }}
      />
      {/* flare dot at slit origin */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 90,
          height: 90,
          margin: "-45px 0 0 -45px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${flashColor} 0%, transparent 70%)`,
          opacity: dot,
          transform: `scale(${0.6 + dot * 0.8})`,
        }}
      />
    </AbsoluteFill>
  );
};
