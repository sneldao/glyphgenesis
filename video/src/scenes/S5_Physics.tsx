import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Paper, SpectrumRule } from "../components/chrome";
import { C, FONT } from "../tokens";
import { walkStd } from "../fields";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// S5 PHYSICS — σ measured at 4 / 8 / 16 steps. Real values from the engine.
// Quantum bars double; classical √ curve trails beneath. Ballistic vs √.
export const S5: React.FC = () => {
  const frame = useCurrentFrame();
  const stepsN = [4, 8, 16];
  const sigma = stepsN.map((s) => walkStd(s)); // real engine values
  const classical = stepsN.map((s) => Math.sqrt(s) * (sigma[0] / 2)); // √ curve, scaled to same start
  const maxV = Math.max(...sigma) * 1.15;
  const chartW = 1080;
  const chartH = 560;
  const barW = 120;
  const groupW = chartW / 3;
  const baseY = 800;
  const left = 470;

  const axis = interpolate(frame - 16, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const capO = interpolate(frame - 400, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Paper>
      {/* heading */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 190,
          opacity: interpolate(frame - 10, [0, 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ fontFamily: FONT.mono, fontSize: 18, letterSpacing: "0.28em", color: C.inkSoft }}>
          SPREAD vs STEPS
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 650,
            fontSize: 76,
            color: C.ink,
            marginTop: 10,
            lineHeight: 1.02,
          }}
        >
          ballistic, <span style={{ fontStyle: "italic", fontWeight: 400 }}>not √</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <SpectrumRule width={300} height={4} from={22} origin="left" />
        </div>
      </div>

      {/* axis */}
      <div
        style={{
          position: "absolute",
          left,
          top: baseY,
          width: chartW,
          height: 2,
          background: C.ink,
          transform: `scaleX(${axis})`,
          transformOrigin: "left",
        }}
      />
      <div
        style={{
          position: "absolute",
          left,
          top: baseY - chartH,
          width: 2,
          height: chartH,
          background: C.ink,
          transform: `scaleY(${axis})`,
          transformOrigin: "bottom",
        }}
      />

      {/* bars + classical curve */}
      {stepsN.map((s, i) => {
        const bh = (sigma[i] / maxV) * chartH;
        const ch = (classical[i] / maxV) * chartH;
        const g = interpolate(frame - (60 + i * 90), [0, 26], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOut,
        });
        const cx = left + groupW * i + groupW / 2;
        return (
          <React.Fragment key={s}>
            {/* classical ghost bar — scaleY grow from baseline */}
            <div
              style={{
                position: "absolute",
                left: cx + barW / 2 + 14,
                top: baseY - ch,
                width: barW * 0.42,
                height: ch,
                border: `2px dashed rgba(23,26,33,0.4)`,
                borderBottom: "none",
                borderRadius: "4px 4px 0 0",
                boxSizing: "border-box",
                transform: `scaleY(${g})`,
                transformOrigin: "bottom",
              }}
            />
            {/* quantum bar — spectral fill, scaleY grow from baseline */}
            <div
              style={{
                position: "absolute",
                left: cx - barW / 2,
                top: baseY - bh,
                width: barW,
                height: bh,
                background: `linear-gradient(180deg, ${C.violet}, ${C.blue} 55%, ${C.teal})`,
                borderRadius: "6px 6px 0 0",
                transform: `scaleY(${g})`,
                transformOrigin: "bottom",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: cx - 70,
                top: baseY - 44,
                width: 140,
                textAlign: "center",
                fontFamily: FONT.mono,
                fontSize: 24,
                color: C.blue,
                opacity: g,
                transform: `translateY(${-bh * g}px)`,
              }}
            >
              σ {sigma[i].toFixed(1)}
            </div>
            <div
              style={{
                position: "absolute",
                left: cx - 70,
                top: baseY + 16,
                width: 140,
                textAlign: "center",
                fontFamily: FONT.mono,
                fontSize: 20,
                letterSpacing: "0.1em",
                color: C.inkSoft,
              }}
            >
              {s} steps
            </div>
          </React.Fragment>
        );
      })}

      {/* legend */}
      <div
        style={{
          position: "absolute",
          left: left + chartW - 10,
          top: baseY - chartH - 70,
          fontFamily: FONT.mono,
          fontSize: 17,
          letterSpacing: "0.1em",
          color: C.inkSoft,
          opacity: interpolate(frame - 300, [0, 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        ▮ quantum walk · ▯ classical √steps
      </div>

      {/* payoff caption */}
      <div
        style={{
          position: "absolute",
          right: 170,
          bottom: 110,
          fontFamily: FONT.body,
          fontStyle: "italic",
          fontSize: 34,
          color: C.inkSoft,
          opacity: capO,
        }}
      >
        verify it with a ruler
      </div>
    </Paper>
  );
};
