import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { S1 } from "./scenes/S1_ColdOpen";
import { S2 } from "./scenes/S2_Thesis";
import { S3 } from "./scenes/S3_Pipeline";
import { S4 } from "./scenes/S4_Specimens";
import { S5 } from "./scenes/S5_Physics";
import { S6 } from "./scenes/S6_Provenance";
import { S7 } from "./scenes/S7_Observatory";
import { S8 } from "./scenes/S8_Close";
import { Slit } from "./components/chrome";
import { Captions } from "./components/Captions";

// Timeline locked to the ElevenLabs VO masters (measured durations).
// Scene = VO segment + 1s head / ~1s tail of breathing room.
const SCENES = [
  { from: 0, dur: 300, Comp: S1, vo: "vo1", voAt: 30 },
  { from: 300, dur: 225, Comp: S2, vo: "vo2", voAt: 30 },
  { from: 525, dur: 585, Comp: S3, vo: "vo3", voAt: 30 },
  { from: 1110, dur: 795, Comp: S4, vo: "vo4", voAt: 30 },
  { from: 1905, dur: 555, Comp: S5, vo: "vo5", voAt: 30 },
  { from: 2460, dur: 645, Comp: S6, vo: "vo6", voAt: 30 },
  { from: 3105, dur: 255, Comp: S7, vo: "vo7", voAt: 30 },
  { from: 3360, dur: 300, Comp: S8, vo: "vo8", voAt: 30 },
] as const;

// scene boundaries get the slit transition (drawn over the incoming scene)
const CUTS = [300, 525, 1110, 1905, 2460, 3105, 3360];

export const Main: React.FC = () => {
  return (
    <AbsoluteFill>
      {SCENES.map(({ from, dur, Comp }) => (
        <Sequence key={from} from={from} durationInFrames={dur}>
          <Comp />
        </Sequence>
      ))}

      {/* slit at every boundary — measurement collapse motif */}
      {CUTS.map((c) => (
        <Sequence key={c} from={c} durationInFrames={18}>
          <Slit span={17} />
        </Sequence>
      ))}

      {/* narration — durations measured from the generated masters (sec×30) */}
      {SCENES.map(({ from, vo, voAt }) => {
        const dur = {
          vo1: 270, vo2: 180, vo3: 560, vo4: 740,
          vo5: 500, vo6: 600, vo7: 200, vo8: 110,
        }[vo];
        return (
          <Sequence key={vo} from={from + voAt} durationInFrames={dur}>
            <Audio src={staticFile(`audio/${vo}.mp3`)} />
          </Sequence>
        );
      })}

      {/* caption rail — above scenes, below nothing */}
      <Captions />

      {/* score — quiet pad under everything */}
      <Audio
        src={staticFile("audio/score.mp3")}
        volume={(f) =>
          f < 60 ? f / 60 : f > 3540 ? Math.max(0, (3660 - f) / 120) : 0.085
        }
      />
    </AbsoluteFill>
  );
};
