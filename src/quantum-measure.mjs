/**
 * quantum-measure — measurement primitives layered on quantum-js.mjs.
 *
 * The engine returns exact probability fields (peak-normalized, gamma 0.4).
 * This module treats a field as a measurement distribution: it can draw
 * finite-shot samples from it (seeded → replayable), accumulate them like a
 * real backend run, compare a stored field against a re-measurement, and
 * draw the circuit schematic behind a spec.
 */

// deterministic PRNG — seeded sampling makes browser "shots" replayable
export function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const GAMMA = 0.4; // matches normalize() in quantum-js.mjs

/** Invert the engine's gamma normalization → relative probabilities. */
export function fieldWeights(field) {
    return field.map(row => row.map(v => Math.pow(v, 1 / GAMMA)));
}

/** x-marginal standard deviation of a 2-D distribution — the physics check. */
export function sigmaX(field) {
    const w = fieldWeights(field);
    let total = 0, ex = 0, ex2 = 0;
    for (const row of w) for (let x = 0; x < row.length; x++) {
        total += row[x]; ex += x * row[x]; ex2 += x * x * row[x];
    }
    if (total <= 0) return 0;
    const mean = ex / total;
    return Math.sqrt(Math.max(ex2 / total - mean * mean, 0));
}

/**
 * Incremental shot sampler over a field's distribution.
 * draw(n) accumulates n samples; field() returns the counts re-normalized
 * the same way the engine normalizes exact fields — so a fully-sampled
 * field looks and renders like a finite-shot backend result.
 */
export function makeSampler(field, seed = 1) {
    const rand = mulberry32(seed | 0 || 1);
    const h = field.length, w = field[0].length;
    const weights = fieldWeights(field);
    const cdf = new Float64Array(w * h);
    let acc = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        acc += weights[y][x];
        cdf[y * w + x] = acc;
    }
    const counts = Array.from({ length: h }, () => new Float64Array(w));
    let drawn = 0;

    const bisect = (r) => {
        let lo = 0, hi = cdf.length - 1;
        while (lo < hi) { const m = (lo + hi) >> 1; cdf[m] < r ? lo = m + 1 : hi = m; }
        return lo;
    };

    return {
        draw(n) {
            for (let i = 0; i < n; i++) {
                const idx = bisect(rand() * acc);
                counts[(idx / w) | 0][idx % w]++;
            }
            drawn += n;
            return drawn;
        },
        get drawn() { return drawn; },
        counts,
        field() {
            let peak = 0;
            for (const row of counts) for (const v of row) if (v > peak) peak = v;
            if (peak <= 0) return counts.map(r => [...r]);
            // plain Arrays — Float64Array.map would coerce glyph strings to NaN downstream
            return counts.map(r => Array.from(r, v => Math.pow(v / peak, GAMMA)));
        },
    };
}

/** Batch schedule for the measurement theater — log-ish ramp to `total`. */
export function shotSchedule(total = 4096, frames = 42) {
    const out = [];
    for (let k = 1; k <= frames; k++) {
        const t = k / frames;
        out.push(Math.max(1, Math.round(total * Math.pow(t, 1.6))));
    }
    out[out.length - 1] = total;
    return out;
}

/** Render a field to HTML with per-cell phase→hue spans (walk2d fields). */
const STOPS = [
    [356, '#e0504a'], [30, '#e08a3a'], [150, '#3fae6e'],
    [175, '#2fa8a0'], [228, '#4a6fd8'], [262, '#8a5fd8'],
];
export function phaseColor(p) {
    const deg = ((p * 180 / Math.PI) + 360) % 360;
    let best = STOPS[0][1], bd = 999;
    for (const [h, c] of STOPS) {
        const d = Math.min(Math.abs(deg - h), 360 - Math.abs(deg - h));
        if (d < bd) { bd = d; best = c; }
    }
    return best;
}

export function renderFieldHtml(field, chars, phase = null) {
    const last = chars.length - 1;
    const esc = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
    return field.map((row, y) =>
        row.map((v, x) => {
            const ch = chars[Math.min(Math.max(Math.round((1 - v) * last), 0), last)];
            const e = esc[ch] || ch;
            if (!phase || ch === ' ') return e;
            const a = 0.35 + v * 0.65;
            return `<span style="color:${phaseColor(phase[y][x])};opacity:${a.toFixed(2)}">${e}</span>`;
        }).join('')
    ).join('\n');
}

/** Map rendered chars back to a density index for comparison. */
export function charIndexMap(chars) {
    const m = new Map();
    chars.forEach((c, i) => m.set(c, chars.length - 1 - i)); // index = density
    return m;
}

function densityMatrix(text, chars) {
    const m = charIndexMap(chars);
    return text.split('\n').map(line =>
        [...line].map(c => m.get(c) ?? 0));
}

