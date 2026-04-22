import { generate, parsePrompt, creativityScore, getRarity, PATTERN_LIST, THEME_LIST } from '@/ascii-generator.mjs';
import { isConnected, getContract, onWalletEvent } from '@/wallet.js';
import { EXPLORER_TX, parseContractError } from '@/contract.js';
import { showToast } from './toast.js';

let animationFrames = [];
let animationIndex = 0;
let animationInterval = null;
let isAnimating = false;
let currentArt = '';

export function renderGenerator() {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'generator';
    section.setAttribute('aria-labelledby', 'generator-title');
    section.innerHTML = `
        <span class="section-label">// 03 \u2014 Interactive Generator</span>
        <h2 class="section-title" id="generator-title">Create <span>ASCII Art</span></h2>
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
                        <option value="pattern">Pattern</option>
                        <option value="compose">Compose (Layered)</option>
                        <option value="mutate">Mutate (Evolve)</option>
                        <option value="banner">Banner (Text)</option>
                    </select>
                </div>
                <div>
                    <label class="field-label" for="pattern">Pattern</label>
                    <select id="pattern" aria-label="Pattern type">
                        ${PATTERN_LIST.map(p => `<option value="${p.id}">${p.name} \u2014 ${p.desc}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="field-label" for="theme">Theme</label>
                    <select id="theme" aria-label="Visual theme">
                        ${THEME_LIST.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>
                <div class="animate-row">
                    <label><input type="checkbox" id="animateToggle"> Animate</label>
                    <div class="playback-btns" id="playbackControls">
                        <button type="button" id="playBtn" aria-label="Play animation">\u25B6 Play</button>
                        <button type="button" id="pauseBtn" aria-label="Pause animation">\u23F8 Pause</button>
                        <span id="frameCounter">Frame: 1</span>
                    </div>
                </div>
                <button type="button" class="gen-btn" id="generateBtn">Generate</button>
                <button type="button" class="gen-btn outline" id="randomizeBtn">Randomize</button>
            </div>
            <div class="generator-output">
                <div class="output-label" aria-hidden="true">ASCII Output</div>
                <div id="output" role="img" aria-label="Generated ASCII art output">Click [ Generate ] to create your masterpiece...</div>
                <div id="creativityScore" class="creativity-score" style="display:none;"></div>
                <div class="output-actions">
                    <button type="button" class="btn btn-ghost" id="copyBtn" aria-label="Copy art to clipboard">\uD83D\uDCCB Copy</button>
                    <button type="button" class="btn btn-ghost" id="downloadBtn" aria-label="Download art as text file">\uD83D\uDCBE Download</button>
                    <button type="button" class="btn btn-ghost" id="shareBtn" aria-label="Share on Twitter">\uD83D\uDC26 Share</button>
                </div>
                <button type="button" class="btn btn-mint" id="mintBtn" disabled>Mint on Monad \u2014 Connect Wallet First</button>
                <div id="mintStatus"></div>
            </div>
        </div>
    `;

    section.querySelector('#generateBtn').addEventListener('click', generateArt);
    section.querySelector('#randomizeBtn').addEventListener('click', randomize);
    section.querySelector('#animateToggle').addEventListener('change', generateArt);
    section.querySelector('#playBtn').addEventListener('click', playAnimation);
    section.querySelector('#pauseBtn').addEventListener('click', pauseAnimation);
    section.querySelector('#copyBtn').addEventListener('click', copyToClipboard);
    section.querySelector('#downloadBtn').addEventListener('click', downloadArt);
    section.querySelector('#shareBtn').addEventListener('click', shareOnTwitter);
    section.querySelector('#mintBtn').addEventListener('click', mintArt);
    section.querySelector('#prompt').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') generateArt();
    });
    // Show/hide pattern selector based on type
    section.querySelector('#genType').addEventListener('change', (e) => {
        const patternRow = section.querySelector('#pattern')?.closest('div');
        if (patternRow) patternRow.style.display = (e.target.value === 'banner') ? 'none' : '';
    });

    onWalletEvent((event) => {
        if (event === 'connect') updateMintButton(true);
        if (event === 'disconnect') updateMintButton(false);
    });

    return section;
}

function updateMintButton(connected) {
    const btn = document.getElementById('mintBtn');
    if (!btn) return;
    btn.disabled = !connected;
    btn.textContent = connected ? 'Mint This Art on Monad' : 'Mint on Monad \u2014 Connect Wallet First';
}

function generateArt() {
    const promptInput = document.getElementById('prompt')?.value || 'MONAD';
    const patternSelect = document.getElementById('pattern')?.value || 'circles';
    const themeSelect = document.getElementById('theme')?.value || 'simple';
    const genTypeSelect = document.getElementById('genType')?.value || 'pattern';
    const animate = document.getElementById('animateToggle')?.checked || false;
    const output = document.getElementById('output');
    if (!output) return;

    pauseAnimation();

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
        if (animated) {
            const frameCount = 8;
            animationFrames = [];
            for (let i = 0; i < frameCount; i++) {
                animationFrames.push(
                    generate(promptInput, {
                        type: genType,
                        pattern, theme,
                        width: parsed.width || 40,
                        height: parsed.height || 15,
                        framed: true,
                        time: i / frameCount,
                        seed: parsed.seed,
                    })
                );
            }
            animationIndex = 0;
            currentArt = animationFrames[0];
            output.textContent = currentArt;
            const controls = document.getElementById('playbackControls');
            if (controls) controls.style.display = 'flex';
            const counter = document.getElementById('frameCounter');
            if (counter) counter.textContent = `Frame: 1/${frameCount}`;
            showToast(`Generated ${frameCount} animation frames!${detectionMsg}`, 'success');
        } else {
            currentArt = generate(promptInput, {
                type: genType,
                pattern, theme,
                width: parsed.width || 40,
                height: parsed.height || 15,
                framed: true,
                seed: parsed.seed,
            });
            output.textContent = currentArt;
            const controls = document.getElementById('playbackControls');
            if (controls) controls.style.display = 'none';
            showToast(`Art generated with ${theme} theme!${detectionMsg}`, 'success');
        }

        // Show creativity score
        updateCreativityScore(currentArt);
    } catch(error) {
        console.error(error);
        output.textContent = 'Failed to generate art. Please try again.';
        showToast(`Generation failed: ${error.message}`, 'error');
    }
}

function updateCreativityScore(art) {
    const scoreEl = document.getElementById('creativityScore');
    if (!scoreEl || !art) return;
    const score = creativityScore(art);
    const rarity = getRarity(score);
    scoreEl.style.display = 'flex';
    scoreEl.innerHTML = `
        <span class="rarity-badge" style="color:${rarity.color};border-color:${rarity.color}">${rarity.emoji} ${rarity.name}</span>
        <span class="creativity-value">Creativity: ${score}/100</span>
    `;
}

function randomize() {
    const patternEl = document.getElementById('pattern');
    const themeEl = document.getElementById('theme');
    const typeEl = document.getElementById('genType');
    if (patternEl) patternEl.value = PATTERN_LIST[Math.floor(Math.random() * PATTERN_LIST.length)].id;
    if (themeEl) themeEl.value = THEME_LIST[Math.floor(Math.random() * THEME_LIST.length)].id;
    // 20% chance of compose/mutate type
    if (typeEl && Math.random() < 0.2) {
        typeEl.value = Math.random() < 0.5 ? 'compose' : 'mutate';
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
        if (output) output.textContent = currentArt;
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
    const text = encodeURIComponent('I just created ASCII art on GlyphGenesis! \uD83C\uDFA8\n\nTry it: https://sneldao.github.io/glyphgenesis/\n\n#FourMemeAI #AIArt');
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
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

        const tx = await contract.createArtwork(art, `${prompt} - ${pattern}`, `Generated with ${pattern} pattern`);
        if (statusDiv) statusDiv.innerHTML = '<div class="status-message loading"><span class="spinner" aria-hidden="true"></span>Mining transaction...</div>';

        const receipt = await tx.wait();
        if (statusDiv) statusDiv.innerHTML = `<div class="status-message success">\u2713 Minted successfully! <a href="${EXPLORER_TX(receipt.hash)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent2);margin-left:8px;">View TX \u2192</a></div>`;
        showToast('Artwork minted successfully!', 'success');
        window.dispatchEvent(new CustomEvent('gallery:refresh'));
        window.dispatchEvent(new CustomEvent('mint:success'));
    } catch(error) {
        console.error(error);
        const msg = parseContractError(error);
        if (statusDiv) statusDiv.innerHTML = `<div class="status-message error">\u2717 ${msg}</div>`;
        showToast(`Minting failed: ${msg}`, 'error');
    } finally {
        if (mintBtn) { mintBtn.disabled = false; mintBtn.textContent = 'Mint This Art on Monad'; }
    }
}
