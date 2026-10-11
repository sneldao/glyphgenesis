/**
 * quantum-js — the quantum engine ported to the browser.
 *
 * Same gate-spec format and same physics as quantum/ (Python). An exact
 * statevector simulator runs the circuits live in the tab — the fields
 * rendered are real measurement distributions, not a texture.
 *
 * Extras over the Python engine: `phaseField()` exposes amplitude phase
 * (arg ψ summed coherently over the coin) for phase→hue rendering —
 * a statevector-only view, honestly labelled.
 */

// ─── gates ───
const SQ = Math.SQRT1_2;

// Complex statevector as parallel arrays — phase needs complex math.
function apply1qC(re, im, q, m00, m01, m10, m11) {
    const step = 1 << q;
    for (let base = 0; base < re.length; base += step << 1) {
        for (let i = base; i < base + step; i++) {
            const j = i + step;
            const ar = re[i], ai = im[i], br = re[j], bi = im[j];
            re[i] = m00[0] * ar - m00[1] * ai + m01[0] * br - m01[1] * bi;
            im[i] = m00[0] * ai + m00[1] * ar + m01[0] * bi + m01[1] * br;
            re[j] = m10[0] * ar - m10[1] * ai + m11[0] * br - m11[1] * bi;
            im[j] = m10[0] * ai + m10[1] * ar + m11[0] * bi + m11[1] * br;
        }
    }
}
function applyMcx(re, im, controls, target) {
    const tmask = 1 << target;
    for (let i = 0; i < re.length; i++) {
        if (i & tmask) continue;
        let ok = true;
        for (const [q, v] of controls) if (((i >> q) & 1) !== v) { ok = false; break; }
        if (ok) {
            const j = i | tmask;
            const tr = re[i], ti = im[i];
            re[i] = re[j]; im[i] = im[j];
            re[j] = tr; im[j] = ti;
        }
    }
}

/** Run a gate spec. Returns {re, im} statevector arrays. */
export function runCircuit(nQubits, gates) {
    const re = new Float64Array(1 << nQubits);
    const im = new Float64Array(1 << nQubits);
    re[0] = 1;
    for (const g of gates) {
        const [op, ...a] = g;
        if (op === 'x') apply1qC(re, im, a[0], [0, 0], [1, 0], [1, 0], [0, 0]);
        else if (op === 'h') apply1qC(re, im, a[0], [SQ, 0], [SQ, 0], [SQ, 0], [-SQ, 0]);
        else if (op === 'ry') {
            const c = Math.cos(a[0] / 2), s = Math.sin(a[0] / 2);
            apply1qC(re, im, a[1], [c, 0], [-s, 0], [s, 0], [c, 0]);
        }
        else if (op === 'p') {
            const e = [Math.cos(a[0]), Math.sin(a[0])];
            apply1qC(re, im, a[1], [1, 0], [0, 0], [0, 0], e);
        }
        else if (op === 'mcx') applyMcx(re, im, a[0], a[1]);
        else throw new Error(`unknown gate ${g}`);
    }
    return { re, im };
}

/** Probability marginal over keep qubits → Map {value: p}. */
export function marginal({ re, im }, keep) {
    const out = new Map();
    for (let i = 0; i < re.length; i++) {
        const p = re[i] * re[i] + im[i] * im[i];
        if (p < 1e-15) continue;
        let v = 0;
        for (let b = 0; b < keep.length; b++) v |= ((i >> keep[b]) & 1) << b;
        out.set(v, (out.get(v) || 0) + p);
    }
    return out;
}

/**
 * Coherent marginal: amplitude per kept value, summed over traced-out
 * qubits. Yields complex ψ(v) — arg gives the phase used by phase-hue
 * rendering. Statevector-only quantity (not hardware-measurable as-is).
 */
export function coherentMarginal({ re, im }, keep) {
    const out = new Map();
    for (let i = 0; i < re.length; i++) {
        let v = 0;
        for (let b = 0; b < keep.length; b++) v |= ((i >> keep[b]) & 1) << b;
        const cur = out.get(v) || { re: 0, im: 0 };
        cur.re += re[i]; cur.im += im[i];
        out.set(v, cur);
    }
    return out;
}

// ─── circuits (mirror of quantum/circuits.py) ───

function shift(pos, coin, coinVal) {
    const gates = [];
    for (let j = pos.length - 1; j >= 0; j--) {
        const controls = [[coin, coinVal]];
        for (let k = 0; k < j; k++) controls.push([pos[k], coinVal]);
        gates.push(['mcx', controls, pos[j]]);
    }
    return gates;
}

