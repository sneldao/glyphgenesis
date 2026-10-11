declare module "*quantum-js.mjs" {
  export function runCircuit(
    nQubits: number,
    gates: unknown[]
  ): { re: Float64Array; im: Float64Array };
  export function marginal(
    sv: { re: Float64Array; im: Float64Array },
    keep: number[]
  ): Map<number, number>;
  export function walkSpec(o?: {
    nPos?: number;
    steps?: number;
    coinAngle?: number;
    start?: number | null;
  }): { nQubits: number; gates: unknown[]; regs: { pos: number[] } };
  export function walk2dField(o?: {
    width?: number;
    height?: number;
    nPos?: number;
    steps?: number;
    phase?: boolean;
  }): { field: number[][]; phase?: number[][] };
  export function entangledField(o?: {
    width?: number;
    height?: number;
    nPos?: number;
    steps?: number;
  }): { field: number[][] };
  export function sweepField(o?: {
    width?: number;
    height?: number;
    nPos?: number;
    steps?: number;
    coinAngle?: number;
  }): { field: number[][] };
  export function renderField(field: number[][], chars: string): string;
}
