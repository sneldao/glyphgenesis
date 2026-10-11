// fields.ts — real quantum engine data for the video. Everything memoized:
// field for (mode,steps,size) is computed once, reused across frames.
import {
  walk2dField,
  entangledField,
  sweepField,
  walkSpec,
  runCircuit,
  marginal,
} from "../../src/quantum-js.mjs";

export type FieldData = { field: number[][]; phase: number[][] | null };

const cache = new Map<string, FieldData>();

export function getField(
  mode: "walk2d" | "entangled" | "sweep",
  steps: number,
  w: number,
  h: number,
  withPhase = true
): FieldData {
  const key = `${mode}:${steps}:${w}x${h}:${withPhase}`;
  let d = cache.get(key);
  if (!d) {
    if (mode === "walk2d") {
      const r = walk2dField({ width: w, height: h, steps, phase: withPhase });
      d = { field: r.field, phase: r.phase ?? null };
    } else if (mode === "entangled") {
      d = { field: entangledField({ width: w, height: h, steps }).field, phase: null };
    } else {
      d = { field: sweepField({ width: w, height: h, steps }).field, phase: null };
    }
    cache.set(key, d);
  }
  return d;
}

// phase −π..π → emission hue 155 (teal) → 375/15 (red), via blue+violet.
export const phaseHue = (ph: number) => 155 + ((ph + Math.PI) / (2 * Math.PI)) * 220;

// glyph ramp dense→sparse (site convention); faint cells still read as dim dots
export const GLYPHS = "█▓▒░";
export const glyphFor = (v: number) =>
  v > 0.62 ? GLYPHS[0] : v > 0.32 ? GLYPHS[1] : v > 0.13 ? GLYPHS[2] : v > 0.012 ? GLYPHS[3] : "";

// reveal order: cells appear in descending probability (measurement accumulates)
export function densityOrder(field: number[][]): number[][] {
  const flat: { v: number; y: number; x: number }[] = [];
  field.forEach((row, y) => row.forEach((v, x) => flat.push({ v, y, x })));
  flat.sort((a, b) => b.v - a.v);
  const order = field.map((r) => r.map(() => 0));
  flat.forEach((c, i) => (order[c.y][c.x] = i));
  return order;
}

// real σ of a 1-D walk's position marginal — powers the physics chart.
export function walkStd(steps: number): number {
  const spec = walkSpec({ nPos: 6, steps, coinAngle: Math.PI / 2 });
  const sv = runCircuit(spec.nQubits, spec.gates);
  const m = marginal(sv, spec.regs.pos);
  let mean = 0;
  for (const [i, p] of m) mean += i * p;
  let s2 = 0;
  for (const [i, p] of m) s2 += (i - mean) ** 2 * p;
  return Math.sqrt(s2);
}

// real position marginal for the histogram station
export function walkMarginal(steps: number): number[] {
  const spec = walkSpec({ nPos: 6, steps, coinAngle: Math.PI / 2 });
  const sv = runCircuit(spec.nQubits, spec.gates);
  const m = marginal(sv, spec.regs.pos);
  const arr = new Array(64).fill(0);
  for (const [i, p] of m) arr[i] = p;
  return arr;
}
