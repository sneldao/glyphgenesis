import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate } from "remotion";
import { Paper } from "../components/chrome";
import { C, FONT } from "../tokens";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// S7 OBSERVATORY — the real site, captured, inside drawn browser chrome.
export const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const out = interpolate(frame - 235, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => t * t * t,
  });

  return (
    <Paper>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${(1 - enter) * 110 + out * -90}px)`,
          opacity: Math.min(enter, 1 - out),
        }}
      >
        <div
          style={{
            width: 1480,
            borderRadius: 18,
            overflow: "hidden",
            border: `1.5px solid rgba(23,26,33,0.5)`,
            boxShadow: "0 40px 90px -40px rgba(11,13,19,0.55)",
            background: C.surface,
          }}
        >
          {/* chrome bar */}
          <div
            style={{
              height: 52,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 20px",
              borderBottom: `1px solid rgba(23,26,33,0.25)`,
              background: C.paper,
            }}
          >
            {[C.red, C.amber, C.teal].map((c, i) => (
              <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
            ))}
            <div
              style={{
                marginLeft: 20,
                fontFamily: FONT.mono,
                fontSize: 17,
                letterSpacing: "0.06em",
                color: C.inkSoft,
                background: "rgba(23,26,33,0.06)",
                borderRadius: 8,
                padding: "6px 18px",
              }}
            >
              glyph.thisyearnofear.com
            </div>
          </div>
          <div style={{ height: 830, position: "relative" }}>
            <OffthreadVideo
              src={staticFile("site-capture/site.mp4")}
              startFrom={Math.round(0.5 * 30)}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
              muted
            />
          </div>
        </div>
      </AbsoluteFill>
    </Paper>
  );
};
