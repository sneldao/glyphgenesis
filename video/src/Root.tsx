import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadSpectral } from "@remotion/google-fonts/Spectral";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";

loadFraunces();
loadSpectral();
loadPlexMono();

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Main"
    component={Main}
    durationInFrames={3660}
    fps={30}
    width={1920}
    height={1080}
  />
);