export function walkSpec({ nPos = 6, steps = 6, coinAngle = null, start = null } = {}) {
    if (start === null) start = 1 << (nPos - 1);
    const pos = Array.from({ length: nPos }, (_, i) => i + 1);
    const gates = [];
    for (let j = 0; j < nPos; j++) if ((start >> j) & 1) gates.push(['x', pos[j]]);
    const inc = shift(pos, 0, 1), dec = shift(pos, 0, 0);
    const toss = coinAngle === null ? ['h', 0] : ['ry', coinAngle, 0];
    for (let t = 0; t < steps; t++) gates.push(toss, ...inc, ...dec);
    return { nQubits: 1 + nPos, gates, regs: { pos } };
}

export function walk2dSpec({ nPos = 5, steps = 6, coinAngle = null, start = null } = {}) {
    if (start === null) start = 1 << (nPos - 1);
    const posX = Array.from({ length: nPos }, (_, i) => i + 1);
    const posY = Array.from({ length: nPos }, (_, i) => i + 1 + nPos);
    const gates = [];
    for (const reg of [posX, posY])
        for (let j = 0; j < nPos; j++) if ((start >> j) & 1) gates.push(['x', reg[j]]);
    const toss = coinAngle === null ? ['h', 0] : ['ry', coinAngle, 0];
    for (let t = 0; t < steps; t++) {
        gates.push(toss);
        const reg = t % 2 === 0 ? posX : posY;
        gates.push(...shift(reg, 0, 1), ...shift(reg, 0, 0));
    }
    return { nQubits: 1 + 2 * nPos, gates, regs: { pos_x: posX, pos_y: posY } };
}

export function entangledWalkSpec({ nPos = 5, steps = 4, coinAngle = null,
                                    startA = null, startB = null } = {}) {
    const half = 1 << (nPos - 1);
    startA ??= half - (half >> 1);
    startB ??= half + (half >> 1);
    const posA = Array.from({ length: nPos }, (_, i) => i + 2);
    const posB = Array.from({ length: nPos }, (_, i) => i + 2 + nPos);
    const gates = [['h', 0], ['mcx', [[0, 1]], 1]];
    for (const [reg, s] of [[posA, startA], [posB, startB]])
        for (let j = 0; j < nPos; j++) if ((s >> j) & 1) gates.push(['x', reg[j]]);
    const ta = coinAngle === null ? ['h', 0] : ['ry', coinAngle, 0];
    const tb = coinAngle === null ? ['h', 1] : ['ry', coinAngle, 1];
    for (let t = 0; t < steps; t++) {
        gates.push(ta, tb,
            ...shift(posA, 0, 1), ...shift(posA, 0, 0),
            ...shift(posB, 1, 1), ...shift(posB, 1, 0));
    }
    return { nQubits: 2 + 2 * nPos, gates, regs: { pos_a: posA, pos_b: posB } };
}

// ─── fields ───

function resample(dist, nPos, width, lo, hi) {
    const side = 1 << nPos;
    lo ??= 0; hi ??= side;
    const span = Math.max(hi - lo, 1);
    const row = new Float64Array(width);
    for (const [pos, p] of dist) {
        if (pos < lo || pos >= hi) continue;
        row[Math.min(((pos - lo) * width / span) | 0, width - 1)] += p;
    }
    return [...row];
}

const window_ = (start, steps, nPos, pad = 2) => {
    const side = 1 << nPos;
    return [Math.max(start - steps - pad, 0), Math.min(start + steps + pad, side)];
};

function normalize(field, gamma = 0.4) {
    const peak = Math.max(...field.flat());
    if (peak <= 0) return field;
    return field.map(r => r.map(v => (v / peak) ** gamma));
}

/** 2-D joint field from a two-register distribution. */
function joint2d(dist, nPos, width, height, loX, hiX, loY, hiY) {
    const side = 1 << nPos;
    const sx = Math.max(hiX - loX, 1), sy = Math.max(hiY - loY, 1);
    const field = Array.from({ length: height }, () => new Array(width).fill(0));
    for (const [j, p] of dist) {
        const xa = j & (side - 1), xb = j >> nPos;
        if (xa < loX || xa >= hiX || xb < loY || xb >= hiY) continue;
        const x = Math.min(((xa - loX) * width / sx) | 0, width - 1);
        const y = Math.min((xb - loY) * height / sy | 0, height - 1);
        field[y][x] += p;
    }
    return field;
}

