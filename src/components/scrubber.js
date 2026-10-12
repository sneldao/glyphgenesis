import { makeSampler, fieldWeights } from '@/quantum-measure.mjs';
import { renderField } from '@/quantum-js.mjs';

/**
 * Shot scrubber — progressive disclosure along the physical axis.
 * A range input maps log-scale to shot count; every position re-samples the
 * field deterministically (same seed), so dragging back and forth is lossless.
 *
 * render(shots, sampler) is caller-provided so hosts decide plain vs phase render.
 */
export function mountShotScrubber(container, { field, seed, shots, render, minShots = 16 }) {
    container.innerHTML = `
        <label class="scrub-row">
            <span class="scrub-label">SHOTS</span>
            <input type="range" class="scrub-range" min="0" max="100" value="100"
                   aria-label="Measurement shots — drag to re-measure at fewer shots">
            <span class="scrub-val">${shots}</span>
        </label>
    `;
    const range = container.querySelector('.scrub-range');
    const val = container.querySelector('.scrub-val');
    const ratio = shots / minShots;

    range.addEventListener('input', () => {
        const t = range.value / 100;
        const n = Math.max(1, Math.round(minShots * Math.pow(ratio, t)));
        const s = makeSampler(field, seed);
        s.draw(n);
        val.textContent = n;
        render(n, s);
    });
}

/**
 * Cell probe — hover a glyph, get its physical meaning.
 * For a joint distribution field, cell (x,y) is the outcome "walker a at x,
 * walker b at y"; the readout reports the circuit-true probability.
 * getField() supplies the exact distribution; out is a readout element.
 */
export function mountCellProbe(pre, { cols, rows, field, out, mode }) {
    if (!pre || !out) return;
    const weights = fieldWeights(field);
    const total = weights.flat().reduce((a, b) => a + b, 0);

    // monospace metrics — measure once fonts settle
    const measure = () => {
        const cs = getComputedStyle(pre);
        const probe = document.createElement('canvas').getContext('2d');
        probe.font = `${cs.fontSize} ${cs.fontFamily}`;
        return { cw: probe.measureText('█').width, lh: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2 };
    };
    let dims = null;

    const describe = (x, y) => {
        const v = weights[y]?.[x] ?? 0;
        const p = v / total;
        if (mode === 'entangled') {
            return `cell (${x},${y}) → joint outcome pos<sub>a</sub>=${x} pos<sub>b</sub>=${y} · p≈${p.toFixed(3)}`;
        }
        return `cell (${x},${y}) · p≈${p.toFixed(3)}${v > 0 ? '' : ' — unreachable under this circuit'}`;
    };

    pre.addEventListener('mousemove', (e) => {
        if (!dims) dims = measure();
        const r = pre.getBoundingClientRect();
        const x = Math.floor((e.clientX - r.left + pre.scrollLeft) / dims.cw);
        const y = Math.floor((e.clientY - r.top + pre.scrollTop) / dims.lh);
        if (x < 0 || x >= cols || y < 0 || y >= rows) { out.textContent = ''; return; }
        out.innerHTML = describe(x, y);
    });
    pre.addEventListener('mouseleave', () => { out.textContent = ''; });
}
