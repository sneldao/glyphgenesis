import { QUANTUM_FIELDS, renderField } from '@/quantum-js.mjs';
import { CHARS } from '@/ascii-generator.mjs';
import { makeSampler, shotSchedule, circuitSvg, legendHtml, renderFieldHtml, fitRidge } from '@/quantum-measure.mjs';
import { mountVerify } from './verify-mount.js';
import { mountShotScrubber, mountCellProbe } from './scrubber.js';

/**
 * FILE Nº 01 — The Object.
 * Progressive disclosure tier 1: the thesis, then a demonstration specimen —
 * a live in-browser measurement (honestly labeled, not a mint) whose three
 * tabs are FIELD → CIRCUIT → VERIFY. Our spin on Art Blocks' "features":
 * instead of traits, the tabs are the physics and the proof.
 */
const MODE = 'entangled';          // the correlation ridge — strongest visual
const W = 64, H = 30, STEPS = 7, SHOTS = 4096;
const STORED_SEED = 7, VERIFY_SEED = 19; // different seeds → statistical verification

export function renderObjectSection() {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'object';
    section.setAttribute('aria-labelledby', 'object-title');
    section.innerHTML = `
        <span class="section-label">FILE Nº 01 — The Object</span>
        <h2 class="section-title" id="object-title">The artwork <span>is</span> the measurement.</h2>
        <p class="section-intro object-thesis">
            Every “quantum NFT” before this used the qubits as dice — measure once,
            hash the result into a seed, and let a classical algorithm draw the picture.
            GlyphGenesis renders the measurement itself: probability becomes glyph weight,
            amplitude phase becomes hue, and the full circuit spec travels with the mint
            so anyone can re-measure and verify.
        </p>
        <div class="object-panel">
            <div class="object-head">
                <span class="object-tag">◉ DEMONSTRATION OBJECT</span>
                <span class="object-sub">live measurement in your browser · not a mint</span>
                <button class="btn btn-ghost btn-sm" data-remeasure>↺ re-measure</button>
            </div>
            <div class="object-tabs" role="tablist" aria-label="Specimen views">
                <button class="obj-tab active" role="tab" aria-selected="true" data-pane="field">FIELD</button>
                <button class="obj-tab" role="tab" aria-selected="false" data-pane="circuit">CIRCUIT</button>
                <button class="obj-tab" role="tab" aria-selected="false" data-pane="verify">VERIFY</button>
            </div>
            <div class="object-body">
                <div class="obj-pane" data-pane="field">
                    <div class="object-readout" id="objReadout" role="status">standby — press re-measure or scroll into view</div>
                    <div class="object-controls">
                        <div id="objScrub" class="obj-scrub"></div>
                        <label class="annotate-toggle"><input type="checkbox" id="objAnnotate"> annotate</label>
                        <span class="cell-readout" id="objCell"></span>
                    </div>
                    <div class="object-field-wrap">
                        <pre class="object-field" id="objField"></pre>
                        <svg class="field-overlay" id="objOverlay" aria-hidden="true"></svg>
                    </div>
                    <div id="objLegend"></div>
                </div>
                <div class="obj-pane" data-pane="circuit" hidden>
                    <div class="passport-circuit" id="objCircuit"></div>
                    <div class="circuit-desc" id="objCircuitDesc">hover a gate or wire — each element explains what it does to the field</div>
                    <div class="specimen-spec" id="objSpec"></div>
                    <div class="object-note">compressed schematic — the multi-controlled shift ladder collapses to the dashed block; the full gate list is in the spec stored with each mint</div>
                </div>
                <div class="obj-pane" data-pane="verify" hidden>
                    <div class="object-note">two independent 4096-shot runs of the same circuit — different seeds, same physics. This is what verification looks like on finite-shot hardware.</div>
                    <div id="objVerify"></div>
                </div>
            </div>
        </div>
    `;

    const spec = { mode: MODE, width: W, height: H, steps: STEPS, seed: STORED_SEED, shots: SHOTS, backend: 'js-statevector', qubits: 12, theme: 'simple', storedLabel: 'RUN A — seed 7' };
    const { field: exactField, phase } = QUANTUM_FIELDS[MODE]({ width: W, height: H, steps: STEPS, seed: STORED_SEED, phase: true });
    const chars = CHARS.simple;

    // the "stored" run — deterministic: same seed + shots → same field
    const storedSampler = makeSampler(exactField, STORED_SEED);
    storedSampler.draw(SHOTS);
    const storedText = renderField(storedSampler.field(), chars).replace(/[ \t]+$/gm, '');

    // CIRCUIT pane content (static)
    section.querySelector('#objCircuit').innerHTML = circuitSvg(spec);
    section.querySelector('#objSpec').innerHTML = [
        `<b>CIRCUIT</b> ${MODE}`,
        `<b>QUBITS</b> ${spec.qubits}`,
        `<b>STEPS</b> ${STEPS}`,
        `<b>SHOTS</b> ${SHOTS}`,
        `<b>BACKEND</b> ${spec.backend}`,
        `<b>SEED</b> ${STORED_SEED}`,
    ].join('');
    section.querySelector('#objLegend').innerHTML = legendHtml({ phase: !!phase, shots: SHOTS });

    // FIELD pane — measurement theater on first view
    const pre = section.querySelector('#objField');
    const readout = section.querySelector('#objReadout');
    let timer = null, ran = false;

    const runTheater = () => {
        if (timer) clearInterval(timer);
        const sampler = makeSampler(exactField, STORED_SEED);
        const schedule = shotSchedule(SHOTS, 44);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const finish = () => {
            const measured = sampler.field();
            pre.innerHTML = phase ? renderFieldHtml(measured, chars, phase) : renderField(measured, chars);
            readout.innerHTML = `◈ measured — shots <b>${SHOTS}</b> · seed ${STORED_SEED} · entangled pair — the ridge is the Bell pair`;
            timer = null;
        };
        if (reduced) { sampler.draw(SHOTS); finish(); ran = true; return; }
        let prev = 0, i = 0;
        pre.textContent = '';
        timer = setInterval(() => {
            sampler.draw(schedule[i] - prev);
            prev = schedule[i];
            pre.textContent = renderField(sampler.field(), chars);
            readout.innerHTML = `◉ measuring — shots <b>${prev}</b>/${SHOTS}`;
            if (++i >= schedule.length) finish();
        }, 55);
        ran = true;
    };

    new IntersectionObserver((entries, obs) => {
        if (entries[0].isIntersecting && !ran) { runTheater(); obs.disconnect(); }
    }, { threshold: 0.35 }).observe(section.querySelector('.object-panel'));

    section.querySelector('[data-remeasure]').addEventListener('click', runTheater);

    /* shot scrubber — disclosure along the physical axis. Each position
       re-samples deterministically, so scrubbing is lossless. Phase hues
       return at full shot count. */
    mountShotScrubber(section.querySelector('#objScrub'), {
        field: exactField, seed: STORED_SEED, shots: SHOTS, chars,
        render(n, s) {
            const f = s.field();
            if (n >= SHOTS && phase) pre.innerHTML = renderFieldHtml(f, chars, phase);
            else pre.textContent = renderField(f, chars);
            readout.innerHTML = `◉ shots <b>${n}</b>/${SHOTS} · seed ${STORED_SEED}${n >= SHOTS ? ' · entangled pair — the ridge is the Bell pair' : ''}`;
        },
    });

    /* cell probe — hover a glyph, get its joint-outcome meaning */
    mountCellProbe(pre, {
        cols: W, rows: H, field: exactField, out: section.querySelector('#objCell'), mode: MODE,
    });

    /* annotation layer — the correlation ridge fitted to the measured field */
    const overlay = section.querySelector('#objOverlay');
    const annotate = section.querySelector('#objAnnotate');
    const drawOverlay = () => {
        if (!annotate.checked) { overlay.innerHTML = ''; overlay.style.display = 'none'; return; }
        const cs = getComputedStyle(pre);
        const probe = document.createElement('canvas').getContext('2d');
        probe.font = `${cs.fontSize} ${cs.fontFamily}`;
        const cw = probe.measureText('█').width;
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        overlay.style.display = 'block';
        overlay.style.width = `${W * cw}px`;
        overlay.style.height = `${H * lh}px`;
        overlay.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const ridge = fitRidge(exactField);
        if (!ridge) return;
        const mx = (ridge.x0 + ridge.x1) / 2, my = (ridge.y0 + ridge.y1) / 2;
        overlay.innerHTML =
            `<line x1="${ridge.x0 + .5}" y1="${ridge.y0 + .5}" x2="${ridge.x1 + .5}" y2="${ridge.y1 + .5}" class="ridge-line"/>` +
            `<circle cx="${ridge.x0 + .5}" cy="${ridge.y0 + .5}" r=".8" class="ridge-dot"/>` +
            `<circle cx="${ridge.x1 + .5}" cy="${ridge.y1 + .5}" r=".8" class="ridge-dot"/>` +
            `<text x="${mx}" y="${my - 2.4}" class="ridge-label">correlation ridge — the Bell pair</text>` +
            `<text x="${mx}" y="${my + 3.4}" class="ridge-label ridge-sub">measuring walker a tells you where b landed</text>`;
    };
    annotate.addEventListener('change', drawOverlay);
    if (document.fonts?.ready) document.fonts.ready.then(() => { if (annotate.checked) drawOverlay(); });

    /* circuit cross-highlight — hover an element, get its physical role */
    const circuitDesc = section.querySelector('#objCircuitDesc');
    const circuitBox = section.querySelector('#objCircuit');
    const descDefault = circuitDesc.textContent;
    circuitBox.addEventListener('mouseover', (e) => {
        const el = e.target.closest?.('.cs-el');
        circuitDesc.textContent = el?.dataset.desc || descDefault;
        circuitDesc.classList.toggle('active', !!el);
    });
    circuitBox.addEventListener('mouseleave', () => {
        circuitDesc.textContent = descDefault;
        circuitDesc.classList.remove('active');
    });

    // tabs — VERIFY mounts lazily on first open
    let verifyMounted = false;
    section.querySelectorAll('.obj-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            section.querySelectorAll('.obj-tab').forEach(t => {
                t.classList.toggle('active', t === tab);
                t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
            });
            section.querySelectorAll('.obj-pane').forEach(p => {
                p.hidden = p.dataset.pane !== tab.dataset.pane;
            });
            if (tab.dataset.pane === 'verify' && !verifyMounted) {
                verifyMounted = true;
                mountVerify(section.querySelector('#objVerify'), {
                    storedText, quantum: spec, verifySeed: VERIFY_SEED,
                });
            }
        });
    });

    return section;
}