/** Pearson correlation between two rendered fields (as char grids). */
export function fieldCorrelation(aText, bText, chars) {
    const A = densityMatrix(aText, chars), B = densityMatrix(bText, chars);
    let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
    for (let y = 0; y < Math.min(A.length, B.length); y++) {
        for (let x = 0; x < Math.min(A[y].length, B[y].length); x++) {
            const a = A[y][x], b = B[y][x];
            sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; n++;
        }
    }
    if (!n) return 0;
    const cov = sab / n - (sa / n) * (sb / n);
    const va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2;
    if (va <= 0 || vb <= 0) return 0;
    return cov / Math.sqrt(va * vb);
}

/**
 * Weighted least-squares ridge through the high-probability cells —
 * the annotation layer's correlation guide line, fitted to the actual
 * measured distribution rather than drawn decoratively.
 * Returns {x0,y0,x1,y1} in cell coordinates.
 */
export function fitRidge(field, thresh = 0.12) {
    const w = fieldWeights(field);
    let peak = 0;
    for (const row of w) for (const v of row) peak = Math.max(peak, v);
    let sx = 0, sy = 0, sxx = 0, sxy = 0, sw = 0;
    let x0 = Infinity, x1 = -Infinity;
    for (let y = 0; y < w.length; y++) for (let x = 0; x < w[0].length; x++) {
        const v = w[y][x];
        if (v < peak * thresh) continue;
        sx += x * v; sy += y * v; sxx += x * x * v; sxy += x * y * v; sw += v;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    }
    if (!sw || x1 <= x0) return null;
    const mx = sx / sw, my = sy / sw;
    const varX = Math.max(sxx / sw - mx * mx, 1e-9);
    const slope = (sxy / sw - mx * my) / varX;
    return { x0, y0: my + slope * (x0 - mx), x1, y1: my + slope * (x1 - mx), slope };
}

/* ─── circuit schematic — the "sheet music" behind a spec ─── */

const WIRE = '#3a3f4d', GATE_BG = '#f4f0e6', ACC = '#1f46b4', TEAL = '#0c8f84';

const desc = (inner, d) => `<g class="cs-el" data-desc="${d.replace(/"/g, '&quot;')}">${inner}</g>`;

function wireRow(label, y, w, d = '') {
    const row = `<text x="8" y="${y + 4}" font-size="11" fill="#6d7590" font-family="monospace">${label}</text>` +
        `<line x1="86" y1="${y}" x2="${w - 14}" y2="${y}" stroke="${WIRE}" stroke-width="1.2"/>`;
    return d ? desc(row, d) : row;
}
function gateBox(x, y, label, color = ACC, d = '') {
    const inner = `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" fill="${GATE_BG}" stroke="${color}" stroke-width="1.5"/>` +
        `<text x="${x}" y="${y + 4.5}" font-size="12" fill="${color}" font-family="monospace" text-anchor="middle">${label}</text>`;
    return d ? desc(inner, d) : inner;
}
function stepBlock(x, y1, y2, label, d = '') {
    const inner = `<rect x="${x}" y="${y1 - 14}" width="86" height="${y2 - y1 + 28}" fill="none" stroke="${TEAL}" stroke-width="1.2" stroke-dasharray="4 3" rx="2"/>` +
        `<text x="${x + 43}" y="${y2 + 26}" font-size="10" fill="${TEAL}" font-family="monospace" text-anchor="middle">${label}</text>`;
    return d ? desc(inner, d) : inner;
}
function bellPrep(x, y1, y2, d = '') {
    const inner = `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${WIRE}" stroke-width="1.2"/>` +
        `<circle cx="${x}" cy="${y1}" r="3.5" fill="${ACC}"/>` +
        `<circle cx="${x}" cy="${y2}" r="7" fill="none" stroke="${ACC}" stroke-width="1.5"/>` +
        `<line x1="${x - 5}" y1="${y2}" x2="${x + 5}" y2="${y2}" stroke="${ACC}" stroke-width="1.5"/>`;
    return d ? desc(inner, d) : inner;
}

/**
 * Schematic SVG for a spec mode — one step block shown, labeled ×steps.
 * Honest compression: MCX shift ladders collapse to a dashed block.
 */