export function walk2dField({ width = 40, height = 16, nPos = 5, steps = 6,
                              phase = false } = {}) {
    const spec = walk2dSpec({ nPos, steps });
    const sv = runCircuit(spec.nQubits, spec.gates);
    const keep = [...spec.regs.pos_x, ...spec.regs.pos_y];
    const centre = (1 << nPos) >> 1;
    const [lo, hi] = window_(centre, (steps >> 1) + 1, nPos, 3);

    if (phase) {
        // coherent marginal → arg ψ per cell (statevector view)
        const coh = coherentMarginal(sv, keep);
        const pfield = joint2d(marginal(sv, keep), nPos, width, height, lo, hi, lo, hi);
        const ph = Array.from({ length: height }, () => new Array(width).fill(0));
        const side = 1 << nPos;
        const sx = hi - lo;
        for (const [j, a] of coh) {
            const xa = j & (side - 1), ya = j >> nPos;
            if (xa < lo || xa >= hi || ya < lo || ya >= hi) continue;
            const x = Math.min(((xa - lo) * width / sx) | 0, width - 1);
            const y = Math.min(((ya - lo) * height / sx) | 0, height - 1);
            ph[y][x] = Math.atan2(a.im, a.re);   // -π..π
        }
        return { field: normalize(pfield), phase: ph };
    }
    return { field: normalize(joint2d(marginal(sv, keep), nPos, width, height, lo, hi, lo, hi)) };
}

export function entangledField({ width = 40, height = 16, nPos = 5, steps = 4 } = {}) {
    const spec = entangledWalkSpec({ nPos, steps });
    const sv = runCircuit(spec.nQubits, spec.gates);
    const keep = [...spec.regs.pos_a, ...spec.regs.pos_b];
    const half = (1 << nPos) >> 1;
    const [loA, hiA] = window_(half - (half >> 1), steps, nPos);
    const [loB, hiB] = window_(half + (half >> 1), steps, nPos);
    return { field: normalize(joint2d(marginal(sv, keep), nPos, width, height, loA, hiA, loB, hiB)) };
}

export function sweepField({ width = 40, height = 16, nPos = 6, steps = 6,
                             coinAngle = Math.PI / 2 } = {}) {
    const centre = 1 << (nPos - 1);
    const side = 1 << nPos;
    const [lo, hi] = window_(centre, 2 * steps, nPos);
    const field = [];
    for (let y = 0; y < height; y++) {
        const start = Math.min(Math.max(
            centre - steps + Math.round(y / Math.max(height - 1, 1) * 2 * steps),
            0), side - 1);
        const spec = walkSpec({ nPos, steps, coinAngle, start });
        const sv = runCircuit(spec.nQubits, spec.gates);
        field.push(resample(marginal(sv, spec.regs.pos), nPos, width, lo, hi));
    }
    return { field: normalize(field) };
}

export const QUANTUM_FIELDS = {
    sweep: sweepField, entangled: entangledField, walk2d: walk2dField,
    grid({ width = 40, height = 16, nPos = 6, steps = 6 } = {}) {
        const centre = 1 << (nPos - 1);
        const [lo, hi] = window_(centre, steps, nPos);
        const sx = walkSpec({ nPos, steps, coinAngle: Math.PI / 2 });
        const sy = walkSpec({ nPos, steps, coinAngle: Math.PI / 3 });
        const dx = resample(marginal(runCircuit(sx.nQubits, sx.gates), sx.regs.pos), nPos, width, lo, hi);
        const dy = resample(marginal(runCircuit(sy.nQubits, sy.gates), sy.regs.pos), nPos, height, lo, hi);
        return { field: normalize(dy.map((py, y) => dx.map(px => Math.sqrt(px * py)))) };
    },
};

/** Serialisable circuit spec — stored in the mint prompt as provenance. */
export function quantumSpec(mode, { width = 40, height = 15, steps = 4, seed = null, shots = null } = {}) {
    const qubits = { sweep: 7, grid: 7, walk2d: 11, entangled: 12 }[mode] ?? null;
    return { schema: 'quantum-art/v1', mode, width, height, steps, seed, shots, backend: 'js-statevector', qubits };
}

/** Render a field to ASCII lines using a theme charset (dense→sparse). */
export function renderField(field, chars) {
    const last = chars.length - 1;
    return field.map(row =>
        row.map(v => chars[Math.min(Math.max(Math.round((1 - v) * last), 0), last)]).join('')
    ).join('\n');
}
