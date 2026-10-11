// motion.ts — the curve kit (klik-anim A1). Thin-peak is the house curve.
export const EASE = "cubic-bezier(0.83, 0, 0.17, 1)"; // thin-peak in-out
export const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)"; // strong settle — entrances
export const EASE_IN = "cubic-bezier(0.7, 0, 0.84, 0)"; // anticipation / exits
// PRECISION device: constant velocity, dead stops — semantic license:
// instrument/machine data only (typewriter, counters, grid scans).
export const PRECISION = "linear";

export const FPS = 30;