export function circuitSvg(spec) {
    const { mode, steps } = spec;
    const y0 = 34, dy = 30;
    const D = {
        coinH: 'Hadamard on the coin qubit — puts the walker into a superposition of moving left and right',
        posX: 'X gate — recenters the position register so the walk can spread both ways',
        shift: 'multi-controlled increment/decrement ladder — moves |x⟩±1 conditioned on the coin, once per step. Each step doubles the reachable positions: ballistic, not diffusive',
        bell: 'H then CNOT between the two coin qubits — creates the shared |Φ+⟩ state. The correlation ridge in the field is this entanglement',
        bellH: 'Hadamard on the already-entangled coin — both walkers now move in superposition',
        ry: 'Ry(π/3) — a biased coin toss for the second walk axis',
        xstart: 'X(start) — initializes the walker at each row\'s start position; the start index scans across rows',
        hsteps: 'the coin toss repeats every step — each repetition doubles the wavefront',
        ridge: 'the correlation between the two walkers is born here',
    };
    const rows = {
        walk2d: [['q₀ coin', 'H', 'H', 'coin toss'], ['q₁–₅ pos x', 'X', 'shift±', 'even steps'], ['q₆–₁₀ pos y', 'X', 'shift±', 'odd steps']],
        sweep: [['q₀ coin', 'H', 'H', 'coin toss'], ['q₁–₆ pos', 'X·start', 'shift±', '×steps'], ['— start scans', '', '', 'per row']],
        grid: [['q₀ coin x', 'H', 'H', 'θ = π/2'], ['q₁–₆ pos x', '', 'shift±', '×steps'], ['q₀ coin y', 'H', 'Ry', 'θ = π/3'], ['q₁–₆ pos y', '', 'shift±', '×steps']],
        entangled: [['q₀ coin a', 'H●', '', 'Bell prep'], ['q₁ coin b', '⊕H', 'H', 'Bell pair'], ['q₂–₆ pos a', 'X', 'shift±', '×steps'], ['q₇–₁₁ pos b', 'X', 'shift±', '×steps']],
    }[mode] || [['q₀ coin', 'H', 'H', 'coin toss'], ['pos', 'X', 'shift±', '×steps']];

    const H = 60 + rows.length * dy + 24, W = 660;
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${mode} circuit schematic">`;
    svg += `<text x="8" y="16" font-size="10" letter-spacing="2" fill="#6d7590" font-family="monospace">CIRCUIT SCHEMATIC · ${mode.toUpperCase()} · ${spec.qubits ?? '—'} QUBITS · ONE STEP SHOWN ×${steps}</text>`;
    rows.forEach(([label], i) => {
        const isPos = /pos/.test(label);
        svg += wireRow(label, y0 + i * dy, W, isPos ? 'position register — a binary encoding of where the walker is' : 'coin qubit — controls the direction each step');
    });

    if (mode === 'entangled') {
        // Bell prep is the physics claim — draw it explicitly
        svg += gateBox(110, y0, 'H', ACC, D.bell);
        svg += bellPrep(150, y0, y0 + dy, D.bell);
        svg += stepBlock(190, y0, y0 + 3 * dy, `shift ± ×${steps}`, D.shift);
        svg += gateBox(190 + 20, y0 + dy, 'H', ACC, D.bellH);
        svg += desc(`<text x="${W - 150}" y="${y0 - 6}" font-size="10" fill="#c82436" font-family="monospace">entangled here</text>`, D.ridge);
    } else if (mode === 'grid') {
        svg += gateBox(110, y0, 'H', ACC, D.coinH);
        svg += stepBlock(190, y0, y0 + dy, `walk x ×${steps}`, D.shift);
        svg += gateBox(110, y0 + 2 * dy, 'Ry', ACC, D.ry);
        svg += stepBlock(190, y0 + 2 * dy, y0 + 3 * dy, `walk y ×${steps}`, D.shift);
        svg += `<text x="${W - 210}" y="${H - 8}" font-size="10" fill="#6d7590" font-family="monospace">two separable walks — no shared coin</text>`;
    } else {
        svg += gateBox(110, y0, 'H', ACC, D.coinH);
        rows.forEach(([, init], i) => {
            if (init === 'X') svg += gateBox(110, y0 + i * dy, 'X', ACC, D.posX);
            if (init === 'X·start') svg += desc(`<text x="118" y="${y0 + i * dy + 4}" font-size="10" fill="${ACC}" font-family="monospace">X(start)</text>`, D.xstart);
        });
        const first = rows.findIndex(r => r[2] === 'shift±');
        const last = rows.map((r, i) => r[2] === 'shift±' ? i : -1).filter(i => i >= 0).pop();
        if (first >= 0) svg += stepBlock(190, y0 + first * dy, y0 + last * dy, `shift ± ×${steps}`, D.shift);
        svg += desc(`<text x="${W - 130}" y="${y0 - 6}" font-size="10" fill="${ACC}" font-family="monospace">H ×${steps}</text>`, D.hsteps);
    }
    svg += '</svg>';
    return svg;
}

/** Compact instrument legend — explains the encoding. */
export function legendHtml({ phase = false, shots = null, sigma = null } = {}) {
    const arc = `<span class="legend-arc" aria-label="phase −π to π maps to spectral hue"></span>`;
    const ramp = [...'·░▒▓█'].map(c => `<span>${c}</span>`).join('');
    return `<div class="instrument-legend">` +
        (phase ? `<span class="legend-item">${arc} PHASE −π·0·+π → HUE</span>` : '') +
        `<span class="legend-item"><span class="legend-ramp">${ramp}</span> PROBABILITY → GLYPH</span>` +
        (shots ? `<span class="legend-item">SHOTS ${shots}</span>` : '') +
        (sigma != null ? `<span class="legend-item">σ<sub>x</sub> ${sigma.toFixed(2)}</span>` : '') +
        `</div>`;
}
