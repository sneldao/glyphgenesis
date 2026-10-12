import { generate, parsePrompt, creativityScore, getRarity, PATTERN_LIST, THEME_LIST, CHARS, mutateArt } from '@/ascii-generator.mjs';
import { QUANTUM_FIELDS, renderField, quantumSpec } from '@/quantum-js.mjs';
import { makeSampler, shotSchedule, renderFieldHtml, legendHtml, sigmaX } from '@/quantum-measure.mjs';
import { mountShotScrubber } from './scrubber.js';
import { isConnected, getContract, onWalletEvent } from '@/wallet.js';
import { EXPLORER_TX, getActiveChain, getActiveChainKey, getCurrencyLabel } from '@/contract.js';
import { showToast } from './toast.js';
import { escapeHtml } from '@/utils.js';

let animationFrames = [];
let animationIndex = 0;
let animationInterval = null;
let isAnimating = false;
let currentArt = '';
let currentPrompt = 'MONAD';
let currentQuantumSpec = null;

export function renderGenerator() {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'generator';
    section.setAttribute('aria-labelledby', 'generator-title');
    section.innerHTML = `
        <span class="section-label">FILE Nº 03 — Laboratory</span>
        <h2 class="section-title" id="generator-title">The <span>Laboratory</span></h2>
        <div class="generator-wrap">
            <div class="generator-controls">
                <div>
                    <label class="field-label" for="prompt">Prompt / Text</label>
                    <input type="text" id="prompt" placeholder="MONAD or 'cyberpunk waves 40x15'" value="MONAD" aria-describedby="prompt-hint">
                    <small id="prompt-hint" style="color:var(--muted);font-size:.68rem;display:block;margin-top:5px;">Try: "cyber waves", "cosmic star animated", "diamond 50x20"</small>
                </div>
                <div>
                    <label class="field-label" for="genType">Type</label>
                    <select id="genType" aria-label="Generation type">
                        <option value="quantum">Quantum Field</option>
                        <option value="pattern">Pattern</option>
                        <option value="compose">Compose (Layered)</option>
                        <option value="mutate">Mutate (Evolve)</option>
                        <option value="banner">Banner (Text)</option>
                    </select>
                </div>
                <div id="quantumControls" class="quantum-controls">
                    <label class="field-label" for="quantumMode">Circuit</label>
                    <select id="quantumMode" aria-label="Quantum circuit mode">
                        <option value="walk2d">Quantum Walk 2-D — single coin steers both axes</option>
                        <option value="sweep">Wave Sweep — start position scans across rows</option>
                        <option value="grid">Interference Lattice — separable walk grid</option>
                        <option value="entangled">Entangled Pair — two walkers share a Bell state</option>
                    </select>
                    <small class="quantum-hint">The artwork is the measurement — watch shots accumulate into the field. Hue encodes amplitude phase, glyph weight encodes probability.</small>
                </div>
                <div>
                    <label class="field-label" for="pattern">Pattern</label>
                    <select id="pattern" aria-label="Pattern type">
                        ${PATTERN_LIST.map(p => `<option value="${p.id}">${p.name} — ${p.desc}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="field-label" for="theme">Theme</label>
                    <select id="theme" aria-label="Visual theme">
                        ${THEME_LIST.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>
                <div class="bnb-controls" id="bnbControls" style="display:none;">
                    <label class="field-label" for="collectionId">BNB Collection ID</label>
                    <input type="number" id="collectionId" min="0" step="1" value="0" aria-label="BNB collection ID">
                    <small style="color:var(--muted);font-size:.68rem;display:block;margin-top:5px;">BNB only: mint into collection 0 by default, or create a new collection first.</small>
                    <button type="button" class="gen-btn outline" id="createCollectionBtn">Create Collection</button>
                </div>
                <div class="animate-row">
                    <label><input type="checkbox" id="animateToggle"> Animate</label>
                    <div class="playback-btns" id="playbackControls">
                        <button type="button" id="playBtn" aria-label="Play animation">▶ Play</button>
                        <button type="button" id="pauseBtn" aria-label="Pause animation">⏸ Pause</button>
                        <span id="frameCounter">Frame: 1</span>
                    </div>
                </div>
                <button type="button" class="gen-btn" id="generateBtn">Generate</button>
                <button type="button" class="gen-btn outline" id="mutateBtn" title="Mutate current art for new variation">♻️ Evolve</button>
                <button type="button" class="gen-btn outline" id="randomizeBtn">Randomize</button>
            </div>
            <div class="generator-output">
                <div class="output-label" aria-hidden="true">Measurement Display</div>
                <div id="measureReadout" class="measure-readout" style="display:none;" role="status" aria-live="polite"></div>
                <div id="shotScrubber" class="obj-scrub lab-scrub" style="display:none;"></div>
                <div id="output" role="img" aria-label="Generated ASCII art output">Click [ Generate ] to create your masterpiece...</div>
                <div id="specimenStrip" class="specimen-spec" style="display:none;"></div>
                <div id="instrumentLegend" style="display:none;"></div>
                <div id="creativityScore" class="creativity-score" style="display:none;"></div>
                <div class="output-actions">
                    <button type="button" class="btn btn-ghost" id="copyBtn" aria-label="Copy art to clipboard">📋 Copy</button>
                    <button type="button" class="btn btn-ghost" id="downloadBtn" aria-label="Download art as text file">💾 Download</button>
                    <button type="button" class="btn btn-ghost" id="shareBtn" aria-label="Share on social">🐦 Share</button>
                    <button type="button" class="btn btn-ghost" id="shareCardBtn" aria-label="Generate shareable card">📄 Share Card</button>
                </div>
                <button type="button" class="btn btn-mint" id="mintBtn" disabled>Mint on ${getCurrencyLabel()} — Connect Wallet First</button>
                <div id="mintStatus"></div>
            </div>
        </div>
    `;

    section.querySelector('#generateBtn').addEventListener('click', generateArt);
    section.querySelector('#mutateBtn').addEventListener('click', () => mutateCurrentArt());
    section.querySelector('#randomizeBtn').addEventListener('click', randomize);
    section.querySelector('#animateToggle').addEventListener('change', generateArt);
    section.querySelector('#playBtn').addEventListener('click', playAnimation);
    section.querySelector('#pauseBtn').addEventListener('click', pauseAnimation);
    section.querySelector('#copyBtn').addEventListener('click', copyToClipboard);
    section.querySelector('#downloadBtn').addEventListener('click', downloadArt);
    section.querySelector('#shareBtn').addEventListener('click', shareOnTwitter);
    section.querySelector('#shareCardBtn').addEventListener('click', generateShareCard);
    section.querySelector('#mintBtn').addEventListener('click', mintArt);
    section.querySelector('#createCollectionBtn')?.addEventListener('click', createCollection);
    section.querySelector('#prompt').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') generateArt();
    });

    section.querySelector('#genType').addEventListener('change', (e) => {
        const v = e.target.value;
        const patternRow = section.querySelector('#pattern')?.closest('div');
        const qControls = section.querySelector('#quantumControls');
        if (patternRow) patternRow.style.display = (v === 'banner' || v === 'quantum') ? 'none' : '';
        if (qControls) qControls.style.display = v === 'quantum' ? '' : 'none';
    });

    onWalletEvent((event) => {
        if (event === 'connect') updateMintButton(true);
        if (event === 'disconnect') updateMintButton(false);
        if (event === 'connect' || event === 'disconnect' || event === 'chainSwitch') updateChainControls();
    });

    updateChainControls();

    // 'quantum' is the default type — sync row visibility with the initial select state
    const patternRow = section.querySelector('#pattern')?.closest('div');
    if (patternRow) patternRow.style.display = 'none';

    return section;
}

function updateChainControls() {
    const controls = document.getElementById('bnbControls');
    if (!controls) return;
    controls.style.display = getActiveChainKey() === 'bnb' ? '' : 'none';
}

function updateMintButton(connected) {
    const btn = document.getElementById('mintBtn');
    if (!btn) return;
    btn.disabled = !connected;
    btn.textContent = connected ? 'Mint This Art on ' + getCurrencyLabel() : 'Mint on ' + getCurrencyLabel() + ' — Connect Wallet First';
}

function generateArt() {
    const promptInput = document.getElementById('prompt')?.value || 'MONAD';
    const patternSelect = document.getElementById('pattern')?.value || 'circles';
    const themeSelect = document.getElementById('theme')?.value || 'simple';
    const genTypeSelect = document.getElementById('genType')?.value || 'pattern';
    const animate = document.getElementById('animateToggle')?.checked || false;
    const output = document.getElementById('output');
    if (!output) return;

    currentPrompt = promptInput;
    pauseAnimation();
    stopMeasure();

    const parsed = parsePrompt(promptInput);
    const pattern = parsed.pattern || patternSelect;
    const theme = parsed.theme || themeSelect;
    const genType = parsed.type !== 'pattern' ? parsed.type : genTypeSelect;
    const animated = parsed.animated || animate;

    const detected = [];
    if (parsed.pattern && parsed.pattern !== patternSelect) detected.push('pattern: ' + parsed.pattern);
    if (parsed.theme && parsed.theme !== themeSelect) detected.push('theme: ' + parsed.theme);
    if (parsed.animated) detected.push('animated');
    if (genType !== 'pattern') detected.push('type: ' + genType);
    const detectionMsg = detected.length > 0 ? ` (detected: ${detected.join(', ')})` : '';

    try {
        if (genType === 'quantum') { generateQuantum(parsed, theme, animated, output, detectionMsg); return; }
        hideSpecimenStrip();

        if (animated) {
            const frameCount = 8;
            animationFrames = [];
            for (let i = 0; i < frameCount; i++) {
                animationFrames.push(generate(promptInput, {
                    type: genType, pattern, theme,
                    width: parsed.width || 40, height: parsed.height || 15,
                    framed: true, time: i / frameCount, seed: parsed.seed,
                }));
            }
            animationIndex = 0;
            currentArt = animationFrames[0];
            
            // For animation, we still want a quick "typing" feel for the first frame
            animateText(output, currentArt, () => {
                const controls = document.getElementById('playbackControls');
                if (controls) controls.style.display = 'flex';
                const counter = document.getElementById('frameCounter');
                if (counter) counter.textContent = `Frame: 1/${frameCount}`;
                showToast(`Generated ${frameCount} animation frames!${detectionMsg}`, 'success');
                updateCreativityScore(currentArt);
            });
        } else {
            currentArt = generate(promptInput, {
                type: genType, pattern, theme,
                width: parsed.width || 40, height: parsed.height || 15,
                framed: true, seed: parsed.seed,
            });
            
            animateText(output, currentArt, () => {
                const controls = document.getElementById('playbackControls');
                if (controls) controls.style.display = 'none';
                showToast(`Art generated with ${theme} theme!${detectionMsg}`, 'success');
                updateCreativityScore(currentArt);
            });
        }
    } catch (error) {
        console.error(error);
        output.textContent = 'Failed to generate art. Please try again.';
        showToast(`Generation failed: ${error.message}`, 'error');
    }
}

/* ─── quantum generation ───
   Real circuit measurement in-browser via src/quantum-js.mjs.
   Animated = time evolution: frame t measures the circuit after t steps. */
const QUANTUM_FIELD = QUANTUM_FIELDS;

let measureTimer = null;
const TOTAL_SHOTS = 4096;

function stopMeasure() {
    if (measureTimer) { clearInterval(measureTimer); measureTimer = null; }
    const ro = document.getElementById('measureReadout');
    if (ro) ro.style.display = 'none';
    const sc = document.getElementById('shotScrubber');
    if (sc) sc.style.display = 'none';
}

function generateQuantum(parsed, themeId, animated, output, detectionMsg) {
    const mode = document.getElementById('quantumMode')?.value || 'walk2d';
    const fieldFn = QUANTUM_FIELD[mode] || QUANTUM_FIELD.walk2d;
    const width = parsed.width || 40, height = parsed.height || 15;
    const seed = parsed.seed ?? (Math.random() * 2 ** 31 | 0);
    const chars = CHARS[themeId] || CHARS.simple;
    // steps ≈ a third of the smaller dimension — enough for visible spread
    const steps = Math.max(3, Math.min(8, Math.round(Math.min(width, height) / 3)));

    const { field: exactField, phase } = fieldFn({ width, height, steps, seed, phase: true });
    const sigma = sigmaX(exactField);
    stopMeasure();

    if (animated) { runEvolution(fieldFn, mode, { width, height, steps, seed, chars, output, detectionMsg, phase }); return; }
    runMeasurement(exactField, phase, { mode, width, height, steps, seed, chars, output, sigma, detectionMsg });
}

/* The artwork is the measurement: shots accumulate from a seeded sampler
   over the circuit's distribution — noise resolves into structure, then
   amplitude phase resolves into hue. Replayable: same seed, same shots. */
function runMeasurement(exactField, phase, { mode, width, height, steps, seed, chars, output, sigma, detectionMsg }) {
    const readout = document.getElementById('measureReadout');
    const sampler = makeSampler(exactField, seed);
    const schedule = shotSchedule(TOTAL_SHOTS, 44);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let prev = 0, i = 0;

    const paint = (shotsSoFar) => {
        const f = sampler.field();
        output.textContent = renderField(f, chars);
        if (readout) {
            readout.style.display = 'block';
            readout.innerHTML = shotsSoFar < TOTAL_SHOTS
                ? `◉ measuring — shots <b>${shotsSoFar}</b>/${TOTAL_SHOTS} · σ<sub>x</sub> ${sigmaX(f).toFixed(2)}`
                : `◈ measured — shots <b>${TOTAL_SHOTS}</b> · σ<sub>x</sub> ${sigma.toFixed(2)} (exact ${sigma.toFixed(2)})`;
        }
    };

    const finish = () => {
        stopMeasure();
        if (readout) readout.style.display = 'block';
        const measured = sampler.field();
        currentArt = renderField(measured, chars);
        // phase is a statevector quantity — it resolves over the measured weights
        output.innerHTML = phase ? renderFieldHtml(measured, chars, phase) : currentArt;
        if (readout) readout.innerHTML = `◈ measured — shots <b>${TOTAL_SHOTS}</b> · seed ${seed} · σ<sub>x</sub> ${sigmaX(measured).toFixed(2)} (exact ${sigma.toFixed(2)})`;
        // shot scrubber — drag backward and watch the measurement dissolve into noise
        const scrubEl = document.getElementById('shotScrubber');
        if (scrubEl) {
            scrubEl.style.display = 'block';
            mountShotScrubber(scrubEl, {
                field: exactField, seed, shots: TOTAL_SHOTS,
                render(n, s) {
                    const f = s.field();
                    if (n >= TOTAL_SHOTS && phase) output.innerHTML = renderFieldHtml(f, chars, phase);
                    else output.textContent = renderField(f, chars);
                    if (readout) readout.innerHTML = `◉ shots <b>${n}</b>/${TOTAL_SHOTS} · σ<sub>x</sub> ${sigmaX(f).toFixed(2)} (exact ${sigma.toFixed(2)})`;
                },
            });
        }
        currentQuantumSpec = { ...quantumSpec(mode, { width, height, steps, seed, shots: TOTAL_SHOTS }), measurement: 'shots' };
        showSpecimenStrip(currentQuantumSpec, 1);
        showInstrumentLegend(!!phase);
        showToast(`Measured ${mode} circuit — ${TOTAL_SHOTS} shots · shot noise is the signature${detectionMsg}`, 'success');
        updateCreativityScore(currentArt);
    };

    animationFrames = [];
    output.textContent = '';
    if (reduced) { sampler.draw(TOTAL_SHOTS); finish(); return; }

    measureTimer = setInterval(() => {
        sampler.draw(schedule[i] - prev);
        prev = schedule[i];
        paint(prev);
        if (++i >= schedule.length) finish();
    }, 55);
}

/* Time evolution — frame t is the same circuit measured after t steps. */
function runEvolution(fieldFn, mode, { width, height, steps, seed, chars, output, detectionMsg }) {
    const frameSpecs = [1, 2, 3, 4, 5, 6].filter(t => t <= steps + 2);
    animationFrames = [];
    const htmlFrames = [];
    let hasPhase = false;
    for (const t of frameSpecs) {
        const { field, phase } = fieldFn({ width, height, steps: t, seed, phase: true });
        animationFrames.push(renderField(field, chars));
        if (phase) { hasPhase = true; htmlFrames.push(renderFieldHtml(field, chars, phase)); }
        else htmlFrames.push(null);
    }

    animationIndex = 0;
    currentArt = animationFrames[0];
    animateText(output, currentArt, () => {
        const controls = document.getElementById('playbackControls');
        if (controls) controls.style.display = 'flex';
        const counter = document.getElementById('frameCounter');
        if (counter) counter.textContent = `Frame: 1/${animationFrames.length} · t=${frameSpecs[0]}`;
        showToast(`Measured ${mode} circuit — ${animationFrames.length} frames of real time evolution${detectionMsg}`, 'success');
        updateCreativityScore(currentArt);
        // swap in the phase-hue render once the reveal settles
        if (hasPhase && htmlFrames[0]) output.innerHTML = htmlFrames[0];
    });
    animationFrames._html = htmlFrames;
    currentQuantumSpec = { ...quantumSpec(mode, { width, height, steps, seed }), measurement: 'exact' };
    showSpecimenStrip(currentQuantumSpec, animationFrames.length);
    showInstrumentLegend(hasPhase);
}

function showInstrumentLegend(hasPhase) {
    const el = document.getElementById('instrumentLegend');
    if (!el) return;
    el.style.display = 'block';
    el.innerHTML = legendHtml({ phase: hasPhase, shots: currentQuantumSpec?.shots });
}

function showSpecimenStrip(spec, frameCount) {
    const el = document.getElementById('specimenStrip');
    if (!el || !spec) { if (el) el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = [
        `<b>CIRCUIT</b> ${spec.mode}`,
        `<b>QUBITS</b> ${spec.qubits}`,
        `<b>STEPS</b> ${spec.steps}${frameCount > 1 ? ` (×${frameCount} frames)` : ''}`,
        spec.shots ? `<b>SHOTS</b> ${spec.shots}` : '',
        `<b>BACKEND</b> ${spec.backend}`,
        `<b>SEED</b> ${spec.seed}`,
        `<span class="specimen-verified">◈ ${spec.measurement === 'shots' ? 'finite-shot measurement' : 'exact statevector'}</span>`,
    ].filter(Boolean).join('');
}

function hideSpecimenStrip() {
    currentQuantumSpec = null;
    stopMeasure();
    const el = document.getElementById('specimenStrip');
    if (el) el.style.display = 'none';
    const legend = document.getElementById('instrumentLegend');
    if (legend) legend.style.display = 'none';
}

/**
 * Animate text rendering line-by-line for a terminal feel
 */
function animateText(el, text, onComplete) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('scanning');
    
    const lines = text.split('\n');
    let currentLine = 0;
    
    // Determine speed based on line count - more lines = faster per line
    const baseDelay = 30;
    const delay = Math.max(10, baseDelay - (lines.length / 2));
    
    function renderNextLine() {
        if (currentLine < lines.length) {
            el.textContent += lines[currentLine] + (currentLine < lines.length - 1 ? '\n' : '');
            currentLine++;
            el.scrollTop = el.scrollHeight;
            setTimeout(renderNextLine, delay);
        } else {
            el.classList.remove('scanning');
            if (onComplete) onComplete();
        }
    }
    
    renderNextLine();
}

function mutateCurrentArt() {
    if (!currentArt || currentArt.startsWith('Click')) {
        showToast('Generate some art first before evolving!', 'warning');
        return;
    }
    const theme = document.getElementById('theme')?.value || 'simple';
    const parsed = parsePrompt(currentPrompt);
    try {
        currentArt = mutateArt(currentArt, { mutationRate: 0.15, theme, seed: Date.now() });
        hideSpecimenStrip(); // a mutated piece is no longer pure circuit output
        const output = document.getElementById('output');
        if (output) animateText(output, currentArt, () => updateCreativityScore(currentArt));
        showToast('Art evolved with subtle mutation!', 'success');
    } catch (error) {
        showToast(`Evolution failed: ${error.message}`, 'error');
    }
}

function updateCreativityScore(art) {
    const scoreEl = document.getElementById('creativityScore');
    if (!scoreEl || !art) return;
    const score = creativityScore(art);
    const rarity = getRarity(score);
    scoreEl.style.display = 'flex';
    
    const isHighRarity = rarity.name === 'Legendary' || rarity.name === 'Epic';
    const rarityClass = isHighRarity ? rarity.name.toLowerCase() : '';
    
    scoreEl.innerHTML = `
        <span class="rarity-badge ${rarityClass}" style="color:${rarity.color};border-color:${rarity.color}">${rarity.emoji} ${rarity.name}</span>
        <span class="creativity-value">Creativity: ${score}/100</span>
    `;
    
    if (isHighRarity) {
        // Trigger a subtle screen shake or special effect
        const output = document.getElementById('output');
        if (output) {
            output.style.animation = 'none';
            void output.offsetWidth; // trigger reflow
            output.style.animation = 'glitch1 0.4s ease-out';
        }
    }
}

function randomize() {
    const patternEl = document.getElementById('pattern');
    const themeEl = document.getElementById('theme');
    const typeEl = document.getElementById('genType');
    if (patternEl) patternEl.value = PATTERN_LIST[Math.floor(Math.random() * PATTERN_LIST.length)].id;
    if (themeEl) themeEl.value = THEME_LIST[Math.floor(Math.random() * THEME_LIST.length)].id;
    if (typeEl && Math.random() < 0.35) {
        const r = Math.random();
        typeEl.value = r < 0.5 ? 'quantum' : (r < 0.75 ? 'compose' : 'mutate');
        const qm = document.getElementById('quantumMode');
        if (typeEl.value === 'quantum' && qm) {
            const modes = ['walk2d', 'sweep', 'grid', 'entangled'];
            qm.value = modes[Math.floor(Math.random() * modes.length)];
        }
        const patternRow = patternEl?.closest('div');
        if (patternRow) patternRow.style.display = typeEl.value === 'quantum' ? 'none' : '';
        const qControls = document.getElementById('quantumControls');
        if (qControls) qControls.style.display = typeEl.value === 'quantum' ? '' : 'none';
    } else if (typeEl) {
        typeEl.value = 'pattern';
    }
    generateArt();
}

function playAnimation() {
    if (animationFrames.length === 0) { showToast('Generate animated art first!', 'error'); return; }
    if (isAnimating) return;
    isAnimating = true;
    animationInterval = setInterval(() => {
        animationIndex = (animationIndex + 1) % animationFrames.length;
        currentArt = animationFrames[animationIndex];
        const output = document.getElementById('output');
        if (output) {
            const html = animationFrames._html?.[animationIndex];
            if (html) output.innerHTML = html;
            else output.textContent = currentArt;
        }
        const counter = document.getElementById('frameCounter');
        if (counter) counter.textContent = `Frame: ${animationIndex + 1}/${animationFrames.length}`;
    }, 200);
    showToast('Animation started!', 'success');
}

function pauseAnimation() {
    if (animationInterval) { clearInterval(animationInterval); animationInterval = null; }
    isAnimating = false;
}

function copyToClipboard() {
    const text = currentArt || document.getElementById('output')?.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text)
        .then(() => showToast('Copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy', 'error'));
}

function downloadArt() {
    const text = currentArt || document.getElementById('output')?.textContent;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'glyphgenesis-art.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Downloaded!', 'success');
}

function shareOnTwitter() {
    const text = encodeURIComponent('I just created ASCII art on GlyphGenesis! 🎨\n\nTry it: https://sneldao.github.io/glyphgenesis/\n\n#FourMemeAI #AIArt');
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

/**
 * Generate and download a shareable NFT card as PNG via Canvas
 * Renders the ASCII art in a styled card with branding
 */
async function generateShareCard() {
    const text = currentArt || document.getElementById('output')?.textContent;
    if (!text || text.startsWith('Click')) { showToast('Generate some art first!', 'warning'); return; }

    const chain = getActiveChain();
    const score = creativityScore(text);
    const rarity = getRarity(score);

    // Create a canvas-based card
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, 800, 600);

    // Border glow
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#7c3aed');
    gradient.addColorStop(1, '#06b6d4');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 796, 596);

    // ASCII art
    ctx.fillStyle = '#00ff41';
    ctx.font = '11px Courier New';
    const lines = text.split('\n');
    const startX = 20;
    const startY = 80;
    const lineHeight = 13;
    for (let i = 0; i < lines.length && i < 38; i++) {
        ctx.fillText(lines[i], startX, startY + i * lineHeight);
    }

    // Title bar
    ctx.fillStyle = '#0d0d14';
    ctx.fillRect(0, 0, 800, 55);
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText('GLYPH', 20, 35);
    ctx.fillStyle = '#7c3aed';
    ctx.fillText('GENESIS', 90, 35);

    // Rarity badge
    ctx.fillStyle = rarity.color;
    ctx.font = 'bold 14px Courier New';
    ctx.fillText(`${rarity.emoji} ${rarity.name}`, 160, 35);
    ctx.fillStyle = '#8896ab';
    ctx.font = '12px Courier New';
    ctx.fillText(`Creativity: ${score}/100`, 280, 35);

    // Footer
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 560, 800, 40);
    ctx.fillStyle = '#8896ab';
    ctx.font = '11px Courier New';
    ctx.fillText(`${chain.name} · ${chain.explorerAddr(chain.contractAddress || '')}`, 20, 585);
    ctx.fillStyle = '#06b6d4';
    ctx.fillText('glyphgenesis.xyz', 680, 585);

    // Download
    const link = document.createElement('a');
    link.download = 'glyphgenesis-share.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Share card generated!', 'success');
}

async function mintArt() {
    if (!isConnected()) { showToast('Please connect your wallet first', 'warning'); return; }
    const contract = getContract();
    if (!contract) { showToast('Wallet not connected', 'error'); return; }

    const prompt = document.getElementById('prompt')?.value || 'MONAD';
    const pattern = document.getElementById('pattern')?.value || 'circles';
    const art = currentArt || document.getElementById('output')?.textContent;
    const statusDiv = document.getElementById('mintStatus');
    const mintBtn = document.getElementById('mintBtn');

    if (!art || art.startsWith('Click')) { showToast('Generate some art first!', 'warning'); return; }

    try {
        if (mintBtn) { mintBtn.disabled = true; mintBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Processing...'; }
        if (statusDiv) statusDiv.innerHTML = '<div class="status-message loading"><span class="spinner" aria-hidden="true"></span>Sending transaction to contract...</div>';
        showToast('Initiating mint transaction...', 'info');

        const title = currentQuantumSpec
            ? `Quantum ${currentQuantumSpec.mode} · seed ${currentQuantumSpec.seed}`
            : `${prompt} - ${pattern}`;
        const description = currentQuantumSpec
            ? JSON.stringify({ quantum: currentQuantumSpec })
            : `Generated with ${pattern} pattern`;
        const collectionId = Number(document.getElementById('collectionId')?.value ?? 0);

        const tx = getActiveChainKey() === 'bnb'
            ? await contract.createArtwork(art, title, description, Number.isFinite(collectionId) ? collectionId : 0)
            : await contract.createArtwork(art, title, description);
        if (statusDiv) statusDiv.innerHTML = '<div class="status-message loading"><span class="spinner" aria-hidden="true"></span>Mining transaction...</div>';

        const receipt = await tx.wait();
        const explorerLink = EXPLORER_TX(receipt.hash);
        if (statusDiv) statusDiv.innerHTML = `<div class="status-message success">✓ Minted successfully! <a href="${explorerLink}" target="_blank" rel="noopener noreferrer" style="color:var(--accent2);margin-left:8px;">View TX →</a></div>`;
        showToast('Artwork minted successfully!', 'success');
        window.dispatchEvent(new CustomEvent('gallery:refresh'));
        window.dispatchEvent(new CustomEvent('mint:success'));
    } catch (error) {
        console.error(error);
        const msg = parseContractError(error);
        if (statusDiv) statusDiv.innerHTML = `<div class="status-message error">✗ ${msg}</div>`;
        showToast(`Minting failed: ${msg}`, 'error');
    } finally {
        if (mintBtn) { mintBtn.disabled = false; mintBtn.textContent = 'Mint This Art on ' + getCurrencyLabel(); }
    }
}

async function createCollection() {
    if (!isConnected()) { showToast('Please connect your wallet first', 'warning'); return; }
    const contract = getContract();
    if (!contract) { showToast('Wallet not connected', 'error'); return; }
    if (getActiveChainKey() !== 'bnb') { showToast('Collections are only available on BNB', 'warning'); return; }

    const name = prompt('Collection name');
    if (!name) return;
    const description = prompt('Collection description') || '';

    try {
        showToast('Creating collection...', 'info');
        const tx = await contract.createCollection(name, description);
        await tx.wait();
        showToast(`Collection "${name}" created!`, 'success');
    } catch (error) {
        showToast(`Collection creation failed: ${error.message || error}`, 'error');
    }
}
